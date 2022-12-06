#!/bin/bash

# Script which deploys the Algorea frontend on S3 and configure the lambda serving the index file.
# It requires the AWS credentials to be set in the environment
# It outputs on its last line the lambda version to be used for the release phase

set -e
set -x

ENV_DIR=./environments
BUILD_DIR=./build/frontend

if [ ! -f ./scripts/deploy-frontend.sh ]; then
  echo "Run the script from the project root!"
  exit 1;
fi

DEPLOYED_ENV=$1
DEPLOYMT_ID=$2

if [[ -z "${DEPLOYED_ENV}" ]]; then
  echo "Missing parameter: environment to be deployed"
  exit 1;
fi

if [[ -z "${DEPLOYMT_ID}" ]]; then
  echo "Missing parameter: DEPLOYMT_ID"
  exit 1;
fi

ENV_FILE=${ENV_DIR}/${DEPLOYED_ENV}.yml
VERSION=$(yq '.frontend.version' ${ENV_FILE})
CONFIG_FILE=$(yq '.frontend.config_file' ${ENV_FILE})
APP_BUILD_DIR=${BUILD_DIR}/AlgoreaFrontend-${VERSION}
DEPLOY_DIR=$(yq '.frontend.deployment_prefix' ${ENV_FILE})-${DEPLOYMT_ID}
SCRIPT_PWD=$(pwd)
AWS_EXTRA_ARGS="" # for debugging (to force profile for instance)
AWS_S3_EXTRA_ARGS="${AWS_EXTRA_ARGS} " # for debugging (--dryrun for instance)

# Get code
mkdir -p ${BUILD_DIR}
curl -L https://github.com/France-ioi/AlgoreaFrontend/archive/refs/tags/v${VERSION}.tar.gz --output ${BUILD_DIR}/archive.tar.gz
tar -xf ${BUILD_DIR}/archive.tar.gz -C ${BUILD_DIR}

# Configure
cp ${ENV_DIR}/configs/${CONFIG_FILE} ${APP_BUILD_DIR}/src/environments/environment.prod.ts

# Build
cd ${APP_BUILD_DIR}
npm install
npm run injectDeployUrlForAssets --url="//assets.algorea.org/deployments/${DEPLOY_DIR}/en/"
npm run injectDeployUrlForPreloadFonts --url="//assets.algorea.org/deployments/${DEPLOY_DIR}/en/"
npx ng build --configuration production-en --base-href / --deploy-url //assets.algorea.org/deployments/${DEPLOY_DIR}/en/
aws s3 sync ./dist/algorea/ s3://algorea-static/deployments/${DEPLOY_DIR} --acl public-read --exclude "*/index.html" --cache-control 'max-age=86400' ${AWS_S3_EXTRA_ARGS}
aws s3 cp ./dist/algorea/en/index.html s3://algorea-static/deployments/${DEPLOY_DIR}/en/index.html --acl public-read --cache-control 'max-age=300' ${AWS_S3_EXTRA_ARGS}
rm -rf ./dist/algorea
git reset --hard
npm run injectDeployUrlForAssets --url="//assets.algorea.org/deployments/${DEPLOY_DIR}/fr/"
npm run injectDeployUrlForPreloadFonts --url="//assets.algorea.org/deployments/${DEPLOY_DIR}/fr/"
npx ng build --configuration production-fr --base-href / --deploy-url //assets.algorea.org/deployments/${DEPLOY_DIR}/fr/
aws s3 sync ./dist/algorea/ s3://algorea-static/deployments/${DEPLOY_DIR} --acl public-read --exclude "*/index.html" --cache-control 'max-age=31536000' ${AWS_S3_EXTRA_ARGS}
aws s3 cp ./dist/algorea/fr/index.html s3://algorea-static/deployments/${DEPLOY_DIR}/fr/index.html --acl public-read --cache-control 'max-age=300' ${AWS_S3_EXTRA_ARGS}
echo '<html><head><script>window.location.replace("en/");</script></head></html>' > dist/algorea/index.html
aws s3 cp dist/algorea/index.html s3://algorea-static/deployments/${DEPLOY_DIR}/index.html ${AWS_S3_EXTRA_ARGS} --acl public-read --cache-control 'max-age=300' ${AWS_S3_EXTRA_ARGS}
cd ${SCRIPT_PWD}

# Deploy
NEW_CONFIG=$(PREFIX=deployments/${DEPLOY_DIR}/ yq '.Variables.S3_PREFIX=strenv(PREFIX)' ${ENV_DIR}/configs/generic-algoreastatic-lambda.json)
REVISIONID=$(aws lambda update-function-configuration --function-name Algorea-static --region eu-central-1 --environment "${NEW_CONFIG}" ${AWS_EXTRA_ARGS} | yq '.RevisionId')
sleep 1
aws lambda publish-version --function-name Algorea-static --region eu-central-1  --description "Autodeployment ${DEPLOYMT_ID} (v${VERSION} on env ${DEPLOYED_ENV})" ${AWS_EXTRA_ARGS} | yq '.Version'
