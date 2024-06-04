import { deleteDeployment } from './deleteDeployment';
import { release } from './release';
import { runBackendCommand } from './runBackendCommand';
import { textStatus } from './status';
import { deploy } from './deploy';
import { SlackChatClient } from '../libs/slackChatClient';
import { Task } from './tasks';

export async function parseAction(task: Task): Promise<void> {
  const slackClient = new SlackChatClient(task.channel, 'worker');

  if (task.action === 'printStatus') {
    await slackClient.send(await textStatus());
  } else if (task.action === 'deleteDeployment') {
    await deleteDeployment(task.app, task.deployEnv, task.deploymentId);
    await slackClient.send('Deployment deleted');
  } else if (task.action === 'doRelease') {
    await release(task.app, task.deployEnv, task.stage, task.lambdaVersion);
    await slackClient.send('Release done');
  } else if (task.action === 'runCommand') {
    await slackClient.send(await runBackendCommand(task.deployEnv, task.command));
  } else if (task.action === 'deploy') {
    await deploy(task, slackClient);
  } else {
    await slackClient.send(`Invalid task: ${JSON.stringify(task)}`);
    throw new Error(`The input event is not a supported "Task": ${JSON.stringify(task)}`);
  }
}