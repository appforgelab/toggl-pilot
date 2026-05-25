import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api.js', () => ({
  put: vi.fn(),
}));

vi.mock('../src/config.js', () => ({
  config: {
    getWorkspaceId: vi.fn().mockResolvedValue(123),
  },
}));

import { put } from '../src/api.js';
import { projectRestore } from '../src/commands/project-restore.js';

const mockedPut = vi.mocked(put);

describe('projectRestore command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exits with usage message when no ID provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectRestore([])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Usage: tgp project-restore <project_id>');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('exits on non-numeric project ID', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectRestore(['abc'])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Invalid project ID: "abc". Must be a number.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('restores project and prints confirmation', async () => {
    mockedPut.mockResolvedValue({ id: 456 });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectRestore(['456']);

    expect(mockedPut).toHaveBeenCalledWith('/workspaces/123/projects/456', {
      active: true,
    });
    expect(logSpy).toHaveBeenCalledWith('Project 456 restored.');
    logSpy.mockRestore();
  });

  it('handles 404 error gracefully', async () => {
    mockedPut.mockRejectedValue(new Error('Toggl API 404: Not Found'));
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await projectRestore(['999']);

    expect(logSpy).toHaveBeenCalledWith('Project 999 not found.');
    logSpy.mockRestore();
  });

  it('re-throws non-404 errors', async () => {
    mockedPut.mockRejectedValue(new Error('Toggl API 500: Server Error'));

    await expect(projectRestore(['123'])).rejects.toThrow('500');
  });
});
