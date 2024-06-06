import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { SlackChatClient } from '../libs/slackChatClient';
import { awsConfig } from '../libs/awsConfig';
import { Task } from '../tasks/tasks';
import { parseDeploy } from './deploy';
import { parseHelp } from './help';
import { helpText } from '../tasks/printHelp';
import { deploy } from '../tasks/deploy';

interface Command {
  superUserOnly?: boolean,
  local: boolean,
  parser: (channel: string, text: string) => Task|undefined,
}

export async function parseBotCommand(channel: string, text: string, isSuperUser: boolean): Promise<void> {
  const slackClient = new SlackChatClient(channel, 'bot');
  const commands: Command[] = [
    { parser: parseHelp, local: true },
    { parser: parseDeploy, superUserOnly: true, local: true }
  ];

  let task: Task|undefined;
  while (task === undefined && commands.length > 0) {
    const command = commands.pop()!;
    task = command.parser(channel, text);
    if (task && (command.superUserOnly && !isSuperUser)) {
      await slackClient.send('Only specific users can use the critical actions');
      return;
    }
  }

  if (!task) {
    await slackClient.send(text+': unknown action (try "help")');
  } else if (task.action === 'printHelp') await slackClient.send(helpText());
  else if (task.action === 'deploy') await slackClient.send(await deploy(task));
  else {
    await Promise.all([
      slackClient.send(`Sending action to worker: '${task.action}'`),
      asyncInvokeWorker(task)
    ]);
  }
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
