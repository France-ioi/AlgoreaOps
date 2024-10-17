/* eslint-disable @typescript-eslint/naming-convention */
import { DeployTask } from './tasks';
import { request } from 'https';

export async function deploy(task: DeployTask): Promise<string> {
  let jobNumber = 0;
  try {
    const response = await triggerDeploy(task);
    const parsedResp = JSON.parse(response) as unknown as { number: number };
    jobNumber = +parsedResp.number;
  } catch (e) {
    return `Unable to trigger deployment: ${typeof e === 'object' ? JSON.stringify(e) : String(e)})`;
  }
  return `Deployment triggered (job number: ${jobNumber})`;
}

async function triggerDeploy(task: DeployTask): Promise<string> {
  const results = await Promise.all([
    task.deployEnv.map(deployEnv => new Promise(function(resolve, reject) {
      const req = request('https://circleci.com/api/v2/project/github/France-ioi/AlgoreaOps/pipeline', {
        headers: { 'Circle-Token': process.env['CIRCLECI_TOKEN'], 'Content-Type': 'application/json' },
        method: 'POST',
      }, res => {
        // reject on bad status
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          return reject(new Error('statusCode=' + res.statusCode));
        }
        // cumulate data
        const body: Uint8Array[] = [];
        res.on('data', function(chunk: Uint8Array) {
          body.push(chunk);
        });
        // resolve on end
        res.on('end', function() {
          let finalBody = '';
          try {
            finalBody = Buffer.concat(body).toString();
          } catch (e) {
            reject(e);
          }
          resolve(finalBody);
        });
      });
      const data = {
        branch: 'v3',
        parameters: {
          'deploy-app': task.app,
          'deploy-env': deployEnv,
          'deploy-version': task.version,
          'deploy-app-config': task.configHash ?? '',
          'aws-account': task.awsAccount,
          'slack-channel': task.slackChannel ?? '',
        }
      };
      req.write(JSON.stringify(data));
      // reject on request error
      req.on('error', function(err) {
        // This is not a "Second reject", just a different sort of failure
        reject(err);
      });
      req.end();
    }))
  ]);
  return results.join('\n');
}