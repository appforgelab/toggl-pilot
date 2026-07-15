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
  // Accept a single-digit hour (e.g. 8:20) but always require a two-digit
  // minute (matches how digital clocks display time). Validate the grammar and
  // the hour/minute ranges explicitly so validity is decided here, not by the
  // permissive JS Date parser (which would accept or normalize values like
  // `0`, locale strings, or out-of-range components).
  const match = at.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid time: ${at}. Use H:MM or HH:MM format (e.g. 8:20, 09:07).`);
  }
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours > 23 || minutes > 59) {
    throw new Error(`Invalid time: ${at}. Use H:MM or HH:MM format (e.g. 8:20, 09:07).`);
  }
  const day = date ?? formatDate(new Date());
  // Normalize to zero-padded HH:MM so the local datetime string is parsed
  // consistently (the Date string parser rejects single-digit hours). Validity
  // was already decided above; this only converts a known-good local time.
  const hh = String(hours).padStart(2, '0');
  const d = new Date(`${day}T${hh}:${match[2]}:00`);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid time: ${at}. Use H:MM or HH:MM format (e.g. 8:20, 09:07).`);
  }
  // Reject DST-normalized wall-clock times. During a spring-forward gap (e.g.
  // 02:30 on 2025-03-09 in America/New_York) the requested time does not exist,
  // and the local Date constructor silently shifts it forward instead of
  // rejecting it. That would record the wrong instant, so compare the
  // constructed Date's local components against the validated input and reject
  // any mismatch. `day` is always YYYY-MM-DD from formatDate / track's --date.
  const [yyyy, mo, dd] = day.split('-').map(Number);
  if (
    d.getFullYear() !== yyyy ||
    d.getMonth() !== mo - 1 ||
    d.getDate() !== dd ||
    d.getHours() !== hours ||
    d.getMinutes() !== minutes
  ) {
    throw new Error(
      `Invalid time: ${at}. ${at} does not exist on ${day} in this timezone (it falls in a DST gap).`
    );
  }
  return d.toISOString();
}

/**
 * Parse a start time for entry-edit. Accepts a bare local-time `H:MM` or
 * `HH:MM` (today, local timezone, via the shared `buildStartTime`) or a full
 * ISO 8601 timestamp that carries an explicit timezone (`Z` or a numeric
 * offset). Timezone-less datetimes, locale-formatted strings, and bare numbers
 * are rejected, and impossible calendar dates (e.g. 2025-02-30) are rejected
 * rather than normalized. Also rejects times in the future (a near-certain
 * typo, intentionally stricter than the API).
 */
export function parseStartTime(value: string): Date {
  const isTimeOfDay = /^\d{1,2}:\d{2}$/.test(value);
  if (!isTimeOfDay) {
    // Require a full ISO 8601 timestamp with date, time, and timezone so the
    // permissive Date parser never gets to accept/normalize undocumented input.
    const invalid = () =>
      new Error(
        `Invalid start time: ${value}. Use H:MM (e.g. 11:20) or ISO 8601 (e.g. 2026-07-14T11:20:00+07:00).`
      );
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})$/);
    if (!m) throw invalid();
    const year = +m[1];
    const month = +m[2];
    const day = +m[3];
    const hour = +m[4];
    const minute = +m[5];
    const second = +m[6];
    if (month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59 || second > 59) {
      throw invalid();
    }
    // Reject impossible calendar dates (e.g. 2025-02-30) instead of letting the
    // Date parser roll them over. Component round-trip via Date.UTC is
    // timezone-independent, so the check is unambiguous regardless of offset.
    const cal = new Date(Date.UTC(year, month - 1, day));
    if (cal.getUTCFullYear() !== year || cal.getUTCMonth() !== month - 1 || cal.getUTCDate() !== day) {
      throw invalid();
    }
  }
  const parsed = new Date(isTimeOfDay ? buildStartTime(value) : value);
  if (isNaN(parsed.getTime())) {
    throw new Error(
      `Invalid start time: ${value}. Use H:MM (e.g. 11:20) or ISO 8601 (e.g. 2026-07-14T11:20:00+07:00).`
    );
  }
  if (parsed.getTime() > Date.now()) {
    throw new Error(`Start time cannot be in the future: ${value}`);
  }
  return parsed;
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
