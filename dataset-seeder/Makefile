
# extract AWS_PROFILE if given
ifdef AWS_PROFILE
	AWS_PARAMS=--profile $(AWS_PROFILE)
endif

ARCHIVE=lambda-archive.zip
FCTNAME=AlgoreaBackend_restore_dev_db

all: deploy

build:
	zip $(ARCHIVE) dataset_loader.py mysql

deploy: build
	# pass AWS profile with AWS_PROFILE: make AWS_PROFILE="myprofile" ...
	aws lambda update-function-code --function-name $(FCTNAME) --zip-file fileb://$(ARCHIVE) $(AWS_PARAMS)
