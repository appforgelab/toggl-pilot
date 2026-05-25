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

  it('throws usage on unknown flag', () => {
    expect(() => parseArgs(['--unknown'])).toThrow('Usage: tgp project-list [--all|-a]');
  });
});
