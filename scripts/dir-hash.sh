#!/bin/bash
#
# Compute the hash of a directory
#

if [[ $# -ne 1 ]]; then
  echo "Illegal number of parameters. Usage: $0 <path-to-directory>" >&2
  exit 1
fi

HASH=$(find $1 -type f -print0 | sort -z | xargs -0 sha1sum | sha1sum)
echo ${HASH:0:6}
