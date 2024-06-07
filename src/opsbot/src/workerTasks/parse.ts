import { textStatus } from './status';
import { SlackChatClient } from '../libs/slackChatClient';
import { Task } from '../tasks/tasks';

export async function parseAction(task: Task): Promise<void> {
  const channel = process.env.SLACK_CHANNEL;
  if (!channel) throw new Error('error: missing slack channel config');
  const slackClient = new SlackChatClient(channel, 'worker');

  if (task.action === 'printStatus') {
    await slackClient.send(await textStatus());
  } else {
    await slackClient.send(`Invalid task: ${JSON.stringify(task)}`);
    throw new Error(`The input event is not a supported "Task": ${JSON.stringify(task)}`);
  }
}