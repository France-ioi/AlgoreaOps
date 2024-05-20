import { Task } from '../workerTasks/tasks';

export function parseStatus(channel: string, text: string): Task|undefined {
  return /^status$/.test(text) ? { channel, action: 'printStatus' } : undefined;
}
