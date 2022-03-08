OPENSSL="openssl" # must be >1.1.1. on OSX, use homebrew version at /usr/local/opt/openssl/bin/openssl

deploy: check-env deploy-frontend deploy-backend

deploy-frontend: check-env
	./scripts/deploy-frontend.sh

deploy-backend: check-env
	./scripts/deploy-backend.sh

encrypt-config:
	tar --create --file - -- ./environments/configs | $(OPENSSL) enc -aes-256-cbc -md sha512 -pbkdf2 -iter 100000 -salt -out ./environments/configs.encrypted

# provide the password in the PASS variable to decrypt without prompt (usage: "PASS=mydecryptionkey make decrypt-config")
decrypt-config:
ifndef PASS
	$(OPENSSL) enc -aes-256-cbc -d -md sha512 -pbkdf2 -iter 100000 -in ./environments/configs.encrypted | tar -v --extract --file -
else
	$(OPENSSL) enc -aes-256-cbc -d -md sha512 -pbkdf2 -iter 100000 -pass env:PASS -in ./environments/configs.encrypted | tar -v --extract --file -
endif

check-env:
ifndef ENV
	$(error ENV is undefined)
endif

.FORCE: # force the rule using it to always re-run
.PHONY: deploy deploy-frontend check-env