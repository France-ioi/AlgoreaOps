
export interface DeployTask { action: 'deploy', app: string, deployEnv: string, version: string, configHash?: string }
export interface ReleaseTask { action: 'release', app: string, deployEnv: string, fullVersion: string }

export type Task =
  { action: 'printHelp'} |
  { action: 'printStatus'} |
  { action: 'deleteDeployment', app: string, deployEnv: string, deploymentId: string } |
  { action: 'doRelease', app: string, deployEnv: string, fullVersion: string } |
  DeployTask | ReleaseTask |
  { action: 'runCommand', app: string, deployEnv: string, command: string }
;