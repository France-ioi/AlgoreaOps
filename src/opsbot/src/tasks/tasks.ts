
export interface DeployTask { action: 'deploy', app: string, deployEnv: string, version: string, configHash?: string, awsAccount: 'dev'|'prod', slackChannel?: string }
export interface ReleaseTask { action: 'release', app: string, deployEnv: string, fullVersion: string }

export type Task =
  { action: 'printHelp'} |
  { action: 'printStatus'} |
  DeployTask | ReleaseTask |
  { action: 'runCommand', app: string, deployEnv: string, command: string }
;