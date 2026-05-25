import { describe, it, expect } from 'vitest';

import { parseArgs } from '../src/commands/client-list.js';

const usage = 'Usage: tgp client-list [--status active|archived|both] [--name <filter>]';

describe('client-list parseArgs', () => {
  it('defaults to active clients', () => {
    expect(parseArgs([])).toEqual({ status: 'active' });
  });

  it('accepts active status', () => {
    expect(parseArgs(['--status', 'active'])).toEqual({ status: 'active' });
  });

  it('accepts archived status', () => {
    expect(parseArgs(['--status', 'archived'])).toEqual({ status: 'archived' });
  });

  it('accepts both status', () => {
    expect(parseArgs(['--status', 'both'])).toEqual({ status: 'both' });
  });

  it('accepts a name filter', () => {
    expect(parseArgs(['--name', 'Acme'])).toEqual({ status: 'active', name: 'Acme' });
  });

  it('accepts status and name in either order', () => {
    expect(parseArgs(['--status', 'both', '--name', 'Acme'])).toEqual({ status: 'both', name: 'Acme' });
    expect(parseArgs(['--name', 'Acme', '--status', 'archived'])).toEqual({
      status: 'archived',
      name: 'Acme',
    });
  });

  it('throws usage when status is missing', () => {
    expect(() => parseArgs(['--status'])).toThrow(usage);
  });

  it('throws usage when status is invalid', () => {
    expect(() => parseArgs(['--status', 'deleted'])).toThrow(usage);
  });

  it('throws usage when name is missing', () => {
    expect(() => parseArgs(['--name'])).toThrow(usage);
  });

  it('throws usage on unknown flag', () => {
    expect(() => parseArgs(['--all'])).toThrow(usage);
  });
});
