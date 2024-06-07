import { Task } from '../tasks/tasks';

export function parseRelease(channel: string, text: string): Task|undefined {
  const releaseMatch = /^release (frontend|backend) (fioi-prod) (\d{1,3}.\d{1,3}.\d{1,3}-[A-Fa-f0-9]{7}-[A-Fa-f0-9]{7})$/.exec(text);
  if (releaseMatch !== null) {
    if (!releaseMatch[1] || !releaseMatch[2] || !releaseMatch[3]) throw new Error('unexpected: no arg match');
    return {
      action: 'release',
      app: releaseMatch[1],
      deployEnv: releaseMatch[2],
      fullVersion: releaseMatch[3],
    };
  }
  return undefined;
}
