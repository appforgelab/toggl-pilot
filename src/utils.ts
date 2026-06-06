export const DASH = '—';

export function parseOrExit<T>(fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 0) {
    seconds = Math.floor(Date.now() / 1000) + seconds;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h${String(m).padStart(2, '0')}m`;
}

export function parseDuration(dur: string): number {
  const match = dur.match(/^(\d+)h(\d+)m$/);
  if (match) return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60;
  const hours = dur.match(/^(\d+)h$/);
  if (hours) return parseInt(hours[1]) * 3600;
  const mins = dur.match(/^(\d+)m$/);
  if (mins) return parseInt(mins[1]) * 60;
  throw new Error(`Invalid duration: ${dur}. Use format like 1h30m, 2h, 45m`);
}

export function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildStartTime(at: string, date?: string): string {
  const day = date ?? formatDate(new Date());
  const d = new Date(`${day}T${at}:00`);
  if (isNaN(d.getTime())) throw new Error(`Invalid time: ${at}. Use HH:MM format.`);
  return d.toISOString();
}

export function localYesterdayDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(12, 0, 0, 0);
  return d;
}

export function requireFlagValue(
  args: string[],
  index: number,
  flagName: string,
  options: { hint?: string; allowEmpty?: boolean } = {}
): string {
  const val = args[index + 1];
  const hintSuffix = options.hint ? ` ${options.hint}` : '';
  if (val === undefined || (val !== '' && val.startsWith('-'))) {
    throw new Error(`Missing value for ${flagName}.${hintSuffix}`);
  }
  if (val === '' && !options.allowEmpty) {
    throw new Error(`Missing value for ${flagName}.${hintSuffix}`);
  }
  return val;
}

export function parseDateArg(args: string[]): Date {
  const idx = args.indexOf('-d') !== -1 ? args.indexOf('-d') : args.indexOf('--date');
  if (idx !== -1) {
    const flag = args[idx];
    const val = requireFlagValue(args, idx, flag, { hint: 'Use YYYY-MM-DD or "yesterday".' });
    if (val === 'yesterday') return localYesterdayDate();
    const d = new Date(val + 'T12:00:00');
    if (!isNaN(d.getTime())) return d;
    throw new Error(`Invalid date: ${val}. Use YYYY-MM-DD or "yesterday".`);
  }
  return new Date();
}
