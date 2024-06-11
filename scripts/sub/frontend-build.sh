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
  echo "Illegal number of parameters. Usage: $0 <version> <config_dir> <deployment_dir>" >&2
  exit 1
fi

VERSION=$1
CONFIG_DIR=$2
DEPLOY_DIR=$3

shopt -s dotglob # include .* files in the mv/cp operations

rm -rf ${BUILD_DIR}
mkdir -p ${BUILD_DIR}/${DEPLOY_DIR}

# Get code
curl -L https://github.com/France-ioi/AlgoreaFrontend/archive/refs/tags/v${VERSION}.tar.gz --output ${BUILD_DIR}/archive.tar.gz
tar -xf ${BUILD_DIR}/archive.tar.gz -C ${BUILD_DIR}

# File override (config and assets)
shopt -s extglob
cp -r ${CONFIG_DIR}/!(*.enc|.*|build-config.yaml) ${BUILD_DIR}/AlgoreaFrontend-${VERSION}/

# lang config
LANGS=$(yq '.languages | join(" ")' ${CONFIG_DIR}/build-config.yaml)

for LANG in $LANGS; do 
  cp -r ${BUILD_DIR}/AlgoreaFrontend-${VERSION} ${BUILD_DIR}/${LANG}
  cd ${BUILD_DIR}/${LANG}

  npm install
  npm run injectDeployUrlForAssets --url="//d2dvl3h4927j7o.cloudfront.net/deployments/${DEPLOY_DIR}/${LANG}/"
  npx ng build --configuration production-${LANG} --base-href / --deploy-url //d2dvl3h4927j7o.cloudfront.net/deployments/${DEPLOY_DIR}/${LANG}/

  mv ./dist/algorea/${LANG} ${BUILD_DIR}/${DEPLOY_DIR}/

done

cd ${SCRIPT_PWD}
