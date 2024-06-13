import { SlackChatClient } from '../libs/slackChatClient';
import { Task } from '../tasks/tasks';
import { parseDeploy } from './deploy';
import { parseHelp } from './help';
import { helpText } from '../tasks/printHelp';
import { deploy } from '../tasks/deploy';
import { parseRelease } from './release';
import { release } from '../tasks/release';
import { parseCommand } from './command';
import { runBackendCommand } from '../tasks/runBackendCommand';
import { textStatus } from '../tasks/status';
import { parseStatus } from './status';

interface Command {
  superUserOnly?: boolean,
  parser: (text: string) => Task|undefined,
}

export async function parseBotCommand(channel: string, text: string, isSuperUser: boolean): Promise<void> {
  const slackClient = new SlackChatClient(channel, 'bot');
  const commands: Command[] = [
    { parser: parseHelp },
    { parser: parseDeploy, superUserOnly: true },
    { parser: parseRelease, superUserOnly: true },
    { parser: parseCommand, superUserOnly: true },
    { parser: parseStatus },
  ];

  let task: Task|undefined;
  while (task === undefined && commands.length > 0) {
    const command = commands.pop()!;
    task = command.parser(text);
    if (task && (command.superUserOnly && !isSuperUser)) {
      await slackClient.send('Only specific users can use the critical actions');
      return;
    }
  }

  if (!task) {
    await slackClient.send(text+': unknown action (try "help")');
  } else if (task.action === 'printHelp') await slackClient.send(helpText());
  else if (task.action === 'deploy') await slackClient.send(await deploy(task));
  else if (task.action === 'release') await slackClient.send(await release(task));
  else if (task.action === 'runCommand') await slackClient.send(await runBackendCommand(task.deployEnv, task.command));
  else if (task.action === 'printStatus') await slackClient.send(await textStatus());
  else {
    await slackClient.send('unhandled action');
  }
}
