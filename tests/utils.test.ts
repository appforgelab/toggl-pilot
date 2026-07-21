import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import {
  formatDuration,
  parseDuration,
  formatDate,
  formatTime,
  buildStartTime,
  parseStartTime,
  parseDateArg,
  parseOrExit,
  localDateWithOffset,
  localYesterdayDate,
  requireFlagValue,
} from '../src/utils.js';

describe('formatDuration', () => {
  it('formats zero seconds', () => {
    expect(formatDuration(0)).toBe('0h00m');
  });

  it('formats minutes only', () => {
    expect(formatDuration(30 * 60)).toBe('0h30m');
  });

  it('formats hours only', () => {
    expect(formatDuration(2 * 3600)).toBe('2h00m');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(1 * 3600 + 30 * 60)).toBe('1h30m');
  });

  it('formats large durations', () => {
    expect(formatDuration(10 * 3600 + 5 * 60)).toBe('10h05m');
  });

  it('handles negative duration as running timer', () => {
    const now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const negativeSeconds = -Math.floor(now / 1000) + 90;
    expect(formatDuration(negativeSeconds)).toBe('0h01m');
    vi.useRealTimers();
  });
});

describe('parseDuration', () => {
  it('parses minutes only', () => {
    expect(parseDuration('30m')).toBe(30 * 60);
  });

  it('parses hours only', () => {
    expect(parseDuration('2h')).toBe(2 * 3600);
  });

  it('parses hours and minutes', () => {
    expect(parseDuration('1h30m')).toBe(1 * 3600 + 30 * 60);
  });

  it('parses 2h15m', () => {
    expect(parseDuration('2h15m')).toBe(2 * 3600 + 15 * 60);
  });

  it('throws on invalid format', () => {
    expect(() => parseDuration('abc')).toThrow('Invalid duration');
  });

  it('throws on empty string', () => {
    expect(() => parseDuration('')).toThrow('Invalid duration');
  });

  it('throws on just a number', () => {
    expect(() => parseDuration('45')).toThrow('Invalid duration');
  });
});

describe('formatDate', () => {
  it('formats a date to YYYY-MM-DD using local components', () => {
    const d = new Date(2025, 5, 15);
    expect(formatDate(d)).toBe('2025-06-15');
  });

  it('pads single-digit month and day', () => {
    const d = new Date(2025, 0, 5);
    expect(formatDate(d)).toBe('2025-01-05');
  });

  it('uses local calendar day near midnight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T23:30:00'));
    const localNow = new Date();
    expect(formatDate(localNow)).toBe('2025-06-15');
    vi.useRealTimers();
  });

  it('uses local calendar day just after midnight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-16T00:30:00'));
    const localNow = new Date();
    expect(formatDate(localNow)).toBe('2025-06-16');
    vi.useRealTimers();
  });
});

describe('formatTime', () => {
  it('formats an ISO string to HH:MM', () => {
    const result = formatTime('2025-06-15T14:30:00Z');
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe('buildStartTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds ISO string from HH:MM for today', () => {
    const result = buildStartTime('09:00');
    const expected = new Date(2025, 5, 15, 9, 0, 0).toISOString();
    expect(result).toBe(expected);
  });

  it('throws on invalid time format', () => {
    expect(() => buildStartTime('25:00')).toThrow('Invalid time');
  });

  it('throws on non-HH:MM input', () => {
    expect(() => buildStartTime('abc')).toThrow('Invalid time');
  });

  it('accepts a single-digit hour (H:MM)', () => {
    const result = buildStartTime('8:20');
    const expected = new Date(2025, 5, 15, 8, 20, 0).toISOString();
    expect(result).toBe(expected);
  });

  it('keeps requiring a two-digit minute', () => {
    expect(() => buildStartTime('9:7')).toThrow('Invalid time');
    expect(() => buildStartTime('09:7')).toThrow('Invalid time');
  });

  it('accepts two-digit minutes that look like digital clocks', () => {
    const result = buildStartTime('9:07');
    const expected = new Date(2025, 5, 15, 9, 7, 0).toISOString();
    expect(result).toBe(expected);
  });

  it('rejects out-of-range hours and minutes', () => {
    expect(() => buildStartTime('24:00')).toThrow('Invalid time');
    expect(() => buildStartTime('12:60')).toThrow('Invalid time');
    expect(() => buildStartTime('99:99')).toThrow('Invalid time');
  });

  it('builds ISO string for a specific date', () => {
    const result = buildStartTime('09:00', '2025-06-10');
    const expected = new Date(2025, 5, 10, 9, 0, 0).toISOString();
    expect(result).toBe(expected);
  });

  it('builds ISO string for yesterday date', () => {
    const result = buildStartTime('14:30', '2025-06-14');
    const expected = new Date(2025, 5, 14, 14, 30, 0).toISOString();
    expect(result).toBe(expected);
  });

  it('uses local calendar day as default when no date provided', () => {
    vi.setSystemTime(new Date(2025, 5, 16, 0, 30));
    const result = buildStartTime('22:00');
    const expected = new Date('2025-06-16T22:00:00').toISOString();
    expect(result).toBe(expected);
    vi.useRealTimers();
  });
});

// DST gap handling depends on the process timezone, so run it in an isolated
// describe block that swaps TZ to a spring-forward zone and restores it after.
describe('buildStartTime DST gap', () => {
  const originalTZ = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = 'America/New_York';
  });

  afterAll(() => {
    if (originalTZ === undefined) delete process.env.TZ;
    else process.env.TZ = originalTZ;
  });

  it('rejects a nonexistent wall-clock time during spring-forward', () => {
    // 2025-03-09 in America/New_York: clocks jump 02:00 -> 03:00, so 02:30
    // does not exist. The local Date constructor normalizes it to 03:30; the
    // round-trip check must reject it rather than record the wrong instant.
    expect(() => buildStartTime('02:30', '2025-03-09')).toThrow('does not exist');
  });

  it('accepts a valid time on a spring-forward day (after the gap)', () => {
    // 03:30 is after the 02:00 -> 03:00 gap and must still be accepted.
    const result = buildStartTime('03:30', '2025-03-09');
    expect(result).toBe('2025-03-09T07:30:00.000Z');
  });
});

