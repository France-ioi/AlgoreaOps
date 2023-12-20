import { LambdaFunctionURLEvent, LambdaFunctionURLResult } from 'aws-lambda';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

export async function handler(_event: LambdaFunctionURLEvent): Promise<LambdaFunctionURLResult> {
  const env = process.env.STAGE;
  if (!env) throw new Error('unexpected: STAGE env var not set');

  const client = new LambdaClient({ region: 'eu-west-3' });
  const command = new InvokeCommand({
    FunctionName: `alg-backend-${env}-command`,
    InvocationType: 'Event', // async
    Payload: JSON.stringify({ command: 'propagation' }),
  });
  await client.send(command);
  return {
    statusCode: 200,
    body: '{}'
  };
}
