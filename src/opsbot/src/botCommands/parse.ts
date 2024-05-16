import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { SlackChatClient } from '../libs/slackChatClient';
import { awsConfig } from '../libs/awsConfig';
import { Task } from '../workerTasks/tasks';

export async function parseBotCommand(channel: string, text: string, isSuperUser: boolean): Promise<void> {
  const slackClient = new SlackChatClient(channel, 'bot');

  if (/^help$/.test(text)) {
    await slackClient.send(`
  Commands: 
      help - this help
      status - info about deployments and releases
      command backend fioi|tez db-recompute|db-migrate|db-migrate-undo|delete-temp-users|propagation
      release frontend|backend fioi|tez prod <lambdaversion>`);
    return;
  }

  if (/^status$/.test(text)) {
    await Promise.all([
      slackClient.send('Retrieving status...'),
      asyncInvokeWorker({ channel, action: 'printStatus' }),
    ]);
    return;
  }

  if (!isSuperUser) {
    await slackClient.send('Only specific users can use the critical actions');
    return;
  }

  const removeMatch = /^delete (frontend|backend) (fioi|tez) ([\da-f.-]+)$/.exec(text);
  if (removeMatch !== null) {
    if (!removeMatch[1] || !removeMatch[2] || !removeMatch[3]) throw new Error('unexpected: no arg match');
    await Promise.all([
      slackClient.send('Deleting...'),
      asyncInvokeWorker({
        channel,
        action: 'deleteDeployment',
        app: removeMatch[1],
        deployEnv: removeMatch[2],
        deploymentId: removeMatch[3]
      }),
    ]);
    return;
  }

  const releaseMatch = /^release (frontend|backend) (fioi|tez) (prod) (\d+)$/.exec(text);
  if (releaseMatch !== null) {
    if (!releaseMatch[1] || !releaseMatch[2] || !releaseMatch[3] || !releaseMatch[4]) throw new Error('unexpected: no arg match');
    await Promise.all([
      slackClient.send('Releasing...'),
      asyncInvokeWorker({
        channel,
        action: 'doRelease',
        app: releaseMatch[1],
        deployEnv: releaseMatch[2],
        stage: releaseMatch[3],
        lambdaVersion: releaseMatch[4]
      }),
    ]);
    return;
  }


  const commandMatch = /^command (backend) (fioi|tez) ([\w -]+)$/.exec(text);
  if (commandMatch !== null) {
    if (!commandMatch[1] || !commandMatch[2] || !commandMatch[3]) throw new Error('unexpected: no arg match');
    await Promise.all([
      slackClient.send(`Sending command to backend: ${commandMatch[3]}`),
      asyncInvokeWorker({
        channel,
        action: 'runCommand',
        app: commandMatch[1],
        deployEnv: commandMatch[2],
        command: commandMatch[3]
      }),
    ]);
    return;
  }

  await slackClient.send(text+': unknown command (try "help")');


}

async function asyncInvokeWorker(task: Task): Promise<void> {
  const stage = process.env['STAGE'];
  if (!stage) throw new Error('unexpected: undefined STAGE env var');
  const client = new LambdaClient(awsConfig);
  const command = new InvokeCommand({
    FunctionName: 'alg-opsbot-worker',
    InvocationType: 'Event',
    Payload: JSON.stringify(task),
  });
  await client.send(command);
}
