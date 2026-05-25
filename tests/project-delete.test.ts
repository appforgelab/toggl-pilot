import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api.js', () => ({
  get: vi.fn(),
  del: vi.fn(),
}));

vi.mock('../src/config.js', () => ({
  config: {
    getWorkspaceId: vi.fn().mockResolvedValue(123),
  },
}));

import { del, get } from '../src/api.js';
import { projectDelete } from '../src/commands/project-delete.js';

const mockedDel = vi.mocked(del);
const mockedGet = vi.mocked(get);

describe('projectDelete command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exits with usage message when no ID provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectDelete([])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Usage: tgp project-delete <project>');
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

    await expect(projectDelete(['abc'])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Project "abc" not found.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('deletes project and prints confirmation', async () => {
    mockedDel.mockResolvedValue(undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectDelete(['456']);

    expect(mockedGet).not.toHaveBeenCalled();
    expect(mockedDel).toHaveBeenCalledWith('/workspaces/123/projects/456');
    expect(logSpy).toHaveBeenCalledWith('Project 456 deleted.');
    logSpy.mockRestore();
  });

  it('deletes project by name', async () => {
    mockedGet.mockResolvedValue([{ id: 456, name: 'Backend' }]);
    mockedDel.mockResolvedValue(undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectDelete(['Backend']);

    expect(mockedGet).toHaveBeenCalledWith('/workspaces/123/projects');
    expect(mockedDel).toHaveBeenCalledWith('/workspaces/123/projects/456');
    expect(logSpy).toHaveBeenCalledWith('Project 456 deleted.');
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

    await expect(projectDelete(['Backend'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith(
      'Multiple projects match "Backend". Use the numeric project ID:\n  456  Backend\n  789  backend'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('handles 404 error gracefully', async () => {
    mockedDel.mockRejectedValue(new Error('Toggl API 404: Not Found'));
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await projectDelete(['999']);

    expect(logSpy).toHaveBeenCalledWith('Project 999 not found.');
    logSpy.mockRestore();
  });

  it('re-throws non-404 errors', async () => {
    mockedDel.mockRejectedValue(new Error('Toggl API 500: Server Error'));

    await expect(projectDelete(['123'])).rejects.toThrow('500');
  });
});
