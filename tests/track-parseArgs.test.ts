import { describe, it, expect } from 'vitest';
import { parseArgs } from '../src/commands/track.js';

describe('track parseArgs', () => {
  it('parses description only', () => {
    const result = parseArgs(['Fix bug']);
    expect(result).toEqual({
      description: 'Fix bug',
      project: null,
      tags: [],
      at: null,
      dur: null,
      date: null,
    });
  });

  it('parses description with project', () => {
    const result = parseArgs(['Fix bug', '-p', 'Dev-Pilot']);
    expect(result.description).toBe('Fix bug');
    expect(result.project).toBe('Dev-Pilot');
  });

  it('parses --project long form', () => {
    const result = parseArgs(['Fix bug', '--project', 'Dev-Pilot']);
    expect(result.project).toBe('Dev-Pilot');
  });

  it('parses tags with -t', () => {
    const result = parseArgs(['Work', '-t', 'dev,review']);
    expect(result.tags).toEqual(['dev', 'review']);
  });

  it('trims whitespace in tags', () => {
    const result = parseArgs(['Work', '-t', 'dev , review , bug']);
    expect(result.tags).toEqual(['dev', 'review', 'bug']);
  });

  it('parses --at and --dur', () => {
    const result = parseArgs(['Meeting', '--at', '09:00', '--dur', '1h30m']);
    expect(result.at).toBe('09:00');
    expect(result.dur).toBe('1h30m');
  });

  it('parses all flags together', () => {
    const result = parseArgs([
      'Sprint planning',
      '-p',
      'Client-X',
      '-t',
      'meeting,planning',
      '--at',
      '10:00',
      '--dur',
      '1h',
    ]);
    expect(result).toEqual({
      description: 'Sprint planning',
      project: 'Client-X',
      tags: ['meeting', 'planning'],
      at: '10:00',
      dur: '1h',
      date: null,
    });
  });

  it('parses -d with ISO date', () => {
    const result = parseArgs(['Standup', '--at', '09:00', '--dur', '30m', '-d', '2025-06-10']);
    expect(result.date).toBe('2025-06-10');
  });

  it('parses --date with yesterday keyword', () => {
    const result = parseArgs(['Standup', '--at', '09:00', '--dur', '30m', '--date', 'yesterday']);
    expect(result.date).toBe('yesterday');
  });

  it('parses all flags with --date', () => {
    const result = parseArgs([
      'Standup',
      '-p',
      'Dev-Pilot',
      '-t',
      'meeting',
      '--at',
      '09:00',
      '--dur',
      '30m',
      '--date',
      'yesterday',
    ]);
    expect(result).toEqual({
      description: 'Standup',
      project: 'Dev-Pilot',
      tags: ['meeting'],
      at: '09:00',
      dur: '30m',
      date: 'yesterday',
    });
  });

  it('throws on --date with no value', () => {
    expect(() => parseArgs(['Work', '--at', '09:00', '--dur', '30m', '--date'])).toThrow(
      'Missing value for --date'
    );
  });

  it('throws on -d followed by another flag', () => {
    expect(() => parseArgs(['Work', '--at', '09:00', '--dur', '30m', '-d', '-p', 'X'])).toThrow(
      'Missing value for -d'
    );
  });

  it('throws on unknown flag', () => {
    expect(() => parseArgs(['Work', '--unknown'])).toThrow('Unknown flag');
  });

  it('throws on missing description', () => {
    expect(() => parseArgs(['-p', 'Project'])).toThrow('Usage');
  });

  it('throws on empty args', () => {
    expect(() => parseArgs([])).toThrow('Usage');
  });

  it('throws on -p with no value', () => {
    expect(() => parseArgs(['Work', '-p'])).toThrow('Missing value for -p.');
  });

  it('throws on --project with no value', () => {
    expect(() => parseArgs(['Work', '--project'])).toThrow('Missing value for --project.');
  });

  it('throws on -t with no value', () => {
    expect(() => parseArgs(['Work', '-t'])).toThrow('Missing value for -t.');
  });

  it('throws on --tags with no value', () => {
    expect(() => parseArgs(['Work', '--tags'])).toThrow('Missing value for --tags.');
  });

  it('throws on --at with no value', () => {
    expect(() => parseArgs(['Work', '--at'])).toThrow('Missing value for --at.');
  });

  it('throws on --dur with no value', () => {
    expect(() => parseArgs(['Work', '--dur'])).toThrow('Missing value for --dur.');
  });

  it('throws on -p followed by another flag', () => {
    expect(() => parseArgs(['Work', '-p', '-t', 'foo'])).toThrow('Missing value for -p.');
  });

  it('throws on --at followed by --dur (issue example)', () => {
    expect(() => parseArgs(['Work', '--at', '--dur', '30m'])).toThrow('Missing value for --at.');
  });

  it('throws on --dur followed by another flag', () => {
    expect(() => parseArgs(['Work', '--at', '09:00', '--dur', '--at'])).toThrow('Missing value for --dur.');
  });
});
