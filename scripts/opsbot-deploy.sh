#!/bin/bash

# Script which deploys the Algorea opsbot serverless
# It requires the AWS credentials to be set in the environment

BUILD_DIR=./build/opsbot
SCRIPT_PWD=$(pwd)

set -e
set -x

if [[ ! "$0" =~ ^./script ]]; then
  echo "Run the script from the project root!"
  exit 1;
fi

if [[ $# -ne 2 ]]; then
  echo "Illegal number of parameters. Usage: $0 <stage> <config-dir>" >&2
  exit 1
fi

STAGE=$1
CONFIG_DIR=$2

if [ "x${AWS_PROFILE}" != "x" ]; then SLS_EXTRA_ARGS="${SLS_EXTRA_ARGS} --aws-profile ${AWS_PROFILE}"; fi

mkdir -p ${BUILD_DIR}
cp -r ./src/opsbot/* ${BUILD_DIR}/
cp ${CONFIG_DIR}/.env ${BUILD_DIR}

# deploy sls to lambda
cd ${BUILD_DIR}
npm install
sls deploy --stage ${STAGE} ${SLS_EXTRA_ARGS}

cd ${SCRIPT_PWD}
rm -rf ${BUILD_DIR}
