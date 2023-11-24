#!/bin/bash
#
# Encrypt a specific config file. Create a filename.enc file.
# Usage: ./script/encrypt.sh <path-fo-file>
#

OPENSSL="openssl" # must be >1.1.1

if [[ $# -ne 1 ]]; then
  echo "Illegal number of parameters. Usage: $0 <path-fo-file>" >&2
  exit 1
fi

FILENAME=$1

rm -f ${FILENAME}.enc
${OPENSSL} enc -aes-256-cbc -md sha512 -pbkdf2 -iter 100000 -salt -in ${FILENAME} -out ${FILENAME}.enc
