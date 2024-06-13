import { getLambdaVersion } from '../ops/s3deployments';
import { lambdaFunctionName } from '../ops/envToFunctionNames';
import { changeAliasVersion } from '../ops/lambdaFunctions';
import { ReleaseTask } from './tasks';

export async function release({ app, deployEnv, fullVersion }: ReleaseTask): Promise<string> {
  const functionName = lambdaFunctionName(app, deployEnv);
  const alias = 'released';
  const lambdaVersionId = await getLambdaVersion(app, deployEnv, fullVersion);
  await changeAliasVersion(functionName, alias, lambdaVersionId);
  return `${functionName}: alias '${alias}' changed to lambda version ${lambdaVersionId}`;
}
