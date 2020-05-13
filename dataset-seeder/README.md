# Dataset Seeder

Lambda function which can seed a database with a given dataset.

* Lambda is made to be triggered from API Gateway as proxy.
* The database is configured with the `DB_HOST`, `DB_USER`, `DB_PWD`, and `DB_NAME`.
* Datasets are retrieved from the "franceioi-algorea" bucket under the "datasets/" path.
* See the Makefile for building the lambda archive and deploying.
* To call the serice using curl: `curl --request POST --url https://.../actions/seed-dataset?dataset=dev`. If the dataset parameter is omitted, the "dev.sql" dataset is loaded.
