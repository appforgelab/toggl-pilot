import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api.js', () => ({
  get: vi.fn(),
  put: vi.fn(),
}));

import { get, put } from '../src/api.js';
import { entryEdit } from '../src/commands/entry-edit.js';

const mockedGet = vi.mocked(get);
const mockedPut = vi.mocked(put);

const baseEntry = {
  id: 100,
  description: 'Original',
  start: '2025-06-15T10:00:00Z',
  stop: '2025-06-15T11:00:00Z',
  duration: 3600,
  project_id: 10,
  project_name: 'Dev-Pilot',
  tags: ['dev'],
  workspace_id: 123,
  billable: false,
};

describe('entryEdit command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('edits description only, preserves other fields', async () => {
    mockedGet.mockResolvedValue({ ...baseEntry });
    mockedPut.mockResolvedValue({
      ...baseEntry,
      description: 'Updated',
    });

    await entryEdit(['100', '-d', 'Updated']);

    expect(mockedPut).toHaveBeenCalledWith(
      '/workspaces/123/time_entries/100',
      expect.objectContaining({
        description: 'Updated',
        project_id: 10,
        tags: ['dev'],
      })
    );
  });

  it('edits project by name', async () => {
    mockedGet.mockImplementation((path: string) => {
      if (path.includes('/time_entries/')) return Promise.resolve({ ...baseEntry });
      return Promise.resolve([{ id: 20, name: 'NewProject' }]);
    });
    mockedPut.mockResolvedValue({
      ...baseEntry,
      project_id: 20,
      project_name: 'NewProject',
    });

    await entryEdit(['100', '-p', 'NewProject']);

    expect(mockedPut).toHaveBeenCalledWith(
      '/workspaces/123/time_entries/100',
      expect.objectContaining({
        project_id: 20,
      })
    );
  });

  it('edits tags', async () => {
    mockedGet.mockResolvedValue({ ...baseEntry });
    mockedPut.mockResolvedValue({
      ...baseEntry,
      tags: ['review', 'bug'],
    });

    await entryEdit(['100', '-t', 'review,bug']);

    expect(mockedPut).toHaveBeenCalledWith(
      '/workspaces/123/time_entries/100',
      expect.objectContaining({
        tags: ['review', 'bug'],
      })
    );
  });

  it('prints not found when entry does not exist', async () => {
    mockedGet.mockRejectedValue(new Error('404'));

    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await entryEdit(['999', '-d', 'Test']);

    expect(logSpy).toHaveBeenCalledWith('Entry 999 not found.');
    logSpy.mockRestore();
  });

  it('exits when project not found', async () => {
    mockedGet.mockImplementation((path: string) => {
      if (path.includes('/time_entries/')) return Promise.resolve({ ...baseEntry });
      return Promise.resolve([{ id: 10, name: 'Other' }]);
    });
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });

    await expect(entryEdit(['100', '-p', 'Missing'])).rejects.toThrow('exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('edits duration only, recomputes stop from start', async () => {
    mockedGet.mockResolvedValue({ ...baseEntry });
    mockedPut.mockResolvedValue({
      ...baseEntry,
      duration: 7200,
      stop: '2025-06-15T12:00:00Z',
    });

    await entryEdit(['100', '--dur', '2h']);

    expect(mockedPut).toHaveBeenCalledWith(
      '/workspaces/123/time_entries/100',
      expect.objectContaining({
        duration: 7200,
        stop: '2025-06-15T12:00:00.000Z',
        start: '2025-06-15T10:00:00Z',
        description: 'Original',
        project_id: 10,
        tags: ['dev'],
      })
    );
  });

  it('edits duration combined with description', async () => {
    mockedGet.mockResolvedValue({ ...baseEntry });
    mockedPut.mockResolvedValue({
      ...baseEntry,
      description: 'New desc',
      duration: 5400,
      stop: '2025-06-15T11:30:00.000Z',
    });

    await entryEdit(['100', '-d', 'New desc', '--dur', '1h30m']);

    expect(mockedPut).toHaveBeenCalledWith(
      '/workspaces/123/time_entries/100',
      expect.objectContaining({
        description: 'New desc',
        duration: 5400,
        stop: '2025-06-15T11:30:00.000Z',
      })
    );
  });

  it('throws on invalid duration format', async () => {
    mockedGet.mockResolvedValue({ ...baseEntry });

    await expect(entryEdit(['100', '--dur', 'abc'])).rejects.toThrow('Invalid duration: abc');
  });

  it('rejects --dur on running timer', async () => {
    mockedGet.mockResolvedValue({ ...baseEntry, stop: null, duration: -1 });
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(entryEdit(['100', '--dur', '1h'])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith(
      'Cannot change duration of a running timer. Stop it first with: tgp stop'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });
});
