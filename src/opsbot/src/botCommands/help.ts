import { Task } from '../tasks/tasks';

export function parseHelp(text: string): Task|undefined {
  const match = /^help$/.exec(text);
  if (match !== null) {
    return { action: 'printHelp' };
  }
  return undefined;
}
