import { config } from '../config.js';
import { get } from '../api.js';
import { formatDate, formatTime, formatDuration, parseDateArg } from '../utils.js';

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

export async function entryList(args: string[]) {
  let date;
  try {
    date = parseDateArg(args);
  } catch (e) {
    console.log((e as Error).message);
    process.exit(1);
  }
  const dayStr = formatDate(date);
  const nextDay = formatDate(new Date(date.getTime() + 86400000));

  const wsId = await config.getWorkspaceId();
  const timeEntries = await get<TimeEntry[]>(`/me/time_entries?start_date=${dayStr}&end_date=${nextDay}`);

  const projectIds = [...new Set(timeEntries.filter((e) => e.project_id).map((e) => e.project_id!))];
  const projectMap = new Map<number, string>();
  if (projectIds.length > 0) {
    const projects = await get<{ id: number; name: string }[]>(`/workspaces/${wsId}/projects`);
    for (const p of projects) {
      if (projectIds.includes(p.id)) projectMap.set(p.id, p.name);
    }
  }

  if (timeEntries.length === 0) {
    console.log(`No time entries for ${dayStr}`);
    return;
  }

  timeEntries.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  console.log(`\nTime entries for ${dayStr}\n`);

  const totals = new Map<string, number>();
  let grandTotal = 0;
  const rows: { line: string; isRunning: boolean }[] = [];

  const tagColWidth = timeEntries.reduce((max, entry) => {
    const tagStr = entry.tags?.length ? `{${entry.tags.join(',')}}` : '—';
    return Math.max(max, tagStr.length);
  }, 0);

  const header = `  ${'ID'.padEnd(12)} ${'Time'.padEnd(11)}  ${'Dur.'.padEnd(7)} ${'Description'.padEnd(22)} ${'Tags'.padEnd(tagColWidth + 1)} Project`;
  console.log(header);

  for (const entry of timeEntries) {
    const id = String(entry.id);
    const start = formatTime(entry.start);
    const stop = entry.stop ? formatTime(entry.stop) : '...';

    const isRunning = entry.duration < 0;
    const durationSec = isRunning
      ? Math.floor((Date.now() - new Date(entry.start).getTime()) / 1000)
      : entry.duration;
    const dur = formatDuration(durationSec);

    const projectName = entry.project_id
      ? (projectMap.get(entry.project_id) ?? entry.project_name ?? '—')
      : '—';

    const tagStr = entry.tags?.length ? `{${entry.tags.join(',')}}` : '—';
    const line = `  ${id.padEnd(12)} ${start}-${stop.padEnd(5)}  ${dur.padEnd(7)} ${(entry.description || '(no description)').slice(0, 22).padEnd(22)} ${tagStr.padEnd(tagColWidth + 1)} ${projectName}${isRunning ? '  ● running' : ''}`;
    rows.push({ line, isRunning });

    if (projectName !== '—') {
      totals.set(projectName, (totals.get(projectName) ?? 0) + durationSec);
    }
    grandTotal += durationSec;
  }

  for (const { line } of rows) {
    console.log(line);
  }

  if (totals.size > 0) {
    console.log(`\n─── Totals ${'─'.repeat(45)}`);
    const maxNameLen = Math.max(
      [...totals.keys()].reduce((m, n) => Math.max(m, n.length), 0),
      'Total'.length
    );
    for (const [name, secs] of totals) {
      console.log(`  ${name.padEnd(maxNameLen + 2)}${formatDuration(secs)}`);
    }
    console.log(`  ${'Total'.padEnd(maxNameLen + 2)}${formatDuration(grandTotal)}`);
  }
  console.log();
}
