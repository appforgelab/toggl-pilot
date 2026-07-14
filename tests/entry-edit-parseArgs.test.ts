import { describe, it, expect } from 'vitest';
import { parseArgs } from '../src/commands/entry-edit.js';

describe('entry-edit parseArgs', () => {
  it('parses id with description', () => {
    const result = parseArgs(['12345', '-d', 'New description']);
    expect(result).toEqual({
      id: '12345',
      description: 'New description',
      project: null,
      tags: null,
      dur: null,
      start: null,
    });
  });

  it('parses id with project', () => {
    const result = parseArgs(['12345', '-p', 'Dev-Pilot']);
    expect(result.id).toBe('12345');
    expect(result.project).toBe('Dev-Pilot');
  });

  it('parses id with tags', () => {
    const result = parseArgs(['12345', '-t', 'dev,bug']);
    expect(result.tags).toEqual(['dev', 'bug']);
  });

  it('parses empty tags as a clear request', () => {
    const result = parseArgs(['12345', '-t', '']);
    expect(result.tags).toEqual([]);
  });

  it('trims tags and removes blanks and duplicates', () => {
    const result = parseArgs(['12345', '-t', ' dev, ,bug,DEV ']);
    expect(result.tags).toEqual(['dev', 'bug']);
  });

  it('parses id with all flags', () => {
    const result = parseArgs(['12345', '-d', 'Updated', '-p', 'Project', '-t', 'review']);
    expect(result).toEqual({
      id: '12345',
      description: 'Updated',
      project: 'Project',
      tags: ['review'],
      dur: null,
      start: null,
    });
  });

  it('parses --description long form', () => {
    const result = parseArgs(['12345', '--description', 'New desc']);
    expect(result.description).toBe('New desc');
  });

  it('throws on missing id', () => {
    expect(() => parseArgs(['-d', 'desc'])).toThrow('Usage');
  });

  it('throws on nothing to edit', () => {
    expect(() => parseArgs(['12345'])).toThrow('Nothing to edit');
  });

  it('throws on unknown flag', () => {
    expect(() => parseArgs(['12345', '--unknown'])).toThrow('Unknown flag');
  });

  it('throws on empty args', () => {
    expect(() => parseArgs([])).toThrow('Usage');
  });

  it('parses --dur', () => {
    const result = parseArgs(['12345', '--dur', '1h30m']);
    expect(result.dur).toBe('1h30m');
  });

  it('parses --dur with other flags', () => {
    const result = parseArgs(['12345', '-d', 'Desc', '--dur', '45m']);
    expect(result.description).toBe('Desc');
    expect(result.dur).toBe('45m');
  });

  it('throws on -d with no value', () => {
    expect(() => parseArgs(['12345', '-d'])).toThrow('Missing value for -d.');
  });

  it('throws on --description with no value', () => {
    expect(() => parseArgs(['12345', '--description'])).toThrow('Missing value for --description.');
  });

  it('throws on -p with no value', () => {
    expect(() => parseArgs(['12345', '-p'])).toThrow('Missing value for -p.');
  });

  it('throws on --project with no value', () => {
    expect(() => parseArgs(['12345', '--project'])).toThrow('Missing value for --project.');
  });

  it('throws on --tags with no value', () => {
    expect(() => parseArgs(['12345', '--tags'])).toThrow('Missing value for --tags.');
  });

  it('throws on --dur with no value', () => {
    expect(() => parseArgs(['12345', '--dur'])).toThrow('Missing value for --dur.');
  });

  it('throws on -p followed by another flag', () => {
    expect(() => parseArgs(['12345', '-p', '-t', 'foo'])).toThrow('Missing value for -p.');
  });

  it('throws on -d followed by -p', () => {
    expect(() => parseArgs(['12345', '-d', '-p', 'X'])).toThrow('Missing value for -d.');
  });

  it('throws on --dur followed by another flag', () => {
    expect(() => parseArgs(['12345', '--dur', '-d', 'desc'])).toThrow('Missing value for --dur.');
  });

  it('throws on -d with empty value', () => {
    expect(() => parseArgs(['12345', '-d', ''])).toThrow('Missing value for -d.');
  });

  it('throws on -p with empty value', () => {
    expect(() => parseArgs(['12345', '-p', ''])).toThrow('Missing value for -p.');
  });

  it('throws on --dur with empty value', () => {
    expect(() => parseArgs(['12345', '--dur', ''])).toThrow('Missing value for --dur.');
  });

  it('parses --start', () => {
    const result = parseArgs(['12345', '--start', '11:20']);
    expect(result.start).toBe('11:20');
  });

  it('parses --start with ISO 8601 value', () => {
    const result = parseArgs(['12345', '--start', '2026-07-14T11:20:00+07:00']);
    expect(result.start).toBe('2026-07-14T11:20:00+07:00');
  });

  it('parses --start combined with other flags', () => {
    const result = parseArgs(['12345', '-d', 'Desc', '--start', '11:20']);
    expect(result.description).toBe('Desc');
    expect(result.start).toBe('11:20');
  });

  it('parses --start and --dur together', () => {
    const result = parseArgs(['12345', '--start', '11:20', '--dur', '1h30m']);
    expect(result.start).toBe('11:20');
    expect(result.dur).toBe('1h30m');
  });

  it('throws on --start with no value', () => {
    expect(() => parseArgs(['12345', '--start'])).toThrow('Missing value for --start.');
  });

  it('throws on --start followed by another flag', () => {
    expect(() => parseArgs(['12345', '--start', '-d', 'desc'])).toThrow('Missing value for --start.');
  });

  it('throws on --start with empty value', () => {
    expect(() => parseArgs(['12345', '--start', ''])).toThrow('Missing value for --start.');
  });
});
