import { Task } from '../tasks/tasks';

export function parseDeploy(text: string): Task|undefined {
  const regex = new RegExp(String.raw`^deploy (frontend|backend) (${process.env['ALLOWED_DEPLOYENV']}) ([\d.-]+)(?: ([A-Fa-f0-9]{1,41}))?$`);
  const match = regex.exec(text);
  if (match !== null) {
    if (!match[1] || !match[2] || !match[3]) throw new Error('unexpected: no arg match');
    return {
      action: 'deploy',
      app: match[1],
      deployEnv: match[2],
      version: match[3],
      configHash: match[4],
      awsAccount: process.env['STAGE'] === 'dev' ? 'dev' : 'prod',
      slackChannel: process.env['SLACK_CHANNEL'],
    };
  }
  return undefined;
}
