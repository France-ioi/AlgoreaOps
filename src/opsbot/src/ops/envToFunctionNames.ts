
export function lambdaFunctionName(app: string, deployEnv: string): string {
  if (app === 'frontend') return `alg-frontend-${deployEnv}-static-serve`;
  if (app === 'backend') return `alg-backend-${deployEnv}-server`;
  throw new Error('unsupported app: '+app);
}