import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { awsConfig } from '../libs/awsConfig';

export async function runBackendCommand(deployEnv: string, command: string): Promise<string> {
  const client = new LambdaClient(awsConfig);
  const lambdaCmd = new InvokeCommand({
    FunctionName: `alg-backend-${deployEnv}-command`,
    InvocationType: 'RequestResponse', // synchronous call
    Payload: JSON.stringify({ command }),
  });
  const resp = await client.send(lambdaCmd);
  if (!resp.Payload) return 'Error: no output';
  return resp.Payload?.transformToString();
}