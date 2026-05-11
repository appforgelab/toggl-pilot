import { describe, it, expect } from 'vitest';
import { getWeekBounds, parseWeekArgs } from '../src/commands/week.js';

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
    const result = parseWeekArgs([]);
    const today = new Date();
    expect(result.toISOString().slice(0, 10)).toBe(today.toISOString().slice(0, 10));
  });

  it('parses --date YYYY-MM-DD', () => {
    const result = parseWeekArgs(['--date', '2026-04-01']);
    const { monday } = getWeekBounds(result);
    expect(monday.toISOString().slice(0, 10)).toBe('2026-03-30');
  });

  it('parses -d shorthand', () => {
    const result = parseWeekArgs(['-d', '2026-04-01']);
    const { monday } = getWeekBounds(result);
    expect(monday.toISOString().slice(0, 10)).toBe('2026-03-30');
  });

  it('parses --week -1 (last week)', () => {
    const result = parseWeekArgs(['--week', '-1']);
    const { monday: resultMonday } = getWeekBounds(result);
    const { monday: currentMonday } = getWeekBounds(new Date());
    const expectedMonday = new Date(currentMonday);
    expectedMonday.setUTCDate(currentMonday.getUTCDate() - 7);
    expect(resultMonday.toISOString().slice(0, 10)).toBe(expectedMonday.toISOString().slice(0, 10));
  });

  it('parses --week 0 (same as current week)', () => {
    const result = parseWeekArgs(['--week', '0']);
    const { monday: resultMonday } = getWeekBounds(result);
    const { monday: currentMonday } = getWeekBounds(new Date());
    expect(resultMonday.toISOString().slice(0, 10)).toBe(currentMonday.toISOString().slice(0, 10));
  });

  it('parses -w -3 (3 weeks ago)', () => {
    const result = parseWeekArgs(['-w', '-3']);
    const { monday: resultMonday } = getWeekBounds(result);
    const { monday: currentMonday } = getWeekBounds(new Date());
    const expectedMonday = new Date(currentMonday);
    expectedMonday.setUTCDate(currentMonday.getUTCDate() - 21);
    expect(resultMonday.toISOString().slice(0, 10)).toBe(expectedMonday.toISOString().slice(0, 10));
  });

  it('parses --week 2 (future week)', () => {
    const result = parseWeekArgs(['--week', '2']);
    const { monday: resultMonday } = getWeekBounds(result);
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
});
