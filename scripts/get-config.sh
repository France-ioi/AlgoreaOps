#!/bin/bash

set -e
set -x

if [[ $# -lt 3 ]]; then
  echo "Illegal number of parameters. Usage: $0 <dest-directory> <application> <environment> [<config-hash>]" >&2
  exit 1
fi

DIR=$1
APP=$2
DEPLOYED_ENV=$3
CONFIG_HASH=$4

git clone https://github.com/France-ioi/AlgoreaConfigs --branch ${APP}_${DEPLOYED_ENV} --single-branch ${DIR}
cd ${DIR}
if [ "x${CONFIG_HASH}" != "x" ]; then git reset --hard ${CONFIG_HASH}; fi