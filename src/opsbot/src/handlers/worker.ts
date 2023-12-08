import { SlackChatClient } from '../libs/slackChatClient';
import { textStatus } from '../commands/status';
import { release } from '../commands/release';
import { logIfDebug } from '../libs/logDebug';

export type Task = { channel: string } & (
  { action: 'printStatus'} |
  { action: 'doRelease', app: string, deployEnv: string, stage: string, lambdaVersion: string }
);

export async function handler(event: unknown): Promise<void> {
  logIfDebug('event', event);
  const task = event as Task;
  try {
    const slackClient = new SlackChatClient(task.channel);
    await doAction(task, slackClient);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

async function doAction(task: Task, slackClient: SlackChatClient): Promise<void> {

  if (task.action === 'printStatus') {
    await slackClient.send(await textStatus());
  } else if (task.action === 'doRelease') {
    await release(task.app, task.deployEnv, task.stage, task.lambdaVersion);
    await slackClient.send('Release done');
  } else {
    throw new Error('The input event is not a supported "Task": '+JSON.stringify(task));
  }
}