import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { awsConfig } from '../libs/awsConfig';

type LambdaVersion = string;

export async function getLambdaVersion(app: string, deployEnv: string, fullVersion: string): Promise<LambdaVersion> {
  const opsBucket = process.env['OPS_BUCKET'];
  if (!opsBucket) throw new Error('OPS_BUCKET must be set');
  const client = new S3Client(awsConfig);
  const key = `deployments/${app}/${deployEnv}/${fullVersion}/LAMBDA_VERSION`;
  const command = new GetObjectCommand({ Bucket: opsBucket, Key: key });
  const data = await client.send(command);
  if (!data.Body) throw new Error('missing "Body" key in S3 get object response');
  const fileContent = await data.Body.transformToString();
  const lambdaVersion = fileContent.split('\n')[0];
  if (!lambdaVersion) {
    throw new Error(`unable to parse correctly lambdaVersion (key:${key}, file:${fileContent})`);
  }
  return lambdaVersion;
}
