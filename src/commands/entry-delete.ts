import { del, get } from '../api.js';

interface TimeEntry {
  id: number;
  description: string;
  start: string;
  stop: string | null;
  project_name: string | null;
  workspace_id: number;
}

export async function entryDelete(args: string[]) {
  const id = args.find((a) => !a.startsWith('-'));
  if (!id) {
    console.log('Usage: tsx src/index.ts entry-delete <entry_id>');
    process.exit(1);
  }

  let entry: TimeEntry;
  try {
    entry = await get<TimeEntry>(`/me/time_entries/${id}`);
  } catch {
    console.log(`Entry ${id} not found.`);
    return;
  }

  const start = new Date(entry.start).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const stop = entry.stop
    ? new Date(entry.stop).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '...';
  const desc = entry.description || '(no description)';
  const project = entry.project_name ? ` [${entry.project_name}]` : '';

  try {
    await del(`/workspaces/${entry.workspace_id}/time_entries/${id}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('400') || msg.includes('404')) {
      console.log(`Entry ${id} not found or already deleted.`);
      return;
    }
    throw e;
  }
  console.log(`Deleted: ${desc} (${start}-${stop})${project}`);
}
