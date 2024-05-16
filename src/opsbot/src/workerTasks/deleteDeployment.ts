import { deleteDeploymentDir } from '../ops/deployments';
import { lambdaFunctionName } from '../ops/envToFunctionNames';
import { removeVersion } from '../ops/releases';

export async function deleteDeployment(app: string, deployEnv: string, deploymentId: string): Promise<void> {
  // delete the deployment directory (return the lambda id)
  const lambaVersion = await deleteDeploymentDir(app, deployEnv, deploymentId);

  // delete the lambda version
  await removeVersion(lambdaFunctionName(app, deployEnv), lambaVersion);
}