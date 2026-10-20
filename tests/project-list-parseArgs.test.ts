import { describe, it, expect } from 'vitest';

import { parseArgs } from '../src/commands/project-list.js';

describe('project-list parseArgs', () => {
  it('defaults to active projects only', () => {
    expect(parseArgs([])).toEqual({ includeArchived: false });
  });

  it('accepts --all', () => {
    expect(parseArgs(['--all'])).toEqual({ includeArchived: true });
  });

  it('accepts -a', () => {
    expect(parseArgs(['-a'])).toEqual({ includeArchived: true });
  });

  it('rejects unknown flags with the valid one', () => {
    expect(() => parseArgs(['--unknown'])).toThrow('Unknown flag: --unknown. Valid flag: -a/--all');
  });

  it('throws usage on positional arguments', () => {
    expect(() => parseArgs(['archived'])).toThrow('Usage: tgp project-list [--all|-a]');
  });

  it('rejects --all given twice', () => {
    expect(() => parseArgs(['-a', '--all'])).toThrow('-a/--all was given more than once.');
  });
});
