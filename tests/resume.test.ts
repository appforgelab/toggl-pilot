import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/api.js', () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

import { get, post } from '../src/api.js';
import { resume } from '../src/commands/resume.js';

const mockedGet = vi.mocked(get);
const mockedPost = vi.mocked(post);

const today = '2025-06-15T12:00:00';

interface TimeEntry {
  id: number;
  description: string;
  start: string;
  stop: string | null;
  duration: number;
  project_id: number | null;
  project_name: string | null;
  tags: string[] | null;
  workspace_id: number;
}

function toUtcIso(dateTime: string): string {
  return new Date(dateTime).toISOString();
}

function makeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: 100,
    description: 'Working on feature',
    start: toUtcIso('2025-06-15T09:00:00'),
    stop: toUtcIso('2025-06-15T10:00:00'),
    duration: 3600,
    project_id: 10,
    project_name: 'Dev-Pilot',
    tags: ['dev', 'bug'],
    workspace_id: 123,
    ...overrides,
  };
}

describe('resume command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(today));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('resumes the latest stopped entry from today', async () => {
    const stoppedEntry = makeEntry();
    mockedGet.mockResolvedValueOnce(null).mockResolvedValueOnce([stoppedEntry]);
    mockedPost.mockResolvedValue({
      ...stoppedEntry,
      id: 999,
      start: toUtcIso('2025-06-15T12:00:00'),
      stop: null,
      duration: -1,
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await resume();

    expect(mockedGet).toHaveBeenNthCalledWith(1, '/me/time_entries/current');
    expect(mockedGet).toHaveBeenNthCalledWith(
      2,
      '/me/time_entries?start_date=2025-06-14&end_date=2025-06-16'
    );
    expect(mockedPost).toHaveBeenCalledWith(
      '/workspaces/123/time_entries',
      expect.objectContaining({
        description: 'Working on feature',
        project_id: 10,
        tags: ['dev', 'bug'],
        start: new Date(today).toISOString(),
        duration: -1,
        workspace_id: 123,
        created_with: 'toggl-pilot',
      })
    );
    expect(logSpy).toHaveBeenCalledWith('Started: Working on feature [Dev-Pilot] {dev, bug} (id: 999)');
  });

  it('ignores running entries', async () => {
    const runningEntry = makeEntry({
      id: 101,
      description: 'Running task',
      stop: null,
      duration: -1,
    });
    const stoppedEntry = makeEntry({ id: 102, description: 'Stopped task' });
    mockedGet.mockResolvedValueOnce(null).mockResolvedValueOnce([runningEntry, stoppedEntry]);
    mockedPost.mockResolvedValue({ ...stoppedEntry, id: 999, stop: null, duration: -1 });

    await resume();

    expect(mockedPost).toHaveBeenCalledWith(
      '/workspaces/123/time_entries',
      expect.objectContaining({ description: 'Stopped task' })
    );
  });

  it('ignores entries stopped on the previous local day', async () => {
    mockedGet.mockResolvedValueOnce(null).mockResolvedValueOnce([
      makeEntry({
        id: 101,
        description: 'Yesterday',
        stop: toUtcIso('2025-06-14T23:59:00'),
      }),
    ]);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await resume();

    expect(errorSpy).toHaveBeenCalledWith('No stopped task found today to resume.');
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('chooses the latest entry by stop time', async () => {
    const earlyEntry = makeEntry({
      id: 101,
      description: 'Early',
      stop: toUtcIso('2025-06-15T10:00:00'),
    });
    const lateEntry = makeEntry({
      id: 102,
      description: 'Late',
      stop: toUtcIso('2025-06-15T11:00:00'),
    });
    mockedGet.mockResolvedValueOnce(null).mockResolvedValueOnce([lateEntry, earlyEntry]);
    mockedPost.mockResolvedValue({ ...lateEntry, id: 999, stop: null, duration: -1 });

    await resume();

    expect(mockedPost).toHaveBeenCalledWith(
      '/workspaces/123/time_entries',
      expect.objectContaining({ description: 'Late' })
    );
  });

  it('preserves description, project, tags, and workspace', async () => {
    const stoppedEntry = makeEntry({
      description: 'Review PR',
      project_id: 456,
      tags: ['review', 'client'],
      workspace_id: 789,
    });
    mockedGet.mockResolvedValueOnce(null).mockResolvedValueOnce([stoppedEntry]);
    mockedPost.mockResolvedValue({ ...stoppedEntry, id: 999, stop: null, duration: -1 });

    await resume();

    expect(mockedPost).toHaveBeenCalledWith(
      '/workspaces/789/time_entries',
      expect.objectContaining({
        description: 'Review PR',
        project_id: 456,
        tags: ['review', 'client'],
        workspace_id: 789,
      })
    );
  });

  it('omits null tags from the post payload', async () => {
    const stoppedEntry = makeEntry({ tags: null });
    mockedGet.mockResolvedValueOnce(null).mockResolvedValueOnce([stoppedEntry]);
    mockedPost.mockResolvedValue({ ...stoppedEntry, id: 999, stop: null, duration: -1 });

    await resume();

    expect(mockedPost).toHaveBeenCalledWith(
      '/workspaces/123/time_entries',
      expect.not.objectContaining({ tags: expect.anything() })
    );
  });

  it('omits empty tags from the post payload', async () => {
    const stoppedEntry = makeEntry({ tags: [] });
    mockedGet.mockResolvedValueOnce(null).mockResolvedValueOnce([stoppedEntry]);
    mockedPost.mockResolvedValue({ ...stoppedEntry, id: 999, stop: null, duration: -1 });

    await resume();

    expect(mockedPost).toHaveBeenCalledWith(
      '/workspaces/123/time_entries',
      expect.not.objectContaining({ tags: expect.anything() })
    );
  });

  it('prints an error and does not post when no stopped task exists today', async () => {
    mockedGet
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce([
        makeEntry({ stop: null, duration: -1 }),
        makeEntry({ stop: toUtcIso('2025-06-14T18:00:00') }),
      ]);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await resume();

    expect(errorSpy).toHaveBeenCalledWith('No stopped task found today to resume.');
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('prints an error and does not post when a timer is already running', async () => {
    mockedGet.mockResolvedValueOnce(
      makeEntry({
        description: 'Current task',
        stop: null,
        duration: -1,
      })
    );
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await resume();

    expect(errorSpy).toHaveBeenCalledWith(
      `Timer "Current task" is already running. Stop it first with 'tgp stop'.`
    );
    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('prints fallback text for an empty resumed description', async () => {
    const stoppedEntry = makeEntry({ description: '' });
    mockedGet.mockResolvedValueOnce(null).mockResolvedValueOnce([stoppedEntry]);
    mockedPost.mockResolvedValue({ ...stoppedEntry, id: 999, stop: null, duration: -1 });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await resume();

    expect(logSpy).toHaveBeenCalledWith('Started: (no description) [Dev-Pilot] {dev, bug} (id: 999)');
  });
});
