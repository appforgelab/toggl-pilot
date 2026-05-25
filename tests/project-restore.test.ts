import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api.js', () => ({
  get: vi.fn(),
  put: vi.fn(),
}));

vi.mock('../src/config.js', () => ({
  config: {
    getWorkspaceId: vi.fn().mockResolvedValue(123),
  },
}));

import { get, put } from '../src/api.js';
import { projectRestore } from '../src/commands/project-restore.js';

const mockedGet = vi.mocked(get);
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

    expect(logSpy).toHaveBeenCalledWith('Usage: tgp project-restore <project>');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('exits when project name is not found', async () => {
    mockedGet.mockResolvedValue([{ id: 456, name: 'Backend' }]);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectRestore(['abc'])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Project "abc" not found.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('restores project and prints confirmation', async () => {
    mockedPut.mockResolvedValue({ id: 456 });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectRestore(['456']);

    expect(mockedGet).not.toHaveBeenCalled();
    expect(mockedPut).toHaveBeenCalledWith('/workspaces/123/projects/456', {
      active: true,
    });
    expect(logSpy).toHaveBeenCalledWith('Project 456 restored.');
    logSpy.mockRestore();
  });

  it('restores project by name', async () => {
    mockedGet.mockResolvedValue([{ id: 456, name: 'Backend' }]);
    mockedPut.mockResolvedValue({ id: 456 });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectRestore(['Backend']);

    expect(mockedGet).toHaveBeenCalledWith('/workspaces/123/projects');
    expect(mockedPut).toHaveBeenCalledWith('/workspaces/123/projects/456', {
      active: true,
    });
    expect(logSpy).toHaveBeenCalledWith('Project 456 restored.');
    logSpy.mockRestore();
  });

  it('exits on ambiguous project name', async () => {
    mockedGet.mockResolvedValue([
      { id: 456, name: 'Backend' },
      { id: 789, name: 'backend' },
    ]);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectRestore(['Backend'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith(
      'Multiple projects match "Backend". Use the numeric project ID:\n  456  Backend\n  789  backend'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
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
