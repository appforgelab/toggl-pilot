import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDuration,
  parseDuration,
  formatDate,
  formatTime,
  buildStartTime,
  parseDateArg,
  parseOrExit,
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
  it('formats a date to YYYY-MM-DD', () => {
    const d = new Date('2025-06-15T10:30:00Z');
    expect(formatDate(d)).toBe('2025-06-15');
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
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds ISO string from HH:MM for today', () => {
    const result = buildStartTime('09:00');
    const expected = new Date('2025-06-15T09:00:00').toISOString();
    expect(result).toBe(expected);
  });

  it('throws on invalid time format', () => {
    expect(() => buildStartTime('25:00')).toThrow('Invalid time');
  });

  it('throws on non-HH:MM input', () => {
    expect(() => buildStartTime('abc')).toThrow('Invalid time');
  });

  it('builds ISO string for a specific date', () => {
    const result = buildStartTime('09:00', '2025-06-10');
    const expected = new Date('2025-06-10T09:00:00').toISOString();
    expect(result).toBe(expected);
  });

  it('builds ISO string for yesterday date', () => {
    const result = buildStartTime('14:30', '2025-06-14');
    const expected = new Date('2025-06-14T14:30:00').toISOString();
    expect(result).toBe(expected);
  });
});

describe('parseDateArg', () => {
  it('returns today when no -d flag', () => {
    const result = parseDateArg([]);
    const today = new Date();
    expect(result.toISOString().slice(0, 10)).toBe(today.toISOString().slice(0, 10));
  });

  it('parses -d flag with date', () => {
    const result = parseDateArg(['-d', '2025-01-15']);
    expect(result.toISOString().slice(0, 10)).toBe('2025-01-15');
  });

  it('parses --date flag with date', () => {
    const result = parseDateArg(['--date', '2025-03-20']);
    expect(result.toISOString().slice(0, 10)).toBe('2025-03-20');
  });

  it('throws on invalid date', () => {
    expect(() => parseDateArg(['-d', 'not-a-date'])).toThrow('Invalid date');
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
