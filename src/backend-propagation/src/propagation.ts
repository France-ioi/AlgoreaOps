import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

export const streamHandler = awslambda.streamifyResponse(async (_event, responseStream) => {
  const env = process.env.STAGE;
  if (!env) throw new Error('unexpected: STAGE env var not set');

  responseStream.setContentType('application/json');
  responseStream.end('{}');

  // If the 'DISABLE' env variable is set, the propagation is not sent to the command.
  // That means that the propagation is not run anymore!!!
  // To be use temporarily for emergency cases where propagations take the db down.
  if (process.env.DISABLE) {
    console.warn('Propagation disabled! Not calling the command.');
    return;
  }

  const client = new LambdaClient({ region: 'eu-west-3' });
  const command = new InvokeCommand({
    FunctionName: `alg-backend-${env}-command`,
    InvocationType: 'Event', // async
    Payload: JSON.stringify({ command: 'propagation' }),
  });
  const result = await client.send(command);
  console.log('Async invocation of the propagation command done with result:'+result.StatusCode);
});
