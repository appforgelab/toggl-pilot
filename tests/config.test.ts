import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

vi.mock('../src/paths.js', () => ({
  getConfigFile: vi.fn(),
  getConfigDir: vi.fn(),
  getCacheDir: vi.fn(),
}));

import { getConfigFile } from '../src/paths.js';
import { setConfigVar } from '../src/config.js';

const mockedGetConfigFile = vi.mocked(getConfigFile);

let dir: string;
let file: string;

describe('setConfigVar', () => {
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'tgp-'));
    file = join(dir, 'config.env');
    mockedGetConfigFile.mockReturnValue(file);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.mocked(console.warn).mockRestore?.();
    rmSync(dir, { recursive: true, force: true });
  });

  it('creates a new config file when none exists', () => {
    const returned = setConfigVar('TOGGL_API_TOKEN', 'abc123');

    expect(returned).toBe(file);
    expect(readFileSync(file, 'utf-8')).toBe('TOGGL_API_TOKEN=abc123\n');
  });

  it('updates an existing key while preserving others', () => {
    writeFileSync(file, 'TOGGL_API_TOKEN=old\nTOGGL_WORKSPACE_ID=111\n');

    setConfigVar('TOGGL_WORKSPACE_ID', '222');

    expect(readFileSync(file, 'utf-8')).toBe('TOGGL_API_TOKEN=old\nTOGGL_WORKSPACE_ID=222\n');
  });

  it('appends a new key while preserving the token', () => {
    writeFileSync(file, 'TOGGL_API_TOKEN=abc123\n');

    setConfigVar('TOGGL_WORKSPACE_ID', '12345');

    expect(readFileSync(file, 'utf-8')).toBe('TOGGL_API_TOKEN=abc123\nTOGGL_WORKSPACE_ID=12345\n');
  });

  it('preserves the workspace id when updating the token', () => {
    writeFileSync(file, 'TOGGL_API_TOKEN=old\nTOGGL_WORKSPACE_ID=12345\n');

    setConfigVar('TOGGL_API_TOKEN', 'new');

    expect(readFileSync(file, 'utf-8')).toBe('TOGGL_API_TOKEN=new\nTOGGL_WORKSPACE_ID=12345\n');
  });
});
