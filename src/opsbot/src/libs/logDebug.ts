/* eslint-disable no-console */

export function logIfDebug(...args: unknown[]): void {
  if (process.env['DEBUG'] === '1') console.debug(...args);
}