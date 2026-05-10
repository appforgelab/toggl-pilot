import { describe, it, expect } from 'vitest';
import { getWeekBounds } from '../src/commands/week.js';

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
