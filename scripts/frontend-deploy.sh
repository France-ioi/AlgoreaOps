#!/bin/bash

# Script which deploys the Algorea frontend on S3 and configure the lambda serving the index file.
# It requires the AWS credentials to be set in the environment

BUILD_DIR=./build/frontend
SCRIPT_PWD=$(pwd)

set -e
set -x

if [[ $# -ne 3 ]]; then
  echo "Illegal number of parameters. Usage: $0 <environment> <app-version> <config-dir>" >&2
  exit 1
fi

if [ "x${AWS_PROFILE}" != "x" ]; then AWS_EXTRA_ARGS="${AWS_EXTRA_ARGS} --profile ${AWS_PROFILE}"; fi
AWS_S3_EXTRA_ARGS="${AWS_S3_EXTRA_ARGS} ${AWS_EXTRA_ARGS} "

if [[ ! "$0" =~ ^./script ]]; then
  echo "Run the script from the project root!"
  exit 1;
fi

DEPLOYED_ENV=$1
VERSION=$2
CONFIG_DIR=$3

cd $CONFIG_DIR
CONFIG_HASH=$(git rev-parse --short HEAD)
cd $SCRIPT_PWD

SCRIPT_HASH=$(git log -1 --pretty="format:%h" -- ./src/frontend-sls)
DEPLOY_DIR=${DEPLOYED_ENV}/${VERSION}-${CONFIG_HASH}-${SCRIPT_HASH}
aws s3 cp s3://alg-ops/deployments/frontend/${DEPLOY_DIR}/LAMBDA_VERSION LAMBDA_VERSION ${AWS_S3_EXTRA_ARGS} || echo "No lambda version file found"
LAMBDA_VERSION=$(cat ./LAMBDA_VERSION || echo "n/a")

RE='^[0-9]+$'
if ! [[ ${LAMBDA_VERSION} =~ ${RE} ]]; then
  ./scripts/sub/frontend-build.sh ${VERSION} ${CONFIG_DIR} ${DEPLOY_DIR}
  ./scripts/sub/frontend-deploy-to-aws.sh ${DEPLOYED_ENV} ${DEPLOY_DIR} "v${VERSION} config:${CONFIG_HASH} scripts:${SCRIPT_HASH}"
else
  echo "${DEPLOY_DIR} already deployed. Lambda version ${LAMBDA_VERSION}"
fi
