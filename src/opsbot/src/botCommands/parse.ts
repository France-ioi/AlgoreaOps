import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { SlackChatClient } from '../libs/slackChatClient';
import { awsConfig } from '../libs/awsConfig';
import { Task } from '../workerTasks/tasks';
import { parseStatus } from './status';
import { parseRelease } from './release';
import { parseCommand } from './command';
import { parseDeploy } from './deploy';

type CommandCheck = (channel: string, text: string) => Task|undefined;

export async function parseBotCommand(channel: string, text: string, isSuperUser: boolean): Promise<void> {
  const slackClient = new SlackChatClient(channel, 'bot');

  if (/^help$/.test(text)) {
    await slackClient.send(`
  Commands: 
      help - this help
      status - info about deployments and releases
      command backend fioi|tez db-recompute|db-migrate|db-migrate-undo|delete-temp-users|propagation
      release frontend|backend fioi|tez prod <lambdaversion>

  v2 WIP:
  Commands:
      deploy <app> <env> <app-version> [<app-config>]
      delete frontend|backend fioi|tez <deployment-id> - undeploy the given deployment

  Where:
      app := frontend|backend
      env := fioi-prod
      app-version: in x.y.z format
      app-config: commit hash of config, if ommitted used the last one from https://github.com/France-ioi/AlgoreaConfigs/tree/<env>-<app>
      `);
    return;
  }

  let task = parseStatus(channel, text);
  if (task) {
    await asyncInvokeWorker(task);
    return;
  }

  if (!isSuperUser) {
    await slackClient.send('Only specific users can use the critical actions');
    return;
  }

  const commands: CommandCheck[] = [ parseRelease, parseCommand, parseDeploy ];

  while (task === undefined && commands.length > 0) {
    task = commands.pop()!(channel, text);
  }

  if (task) {
    await Promise.all([
      slackClient.send(`Running command '${task.action}'`),
      asyncInvokeWorker(task)
    ]);

  } else await slackClient.send(text+': unknown command (try "help")');
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
