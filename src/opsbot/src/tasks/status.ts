import { aliasInfo, functionVersions } from '../ops/lambdaFunctions';
import { lambdaFunctionName } from '../ops/envToFunctionNames';

export async function textStatus(): Promise<string> {
  const envs = [
    { app: 'backend', deployedEnv: 'fioi-prod' },
    { app: 'frontend', deployedEnv: 'fioi-prod' },
    { app: 'backend', deployedEnv: 'tez-prod' },
    { app: 'frontend', deployedEnv: 'tez-prod' },
  ];
  const info = await Promise.all(envs.map(async ({ app, deployedEnv }) => envStatus(app, deployedEnv)));
  return 'Current deployments: '+
    '(format: "<deployment version> [<deployment date] (<lambda version>)", ✅ indicates the released version)\n' +
    envs
      .map((e, idx) => `${e.app} ${e.deployedEnv}:\n${
          info[idx]!.versions.map(v =>
            ` * ${v.description} (${v.version}) ${v.version === info[idx]!.releasedVersion ? '✅':''}`
          ).join('\n')}`)
      .join('\n');

}

async function envStatus(app: string, deployedEnv: string): Promise<
  { versions: { description: string, version: string }[], releasedVersion: string|undefined }
> {
  const functionName = lambdaFunctionName(app, deployedEnv);
  const info = await Promise.all([
    functionVersions(functionName),
    aliasInfo(functionName, 'released')
  ]);
  return { versions: info[0], releasedVersion: info[1].version };
}