describe('parseStartTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('parses full ISO 8601 in the past', () => {
    // Faked now is local 2025-06-15 12:00 (= 05:00Z at +07:00), so use a value
    // safely before that in any timezone.
    const result = parseStartTime('2025-06-14T09:00:00Z');
    expect(result).toEqual(new Date('2025-06-14T09:00:00Z'));
  });

  it('parses bare HH:MM as today local time', () => {
    const result = parseStartTime('09:00');
    expect(result).toEqual(new Date(2025, 5, 15, 9, 0, 0));
  });

  it('rejects future bare HH:MM start times', () => {
    // 13:00 is one hour after the faked now (12:00)
    expect(() => parseStartTime('13:00')).toThrow('cannot be in the future');
  });

  it('rejects future ISO start times', () => {
    expect(() => parseStartTime('2030-06-15T09:00:00Z')).toThrow('cannot be in the future');
  });

  it('rejects invalid format', () => {
    expect(() => parseStartTime('not-a-time')).toThrow('Invalid start time');
  });

  it('parses a bare single-digit-hour local time (H:MM)', () => {
    const result = parseStartTime('9:07');
    expect(result).toEqual(new Date(2025, 5, 15, 9, 7, 0));
  });

  it('accepts a full ISO 8601 timestamp with a numeric offset', () => {
    const result = parseStartTime('2025-06-14T09:00:00+07:00');
    expect(result).toEqual(new Date('2025-06-14T09:00:00+07:00'));
  });

  it('rejects a bare number', () => {
    expect(() => parseStartTime('0')).toThrow('Invalid start time');
  });

  it('rejects a date without a time or timezone', () => {
    expect(() => parseStartTime('2025-06-14')).toThrow('Invalid start time');
  });

  it('rejects a locale-formatted date', () => {
    expect(() => parseStartTime('15/06/2025 09:00')).toThrow('Invalid start time');
  });

  it('rejects a timezone-less datetime', () => {
    expect(() => parseStartTime('2025-06-15T09:00:00')).toThrow('Invalid start time');
  });

  it('rejects an impossible calendar date instead of normalizing it', () => {
    expect(() => parseStartTime('2025-02-30T09:00:00Z')).toThrow('Invalid start time');
  });
});

describe('parseDateArg', () => {
  it('returns today when no -d flag', () => {
    const result = parseDateArg([]);
    const today = new Date();
    expect(formatDate(result)).toBe(formatDate(today));
  });

  it('parses -d flag with date', () => {
    const result = parseDateArg(['-d', '2025-01-15']);
    expect(formatDate(result)).toBe('2025-01-15');
  });

  it('parses --date flag with date', () => {
    const result = parseDateArg(['--date', '2025-03-20']);
    expect(formatDate(result)).toBe('2025-03-20');
  });

  it('parses -d yesterday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00'));
    const result = parseDateArg(['-d', 'yesterday']);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(14);
    vi.useRealTimers();
  });

  it('yesterday resolves correctly around midnight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T00:30:00'));
    const result = parseDateArg(['--date', 'yesterday']);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(14);
    vi.useRealTimers();
  });

  it.each([
    ['0', '2025-06-15'],
    ['-1', '2025-06-14'],
    ['-3', '2025-06-12'],
    ['2', '2025-06-17'],
    ['+2', '2025-06-17'],
  ])('parses %s as a relative day offset', (offset, expected) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T00:30:00'));
    const result = parseDateArg(['--date', offset]);
    expect(formatDate(result)).toBe(expected);
    expect(result.getHours()).toBe(12);
    vi.useRealTimers();
  });

  it('resolves offsets across a year boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-02T12:00:00'));
    expect(formatDate(parseDateArg(['-d', '-3']))).toBe('2025-12-30');
    vi.useRealTimers();
  });

  it('resolves offsets across a leap day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-01T12:00:00'));
    expect(formatDate(parseDateArg(['-d', '-1']))).toBe('2024-02-29');
    vi.useRealTimers();
  });

  it.each(['-1.5', '1.5', '-2days', '9007199254740992'])('rejects invalid offset %s', (offset) => {
    expect(() => parseDateArg(['-d', offset])).toThrow('Invalid date');
  });

  it('throws on invalid date', () => {
    expect(() => parseDateArg(['-d', 'not-a-date'])).toThrow('Invalid date');
  });
});

