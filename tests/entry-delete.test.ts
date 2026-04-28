import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api.js', () => ({
  get: vi.fn(),
  del: vi.fn(),
}));

import { get, del } from '../src/api.js';
import { entryDelete } from '../src/commands/entry-delete.js';

const mockedGet = vi.mocked(get);
const mockedDel = vi.mocked(del);

const baseEntry = {
  id: 100,
  description: 'Test entry',
  start: '2025-06-15T10:00:00Z',
  stop: '2025-06-15T11:00:00Z',
  project_name: 'Dev-Pilot',
  workspace_id: 123,
};

describe('entryDelete command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exits with usage message when no ID provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await expect(entryDelete(['entry-delete'])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Usage: tsx src/index.ts entry-delete <entry_id>');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('prints not found when GET fails', async () => {
    mockedGet.mockRejectedValue(new Error('404'));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await entryDelete(['entry-delete', '999']);

    expect(logSpy).toHaveBeenCalledWith('Entry 999 not found.');
    logSpy.mockRestore();
  });

  it('deletes entry and prints formatted output', async () => {
    mockedGet.mockResolvedValue({ ...baseEntry });
    mockedDel.mockResolvedValue(undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await entryDelete(['entry-delete', '100']);

    expect(mockedDel).toHaveBeenCalledWith('/workspaces/123/time_entries/100');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Deleted: Test entry'));
    logSpy.mockRestore();
  });

  it('handles 400 error during delete', async () => {
    mockedGet.mockResolvedValue({ ...baseEntry });
    mockedDel.mockRejectedValue(new Error('Toggl API 400: Bad Request'));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await entryDelete(['entry-delete', '100']);

    expect(logSpy).toHaveBeenCalledWith('Entry 100 not found or already deleted.');
    logSpy.mockRestore();
  });

  it('handles 404 error during delete', async () => {
    mockedGet.mockResolvedValue({ ...baseEntry });
    mockedDel.mockRejectedValue(new Error('Toggl API 404: Not Found'));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await entryDelete(['entry-delete', '100']);

    expect(logSpy).toHaveBeenCalledWith('Entry 100 not found or already deleted.');
    logSpy.mockRestore();
  });

  it('re-throws non-400/404 errors during delete', async () => {
    mockedGet.mockResolvedValue({ ...baseEntry });
    mockedDel.mockRejectedValue(new Error('Toggl API 500: Server Error'));

    await expect(entryDelete(['entry-delete', '100'])).rejects.toThrow('500');
  });

  it('shows fallback for entry without description or project', async () => {
    mockedGet.mockResolvedValue({
      ...baseEntry,
      description: '',
      project_name: null,
    });
    mockedDel.mockResolvedValue(undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await entryDelete(['entry-delete', '100']);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('(no description)'));
    expect(logSpy).toHaveBeenCalledWith(expect.not.stringContaining('['));
    logSpy.mockRestore();
  });
});
