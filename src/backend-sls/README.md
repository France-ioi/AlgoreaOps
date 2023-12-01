# Algorea Backend Serverless Deployment

# Packaging

Before building, the project requires (at the root of the project):
- the app binary file named `AlgoreaBackend`
- private and public keys, named `public_key.pem` and `private_key.pem`
- a config file `./conf/config.yaml`

Then, run `make`. Archives are build in the `build/` directory. 

# Deployment

```
sls deploy --stage fioi --aws-profile ...
```
