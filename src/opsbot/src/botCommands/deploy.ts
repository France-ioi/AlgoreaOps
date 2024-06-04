import { Task } from '../workerTasks/tasks';

export function parseDeploy(channel: string, text: string): Task|undefined {
  const match = /^deploy (frontend|backend) (fioi-prod) ([\d.-]*) ([A-Fa-f0-9]{6})+$/.exec(text);
  if (match !== null) {
    if (!match[1] || !match[2] || !match[3]) throw new Error('unexpected: no arg match');
    return {
      channel,
      action: 'deploy',
      app: match[1],
      deployEnv: match[2],
      version: match[3],
      configHash: match[4],
    };
  }
  return undefined;
}
