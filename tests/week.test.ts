import { describe, it, expect } from 'vitest';
import {
  getWeekBounds,
  parseWeekArgs,
  buildProjectDayMap,
  renderVerboseMatrix,
} from '../src/commands/week.js';
import { formatDate, DASH } from '../src/utils.js';

describe('getWeekBounds', () => {
  it('returns same Monday when given a Monday', () => {
    const mon = new Date(2026, 4, 4);
    const { monday, sunday, weekNumber } = getWeekBounds(mon);
    expect(formatDate(monday)).toBe('2026-05-04');
    expect(formatDate(sunday)).toBe('2026-05-10');
    expect(weekNumber).toBe(19);
  });

  it('returns correct Monday for a Wednesday', () => {
    const wed = new Date(2026, 4, 6);
    const { monday, sunday } = getWeekBounds(wed);
    expect(formatDate(monday)).toBe('2026-05-04');
    expect(formatDate(sunday)).toBe('2026-05-10');
  });

  it('returns correct Monday for a Sunday', () => {
    const sun = new Date(2026, 4, 10);
    const { monday, sunday } = getWeekBounds(sun);
    expect(formatDate(monday)).toBe('2026-05-04');
    expect(formatDate(sunday)).toBe('2026-05-10');
  });

  it('handles week spanning month boundary', () => {
    const thu = new Date(2026, 3, 30);
    const { monday, sunday } = getWeekBounds(thu);
    expect(formatDate(monday)).toBe('2026-04-27');
    expect(formatDate(sunday)).toBe('2026-05-03');
  });

  it('handles week spanning year boundary', () => {
    const wed = new Date(2025, 11, 31);
    const { monday, sunday, weekNumber } = getWeekBounds(wed);
    expect(formatDate(monday)).toBe('2025-12-29');
    expect(formatDate(sunday)).toBe('2026-01-04');
    expect(weekNumber).toBe(1);
  });

  it('calculates correct week number for week 2', () => {
    const mon = new Date(2026, 0, 5);
    const { weekNumber } = getWeekBounds(mon);
    expect(weekNumber).toBe(2);
  });

  it('does not mutate the input date', () => {
    const input = new Date(2026, 4, 7, 12, 0, 0);
    const before = input.getTime();
    getWeekBounds(input);
    expect(input.getTime()).toBe(before);
  });

  it('normalizes time to local noon', () => {
    const lateNight = new Date(2026, 4, 7, 2, 0, 0);
    const { monday } = getWeekBounds(lateNight);
    expect(monday.getHours()).toBe(12);
    expect(monday.getMinutes()).toBe(0);
    expect(monday.getSeconds()).toBe(0);
  });
});

