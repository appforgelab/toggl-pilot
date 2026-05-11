import { describe, it, expect } from 'vitest';
import {
  getWeekBounds,
  parseWeekArgs,
  buildProjectDayMap,
  renderVerboseMatrix,
} from '../src/commands/week.js';
import { NONE } from '../src/utils.js';

describe('getWeekBounds', () => {
  it('returns same Monday when given a Monday', () => {
    const mon = new Date('2026-05-04T08:00:00Z');
    const { monday, sunday, weekNumber } = getWeekBounds(mon);
    expect(monday.toISOString().slice(0, 10)).toBe('2026-05-04');
    expect(sunday.toISOString().slice(0, 10)).toBe('2026-05-10');
    expect(weekNumber).toBe(19);
  });

  it('returns correct Monday for a Wednesday', () => {
    const wed = new Date('2026-05-06T15:30:00Z');
    const { monday, sunday } = getWeekBounds(wed);
    expect(monday.toISOString().slice(0, 10)).toBe('2026-05-04');
    expect(sunday.toISOString().slice(0, 10)).toBe('2026-05-10');
  });

  it('returns correct Monday for a Sunday', () => {
    const sun = new Date('2026-05-10T22:00:00Z');
    const { monday, sunday } = getWeekBounds(sun);
    expect(monday.toISOString().slice(0, 10)).toBe('2026-05-04');
    expect(sunday.toISOString().slice(0, 10)).toBe('2026-05-10');
  });

  it('handles week spanning month boundary', () => {
    const thu = new Date('2026-04-30T12:00:00Z');
    const { monday, sunday } = getWeekBounds(thu);
    expect(monday.toISOString().slice(0, 10)).toBe('2026-04-27');
    expect(sunday.toISOString().slice(0, 10)).toBe('2026-05-03');
  });

  it('handles week spanning year boundary', () => {
    const wed = new Date('2025-12-31T12:00:00Z');
    const { monday, sunday, weekNumber } = getWeekBounds(wed);
    expect(monday.toISOString().slice(0, 10)).toBe('2025-12-29');
    expect(sunday.toISOString().slice(0, 10)).toBe('2026-01-04');
    expect(weekNumber).toBe(1);
  });

  it('calculates correct week number for week 2', () => {
    const mon = new Date('2026-01-05T12:00:00Z');
    const { weekNumber } = getWeekBounds(mon);
    expect(weekNumber).toBe(2);
  });

  it('does not mutate the input date', () => {
    const input = new Date('2026-05-07T12:00:00Z');
    const before = input.toISOString();
    getWeekBounds(input);
    expect(input.toISOString()).toBe(before);
  });

  it('normalizes time to noon UTC', () => {
    const lateNight = new Date('2026-05-07T02:00:00Z');
    const { monday } = getWeekBounds(lateNight);
    expect(monday.toISOString()).toBe('2026-05-04T12:00:00.000Z');
  });
});

