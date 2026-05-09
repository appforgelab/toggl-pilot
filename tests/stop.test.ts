import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/api.js', () => ({
  get: vi.fn(),
  put: vi.fn(),
}));

import { get, put } from '../src/api.js';
import { stop } from '../src/commands/stop.js';

const mockedGet = vi.mocked(get);
const mockedPut = vi.mocked(put);

const runningEntry = {
  id: 100,
  description: 'Working on feature',
  start: '2025-06-15T10:00:00Z',
  stop: null,
  duration: -1,
  project_name: null,
  workspace_id: 123,
};

describe('stop command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prints error when no running timer', async () => {
    mockedGet.mockResolvedValue(null);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await stop();

    expect(errorSpy).toHaveBeenCalledWith('No running timer.');
    expect(mockedPut).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('stops a running timer and prints formatted output', async () => {
    mockedGet.mockResolvedValue({ ...runningEntry });
    mockedPut.mockResolvedValue({
      ...runningEntry,
      stop: '2025-06-15T11:30:00Z',
      duration: 5400,
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await stop();

    expect(mockedPut).toHaveBeenCalledWith(
      '/workspaces/123/time_entries/100',
      expect.objectContaining({
        stop: expect.any(String),
        duration: expect.any(Number),
      })
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Working on feature'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('1h30m'));
    logSpy.mockRestore();
  });

  it('handles entry with no description', async () => {
    mockedGet.mockResolvedValue({ ...runningEntry, description: '' });
    mockedPut.mockResolvedValue({
      ...runningEntry,
      description: '',
      stop: '2025-06-15T11:00:00Z',
      duration: 3600,
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await stop();

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('(no description)'));
    logSpy.mockRestore();
  });

  it('handles entry with project name', async () => {
    mockedGet.mockResolvedValue({ ...runningEntry, project_name: 'DevPilot' });
    mockedPut.mockResolvedValue({
      ...runningEntry,
      project_name: 'DevPilot',
      stop: '2025-06-15T11:00:00Z',
      duration: 3600,
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await stop();

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[DevPilot]'));
    logSpy.mockRestore();
  });

  it('calculates duration correctly from start time to stop time', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T11:30:00Z'));

    mockedGet.mockResolvedValue({ ...runningEntry });
    mockedPut.mockResolvedValue({
      ...runningEntry,
      stop: '2025-06-15T11:30:00Z',
      duration: 5400,
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await stop();

    expect(mockedPut).toHaveBeenCalledWith(
      '/workspaces/123/time_entries/100',
      expect.objectContaining({ duration: 5400 })
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('1h30m'));

    logSpy.mockRestore();
    vi.useRealTimers();
  });
});
