#!/bin/bash

# Script which deploys the Algorea search serverless
# It requires the AWS credentials to be set in the environment

BUILD_DIR=./build/search
SCRIPT_PWD=$(pwd)

set -e
set -x

if [[ ! "$0" =~ ^./script ]]; then
  echo "Run the script from the project root!"
  exit 1;
fi

DEPLOYMENTS=./environments/deployments.yaml

for DEPLOYED_ENV in $(yq '.search | keys | join(" ")' ${DEPLOYMENTS}); do
  VERSION=$(E=${DEPLOYED_ENV} yq '.search[strenv(E)]' ${DEPLOYMENTS})
  DEPLOY_DIR=${DEPLOYED_ENV}/${VERSION}-$(./scripts/dir-hash.sh ./environments/search/${DEPLOYED_ENV})
  LAMBDA_VERSION=$(curl -L --fail https://alg-ops.s3.eu-west-3.amazonaws.com/deployments/search/${DEPLOY_DIR}/LAMBDA_VERSION || echo "n/a")

  RE='^[0-9]+$'
  if ! [[ ${LAMBDA_VERSION} =~ ${RE} ]]; then

    mkdir -p ${BUILD_DIR}/sls

    # get the source code
    curl -L https://github.com/France-ioi/AlgoreaSearch/archive/refs/tags/v${VERSION}.tar.gz --output ${BUILD_DIR}/archive.tar.gz
    tar -xf ${BUILD_DIR}/archive.tar.gz -C ${BUILD_DIR}
    mv ${BUILD_DIR}/AlgoreaSearch-${VERSION}/* ${BUILD_DIR}/sls/
    
    # config env
    cp -r environments/search/${DEPLOYED_ENV}/.env.${DEPLOYED_ENV} ${BUILD_DIR}/sls/

    # deploy sls to lambda
    cd ${BUILD_DIR}/sls
    mkdir .git # for husky install
    npm install
    sls deploy --stage ${DEPLOYED_ENV} ${SLS_EXTRA_ARGS}

    # print the lambda version
    LAMBDA_VERSION=$(aws cloudformation describe-stacks --stack-name alg-search-${DEPLOYED_ENV} --query "Stacks[0].Outputs[?OutputKey == 'ConnectionLambdaFunctionQualifiedArn'].OutputValue | [0]" ${AWS_EXTRA_ARGS} | cut -d: -f 8 | cut -d\" -f 1)
    echo ${LAMBDA_VERSION} > LAMBDA_VERSION
    aws s3 cp LAMBDA_VERSION s3://alg-ops/deployments/search/${DEPLOY_DIR}/LAMBDA_VERSION ${AWS_S3_EXTRA_ARGS}


    cd ${SCRIPT_PWD}

  else
    echo "${DEPLOY_DIR} already deployed. Lambda version ${LAMBDA_VERSION}"
  fi

done
