#!/bin/bash
#
# Compute the hash of a directory
#

if [[ $# -lt 1 ]]; then
  echo "Illegal number of parameters. Usage: $0 <path-to-directory-1> <path-to-directory-2> ..." >&2
  exit 1
fi

FILE_HASHES=""

for DIR in "$@"; do
  FILE_HASHES=${FILE_HASHES}$(find ${DIR} -type f -print0 | sort -z | xargs -0 sha1sum)
done

HASH=$(echo ${FILE_HASHES} | sha1sum)


echo ${HASH:0:6}
