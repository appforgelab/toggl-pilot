import { config } from '../config.js';
import { get } from '../api.js';
import { formatDate, formatDuration, parseDateArg, parseOrExit, DASH } from '../utils.js';

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

function findFlag(args: string[], ...flags: string[]): number {
  for (const f of flags) {
    const idx = args.indexOf(f);
    if (idx !== -1) return idx;
  }
  return -1;
}

export function parseWeekArgs(args: string[]): { refDate: Date; verbose: boolean } {
  const verbose = findFlag(args, '--verbose', '-v') !== -1;
  const dateIdx = findFlag(args, '--date', '-d');
  const weekIdx = findFlag(args, '--week', '-w');

  if (dateIdx !== -1 && weekIdx !== -1) {
    throw new Error('Cannot use both --date and --week');
  }

  if (weekIdx !== -1) {
    const val = args[weekIdx + 1];
    if (!val) throw new Error('Missing value for --week');
    const offset = parseInt(val, 10);
    if (isNaN(offset)) throw new Error(`Invalid week: ${val}`);
    const { monday: currentMonday } = getWeekBounds(new Date());
    const targetMonday = new Date(currentMonday);
    targetMonday.setUTCDate(currentMonday.getUTCDate() + offset * 7);
    return { refDate: targetMonday, verbose };
  }

  if (dateIdx !== -1) {
    if (!args[dateIdx + 1]) throw new Error('Missing value for --date');
    return { refDate: parseDateArg(args), verbose };
  }

  return { refDate: new Date(), verbose };
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDayIndex(isoStart: string): number {
  const dow = new Date(isoStart).getUTCDay();
  return dow === 0 ? 6 : dow - 1;
}

export function buildProjectDayMap(
  entries: TimeEntry[],
  projectMap: Map<number, string>
): Map<string, number[]> {
  const map = new Map<string, number[]>();
  const ensure = (key: string) => {
    if (!map.has(key)) map.set(key, [0, 0, 0, 0, 0, 0, 0]);
  };

  for (const entry of entries) {
    const durationSec =
      entry.duration < 0 ? Math.floor((Date.now() - new Date(entry.start).getTime()) / 1000) : entry.duration;
    const dayIdx = getDayIndex(entry.start);
    const projectName = entry.project_id
      ? (projectMap.get(entry.project_id) ?? entry.project_name ?? DASH)
      : DASH;
    ensure(projectName);
    map.get(projectName)![dayIdx] += durationSec;
  }

  return map;
}

function padRight(s: string, width: number): string {
  return s + ' '.repeat(Math.max(0, width - s.length));
}

function padLeft(s: string, width: number): string {
  return ' '.repeat(Math.max(0, width - s.length)) + s;
}

function formatCell(seconds: number, width: number): string {
  if (seconds === 0) return padLeft('-', width);
  return padLeft(formatDuration(seconds), width);
}

export function renderVerboseMatrix(
  projectDayMap: Map<string, number[]>,
  monday: Date,
  sunday: Date,
  weekNumber: number
): string {
  const lines: string[] = [];
  lines.push(`\nWeek ${weekNumber} (${formatShortDate(monday)} – ${formatShortDate(sunday)})\n`);

  const projectNames = [...projectDayMap.keys()].sort((a, b) => {
    if (a === DASH) return 1;
    if (b === DASH) return -1;
    return a.localeCompare(b);
  });

  const dailyTotals = [0, 0, 0, 0, 0, 0, 0];
  for (const row of projectDayMap.values()) {
    for (let i = 0; i < 7; i++) dailyTotals[i] += row[i];
  }

  const projectRowTotals = new Map<string, number>();
  let grandTotal = 0;
  for (const [name, row] of projectDayMap) {
    const rowTotal = row.reduce((s, v) => s + v, 0);
    projectRowTotals.set(name, rowTotal);
    grandTotal += rowTotal;
  }

  const dayHeaders = [...DAY_LABELS, 'Total'];
  const headerWidths = dayHeaders.map(() => 0);
  for (let i = 0; i < 7; i++) {
    headerWidths[i] = Math.max(dayHeaders[i].length, formatDuration(dailyTotals[i]).length);
    for (const name of projectNames) {
      const val = projectDayMap.get(name)![i];
      const formatted = val === 0 ? '-' : formatDuration(val);
      headerWidths[i] = Math.max(headerWidths[i], formatted.length);
    }
  }
  headerWidths[7] = Math.max('Total'.length, formatDuration(grandTotal).length);
  for (const name of projectNames) {
    const t = projectRowTotals.get(name)!;
    headerWidths[7] = Math.max(headerWidths[7], formatDuration(t).length);
  }

  const nameColWidth = Math.max(...projectNames.map((n) => n.length), 'Daily Total'.length);

  const headerLine =
    padRight('', nameColWidth + 2) + dayHeaders.map((h, i) => padLeft(h, headerWidths[i])).join('  ');
  lines.push(headerLine);

  for (const name of projectNames) {
    const row = projectDayMap.get(name)!;
    const rowTotal = projectRowTotals.get(name)!;
    const parts = row.map((val, i) => formatCell(val, headerWidths[i]));
    parts.push(formatCell(rowTotal, headerWidths[7]));
    lines.push(padRight(name, nameColWidth + 2) + parts.join('  '));
  }

  const totalWidth =
    nameColWidth + 2 + headerWidths.reduce((s, w) => s + w, 0) + (headerWidths.length - 1) * 2;
  lines.push('─'.repeat(totalWidth));

  const dailyParts = dailyTotals.map((val, i) => formatCell(val, headerWidths[i]));
  dailyParts.push(formatCell(grandTotal, headerWidths[7]));
  lines.push(padRight('Daily Total', nameColWidth + 2) + dailyParts.join('  '));

  lines.push('');
  return lines.join('\n');
}

export async function week(args: string[]) {
  const { refDate, verbose } = parseOrExit(() => parseWeekArgs(args));
  const { monday, sunday, weekNumber } = getWeekBounds(refDate);
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

  if (verbose) {
    const projectDayMap = buildProjectDayMap(timeEntries, projectMap);
    console.log(renderVerboseMatrix(projectDayMap, monday, sunday, weekNumber));
    return;
  }

  const totals = new Map<string, number>();
  let grandTotal = 0;

  for (const entry of timeEntries) {
    const durationSec =
      entry.duration < 0 ? Math.floor((Date.now() - new Date(entry.start).getTime()) / 1000) : entry.duration;

    const projectName = entry.project_id
      ? (projectMap.get(entry.project_id) ?? entry.project_name ?? DASH)
      : DASH;

    if (projectName !== DASH) {
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
    const maxDurLen = Math.max(...[...totals.values(), grandTotal].map((s) => formatDuration(s).length));
    for (const [name, secs] of totals) {
      console.log(`${name.padEnd(maxNameLen + 2)}${formatDuration(secs).padStart(maxDurLen)}`);
    }
    console.log(`${'─'.repeat(maxNameLen + 2 + maxDurLen)}`);
    console.log(`${'Total'.padEnd(maxNameLen + 2)}${formatDuration(grandTotal).padStart(maxDurLen)}`);
  } else {
    console.log(`Total ${formatDuration(grandTotal)}`);
  }
  console.log();
}
