
export function helpText(): string {
  return `
  Commands: 
      help - this help
      status - info about deployments and releases
      command backend fioi|tez db-recompute|db-migrate|db-migrate-undo|delete-temp-users|propagation

  v3 Commands:
      deploy <app> <env> <app-version> [<app-config>]
      release <app> <env> <deployment-version>

  Where:
      app := frontend|backend
      env := fioi-prod
      app-version: in x.y.z format
      app-config: commit hash of config, if ommitted used the last one from https://github.com/France-ioi/AlgoreaConfigs/tree/<env>-<app>
      deployment-version: in x.y.z-<confighash>-<scripthash> format`;
}