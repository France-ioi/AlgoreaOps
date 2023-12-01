
SERVER_BUILD_DIR=build/server
COMMAND_BUILD_DIR=build/command

all: server command

server:
	rm -f build/server.zip
	mkdir -p ${SERVER_BUILD_DIR}
	cp ./AlgoreaBackend ${SERVER_BUILD_DIR}/bootstrap
	cp -r ./conf ${SERVER_BUILD_DIR}/
	cp -r ./public_key.pem ${SERVER_BUILD_DIR}/
	cp -r ./private_key.pem ${SERVER_BUILD_DIR}/
	cd ${SERVER_BUILD_DIR} && zip ../server.zip bootstrap conf/config* *.pem
	rm -rf ${SERVER_BUILD_DIR}

command:
	rm -f build/command.zip
	mkdir -p ${COMMAND_BUILD_DIR}
	cp ./src/command.sh ${COMMAND_BUILD_DIR}/bootstrap
	cp ./AlgoreaBackend ${COMMAND_BUILD_DIR}/
	cp -r ./conf ${COMMAND_BUILD_DIR}/
	cp -r ./public_key.pem ${COMMAND_BUILD_DIR}/
	cp -r ./private_key.pem ${COMMAND_BUILD_DIR}/
	cd ${COMMAND_BUILD_DIR} && zip ../command.zip bootstrap AlgoreaBackend conf/config* *.pem
	rm -rf ${COMMAND_BUILD_DIR}

.FORCE: # force the rule using it to always re-run
.PHONY: all server command