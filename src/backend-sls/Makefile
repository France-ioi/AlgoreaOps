
SERVER_BUILD_DIR=build/server

all: server

server:
	rm -f build/server.zip
	mkdir -p ${SERVER_BUILD_DIR}
	cp ./AlgoreaBackend ${SERVER_BUILD_DIR}/bootstrap
	cp -r ./conf ${SERVER_BUILD_DIR}/
	cp -r ./public_key.pem ${SERVER_BUILD_DIR}/
	cp -r ./private_key.pem ${SERVER_BUILD_DIR}/
	cd ${SERVER_BUILD_DIR} && zip ../server.zip bootstrap conf/config* *.pem
	rm -rf ${SERVER_BUILD_DIR}

.FORCE: # force the rule using it to always re-run
.PHONY: all server d