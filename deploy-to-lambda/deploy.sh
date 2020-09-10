#!/bin/sh
set -e

function deploy()
{
  TAG=$1
  ALLUSERSGRP=$2
  TMPUSERSGRP=$3
  APIPATH=$4
  DBNAME=$5
  AWSPROFILE="$6 $7" # may be empty

  FILENAME=lambda-$TAG.zip

  ## PREPARE THE ARCHIVE
  INITPWD=`pwd`
  rm -rf $FILENAME
  TMPDIR=`mktemp -d -t algoreabackend-XXXXXXXXXX`
  cp AlgoreaBackend-linux ./private_key.pem ./public_key.pem $TMPDIR/
  mkdir -p $TMPDIR/conf
  sed "s/ALLUSERS/$ALLUSERSGRP/" config.lambda.yaml | sed -e "s/TMPUSERS/$TMPUSERSGRP/" > $TMPDIR/conf/config.yaml
  cd $TMPDIR
  zip -r $INITPWD/$FILENAME .
  cd $INITPWD
  rm -rf $TMPDIR

  ## DEPLOY ON AWS LAMBDA

  aws s3 sync ./ s3://algorea-lambda-upload/lambda-code/ --exclude "*" --include "$FILENAME" $AWSPROFILE
  aws lambda update-function-code --function-name AlgoreaBackend --s3-bucket algorea-lambda-upload --s3-key lambda-code/$FILENAME --query 'LastUpdateStatus' $AWSPROFILE
  CONFIG=`aws lambda get-function-configuration --function-name AlgoreaBackend --output json --query 'Environment' $AWSPROFILE`

  # replace api path and db name
  APIPATH=${APIPATH/\//\\\/}
  CONFIG=`echo $CONFIG | sed "s#\"ALGOREA_SERVER__ROOTPATH\": \"[\/a-z]*\"#\"ALGOREA_SERVER__ROOTPATH\": \"$APIPATH\"#" | sed "s/\"ALGOREA_DATABASE__DBNAME\": \"[_a-z]*\"/\"ALGOREA_DATABASE__DBNAME\": \"$DBNAME\"/"`

  # update config,
  aws lambda update-function-configuration --function-name AlgoreaBackend --environment "${CONFIG}" --query 'LastUpdateStatus' $AWSPROFILE
  # attach version to alias
  VER=`aws lambda publish-version --function-name AlgoreaBackend --query 'Version' $AWSPROFILE`
  VER=${VER//\"/}
  aws lambda update-alias --function-name AlgoreaBackend --name $TAG --function-version $VER $AWSPROFILE

}

# deploy dev 1 4 /devapi/ algorea $1 $2
deploy prod 3 2 /api/ algorea_full $1 $2
