#!/bin/bash
#
# Decrypt all ".enc" in a specific directory
# Usage: ./scripts/decrypt.sh <path>
# The password can be passed using the "PASS" env var
#

OPENSSL="openssl" # must be >1.1.1

if [[ $# -ne 1 ]]; then
  echo "Illegal number of parameters. Usage: $0 <path>" >&2
  exit 1
fi

DIR=$1

for FILE in $(find ${DIR} -name '*.enc'); do
  DECRYPTED_FILE=${FILE%.enc}

  if [ "x${PASS}" == "x" ]; then
    ${OPENSSL} enc -aes-256-cbc -d -md sha512 -pbkdf2 -iter 100000 -in ${FILE} -out ${DECRYPTED_FILE} 
  else 
  	${OPENSSL} enc -aes-256-cbc -d -md sha512 -pbkdf2 -iter 100000 -pass env:PASS -in ${FILE} -out ${DECRYPTED_FILE}
  fi

done