describe('localDateWithOffset across DST', () => {
  const originalTZ = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = 'America/New_York';
  });

  afterAll(() => {
    if (originalTZ === undefined) delete process.env.TZ;
    else process.env.TZ = originalTZ;
  });

  it('uses local calendar arithmetic across spring-forward', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-10T00:30:00-04:00'));
    const result = localDateWithOffset(-1);
    expect(formatDate(result)).toBe('2025-03-09');
    expect(result.getHours()).toBe(12);
    vi.useRealTimers();
  });
});

describe('localYesterdayDate', () => {
  it('returns yesterday in local calendar', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00'));
    const result = localYesterdayDate();
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(14);
    vi.useRealTimers();
  });

  it('works correctly around midnight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T00:30:00'));
    const result = localYesterdayDate();
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(14);
    vi.useRealTimers();
  });

  it('works across month boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-01T12:00:00'));
    const result = localYesterdayDate();
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(28);
    vi.useRealTimers();
  });
});

describe('parseOrExit', () => {
  it('returns the value on success', () => {
    const result = parseOrExit(() => 42);
    expect(result).toBe(42);
  });

  it('writes error to stderr and exits on throw', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    expect(() =>
      parseOrExit(() => {
        throw new Error('bad input');
      })
    ).toThrow('process.exit');
    expect(errorSpy).toHaveBeenCalledWith('bad input');
    expect(exitSpy).toHaveBeenCalledWith(1);

    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});

describe('requireFlagValue', () => {
  it('returns the next arg when present and not a flag', () => {
    expect(requireFlagValue(['-p', 'Dev-Pilot'], 0, '-p')).toBe('Dev-Pilot');
  });

  it('throws when the flag is the last arg', () => {
    expect(() => requireFlagValue(['-p'], 0, '-p')).toThrow('Missing value for -p.');
  });

  it('throws when the next arg starts with -', () => {
    expect(() => requireFlagValue(['-p', '--dur', '30m'], 0, '-p')).toThrow('Missing value for -p.');
  });

  it('throws on empty string by default', () => {
    expect(() => requireFlagValue(['-p', ''], 0, '-p')).toThrow('Missing value for -p.');
  });

  it('returns an empty string when allowEmpty is true', () => {
    expect(requireFlagValue(['--client', ''], 0, '--client', { allowEmpty: true })).toBe('');
  });

  it('still rejects the next arg starting with - even when allowEmpty is true', () => {
    expect(() => requireFlagValue(['--client', '--name', 'X'], 0, '--client', { allowEmpty: true })).toThrow(
      'Missing value for --client.'
    );
  });

  it('includes a hint in the error message', () => {
    expect(() => requireFlagValue(['-d'], 0, '-d', { hint: 'Use YYYY-MM-DD or "yesterday".' })).toThrow(
      'Missing value for -d. Use YYYY-MM-DD or "yesterday".'
    );
  });

  it('includes a hint even when allowEmpty is true and value is empty', () => {
    expect(() => requireFlagValue(['-d', ''], 0, '-d', { hint: 'Use YYYY-MM-DD or "yesterday".' })).toThrow(
      'Missing value for -d. Use YYYY-MM-DD or "yesterday".'
    );
  });
});

describe('parseDateArg missing-value behavior', () => {
  it('throws when -d is the last arg', () => {
    expect(() => parseDateArg(['-d'])).toThrow('Missing value for -d');
  });

  it('throws when -d is followed by another flag', () => {
    expect(() => parseDateArg(['-d', '--foo'])).toThrow('Missing value for -d');
  });

  it('throws when --date is the last arg', () => {
    expect(() => parseDateArg(['--date'])).toThrow('Missing value for --date');
  });

  it('throws when --date is followed by another flag', () => {
    expect(() => parseDateArg(['--date', '-v'])).toThrow('Missing value for --date');
  });

  it('throws when -d value is empty', () => {
    expect(() => parseDateArg(['-d', ''])).toThrow('Missing value for -d');
  });
});
