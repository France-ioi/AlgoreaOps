
export function logIfDebug(...args: any[]): void {
  if (process.env['DEBUG'] === '1') console.debug(...args);
}