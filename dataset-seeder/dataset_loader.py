import boto3
import subprocess

def fetch_dataset(dst, dataset_name):
    # fetching the dataset from S3
    s3 = boto3.client('s3', region_name="eu-west-3")
    s3.download_file("franceioi-algorea", f'datasets/{dataset_name}.sql', dst)

def input_dataset(event):
    if isinstance(event, dict) and "queryStringParameters" in event:
        params = event["queryStringParameters"]
        if isinstance(params, dict) and "dataset" in params:
            return params["dataset"]
    return "dev" # default one

def lambda_handler(event, context):
    filename = "/tmp/dataset.sql"
    print(event)
    print(context)
    dataset = input_dataset(event)
    fetch_dataset(filename, dataset)
    subprocess.run(
        f'sed -i -- \'s/^\(.*\)DEFINER=[^*]*\(.*\)$/\\1DEFINER=CURRENT_USER\\2/g\' {filename}',
        shell=True, check=True
    )
    subprocess.run(
        f'./mysql -h $DB_HOST -u $DB_USER -p$DB_PWD $DB_NAME < {filename}',
        shell=True, check=True
    )
    return {
        "statusCode": 200,
        "headers": { "Content-Type": "text/plain" },
        "body": f'Dataset "{dataset}" seeded successfully'
    }
