
export type Task = { channel: string } & (
    { action: 'printStatus'} |
    { action: 'deleteDeployment', app: string, deployEnv: string, deploymentId: string } |
    { action: 'doRelease', app: string, deployEnv: string, stage: string, lambdaVersion: string } |
    { action: 'runCommand', app: string, deployEnv: string, command: string }
  );