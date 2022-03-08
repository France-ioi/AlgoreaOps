#!/bin/bash

# Script which deploys the Algorea backend
# Requires "BACKEND_PUBLIC_KEY", "BACKEND_PRIVATE_KEY", and the AWS credential to be set in the environment
# It outputs on its last line the lambda version to be used for the release phase

set -e
set -x

ENV_DIR=./environments
BUILD_DIR=./build/backend

if [ ! -f ./scripts/deploy-backend.sh ]; then
  echo "Run the script from the project root!"
  exit 1;
fi

DEPLOYED_ENV=$1

if [[ -z "${DEPLOYED_ENV}" ]]; then
  echo "Missing parameter: environment to be deployed"
  exit 1;
fi

ENV_FILE=${ENV_DIR}/${DEPLOYED_ENV}.yml
VERSION=$(yq '.backend.version' ${ENV_FILE})
SCRIPT_PWD=$(pwd)
ARCHIVE_FILENAME="lambda-${VERSION}-${DEPLOYED_ENV}.zip"
AWS_EXTRA_ARGS="" # for debugging (to force profile for instance)
AWS_S3_EXTRA_ARGS="${AWS_EXTRA_ARGS}" # for debugging (--dryrun for instance)

# Get code
mkdir -p ${BUILD_DIR}
curl -L https://github.com/France-ioi/AlgoreaBackend/releases/download/v${VERSION}/AlgoreaBackend-linux --output ${BUILD_DIR}/AlgoreaBackend-linux

# Configure
PUBLIC_KEY=$(yq '.backend.public_key_file' ${ENV_FILE})
PRIVATE_KEY=$(yq '.backend.private_key_file' ${ENV_FILE})
echo ${PUBLIC_KEY} > ${BUILD_DIR}/public_key.pem
echo ${PRIVATE_KEY} > ${BUILD_DIR}/private_key.pem
ALLUSERSGRP=$(yq '.backend.config.all_users_group' ${ENV_FILE})
TMPUSERSGRP=$(yq '.backend.config.temp_users_group' ${ENV_FILE})
mkdir -p ${BUILD_DIR}/conf
yq '.domains[0].allUsersGroup=strenv(ALLUSERSGRP),.domains[0].tempUsersGroup=strenv(TMPUSERSGRP)' ${ENV_DIR}/configs/generic-backend-empty.yaml > ${BUILD_DIR}/conf/config.yaml
cd ${BUILD_DIR}
zip -r ../${ARCHIVE_FILENAME} .
cd ${SCRIPT_PWD}

# Deploy
LAMBDA_CONFIG_FILE=$(yq '.backend.lambda_env_file' ${ENV_FILE})
aws s3 sync ${BUILD_DIR}/../ s3://algorea-lambda-upload/lambda-code/ --exclude "*" --include ${ARCHIVE_FILENAME} ${AWS_S3_EXTRA_ARGS}
aws lambda update-function-code --region eu-central-1 --function-name AlgoreaBackend --s3-bucket algorea-lambda-upload --s3-key lambda-code/${ARCHIVE_FILENAME} --query 'LastUpdateStatus' ${AWS_EXTRA_ARGS}
aws lambda update-function-configuration --region eu-central-1 --function-name AlgoreaBackend --environment "`cat ${ENV_DIR}/configs/${LAMBDA_CONFIG_FILE}`" ${AWS_EXTRA_ARGS} > /dev/null
aws lambda publish-version --region eu-central-1 --function-name AlgoreaBackend --description "Autodeployment v${VERSION} on env ${DEPLOYED_ENV}" ${AWS_EXTRA_ARGS} | yq '.Version'

# Cleanup
rm ${BUILD_DIR}/../${ARCHIVE_FILENAME}
rm -rf ${BUILD_DIR}