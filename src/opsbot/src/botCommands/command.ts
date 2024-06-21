import { Task } from '../tasks/tasks';

export function parseCommand(text: string): Task|undefined {
  const regex = new RegExp(`^command (backend) (${process.env['ALLOWED_DEPLOYENV']}) ([\w -]+)$`);
  const commandMatch = regex.exec(text);
  if (commandMatch !== null) {
    if (!commandMatch[1] || !commandMatch[2] || !commandMatch[3]) throw new Error('unexpected: no arg match');
    return {
      action: 'runCommand',
      app: commandMatch[1],
      deployEnv: commandMatch[2],
      command: commandMatch[3]
    };
  }
  return undefined;
}
