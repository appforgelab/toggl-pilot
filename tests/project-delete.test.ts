import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api.js', () => ({
  del: vi.fn(),
}));

vi.mock('../src/config.js', () => ({
  config: {
    getWorkspaceId: vi.fn().mockResolvedValue(123),
  },
}));

import { del } from '../src/api.js';
import { projectDelete } from '../src/commands/project-delete.js';

const mockedDel = vi.mocked(del);

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

    expect(logSpy).toHaveBeenCalledWith('Usage: tgp project-delete <project_id>');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('exits on non-numeric project ID', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectDelete(['abc'])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Invalid project ID: "abc". Must be a number.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('deletes project and prints confirmation', async () => {
    mockedDel.mockResolvedValue(undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectDelete(['456']);

    expect(mockedDel).toHaveBeenCalledWith('/workspaces/123/projects/456');
    expect(logSpy).toHaveBeenCalledWith('Project 456 deleted.');
    logSpy.mockRestore();
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
