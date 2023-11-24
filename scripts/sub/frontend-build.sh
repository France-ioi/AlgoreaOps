#!/bin/bash
#
# Script which builds the Algorea frontend. It outputs on its last line the path the build.
# Usage: ./scripts/frontend-build.sh <env> <deployment_id> <config_dir> <lang1> <lang2> ... 
#        (e.g. './scripts/frontend-build.sh fioi 81 2.38.1 ./environement/fioi/config/frontend en fr')
#

SCRIPT_PWD=$(pwd)
BUILD_DIR=${SCRIPT_PWD}/build/frontend

set -e
set -x

if [[ ! "$0" =~ ^./script ]]; then
  echo "Run the script from the project root!" >&2
  exit 1;
fi

if [[ $# -le 5 ]]; then
    echo "Illegal number of parameters. Usage: $0 <env> <deployment_id> <version> <config_dir> <lang1> <lang2> ..." >&2
    exit 1
fi

DEPLOYED_ENV=$1
DEPLOYMT_ID=$2
VERSION=$3
CONFIG_DIR=$4
shift 4
LANGS=$@

DEPLOY_DIR=${DEPLOYED_ENV}/${DEPLOYMT_ID}
APP_BUILD_DIR=${BUILD_DIR}/AlgoreaFrontend-${VERSION}

# Get code
mkdir -p ${BUILD_DIR}
curl -L https://github.com/France-ioi/AlgoreaFrontend/archive/refs/tags/v${VERSION}.tar.gz --output ${BUILD_DIR}/archive.tar.gz
tar -xf ${BUILD_DIR}/archive.tar.gz -C ${BUILD_DIR}

# File override (config and assets)
rsync -r ${CONFIG_DIR}  ${APP_BUILD_DIR}/ --exclude "*.enc" --exclude ".*"

cd ${APP_BUILD_DIR}
rm -rf ${BUILD_DIR}/${DEPLOY_DIR}
mkdir -p ${BUILD_DIR}/${DEPLOY_DIR}/

for LANG in $LANGS; do 

  npm install
  #npm run injectDeployUrlForAssets --url="//assets.algorea.org/deployments/${DEPLOY_DIR}/${LANG}/"
  npx ng build --configuration production-${LANG} --base-href / --deploy-url //assets.algorea.org/deployments/${DEPLOY_DIR}/${LANG}/

  mv ./dist/algorea/${LANG} ${BUILD_DIR}/${DEPLOY_DIR}/

done

cd ${SCRIPT_PWD}
echo ${BUILD_DIR}/${DEPLOY_DIR}