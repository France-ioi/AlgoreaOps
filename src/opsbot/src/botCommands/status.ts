import { Task } from '../tasks/tasks';

export function parseStatus(channel: string, text: string): Task|undefined {
  return /^status$/.test(text) ? { action: 'printStatus' } : undefined;
}
