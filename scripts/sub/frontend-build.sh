#!/bin/bash
#
# Script which builds the Algorea frontend
# Usage: ./scripts/sub/frontend-build.sh <env> <version> <deployment_dir>
#

SCRIPT_PWD=$(pwd)
BUILD_DIR=${SCRIPT_PWD}/build/frontend

set -e
set -x

if [[ ! "$0" =~ ^./script ]]; then
  echo "Run the script from the project root!" >&2
  exit 1;
fi

if [[ $# -ne 3 ]]; then
    echo "Illegal number of parameters. Usage: $0 <env> <version> <deployment_dir>" >&2
    exit 1
fi

DEPLOYED_ENV=$1
VERSION=$2
DEPLOY_DIR=$3

rm -rf ${BUILD_DIR}
mkdir -p ${BUILD_DIR}/${DEPLOY_DIR}

# Get code
curl -L https://github.com/France-ioi/AlgoreaFrontend/archive/refs/tags/v${VERSION}.tar.gz --output ${BUILD_DIR}/archive.tar.gz
tar -xf ${BUILD_DIR}/archive.tar.gz -C ${BUILD_DIR}
mv ${BUILD_DIR}/AlgoreaFrontend-${VERSION}/* ${BUILD_DIR}/

# File override (config and assets)
shopt -s extglob
cp -r environments/frontend/${DEPLOYED_ENV}/!(*.enc|.*|build-config.yaml) ${BUILD_DIR}/ 

# lang config
LANGS=$(yq '.languages | join(" ")' environments/frontend/${DEPLOYED_ENV}/build-config.yaml)

cd ${BUILD_DIR}

for LANG in $LANGS; do 
  npm install
  npm run injectDeployUrlForAssets --url="//assets.algorea.org/deployments/${DEPLOY_DIR}/${LANG}/"
  npx ng build --configuration production-${LANG} --base-href / --deploy-url //assets.algorea.org/deployments/${DEPLOY_DIR}/${LANG}/

  mv ./dist/algorea/${LANG} ${BUILD_DIR}/${DEPLOY_DIR}/

done

cd ${SCRIPT_PWD}
