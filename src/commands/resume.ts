import { get, post } from '../api.js';
import type { TimeEntry } from '../types.js';
import { formatDate } from '../utils.js';

function isStoppedToday(entry: TimeEntry, today: Date): boolean {
  if (entry.stop === null || entry.duration < 0) return false;
  return formatDate(new Date(entry.stop)) === formatDate(today);
}

export function findLatestStoppedToday(entries: TimeEntry[], today: Date): TimeEntry | null {
  const stoppedToday = entries.filter((entry) => isStoppedToday(entry, today));
  if (stoppedToday.length === 0) return null;

  stoppedToday.sort((a, b) => new Date(b.stop!).getTime() - new Date(a.stop!).getTime());
  return stoppedToday[0];
}

function getResumeWindow(today: Date): { startDate: string; endDate: string } {
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return {
    startDate: formatDate(yesterday),
    endDate: formatDate(tomorrow),
  };
}

function startFrom(entry: TimeEntry): Promise<TimeEntry> {
  return post<TimeEntry>(`/workspaces/${entry.workspace_id}/time_entries`, {
    description: entry.description,
    project_id: entry.project_id,
    tags: entry.tags && entry.tags.length > 0 ? entry.tags : undefined,
    start: new Date().toISOString(),
    duration: -1,
    workspace_id: entry.workspace_id,
    created_with: 'toggl-pilot',
  });
}

function printStarted(entry: TimeEntry): void {
  const description = entry.description || '(no description)';
  const projectLabel = entry.project_name ? ` [${entry.project_name}]` : '';
  const tagLabel = entry.tags?.length ? ` {${entry.tags.join(', ')}}` : '';
  console.log(`Started: ${description}${projectLabel}${tagLabel} (id: ${entry.id})`);
}

async function resumeLatest(): Promise<void> {
  const today = new Date();
  const { startDate, endDate } = getResumeWindow(today);
  const timeEntries = await get<TimeEntry[]>(`/me/time_entries?start_date=${startDate}&end_date=${endDate}`);
  const lastStopped = findLatestStoppedToday(timeEntries, today);

  if (!lastStopped) {
    console.error('No stopped task found today to resume.');
    return;
  }

  const entry = await startFrom(lastStopped);
  printStarted(entry);
}

async function resumeById(rawId: string): Promise<void> {
  let entry: TimeEntry;
  try {
    entry = await get<TimeEntry>(`/me/time_entries/${rawId}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('400') || msg.includes('404')) {
      console.error(`Time entry ${rawId} not found.`);
      return;
    }
    throw e;
  }

  if (entry.duration < 0) {
    console.error(
      `Time entry ${rawId} is still running and cannot be resumed. Stop it first with 'tgp stop'.`
    );
    return;
  }

  const started = await startFrom(entry);
  printStarted(started);
}

export async function resume(args: string[]) {
  const positional = args.filter((a) => !a.startsWith('-'));
  if (args.some((a) => a.startsWith('-')) || positional.length > 1) {
    console.error('Usage: tgp resume [<entry_id>]');
    process.exit(1);
  }

  const current = await get<TimeEntry | null>('/me/time_entries/current');
  if (current) {
    console.error(
      `Timer "${current.description || '(no description)'}" is already running. Stop it first with 'tgp stop'.`
    );
    return;
  }

  if (positional.length === 1) {
    await resumeById(positional[0]);
  } else {
    await resumeLatest();
  }
}
