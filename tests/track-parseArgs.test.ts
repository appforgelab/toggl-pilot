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
    });
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
});
