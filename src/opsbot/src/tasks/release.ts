import { getLambdaVersion } from '../ops/deployments';
import { lambdaFunctionName } from '../ops/envToFunctionNames';
import { changeAliasVersion } from '../ops/releases';
import { ReleaseTask } from './tasks';

export async function release({ app, deployEnv, fullVersion }: ReleaseTask): Promise<string> {
  const functionName = lambdaFunctionName(app, deployEnv);
  const alias = 'released';
  const lambdaVersionId = await getLambdaVersion(app, deployEnv, fullVersion);
  await changeAliasVersion(functionName, alias, lambdaVersionId);
  return `${functionName}: alias ${alias} changed to version ${lambdaVersionId}`;
}