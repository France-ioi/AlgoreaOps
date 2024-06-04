
export interface DeployTask { action: 'deploy', app: string, deployEnv: string, version: string, configHash?: string }

export type Task = { channel: string } & (
  { action: 'printStatus'} |
  { action: 'deleteDeployment', app: string, deployEnv: string, deploymentId: string } |
  { action: 'doRelease', app: string, deployEnv: string, stage: string, lambdaVersion: string } |
  DeployTask |
  { action: 'runCommand', app: string, deployEnv: string, command: string }
  );