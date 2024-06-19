import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

export const streamHandler = awslambda.streamifyResponse(async (_event, responseStream) => {
  const env = process.env.STAGE;
  if (!env) throw new Error('unexpected: STAGE env var not set');

  responseStream.setContentType('application/json');
  responseStream.end('{}');

  const client = new LambdaClient({ region: 'eu-west-3' });
  const command = new InvokeCommand({
    FunctionName: `alg-backend-${env}-command`,
    InvocationType: 'Event', // async
    Payload: JSON.stringify({ command: 'propagation' }),
  });
  const result = await client.send(command);
  console.log('Async invocation of the propagation command done with result:'+result.StatusCode);
});
