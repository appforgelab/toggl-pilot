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

export async function resume() {
  const current = await get<TimeEntry | null>('/me/time_entries/current');
  if (current) {
    console.error(
      `Timer "${current.description || '(no description)'}" is already running. Stop it first with 'tgp stop'.`
    );
    return;
  }

  const today = new Date();
  const { startDate, endDate } = getResumeWindow(today);
  const timeEntries = await get<TimeEntry[]>(`/me/time_entries?start_date=${startDate}&end_date=${endDate}`);
  const lastStopped = findLatestStoppedToday(timeEntries, today);

  if (!lastStopped) {
    console.error('No stopped task found today to resume.');
    return;
  }

  const entry = await post<TimeEntry>(`/workspaces/${lastStopped.workspace_id}/time_entries`, {
    description: lastStopped.description,
    project_id: lastStopped.project_id,
    tags: lastStopped.tags && lastStopped.tags.length > 0 ? lastStopped.tags : undefined,
    start: new Date().toISOString(),
    duration: -1,
    workspace_id: lastStopped.workspace_id,
    created_with: 'toggl-pilot',
  });

  const description = entry.description || '(no description)';
  const projectLabel = entry.project_name ? ` [${entry.project_name}]` : '';
  const tagLabel = entry.tags?.length ? ` {${entry.tags.join(', ')}}` : '';
  console.log(`Started: ${description}${projectLabel}${tagLabel} (id: ${entry.id})`);
}
