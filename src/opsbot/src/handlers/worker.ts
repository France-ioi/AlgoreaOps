import { logIfDebug } from '../libs/logDebug';
import { parseAction } from '../workerTasks/parse';
import { Task } from '../tasks/tasks';

export async function handler(event: unknown): Promise<void> {
  logIfDebug('event', event);
  const task = event as Task;
  try {
    await parseAction(task);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}
