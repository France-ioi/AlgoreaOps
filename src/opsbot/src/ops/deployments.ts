import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3"; 
import { awsConfig } from "../libs/awsConfig";

export interface EnvDeployments {
  app: string,
  env: string 
  deployments: Deployment[]
}

interface Deployment {
  deploymentId: string,
  lambdaVersion: string, 
}

export async function gatherDeploymentsInfo(): Promise<EnvDeployments[]> {
  const client = new S3Client(awsConfig);
  return await Promise.all(
    [
      { app: 'backend', env: 'fioi' },
      { app: 'frontend', env: 'fioi' },
    ]
      .map(async (req) => ({ ...req, deployments: await allDeployedVersions(client, req.app, req.env) }))
  );
}

async function allDeployedVersions(client: S3Client, app: string, env: string): Promise<Deployment[]> {
  const command = new ListObjectsV2Command({ Bucket: 'alg-ops', Prefix: `deployments/${app}/${env}/` });
  const response = await client.send(command);
  if (!response.Contents) throw new Error('missing "Content" key in S3 listing response');
  const keys = response.Contents.map(c => c.Key);
  return await Promise.all(keys.map(async (key) => {
    if (!key) throw new Error('missing "Key" in S3 listing response');
    const command = new GetObjectCommand({ Bucket: 'alg-ops', Key: key });
		const data = await client.send(command);
    if (!data.Body) throw new Error('missing "Body" key in S3 get object response');
		const fileContent = await data.Body.transformToString();
    const deploymentId = key.split('/')[3];
    const lambdaVersion = fileContent.split('\n')[0];
    if (!deploymentId || !lambdaVersion) throw new Error(`unable to parse correctly deploymentId or lambdaVersion (key:${key}, file:${fileContent})`);
    return { deploymentId, lambdaVersion }
  }));
}