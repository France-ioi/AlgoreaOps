#!/bin/sh
set -e

aws s3 sync ./ s3://algorea-lambda-upload/lambda-code/ --exclude "*" --include "lambda.zip" $1 $2
aws lambda update-function-code --function-name AlgoreaBackend --s3-bucket algorea-lambda-upload --s3-key lambda-code/lambda.zip --query 'LastUpdateStatus' $1 $2
CONFIG=`aws lambda get-function-configuration --function-name AlgoreaBackend --output json --query 'Environment' $1 $2`

# replace api path
CONFIG_DEV=${CONFIG/\"\/api\/\"/\"\/devapi\/\"}
CONFIG_PRO=${CONFIG/\"\/devapi\/\"/\"\/api\/\"}

# replace db username
CONFIG_DEV=${CONFIG_DEV/\"algorea_full\"/\"algorea\"}
CONFIG_PRO=${CONFIG_PRO/\"algorea\"/\"algorea_full\"}


aws lambda update-function-configuration --function-name AlgoreaBackend --environment "${CONFIG_DEV}" --query 'LastUpdateStatus' $1 $2
VER=`aws lambda publish-version --function-name AlgoreaBackend --query 'Version' $1 $2`
VER=${VER//\"/}
aws lambda update-alias --function-name AlgoreaBackend --name dev --function-version $VER $1 $2

aws lambda update-function-configuration --function-name AlgoreaBackend --environment "${CONFIG_PRO}" --query 'LastUpdateStatus' $1 $2
VER=`aws lambda publish-version --function-name AlgoreaBackend --query 'Version' $1 $2`
VER=${VER//\"/}
aws lambda update-alias --function-name AlgoreaBackend --name prod --function-version $VER $1 $2

