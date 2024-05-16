import { lambdaFunctionName } from '../ops/envToFunctionNames';
import { changeAliasVersion } from '../ops/releases';

export async function release(app: string, deployEnv: string, stage: string, lambdaVersion: string): Promise<void> {
  await changeAliasVersion(lambdaFunctionName(app, deployEnv), stage, lambdaVersion);
}