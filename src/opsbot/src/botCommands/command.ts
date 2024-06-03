import { Task } from '../workerTasks/tasks';

export function parseCommand(channel: string, text: string): Task|undefined {
  const commandMatch = /^command (backend) (fioi|tez) ([\w -]+)$/.exec(text);
  if (commandMatch !== null) {
    if (!commandMatch[1] || !commandMatch[2] || !commandMatch[3]) throw new Error('unexpected: no arg match');
    return {
      channel,
      action: 'runCommand',
      app: commandMatch[1],
      deployEnv: commandMatch[2],
      command: commandMatch[3]
    };
  }
  return undefined;
}