describe('parseWeekArgs', () => {
  it('returns current date when no flags provided', () => {
    const { refDate } = parseWeekArgs([]);
    const today = new Date();
    expect(refDate.toISOString().slice(0, 10)).toBe(today.toISOString().slice(0, 10));
  });

  it('parses --date YYYY-MM-DD', () => {
    const { refDate } = parseWeekArgs(['--date', '2026-04-01']);
    const { monday } = getWeekBounds(refDate);
    expect(monday.toISOString().slice(0, 10)).toBe('2026-03-30');
  });

  it('parses -d shorthand', () => {
    const { refDate } = parseWeekArgs(['-d', '2026-04-01']);
    const { monday } = getWeekBounds(refDate);
    expect(monday.toISOString().slice(0, 10)).toBe('2026-03-30');
  });

  it('parses --week -1 (last week)', () => {
    const { refDate } = parseWeekArgs(['--week', '-1']);
    const { monday: resultMonday } = getWeekBounds(refDate);
    const { monday: currentMonday } = getWeekBounds(new Date());
    const expectedMonday = new Date(currentMonday);
    expectedMonday.setUTCDate(currentMonday.getUTCDate() - 7);
    expect(resultMonday.toISOString().slice(0, 10)).toBe(expectedMonday.toISOString().slice(0, 10));
  });

  it('parses --week 0 (same as current week)', () => {
    const { refDate } = parseWeekArgs(['--week', '0']);
    const { monday: resultMonday } = getWeekBounds(refDate);
    const { monday: currentMonday } = getWeekBounds(new Date());
    expect(resultMonday.toISOString().slice(0, 10)).toBe(currentMonday.toISOString().slice(0, 10));
  });

  it('parses -w -3 (3 weeks ago)', () => {
    const { refDate } = parseWeekArgs(['-w', '-3']);
    const { monday: resultMonday } = getWeekBounds(refDate);
    const { monday: currentMonday } = getWeekBounds(new Date());
    const expectedMonday = new Date(currentMonday);
    expectedMonday.setUTCDate(currentMonday.getUTCDate() - 21);
    expect(resultMonday.toISOString().slice(0, 10)).toBe(expectedMonday.toISOString().slice(0, 10));
  });

  it('parses --week 2 (future week)', () => {
    const { refDate } = parseWeekArgs(['--week', '2']);
    const { monday: resultMonday } = getWeekBounds(refDate);
    const { monday: currentMonday } = getWeekBounds(new Date());
    const expectedMonday = new Date(currentMonday);
    expectedMonday.setUTCDate(currentMonday.getUTCDate() + 14);
    expect(resultMonday.toISOString().slice(0, 10)).toBe(expectedMonday.toISOString().slice(0, 10));
  });

  it('throws when both --date and --week are provided', () => {
    expect(() => parseWeekArgs(['--date', '2026-04-01', '--week', '-1'])).toThrow(
      'Cannot use both --date and --week'
    );
  });

  it('throws on invalid date', () => {
    expect(() => parseWeekArgs(['-d', 'not-a-date'])).toThrow('Invalid date');
  });

  it('throws on non-integer --week value', () => {
    expect(() => parseWeekArgs(['--week', 'abc'])).toThrow('Invalid week');
  });

  it('throws when --date or --week is missing its value', () => {
    expect(() => parseWeekArgs(['--date'])).toThrow();
    expect(() => parseWeekArgs(['--week'])).toThrow();
  });

  it('returns verbose=false by default', () => {
    const { verbose } = parseWeekArgs([]);
    expect(verbose).toBe(false);
  });

  it('parses --verbose flag', () => {
    const { verbose } = parseWeekArgs(['--verbose']);
    expect(verbose).toBe(true);
  });

  it('parses -v shorthand', () => {
    const { verbose } = parseWeekArgs(['-v']);
    expect(verbose).toBe(true);
  });

  it('combines --verbose with --date', () => {
    const { refDate, verbose } = parseWeekArgs(['--verbose', '--date', '2026-04-01']);
    const { monday } = getWeekBounds(refDate);
    expect(monday.toISOString().slice(0, 10)).toBe('2026-03-30');
    expect(verbose).toBe(true);
  });

  it('combines -v with --week', () => {
    const { verbose } = parseWeekArgs(['-v', '--week', '-1']);
    expect(verbose).toBe(true);
  });
});

describe('buildProjectDayMap', () => {
  it('groups entries by project and day', () => {
    const entries = [
      makeEntry(1, '2026-05-04T09:00:00Z', 3600, 10),
      makeEntry(2, '2026-05-05T09:00:00Z', 7200, 10),
      makeEntry(3, '2026-05-04T10:00:00Z', 1800, 20),
    ];
    const projectMap = new Map([
      [10, 'Alpha'],
      [20, 'Beta'],
    ]);
    const result = buildProjectDayMap(entries, projectMap);
    expect(result.get('Alpha')![0]).toBe(3600);
    expect(result.get('Alpha')![1]).toBe(7200);
    expect(result.get('Beta')![0]).toBe(1800);
  });

  it('groups entries without project as —', () => {
    const entries = [makeEntry(1, '2026-05-04T09:00:00Z', 3600, null)];
    const projectMap = new Map<number, string>();
    const result = buildProjectDayMap(entries, projectMap);
    expect(result.has(NONE)).toBe(true);
    expect(result.get(NONE)![0]).toBe(3600);
  });

  it('maps Sunday to index 6', () => {
    const entries = [makeEntry(1, '2026-05-10T09:00:00Z', 1800, 10)];
    const projectMap = new Map([[10, 'Alpha']]);
    const result = buildProjectDayMap(entries, projectMap);
    expect(result.get('Alpha')![6]).toBe(1800);
  });

  it('maps Saturday to index 5', () => {
    const entries = [makeEntry(1, '2026-05-09T09:00:00Z', 2400, 10)];
    const projectMap = new Map([[10, 'Alpha']]);
    const result = buildProjectDayMap(entries, projectMap);
    expect(result.get('Alpha')![5]).toBe(2400);
  });

  it('handles running timer entries (negative duration)', () => {
    const start = new Date(Date.now() - 1800000);
    const entries = [makeEntry(1, start.toISOString(), -1, 10)];
    const projectMap = new Map([[10, 'Alpha']]);
    const result = buildProjectDayMap(entries, projectMap);
    const dayIdx = start.getUTCDay() === 0 ? 6 : start.getUTCDay() - 1;
    expect(result.get('Alpha')![dayIdx]).toBeGreaterThanOrEqual(1799);
  });

  it('returns empty map for empty entries', () => {
    const result = buildProjectDayMap([], new Map());
    expect(result.size).toBe(0);
  });
});

