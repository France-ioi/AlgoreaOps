#!/bin/sh
#
# Lambda handler which expects a json event in the form "<cmd>" (just a string a the root of the json)
# where `<cmd>` is among the authorized command
# The `<cmd>` is given as parameter to the ./AlgoreaBackend binary
#

set -euo pipefail

# Processing
while true
do
  HEADERS="$(mktemp)"
  # Get an event. The HTTP request will block until one is received
  EVENT_DATA=$(curl -sS -LD "$HEADERS" "http://${AWS_LAMBDA_RUNTIME_API}/2018-06-01/runtime/invocation/next")

  # Extract request ID by scraping response headers received above
  REQUEST_ID=$(grep -Fi Lambda-Runtime-Aws-Request-Id "$HEADERS" | tr -d '[:space:]' | cut -d: -f2)

  COMMAND=$(echo ${EVENT_DATA} | cut -d\" -f2) # extract the first string from the data
  if [[ "$COMMAND" =~ ^(db-recompute|db-migrate)$ ]]; then
    $LAMBDA_TASK_ROOT/AlgoreaBackend ${COMMAND}
    curl "http://${AWS_LAMBDA_RUNTIME_API}/2018-06-01/runtime/invocation/$REQUEST_ID/response"  -d "DONE with command: ${COMMAND} (data: ${EVENT_DATA})"
  else
    curl "http://${AWS_LAMBDA_RUNTIME_API}/2018-06-01/runtime/invocation/$REQUEST_ID/error"  -d "Invalid/unauthorized data: ${EVENT_DATA}"
  fi

done
