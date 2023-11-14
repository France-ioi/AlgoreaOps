# Algorea Backend Serverless Deployment

# Deployment

```
sls deploy --stage prod --aws-profile ...
```

# Current deployments

```
cp ../../environments/configs/tezos-private.pem private_key.pem
cp ../../environments/configs/tezos-public.pem public_key.pem
curl -L https://github.com/France-ioi/AlgoreaBackend/releases/download/v2.14.1/AlgoreaBackend-linux --output ./AlgoreaBackend-linux
sls deploy --stage tezos-prod --aws-profile algorea

sls deploy --stage default-prod --aws-profile algorea
sls deploy --stage dev --aws-profile ...
```