describe('renderVerboseMatrix', () => {
  it('renders a basic matrix with one project', () => {
    const projectDayMap = new Map<string, number[]>([['Alpha', [3600, 7200, 0, 0, 0, 0, 0]]]);
    const monday = new Date('2026-05-04T12:00:00Z');
    const sunday = new Date('2026-05-10T12:00:00Z');
    const output = renderVerboseMatrix(projectDayMap, monday, sunday, 19);

    expect(output).toContain('Week 19 (May 04 – May 10)');
    expect(output).toContain('Alpha');
    expect(output).toContain('1h00m');
    expect(output).toContain('2h00m');
    expect(output).toContain('Daily Total');
    expect(output).toContain('─');
  });

  it('shows - for empty cells', () => {
    const projectDayMap = new Map<string, number[]>([['Alpha', [0, 0, 0, 0, 0, 0, 0]]]);
    const monday = new Date('2026-05-04T12:00:00Z');
    const sunday = new Date('2026-05-10T12:00:00Z');
    const output = renderVerboseMatrix(projectDayMap, monday, sunday, 19);

    expect(output).toContain('-');
  });

  it('places — row last', () => {
    const projectDayMap = new Map<string, number[]>([
      [NONE, [3600, 0, 0, 0, 0, 0, 0]],
      ['Alpha', [1800, 0, 0, 0, 0, 0, 0]],
    ]);
    const monday = new Date('2026-05-04T12:00:00Z');
    const sunday = new Date('2026-05-10T12:00:00Z');
    const output = renderVerboseMatrix(projectDayMap, monday, sunday, 19);
    const alphaIdx = output.indexOf('Alpha');
    const dashIdx = output.indexOf(NONE);
    expect(dashIdx).toBeGreaterThan(alphaIdx);
  });

  it('sorts project names alphabetically', () => {
    const projectDayMap = new Map<string, number[]>([
      ['Zeta', [3600, 0, 0, 0, 0, 0, 0]],
      ['Alpha', [1800, 0, 0, 0, 0, 0, 0]],
    ]);
    const monday = new Date('2026-05-04T12:00:00Z');
    const sunday = new Date('2026-05-10T12:00:00Z');
    const output = renderVerboseMatrix(projectDayMap, monday, sunday, 19);
    const alphaIdx = output.indexOf('Alpha');
    const zetaIdx = output.indexOf('Zeta');
    expect(alphaIdx).toBeLessThan(zetaIdx);
  });

  it('computes Daily Total correctly', () => {
    const projectDayMap = new Map<string, number[]>([
      ['Alpha', [3600, 7200, 0, 0, 0, 0, 0]],
      ['Beta', [1800, 3600, 0, 0, 0, 0, 0]],
    ]);
    const monday = new Date('2026-05-04T12:00:00Z');
    const sunday = new Date('2026-05-10T12:00:00Z');
    const output = renderVerboseMatrix(projectDayMap, monday, sunday, 19);

    expect(output).toContain('Daily Total');
    expect(output).toContain('4h30m');
  });

  it('renders Total column per project', () => {
    const projectDayMap = new Map<string, number[]>([['Alpha', [3600, 7200, 0, 0, 0, 0, 0]]]);
    const monday = new Date('2026-05-04T12:00:00Z');
    const sunday = new Date('2026-05-10T12:00:00Z');
    const output = renderVerboseMatrix(projectDayMap, monday, sunday, 19);

    expect(output).toContain('3h00m');
  });
});

function makeEntry(id: number, start: string, duration: number, project_id: number | null) {
  return {
    id,
    description: '',
    start,
    stop: duration < 0 ? null : new Date(new Date(start).getTime() + duration * 1000).toISOString(),
    duration,
    project_id,
    project_name: null,
    tags: null,
    workspace_id: 1,
  };
}
