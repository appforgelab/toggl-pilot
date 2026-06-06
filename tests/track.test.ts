import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api.js', () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('../src/config.js', () => ({
  config: {
    getWorkspaceId: vi.fn().mockResolvedValue(123),
  },
}));

import { get, post } from '../src/api.js';
import { track } from '../src/commands/track.js';

const mockedGet = vi.mocked(get);
const mockedPost = vi.mocked(post);

describe('track command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts a running timer without project', async () => {
    mockedPost.mockResolvedValue({
      id: 999,
      description: 'Test',
      start: '2025-06-15T10:00:00Z',
      duration: -1,
      project_id: null,
      project_name: null,
      tags: null,
      workspace_id: 123,
    });

    await track(['Test']);

    expect(mockedPost).toHaveBeenCalledWith(
      '/workspaces/123/time_entries',
      expect.objectContaining({
        description: 'Test',
        duration: -1,
        workspace_id: 123,
        created_with: 'toggl-pilot',
      })
    );
  });

  it('starts a timer with project (exact match)', async () => {
    mockedGet.mockResolvedValue([
      { id: 10, name: 'Dev-Pilot' },
      { id: 20, name: 'Other' },
    ]);
    mockedPost.mockResolvedValue({
      id: 1000,
      description: 'Fix bug',
      start: '2025-06-15T10:00:00Z',
      duration: -1,
      project_id: 10,
      project_name: 'Dev-Pilot',
      tags: null,
      workspace_id: 123,
    });

    await track(['Fix bug', '-p', 'dev-pilot']);

    expect(mockedPost).toHaveBeenCalledWith(
      '/workspaces/123/time_entries',
      expect.objectContaining({
        project_id: 10,
      })
    );
  });

  it('exits when project not found', async () => {
    mockedGet.mockResolvedValue([{ id: 10, name: 'Other' }]);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });

    await expect(track(['Work', '-p', 'Missing'])).rejects.toThrow('exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('exits on ambiguous project match', async () => {
    mockedGet.mockResolvedValue([
      { id: 10, name: 'Project' },
      { id: 20, name: 'project' },
    ]);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });

    await expect(track(['Work', '-p', 'project'])).rejects.toThrow('exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('creates a timed entry with --at and --dur', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00'));

    mockedPost.mockResolvedValue({
      id: 2000,
      description: 'Standup',
      start: expect.any(String),
      duration: 1800,
      project_id: null,
      project_name: null,
      tags: null,
      workspace_id: 123,
    });

    await track(['Standup', '--at', '09:00', '--dur', '30m']);

    expect(mockedPost).toHaveBeenCalledWith(
      '/workspaces/123/time_entries',
      expect.objectContaining({
        duration: 30 * 60,
        description: 'Standup',
      })
    );

    vi.useRealTimers();
  });

  it('exits when only --at is provided without --dur', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });

    await expect(track(['Work', '--at', '09:00'])).rejects.toThrow('exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('exits when --date is provided without --at and --dur', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });

    await expect(track(['Work', '--date', 'yesterday'])).rejects.toThrow('exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('exits on invalid date value', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });

    await expect(track(['Work', '--at', '09:00', '--dur', '30m', '--date', 'foo'])).rejects.toThrow('exit');

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('creates a timed entry with --date for a specific date', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00'));

    mockedPost.mockResolvedValue({
      id: 3000,
      description: 'Standup',
      start: expect.any(String),
      duration: 1800,
      project_id: null,
      project_name: null,
      tags: null,
      workspace_id: 123,
    });

    await track(['Standup', '--at', '09:00', '--dur', '30m', '--date', '2025-06-10']);

    expect(mockedPost).toHaveBeenCalledWith(
      '/workspaces/123/time_entries',
      expect.objectContaining({
        start: new Date('2025-06-10T09:00:00').toISOString(),
        duration: 30 * 60,
        description: 'Standup',
      })
    );

    vi.useRealTimers();
  });

  it('creates a timed entry with --date yesterday', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00'));

    mockedPost.mockResolvedValue({
      id: 3001,
      description: 'Review',
      start: expect.any(String),
      duration: 3600,
      project_id: null,
      project_name: null,
      tags: null,
      workspace_id: 123,
    });

    await track(['Review', '--at', '14:00', '--dur', '1h', '-d', 'yesterday']);

    expect(mockedPost).toHaveBeenCalledWith(
      '/workspaces/123/time_entries',
      expect.objectContaining({
        start: new Date('2025-06-14T14:00:00').toISOString(),
        duration: 3600,
        description: 'Review',
      })
    );

    vi.useRealTimers();
  });
});
