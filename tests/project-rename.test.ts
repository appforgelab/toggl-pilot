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
import { projectRename } from '../src/commands/project-rename.js';

const mockedPut = vi.mocked(put);

describe('projectRename command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exits with usage message when no args provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectRename([])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Usage: tgp project-rename <project_id> "New Name"');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('exits with usage message when only project ID provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectRename(['123'])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Usage: tgp project-rename <project_id> "New Name"');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('exits with error when project ID is not numeric', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectRename(['abc', 'New Name'])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Invalid project ID: "abc". Must be a number.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('renames project and prints confirmation', async () => {
    mockedPut.mockResolvedValue({ id: 456, name: 'New Name' });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectRename(['456', 'New Name']);

    expect(mockedPut).toHaveBeenCalledWith('/workspaces/123/projects/456', {
      name: 'New Name',
    });
    expect(logSpy).toHaveBeenCalledWith('Project 456 renamed to "New Name"');
    logSpy.mockRestore();
  });

  it('handles 404 error gracefully', async () => {
    mockedPut.mockRejectedValue(new Error('Toggl API 404: Not Found'));
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await projectRename(['999', 'New Name']);

    expect(logSpy).toHaveBeenCalledWith('Project 999 not found.');
    logSpy.mockRestore();
  });

  it('re-throws non-404 errors', async () => {
    mockedPut.mockRejectedValue(new Error('Toggl API 500: Server Error'));

    await expect(projectRename(['123', 'New Name'])).rejects.toThrow('500');
  });
});
