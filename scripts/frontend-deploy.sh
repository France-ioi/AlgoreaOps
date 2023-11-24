#!/bin/bash

# Script which deploys the Algorea frontend on S3 and configure the lambda serving the index file.
# It requires the AWS credentials to be set in the environment
# It outputs on its last line the lambda version to be used for the release phase

S3_BUCKET=alg-public
S3_REGION=eu-west-3

ENV_DIR=./environments
BUILD_DIR=./build/frontend
SCRIPT_PWD=$(pwd)

set -e
set -x

if [[ ! "$0" =~ ^./script ]]; then
  echo "Run the script from the project root!"
  exit 1;
fi

DEPLOYED_ENV=$1
if [[ -z "${DEPLOYED_ENV}" ]]; then
  echo "Missing parameter: environment to be deployed. Usage: $0 <env>."
  exit 1;
fi

ENV_FILE=${ENV_DIR}/${DEPLOYED_ENV}/deployments/frontend.yaml

for DEPLOYMT_ID in $(yq 'keys | join(" ")' ${ENV_FILE}); do
  VERSION=$(ID=${DEPLOYMT_ID} yq '.[strenv(ID)].version' ${ENV_FILE})
  BUILD_FR=$(ID=${DEPLOYMT_ID} yq '.[strenv(ID)].build_fr' ${ENV_FILE})
  DEPLOY_DIR=${DEPLOYED_ENV}/${DEPLOYMT_ID}

  LAMBDA_VERSION=$(curl -L --fail https://alg-public.s3.eu-west-3.amazonaws.com/deployments/frontend/${DEPLOY_DIR}/LAMBDA_VERSION)

  if ! [[ ${LAMBDA_VERSION} =~ '^[0-9]+$' ]]; then
    # languages to be built
    if [ "x${BUILD_FR}" == "xtrue" ]; then LANGS='en fr'; else LANGS='en'; fi

    BUILD_DIR=$(./script/sub/frontend-build.sh ${DEPLOYED_ENV} ${DEPLOYMT_ID} ${VERSION} ${LANGS} | tail -n 1)
    LAMBDA_VERSION=$(./script/sub/frontend-deploy-to-aws.sh ${DEPLOYED_ENV} ${BUILD_DIR} ${DEPLOY_DIR} | tail -n 1)
  else
    echo "Version ${DEPLOY_DIR} already deployed. Lambda v${LAMBDA_VERSION}"
  fi

done
