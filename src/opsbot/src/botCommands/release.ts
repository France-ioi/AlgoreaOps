import { Task } from '../workerTasks/tasks';

export function parseRelease(channel: string, text: string): Task|undefined {
  const releaseMatch = /^release (frontend|backend) (fioi|tez) (prod) (\d+)$/.exec(text);
  if (releaseMatch !== null) {
    if (!releaseMatch[1] || !releaseMatch[2] || !releaseMatch[3] || !releaseMatch[4]) throw new Error('unexpected: no arg match');
    return {
      channel,
      action: 'doRelease',
      app: releaseMatch[1],
      deployEnv: releaseMatch[2],
      stage: releaseMatch[3],
      lambdaVersion: releaseMatch[4]
    };
  }
  return undefined;
}
