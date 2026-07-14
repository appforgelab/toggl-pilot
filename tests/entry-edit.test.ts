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
      })
    );
    expect(mockedPut.mock.calls[0][1]).not.toHaveProperty('tags');
    expect(mockedPut.mock.calls[0][1]).not.toHaveProperty('tag_action');
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

  it('replaces tags', async () => {
    mockedGet.mockResolvedValue({ ...baseEntry, tags: ['dev', 'sysadm'] });
    mockedPut.mockResolvedValue({
      ...baseEntry,
      tags: ['dev', 'dart'],
    });

    await entryEdit(['100', '-t', 'dev,dart']);

    expect(mockedPut).toHaveBeenCalledWith(
      '/workspaces/123/time_entries/100',
      expect.objectContaining({
        tags: ['dev', 'dart'],
      })
    );
    expect(mockedPut.mock.calls[0][1]).not.toHaveProperty('tag_action');
  });

  it('does not call update when requested tags already match', async () => {
    mockedGet.mockResolvedValue({ ...baseEntry, tags: ['dev', 'dart'] });

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await entryEdit(['100', '-t', 'dev,dart']);

    expect(mockedPut).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('No changes.');
    logSpy.mockRestore();
  });

  it('clears tags', async () => {
    mockedGet.mockResolvedValue({ ...baseEntry, tags: ['dev'] });
    mockedPut.mockResolvedValue({
      ...baseEntry,
      tags: null,
    });

    await entryEdit(['100', '-t', '']);

    expect(mockedPut).toHaveBeenCalledWith(
      '/workspaces/123/time_entries/100',
      expect.objectContaining({
        tags: [],
      })
    );
    expect(mockedPut.mock.calls[0][1]).not.toHaveProperty('tag_action');
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
      })
    );
    expect(mockedPut.mock.calls[0][1]).not.toHaveProperty('tags');
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

  it('amends start time of a running timer, keeps it running', async () => {
    mockedGet.mockResolvedValue({ ...baseEntry, stop: null, duration: -1 });
    mockedPut.mockResolvedValue({ ...baseEntry, stop: null, duration: -1 });

    await entryEdit(['100', '--start', '2025-06-15T09:00:00Z']);

    const expectedStartEpoch = Math.floor(new Date('2025-06-15T09:00:00Z').getTime() / 1000);
    expect(mockedPut).toHaveBeenCalledWith(
      '/workspaces/123/time_entries/100',
      expect.objectContaining({
        start: '2025-06-15T09:00:00.000Z',
        stop: null,
        // Toggl's negative-duration "running" convention, relative to the new start.
        duration: -expectedStartEpoch,
      })
    );
  });

  it('amends start time of a stopped entry, recomputes duration keeping stop fixed', async () => {
    mockedGet.mockResolvedValue({ ...baseEntry });
    mockedPut.mockResolvedValue({ ...baseEntry, duration: 7200 });

    await entryEdit(['100', '--start', '2025-06-15T09:00:00Z']);

    expect(mockedPut).toHaveBeenCalledWith(
      '/workspaces/123/time_entries/100',
      expect.objectContaining({
        start: '2025-06-15T09:00:00.000Z',
        stop: '2025-06-15T11:00:00Z',
        duration: 7200,
      })
    );
  });

  it('combines --start and --dur on a stopped entry: stop = start + dur', async () => {
    mockedGet.mockResolvedValue({ ...baseEntry });
    mockedPut.mockResolvedValue({ ...baseEntry, duration: 10800, stop: '2025-06-15T12:00:00Z' });

    await entryEdit(['100', '--start', '2025-06-15T09:00:00Z', '--dur', '3h']);

    expect(mockedPut).toHaveBeenCalledWith(
      '/workspaces/123/time_entries/100',
      expect.objectContaining({
        start: '2025-06-15T09:00:00.000Z',
        stop: '2025-06-15T12:00:00.000Z',
        duration: 10800,
      })
    );
  });

  it('rejects --start after the stop time on a stopped entry', async () => {
    mockedGet.mockResolvedValue({ ...baseEntry });
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(entryEdit(['100', '--start', '2025-06-15T12:00:00Z'])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Start time must be before the stop time.');
    expect(mockedPut).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('amends start time using bare HH:MM (today, local tz)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15, 12, 0, 0));
    mockedGet.mockResolvedValue({ ...baseEntry, stop: null, duration: -1 });
    mockedPut.mockResolvedValue({ ...baseEntry, stop: null, duration: -1 });

    await entryEdit(['100', '--start', '09:00']);

    const expectedISO = new Date(2025, 5, 15, 9, 0, 0).toISOString();
    const expectedDuration = -Math.floor(new Date(expectedISO).getTime() / 1000);
    expect(mockedPut).toHaveBeenCalledWith(
      '/workspaces/123/time_entries/100',
      expect.objectContaining({
        start: expectedISO,
        stop: null,
        duration: expectedDuration,
      })
    );
    vi.useRealTimers();
  });

  it('rejects future start times', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15, 12, 0, 0));
    mockedGet.mockResolvedValue({ ...baseEntry, stop: null, duration: -1 });

    await expect(entryEdit(['100', '--start', '13:00'])).rejects.toThrow('cannot be in the future');

    expect(mockedPut).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
