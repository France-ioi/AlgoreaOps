#!/bin/bash

# Script which deploys the Algorea backend
# Requires the AWS credential to be set in the environment
# It outputs on its last line the lambda version to be used for the release phase

SCRIPT_PWD=$(pwd)
BUILD_DIR=${SCRIPT_PWD}/build/backend

set -e
set -x

ENV_DIR=${SCRIPT_PWD}/environments

if [[ ! "$0" =~ ^./script ]]; then
  echo "Run the script from the project root!"
  exit 1;
fi

if [ "x${AWS_PROFILE}" != "x" ]; then AWS_EXTRA_ARGS="${AWS_EXTRA_ARGS} --profile ${AWS_PROFILE}"; fi
if [ "x${AWS_PROFILE}" != "x" ]; then SLS_EXTRA_ARGS="${SLS_EXTRA_ARGS} --aws-profile ${AWS_PROFILE}"; fi
AWS_S3_EXTRA_ARGS="${AWS_S3_EXTRA_ARGS} ${AWS_EXTRA_ARGS}"

DEPLOYMENTS=${ENV_DIR}/deployments.yaml

for DEPLOYED_ENV in $(yq '.backend | keys | join(" ")' ${DEPLOYMENTS}); do

  VERSION=$(E=${DEPLOYED_ENV} yq '.backend[strenv(E)]' ${DEPLOYMENTS})
  DEPLOY_DIR=${DEPLOYED_ENV}/${VERSION}-$(./scripts/dir-hash.sh ./environments/backend/${DEPLOYED_ENV} ./src/backend-sls)
  aws s3 cp s3://alg-ops/deployments/backend/${DEPLOY_DIR}/LAMBDA_VERSION LAMBDA_VERSION ${AWS_S3_EXTRA_ARGS} || echo "No lambda version file found"
  LAMBDA_VERSION=$(cat ./LAMBDA_VERSION || echo "n/a")

  RE='^[0-9]+$'
  if ! [[ ${LAMBDA_VERSION} =~ ${RE} ]]; then
    mkdir -p ${BUILD_DIR}
    cp -r ./src/backend-sls/* ${BUILD_DIR}
    cd ${BUILD_DIR}

    # Get code
    curl -fL https://github.com/France-ioi/AlgoreaBackend/releases/download/v${VERSION}/AlgoreaBackend-linux --output AlgoreaBackend
    wget -qO- https://github.com/France-ioi/AlgoreaBackend/archive/refs/tags/v${VERSION}.tar.gz | tar xvz # will be in ./AlgoreaBackend-${VERSION}/

    # set keys
    cp -r ${ENV_DIR}/backend/${DEPLOYED_ENV}/*.pem ${ENV_DIR}/backend/${DEPLOYED_ENV}/.env* ./

    # get db migrations
    mkdir -p db
    cp -r ./AlgoreaBackend-${VERSION}/db/migrations ./db/

    # buid artifacts
    make

    # deploy
    sls deploy --stage ${DEPLOYED_ENV} ${SLS_EXTRA_ARGS}

    LAMBDA_VERSION=$(aws cloudformation describe-stacks --stack-name alg-backend-${DEPLOYED_ENV} --query "Stacks[0].Outputs[?OutputKey == 'ServerLambdaFunctionQualifiedArn'].OutputValue | [0]" ${AWS_EXTRA_ARGS} | cut -d: -f 8 | cut -d\" -f 1)
    echo ${LAMBDA_VERSION} > LAMBDA_VERSION
    aws s3 cp LAMBDA_VERSION s3://alg-ops/deployments/backend/${DEPLOY_DIR}/LAMBDA_VERSION ${AWS_S3_EXTRA_ARGS}

    cd ${SCRIPT_PWD}

    # Cleanup
    rm -rf ${BUILD_DIR}
  else
    echo "${DEPLOY_DIR} already deployed. Lambda version ${LAMBDA_VERSION}"
  fi

done

