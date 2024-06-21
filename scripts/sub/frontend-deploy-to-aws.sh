#!/bin/bash
#
# Script which deploys the Algorea frontend on S3 and configure the lambda serving the index file.
# It requires the AWS credentials to be set in the environment
# It outputs on its last line the lambda version to be used for the release phase.
# Usage: ./frontend-deploy-to-aws.sh <env> <deploy_dir> 
# 
# To pass specific parameters to aws commands, use the AWS_PROFILE, AWS_EXTRA_ARGS, AWS_S3_EXTRA_ARGS, SLS_EXTRA_ARGS variables.
# For instance: "AWS_PROFILE=... ./scripts/frontend-deploy-to-aws.sh ..."
#

if [ "x${FRONTEND_PUBLIC_BUCKET}" = "x" ]; then
  echo "FRONTEND_PUBLIC_BUCKET env var should be set" >&2
  exit 1
fi

S3_BUCKET=${FRONTEND_PUBLIC_BUCKET}
S3_REGION=eu-west-3

SCRIPT_PWD=$(pwd)
BUILD_DIR=${SCRIPT_PWD}/build/frontend

set -e
set -x

if [ "x${AWS_PROFILE}" != "x" ]; then AWS_EXTRA_ARGS="${AWS_EXTRA_ARGS} --profile ${AWS_PROFILE}"; fi
if [ "x${AWS_PROFILE}" != "x" ]; then SLS_EXTRA_ARGS="${SLS_EXTRA_ARGS} --aws-profile ${AWS_PROFILE}"; fi
AWS_S3_EXTRA_ARGS="${AWS_S3_EXTRA_ARGS} ${AWS_EXTRA_ARGS} "

if [[ ! "$0" =~ ^./script ]]; then
  echo "Run the script from the project root!" >&2
  exit 1;
fi

if [[ $# -lt 3 ]]; then
    echo "Illegal number of parameters. Usage: $0 <build_dir> <deploy_dir> <description>" >&2
    exit 1
fi

DEPLOYED_ENV=$1
DEPLOY_DIR=$2
shift 2
DESCRIPTION="$@"

# upload to S3
aws s3 sync ${BUILD_DIR}/${DEPLOY_DIR} s3://${S3_BUCKET}/deployments/${DEPLOY_DIR} --exclude "*/index.html" --cache-control 'max-age=86400' ${AWS_S3_EXTRA_ARGS}
aws s3 sync ${BUILD_DIR}/${DEPLOY_DIR} s3://${S3_BUCKET}/deployments/${DEPLOY_DIR} --exclude "*" --include "*/index.html" --cache-control 'max-age=300' ${AWS_S3_EXTRA_ARGS}

# create sls
mkdir -p ${BUILD_DIR}/sls
cp -r ${SCRIPT_PWD}/src/frontend-sls/* ${BUILD_DIR}/sls
cd ${BUILD_DIR}/sls
ENV_CONFIG=".env.${DEPLOYED_ENV}"
echo "DEBUG=\"0\"" > $ENV_CONFIG
echo "NO_CACHE=\"0\"" >> $ENV_CONFIG
echo "S3_BUCKET=\"${S3_BUCKET}\"" >> $ENV_CONFIG
echo "S3_PREFIX=\"deployments/${DEPLOY_DIR}/\"" >> $ENV_CONFIG
echo "S3_REGION=\"${S3_REGION}\"" >> $ENV_CONFIG

# deploy to lambda
sls deploy --stage ${DEPLOYED_ENV} --param="description=${DESCRIPTION}" ${SLS_EXTRA_ARGS} 

# print the lambda version
LAMBDA_VERSION=$(aws cloudformation describe-stacks --stack-name alg-frontend-${DEPLOYED_ENV} --query "Stacks[0].Outputs[?OutputKey == 'StaticDashserveLambdaFunctionQualifiedArn'].OutputValue | [0]" ${AWS_EXTRA_ARGS} | cut -d: -f 8 | cut -d\" -f 1)
echo ${LAMBDA_VERSION} > LAMBDA_VERSION
aws s3 cp LAMBDA_VERSION s3://alg-ops/deployments/frontend/${DEPLOY_DIR}/LAMBDA_VERSION ${AWS_S3_EXTRA_ARGS}

cd ${SCRIPT_PWD}
