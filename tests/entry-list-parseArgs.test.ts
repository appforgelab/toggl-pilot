import { describe, it, expect } from 'vitest';
import { parseArgs } from '../src/commands/entry-list.js';
import { formatDate, localDateWithOffset, localYesterdayDate } from '../src/utils.js';

describe('entry-list parseArgs', () => {
  it('defaults to today', () => {
    expect(formatDate(parseArgs([]))).toBe(formatDate(new Date()));
  });

  it.each([
    [['-d', 'yesterday'], () => localYesterdayDate()],
    [['--date', '-2'], () => localDateWithOffset(-2)],
    [['-d', '2026-04-29'], () => new Date('2026-04-29T12:00:00')],
  ])('parses %j', (args, expected) => {
    expect(formatDate(parseArgs(args))).toBe(formatDate(expected()));
  });

  it('rejects a date given without -d', () => {
    expect(() => parseArgs(['yesterday'])).toThrow(
      'Usage: tgp entry-list [-d YYYY-MM-DD|yesterday|<offset>]'
    );
  });

  it('rejects unknown flags', () => {
    expect(() => parseArgs(['--all'])).toThrow('Unknown flag: --all. Valid flag: -d/--date');
  });

  it('rejects extra arguments after the date', () => {
    expect(() => parseArgs(['-d', 'yesterday', 'extra'])).toThrow('Usage: tgp entry-list');
  });
});
