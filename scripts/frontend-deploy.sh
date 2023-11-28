#!/bin/bash

# Script which deploys the Algorea frontend on S3 and configure the lambda serving the index file.
# It requires the AWS credentials to be set in the environment

BUILD_DIR=./build/frontend
SCRIPT_PWD=$(pwd)

set -e
set -x

if [[ ! "$0" =~ ^./script ]]; then
  echo "Run the script from the project root!"
  exit 1;
fi

DEPLOYMENTS=./environments/deployments.yaml

for DEPLOYED_ENV in $(yq '.frontend | keys | join(" ")' ${DEPLOYMENTS}); do
  VERSION=$(E=${DEPLOYED_ENV} yq '.frontend[strenv(E)]' ${DEPLOYMENTS})
  DEPLOY_DIR=${DEPLOYED_ENV}/${VERSION}-$(./scripts/dir-hash.sh ./environments/frontend/${DEPLOYED_ENV})
  LAMBDA_VERSION=$(curl -L --fail https://alg-ops.s3.eu-west-3.amazonaws.com/deployments/frontend/${DEPLOY_DIR}/LAMBDA_VERSION || echo "n/a")

  RE='^[0-9]+$'
  if ! [[ ${LAMBDA_VERSION} =~ ${RE} ]]; then
    ./scripts/sub/frontend-build.sh ${DEPLOYED_ENV} ${VERSION} ${DEPLOY_DIR}
    ./scripts/sub/frontend-deploy-to-aws.sh ${DEPLOYED_ENV} ${DEPLOY_DIR}
  else
    echo "${DEPLOY_DIR} already deployed. Lambda version ${LAMBDA_VERSION}"
  fi

done
