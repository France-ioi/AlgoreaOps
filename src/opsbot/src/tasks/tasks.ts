
export interface DeployTask { action: 'deploy', app: string, deployEnv: string, version: string, configHash?: string }
export interface Done { action: 'done', message?: string } // nothing else to do

export type Task =
  { action: 'printHelp'} |
  { action: 'printStatus'} |
  { action: 'deleteDeployment', app: string, deployEnv: string, deploymentId: string } |
  { action: 'doRelease', app: string, deployEnv: string, fullVersion: string } |
  DeployTask | Done |
  { action: 'runCommand', app: string, deployEnv: string, command: string }
;