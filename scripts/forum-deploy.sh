#!/bin/bash

# Script which deploys the Algorea forum serverless
# It requires the AWS credentials to be set in the environment

BUILD_DIR=./build/forum
SCRIPT_PWD=$(pwd)

set -e
set -x

if [[ ! "$0" =~ ^./script ]]; then
  echo "Run the script from the project root!"
  exit 1;
fi

if [[ $# -lt 1 ]]; then
  echo "Should give one parameter: the hash" >&2
  exit 1
fi

HASH=$1

DEPLOYMENTS=./environments/deployments.yaml

for DEPLOYED_ENV in $(yq '.forum | keys | join(" ")' ${DEPLOYMENTS}); do
  VERSION=$(E=${DEPLOYED_ENV} yq '.forum[strenv(E)]' ${DEPLOYMENTS})
  DEPLOY_DIR=${DEPLOYED_ENV}/${VERSION}-${HASH}
  aws s3 cp s3://alg-ops/deployments/forum/${DEPLOY_DIR}/LAMBDA_VERSION LAMBDA_VERSION ${AWS_S3_EXTRA_ARGS} || echo "No lambda version file found"
  LAMBDA_VERSION=$(cat ./LAMBDA_VERSION || echo "n/a")

  RE='^[0-9]+$'
  if ! [[ ${LAMBDA_VERSION} =~ ${RE} ]]; then

    mkdir -p ${BUILD_DIR}/sls

    # get the source code
    curl -L https://github.com/France-ioi/AlgoreaForum/archive/refs/tags/v${VERSION}.tar.gz --output ${BUILD_DIR}/archive.tar.gz
    tar -xf ${BUILD_DIR}/archive.tar.gz -C ${BUILD_DIR}
    mv ${BUILD_DIR}/AlgoreaForum-${VERSION}/* ${BUILD_DIR}/sls/
    
    # config env
    cp -r environments/forum/${DEPLOYED_ENV}/.env.${DEPLOYED_ENV} ${BUILD_DIR}/sls/

    # deploy sls to lambda
    cd ${BUILD_DIR}/sls
    mkdir .git # for husky install
    npm install
    sls deploy --stage ${DEPLOYED_ENV} ${SLS_EXTRA_ARGS}

    # print the lambda version
    LAMBDA_VERSION=$(aws cloudformation describe-stacks --stack-name alg-forum-${DEPLOYED_ENV} --query "Stacks[0].Outputs[?OutputKey == 'ConnectionLambdaFunctionQualifiedArn'].OutputValue | [0]" ${AWS_EXTRA_ARGS} | cut -d: -f 8 | cut -d\" -f 1)
    echo ${LAMBDA_VERSION} > LAMBDA_VERSION
    aws s3 cp LAMBDA_VERSION s3://alg-ops/deployments/forum/${DEPLOY_DIR}/LAMBDA_VERSION ${AWS_S3_EXTRA_ARGS}


    cd ${SCRIPT_PWD}
    rm -rf ${BUILD_DIR}

  else
    echo "${DEPLOY_DIR} already deployed. Lambda version ${LAMBDA_VERSION}"
  fi

done
