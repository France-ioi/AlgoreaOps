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

SCRIPT_HASH=$(git log -1 --pretty="format:%h" -- ./src/frontend-sls ./scripts/frontend-deploy.sh ./scripts/sub/frontend-build.sh ./scripts/sub/frontend-deploy-to-aws.sh)
FULLVERSION=${VERSION}-${CONFIG_HASH}-${SCRIPT_HASH}
DEPLOY_DIR=${DEPLOYED_ENV}/${FULLVERSION}
aws s3 cp s3://alg-ops/deployments/frontend/${DEPLOY_DIR}/LAMBDA_VERSION LAMBDA_VERSION ${AWS_S3_EXTRA_ARGS} || echo "No lambda version file found"
LAMBDA_VERSION=$(cat ./LAMBDA_VERSION || echo "n/a")

RE='^[0-9]+$'
if ! [[ ${LAMBDA_VERSION} =~ ${RE} ]]; then
  ./scripts/sub/frontend-build.sh ${VERSION} ${CONFIG_DIR} ${DEPLOY_DIR}
  ./scripts/sub/frontend-deploy-to-aws.sh ${DEPLOYED_ENV} ${DEPLOY_DIR} "${FULLVERSION} [`date +%d-%m-%Y" "%H:%M:%S%Z`]"
  echo "export OUTPUTMSG=\"Frontend deployed for ${DEPLOYED_ENV}: '${FULLVERSION}'\"" >> "$BASH_ENV"
else
  echo "${DEPLOY_DIR} already deployed. Lambda version ${LAMBDA_VERSION}"
  echo "export OUTPUTMSG=\"Frontend already deployed for ${DEPLOYED_ENV}: '${FULLVERSION}'\"" >> "$BASH_ENV"
fi
echo "export DEPLOYED_VERSION=${FULLVERSION}" >> "$BASH_ENV"