describe('parseWeekArgs', () => {
  it('returns current date when no flags provided', () => {
    const { refDate } = parseWeekArgs([]);
    const today = new Date();
    expect(formatDate(refDate)).toBe(formatDate(today));
  });

  it('parses --date YYYY-MM-DD', () => {
    const { refDate } = parseWeekArgs(['--date', '2026-04-01']);
    const { monday } = getWeekBounds(refDate);
    expect(formatDate(monday)).toBe('2026-03-30');
  });

  it('parses -d shorthand', () => {
    const { refDate } = parseWeekArgs(['-d', '2026-04-01']);
    const { monday } = getWeekBounds(refDate);
    expect(formatDate(monday)).toBe('2026-03-30');
  });

  it('parses --week -1 (last week)', () => {
    const { refDate } = parseWeekArgs(['--week', '-1']);
    const { monday: resultMonday } = getWeekBounds(refDate);
    const { monday: currentMonday } = getWeekBounds(new Date());
    const expectedMonday = new Date(currentMonday);
    expectedMonday.setDate(currentMonday.getDate() - 7);
    expect(formatDate(resultMonday)).toBe(formatDate(expectedMonday));
  });

  it('parses --week 0 (same as current week)', () => {
    const { refDate } = parseWeekArgs(['--week', '0']);
    const { monday: resultMonday } = getWeekBounds(refDate);
    const { monday: currentMonday } = getWeekBounds(new Date());
    expect(formatDate(resultMonday)).toBe(formatDate(currentMonday));
  });

  it('parses -w -3 (3 weeks ago)', () => {
    const { refDate } = parseWeekArgs(['-w', '-3']);
    const { monday: resultMonday } = getWeekBounds(refDate);
    const { monday: currentMonday } = getWeekBounds(new Date());
    const expectedMonday = new Date(currentMonday);
    expectedMonday.setDate(currentMonday.getDate() - 21);
    expect(formatDate(resultMonday)).toBe(formatDate(expectedMonday));
  });

  it('parses --week 2 (future week)', () => {
    const { refDate } = parseWeekArgs(['--week', '2']);
    const { monday: resultMonday } = getWeekBounds(refDate);
    const { monday: currentMonday } = getWeekBounds(new Date());
    const expectedMonday = new Date(currentMonday);
    expectedMonday.setDate(currentMonday.getDate() + 14);
    expect(formatDate(resultMonday)).toBe(formatDate(expectedMonday));
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
    expect(formatDate(monday)).toBe('2026-03-30');
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
    expect(result.get('Alpha')![localDayIndex('2026-05-04T09:00:00Z')]).toBe(3600);
    expect(result.get('Alpha')![localDayIndex('2026-05-05T09:00:00Z')]).toBe(7200);
    expect(result.get('Beta')![localDayIndex('2026-05-04T10:00:00Z')]).toBe(1800);
  });

  it('groups entries without project as —', () => {
    const entries = [makeEntry(1, '2026-05-04T09:00:00Z', 3600, null)];
    const projectMap = new Map<number, string>();
    const result = buildProjectDayMap(entries, projectMap);
    expect(result.has(DASH)).toBe(true);
    expect(result.get(DASH)![localDayIndex('2026-05-04T09:00:00Z')]).toBe(3600);
  });

  it('maps days to correct indices', () => {
    const entries = [makeEntry(1, '2026-05-10T09:00:00Z', 1800, 10)];
    const projectMap = new Map([[10, 'Alpha']]);
    const result = buildProjectDayMap(entries, projectMap);
    const idx = localDayIndex('2026-05-10T09:00:00Z');
    expect(result.get('Alpha')![idx]).toBe(1800);
  });

  it('handles running timer entries (negative duration)', () => {
    const start = new Date(Date.now() - 1800000);
    const entries = [makeEntry(1, start.toISOString(), -1, 10)];
    const projectMap = new Map([[10, 'Alpha']]);
    const result = buildProjectDayMap(entries, projectMap);
    const dayIdx = start.getDay() === 0 ? 6 : start.getDay() - 1;
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
    const monday = new Date(2026, 4, 4, 12, 0, 0);
    const sunday = new Date(2026, 4, 10, 12, 0, 0);
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
    const monday = new Date(2026, 4, 4, 12, 0, 0);
    const sunday = new Date(2026, 4, 10, 12, 0, 0);
    const output = renderVerboseMatrix(projectDayMap, monday, sunday, 19);

    expect(output).toContain('-');
  });

  it('places — row last', () => {
    const projectDayMap = new Map<string, number[]>([
      [DASH, [3600, 0, 0, 0, 0, 0, 0]],
      ['Alpha', [1800, 0, 0, 0, 0, 0, 0]],
    ]);
    const monday = new Date(2026, 4, 4, 12, 0, 0);
    const sunday = new Date(2026, 4, 10, 12, 0, 0);
    const output = renderVerboseMatrix(projectDayMap, monday, sunday, 19);
    const alphaIdx = output.indexOf('Alpha');
    const dashIdx = output.indexOf(DASH);
    expect(dashIdx).toBeGreaterThan(alphaIdx);
  });

  it('sorts project names alphabetically', () => {
    const projectDayMap = new Map<string, number[]>([
      ['Zeta', [3600, 0, 0, 0, 0, 0, 0]],
      ['Alpha', [1800, 0, 0, 0, 0, 0, 0]],
    ]);
    const monday = new Date(2026, 4, 4, 12, 0, 0);
    const sunday = new Date(2026, 4, 10, 12, 0, 0);
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
    const monday = new Date(2026, 4, 4, 12, 0, 0);
    const sunday = new Date(2026, 4, 10, 12, 0, 0);
    const output = renderVerboseMatrix(projectDayMap, monday, sunday, 19);

    expect(output).toContain('Daily Total');
    expect(output).toContain('4h30m');
  });

  it('renders Total column per project', () => {
    const projectDayMap = new Map<string, number[]>([['Alpha', [3600, 7200, 0, 0, 0, 0, 0]]]);
    const monday = new Date(2026, 4, 4, 12, 0, 0);
    const sunday = new Date(2026, 4, 10, 12, 0, 0);
    const output = renderVerboseMatrix(projectDayMap, monday, sunday, 19);

    expect(output).toContain('3h00m');
  });
});

function localDayIndex(isoStart: string): number {
  const dow = new Date(isoStart).getDay();
  return dow === 0 ? 6 : dow - 1;
}

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
