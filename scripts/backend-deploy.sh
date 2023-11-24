#!/bin/bash

# Script which deploys the Algorea backend
# Requires "BACKEND_PUBLIC_KEY", "BACKEND_PRIVATE_KEY", and the AWS credential to be set in the environment
# It outputs on its last line the lambda version to be used for the release phase

SCRIPT_PWD=$(pwd)
BUILD_DIR=${SCRIPT_PWD}/build/backend
S3_BUCKET=alg-public

set -e
set -x

ENV_DIR=${SCRIPT_PWD}/environments

if [[ ! "$0" =~ ^./script ]]; then
  echo "Run the script from the project root!"
  exit 1;
fi

if [[ $# -ne 1 ]]; then
  echo "Illegal number of parameters. Usage: $0 <env>" >&2
  exit 1
fi

if [ "x${AWS_PROFILE}" != "x" ]; then AWS_EXTRA_ARGS="${AWS_EXTRA_ARGS} --profile ${AWS_PROFILE}"; fi
if [ "x${AWS_PROFILE}" != "x" ]; then SLS_EXTRA_ARGS="${SLS_EXTRA_ARGS} --aws-profile ${AWS_PROFILE}"; fi
AWS_S3_EXTRA_ARGS="${AWS_S3_EXTRA_ARGS} ${AWS_EXTRA_ARGS} "

DEPLOYED_ENV=$1

ENV_FILE=${ENV_DIR}/${DEPLOYED_ENV}/deployments/backend.yaml

for DEPLOYMT_ID in $(yq 'keys | join(" ")' ${ENV_FILE}); do

  VERSION=$(ID=${DEPLOYMT_ID} yq '.[strenv(ID)].version' ${ENV_FILE})

  cp -r ./src/backend-sls ${BUILD_DIR}
  cd ${BUILD_DIR}

  # Get code
  curl -fL https://github.com/France-ioi/AlgoreaBackend/releases/download/v${VERSION}/AlgoreaBackend-linux --output bootstrap

  # set keys
  rsync ${ENV_DIR}/${DEPLOYED_ENV}/config/backend/ ./ --exclude "*.enc" --exclude ".*"

  # deploy
  sls deploy --stage ${DEPLOYED_ENV} ${SLS_EXTRA_ARGS}

  LAMBDA_VERSION=$(aws cloudformation describe-stacks --stack-name alg-backend-${DEPLOYED_ENV} --query "Stacks[0].Outputs[?OutputKey == 'ServerLambdaFunctionQualifiedArn'].OutputValue | [0]" ${AWS_EXTRA_ARGS} | cut -d: -f 8 | cut -d\" -f 1)
  echo ${LAMBDA_VERSION} > LAMBDA_VERSION
  aws s3 cp LAMBDA_VERSION s3://${S3_BUCKET}/deployments/backend/${DEPLOYED_ENV}/${DEPLOYMT_ID}/LAMBDA_VERSION ${AWS_S3_EXTRA_ARGS}

  cd ${SCRIPT_PWD}

  # Cleanup
  rm -rf ${BUILD_DIR}

done

