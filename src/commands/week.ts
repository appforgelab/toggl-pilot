import { config } from '../config.js';
import { get } from '../api.js';
import { formatDate, formatDuration } from '../utils.js';

interface TimeEntry {
  id: number;
  description: string;
  start: string;
  stop: string | null;
  duration: number;
  project_id: number | null;
  project_name: string | null;
  tags: string[] | null;
  workspace_id: number;
}

export function getWeekBounds(refDate: Date): { monday: Date; sunday: Date; weekNumber: number } {
  const d = new Date(refDate);
  d.setUTCHours(12, 0, 0, 0);
  const dayOfWeek = d.getUTCDay();
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + offsetToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const weekNumber = getISOWeekNumber(monday);
  return { monday, sunday, weekNumber };
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatShortDate(date: Date): string {
  return `${MONTHS[date.getUTCMonth()]} ${String(date.getUTCDate()).padStart(2, '0')}`;
}

export async function week() {
  const { monday, sunday, weekNumber } = getWeekBounds(new Date());
  const startStr = formatDate(monday);
  const endStr = formatDate(new Date(sunday.getTime() + 86400000));

  const wsId = await config.getWorkspaceId();
  const timeEntries = await get<TimeEntry[]>(`/me/time_entries?start_date=${startStr}&end_date=${endStr}`);

  const projectIds = [...new Set(timeEntries.filter((e) => e.project_id).map((e) => e.project_id!))];
  const projectMap = new Map<number, string>();
  if (projectIds.length > 0) {
    const projects = await get<{ id: number; name: string }[]>(`/workspaces/${wsId}/projects`);
    for (const p of projects) {
      if (projectIds.includes(p.id)) projectMap.set(p.id, p.name);
    }
  }

  if (timeEntries.length === 0) {
    console.log(
      `No time entries for week ${weekNumber} (${formatShortDate(monday)} – ${formatShortDate(sunday)})`
    );
    return;
  }

  const totals = new Map<string, number>();
  let grandTotal = 0;

  for (const entry of timeEntries) {
    const durationSec =
      entry.duration < 0 ? Math.floor((Date.now() - new Date(entry.start).getTime()) / 1000) : entry.duration;

    const projectName = entry.project_id
      ? (projectMap.get(entry.project_id) ?? entry.project_name ?? '—')
      : '—';

    if (projectName !== '—') {
      totals.set(projectName, (totals.get(projectName) ?? 0) + durationSec);
    }
    grandTotal += durationSec;
  }

  console.log(`\nWeek ${weekNumber} (${formatShortDate(monday)} – ${formatShortDate(sunday)})\n`);

  if (totals.size > 0) {
    const maxNameLen = Math.max(
      [...totals.keys()].reduce((m, n) => Math.max(m, n.length), 0),
      'Total'.length
    );
    for (const [name, secs] of totals) {
      console.log(`  ${name.padEnd(maxNameLen + 2)}${formatDuration(secs)}`);
    }
    console.log(`  ${'─'.repeat(maxNameLen + 8)}`);
    console.log(`  ${'Total'.padEnd(maxNameLen + 2)}${formatDuration(grandTotal)}`);
  } else {
    console.log(`  Total ${formatDuration(grandTotal)}`);
  }
  console.log();
}
