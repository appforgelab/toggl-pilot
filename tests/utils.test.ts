import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import {
  formatDuration,
  parseDuration,
  formatDate,
  formatTime,
  buildStartTime,
  parseStartTime,
  parseOrExit,
  localDateWithOffset,
  localYesterdayDate,
  validFlagsHint,
  parseDateValue,
  parseOptions,
  optionLabel,
  nothingToEditError,
  parseCommandLine,
  UnknownFlagError,
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

describe('parseDateValue', () => {
  it('parses -d flag with date', () => {
    const result = parseDateValue('2025-01-15');
    expect(formatDate(result)).toBe('2025-01-15');
  });

  it('parses --date flag with date', () => {
    const result = parseDateValue('2025-03-20');
    expect(formatDate(result)).toBe('2025-03-20');
  });

  it('parses -d yesterday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00'));
    const result = parseDateValue('yesterday');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(14);
    vi.useRealTimers();
  });

  it('yesterday resolves correctly around midnight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T00:30:00'));
    const result = parseDateValue('yesterday');
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
    const result = parseDateValue(offset);
    expect(formatDate(result)).toBe(expected);
    expect(result.getHours()).toBe(12);
    vi.useRealTimers();
  });

  it('resolves offsets across a year boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-02T12:00:00'));
    expect(formatDate(parseDateValue('-3'))).toBe('2025-12-30');
    vi.useRealTimers();
  });

  it('resolves offsets across a leap day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-01T12:00:00'));
    expect(formatDate(parseDateValue('-1'))).toBe('2024-02-29');
    vi.useRealTimers();
  });

  it.each(['-1.5', '1.5', '-2days', '9007199254740992'])('rejects invalid offset %s', (offset) => {
    expect(() => parseDateValue(offset)).toThrow('Invalid date');
  });

  it('throws on invalid date', () => {
    expect(() => parseDateValue('not-a-date')).toThrow('Invalid date');
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

  it('preserves the calendar day across spring-forward', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-10T00:30:00-04:00'));

    expect(new Date().getTimezoneOffset()).toBe(240);
    expect(formatDate(new Date(Date.now() - 86400000))).toBe('2025-03-08');

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

describe('nothingToEditError', () => {
  it('lists the short form of each option where there is one', () => {
    const options = [
      { short: '-d', long: '--description', value: '<text>', description: '' },
      { long: '--dur', value: '<duration>', description: '' },
    ];
    expect(nothingToEditError(options).message).toBe('Nothing to edit. Provide at least one of: -d, --dur');
  });
});

describe('parseCommandLine option values', () => {
  const project = { short: '-p', long: '--project', value: '<name>', description: 'Project name' };
  const week = { short: '-w', long: '--week', value: '<offset>', description: 'Weeks from now' };
  const missingProject = (flag: string) => `Missing value for ${flag}. Expected <name>: Project name.`;
  const valueOf = (
    args: string[],
    option: typeof project & { allowEmpty?: boolean; negativeNumber?: boolean }
  ) => parseCommandLine(args, [option]).values.get(option.long);

  it('returns the next arg when present and not a flag', () => {
    expect(valueOf(['-p', 'Dev-Pilot'], project)).toBe('Dev-Pilot');
  });

  it('reports the flag as typed, with what the option expects', () => {
    expect(() => valueOf(['--project'], project)).toThrow(missingProject('--project'));
  });

  it('throws when the next arg starts with -', () => {
    expect(() => valueOf(['-p', '-x'], project)).toThrow(missingProject('-p'));
  });

  it('throws on empty string by default', () => {
    expect(() => valueOf(['-p', ''], project)).toThrow(missingProject('-p'));
  });

  it('returns an empty string when the option allows it', () => {
    expect(valueOf(['-p', ''], { ...project, allowEmpty: true })).toBe('');
  });

  it('still rejects the next arg starting with - when the option allows empty values', () => {
    expect(() => valueOf(['-p', '-x'], { ...project, allowEmpty: true })).toThrow(missingProject('-p'));
  });

  it('accepts a negative number only for options marked negativeNumber', () => {
    expect(valueOf(['-w', '-1'], { ...week, negativeNumber: true })).toBe('-1');
    expect(() => valueOf(['-w', '-1'], week)).toThrow('Missing value for -w.');
    expect(() => valueOf(['-w', '-v'], { ...week, negativeNumber: true })).toThrow('Missing value for -w.');
  });

  it('does not add a period after a description ending in ? or !', () => {
    const question = { long: '--x', value: '<x>', description: 'Which one?' };
    expect(() => parseCommandLine(['--x'], [question])).toThrow(/Expected <x>: Which one\?$/);
  });

  it('keeps the hint on one line and does not double a trailing period', () => {
    const wrapped = {
      long: '--at',
      value: '<time>',
      description: 'Start time as [H]H:MM\n(requires --dur).',
    };
    expect(() => parseCommandLine(['--at'], [wrapped])).toThrow(
      /^Missing value for --at\. Expected <time>: Start time as \[H\]H:MM \(requires --dur\)\.$/
    );
  });
});

describe('parseCommandLine', () => {
  const options = [
    { short: '-p', long: '--project', value: '<name>', description: 'Project name' },
    { short: '-t', long: '--tags', value: '<tags>', description: 'Tags', allowEmpty: true },
    { long: '--public', description: 'Public' },
  ];

  it('separates positionals, values, and boolean flags', () => {
    expect(parseCommandLine(['Fix', '-p', 'Dev', '--public', 'extra'], options)).toEqual({
      positionals: ['Fix', 'extra'],
      values: new Map([['--project', 'Dev']]),
      flags: new Set(['--public']),
    });
  });

  it('treats everything after -- as positional', () => {
    expect(parseCommandLine(['-p', 'Dev', '--', '-wip', '--public', '--'], options)).toEqual({
      positionals: ['-wip', '--public', '--'],
      values: new Map([['--project', 'Dev']]),
      flags: new Set(),
    });
  });

  it('does not use -- as a missing value', () => {
    expect(() => parseCommandLine(['-p', '--', 'x'], options)).toThrow('Missing value for -p.');
  });

  it('accepts --long=value, including values that start with -', () => {
    expect(parseCommandLine(['--project=-draft', 'Fix'], options).values.get('--project')).toBe('-draft');
    expect(parseCommandLine(['--project=a=b'], options).values.get('--project')).toBe('a=b');
  });

  it('applies the empty-value rule to --long=', () => {
    expect(() => parseCommandLine(['--project='], options)).toThrow(
      'Missing value for --project. Expected <name>: Project name.'
    );
    expect(parseCommandLine(['--tags='], options).values.get('--tags')).toBe('');
  });

  it('rejects = on an option that takes no value', () => {
    expect(() => parseCommandLine(['--public=yes'], options)).toThrow('--public does not take a value.');
  });

  it('does not support = on short flags', () => {
    expect(() => parseCommandLine(['-p=Dev'], options)).toThrow('Unknown flag: -p=Dev.');
  });

  it('rejects unknown flags and repeats, including the = form', () => {
    expect(() => parseCommandLine(['--color=red'], options)).toThrow('Unknown flag: --color.');
    expect(() => parseCommandLine(['-p', 'A', '--project=B'], options)).toThrow(
      '-p/--project was given more than once.'
    );
  });
});

describe('parseOptions missing values', () => {
  it('does not double a trailing period in the description', () => {
    const withPeriod = [{ long: '--name', value: '<filter>', description: 'Client name.' }];
    expect(() => parseOptions(['--name'], withPeriod, 'Usage: x')).toThrow(
      /^Missing value for --name\. Expected <filter>: Client name\.$/
    );
  });

  const options = [
    { short: '-d', long: '--date', value: '<date>', description: 'YYYY-MM-DD or "yesterday"' },
  ];
  const usage = 'Usage: tgp test [-d <date>]';

  it.each([[['-d']], [['-d', '--foo']], [['--date']], [['--date', '-v']], [['-d', '']]])(
    'reports a missing value for %j, with what is expected',
    (args) => {
      expect(() => parseOptions(args, options, usage)).toThrow(
        `Missing value for ${args[0]}. Expected <date>: YYYY-MM-DD or "yesterday".`
      );
    }
  );
});

describe('option helpers', () => {
  const options = [
    { short: '-d', long: '--date', value: '<date>', description: '', negativeNumber: true },
    { long: '--at', value: '<time>', description: '' },
    { short: '-v', long: '--verbose', description: '' },
  ];
  const usage = 'Usage: tgp test [-d <date>] [--at <time>] [-v]';

  it('validFlagsHint lists flags in order, singular for one flag', () => {
    expect(validFlagsHint(options)).toBe('Valid flags: -d/--date, --at, -v/--verbose');
    expect(validFlagsHint([options[1]])).toBe('Valid flag: --at');
  });

  it('accepts either spelling of a flag', () => {
    expect(parseCommandLine(['-v'], options).flags).toEqual(new Set(['--verbose']));
    expect(parseCommandLine(['--verbose'], options).flags).toEqual(new Set(['--verbose']));
  });

  it('rejects unknown flags with the valid ones and their position', () => {
    let error: unknown;
    try {
      parseCommandLine(['first', '--json'], options);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(UnknownFlagError);
    expect((error as UnknownFlagError).message).toBe(
      'Unknown flag: --json. Valid flags: -d/--date, --at, -v/--verbose'
    );
    expect((error as UnknownFlagError).position).toBe(1);
  });

  it('reports an unknown flag without a hint when there are no options', () => {
    expect(() => parseCommandLine(['-x'], [])).toThrow(/^Unknown flag: -x\.$/);
  });

  it('rejects an option already given under either spelling', () => {
    expect(() => parseCommandLine(['-d', 'x', '--date', 'y'], options)).toThrow(
      '-d/--date was given more than once.'
    );
  });

  it('keeps --=x whole instead of reading it as -- with a value', () => {
    expect(() => parseCommandLine(['--=x'], options)).toThrow('Unknown flag: --=x.');
  });

  it('parseOptions returns values and boolean flags keyed by long flag', () => {
    expect(parseOptions(['-d', '-2', '-v', '--at', '09:00'], options, usage)).toEqual({
      values: new Map([
        ['--date', '-2'],
        ['--at', '09:00'],
      ]),
      flags: new Set(['--verbose']),
    });
    expect(parseOptions([], options, usage)).toEqual({ values: new Map(), flags: new Set() });
  });

  it('parseOptions rejects a value without its flag', () => {
    expect(() => parseOptions(['-v', '-2'], options, usage)).toThrow('Unknown flag: -2.');
  });

  it.each([
    [['-v', '-v'], '-v/--verbose was given more than once.'],
    [['-d', 'yesterday', '--date', '2026-01-01'], '-d/--date was given more than once.'],
    [['--at', '09:00', '--at', '10:00'], '--at was given more than once.'],
  ])('parseOptions rejects repeated options: %j', (args, message) => {
    expect(() => parseOptions(args, options, usage)).toThrow(message);
  });

  it('parseOptions rejects positional arguments with the usage', () => {
    expect(() => parseOptions(['yesterday'], options, usage)).toThrow(usage);
  });

  it('parseOptions does not read the next flag as a missing value', () => {
    expect(() => parseOptions(['-d', '-v'], options, usage)).toThrow('Missing value for -d.');
  });

  it('optionLabel joins short and long flags with the value placeholder', () => {
    expect(optionLabel(options[0])).toBe('-d, --date <date>');
  });

  it('optionLabel indents long-only flags so long flags line up', () => {
    expect(optionLabel(options[1])).toBe('    --at <time>');
  });

  it('optionLabel omits the placeholder for boolean flags', () => {
    expect(optionLabel(options[2])).toBe('-v, --verbose');
  });
});
