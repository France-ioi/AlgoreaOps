import { Task } from '../tasks/tasks';

export function parseRelease(text: string): Task|undefined {
  const regex = new RegExp(`^release (frontend|backend) (${process.env['ALLOWED_DEPLOYENV']}) (\d{1,3}.\d{1,3}.\d{1,3}-[A-Fa-f0-9]{7}-[A-Fa-f0-9]{7})$`);
  const releaseMatch = regex.exec(text);
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
