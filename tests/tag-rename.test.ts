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
import { tagRename } from '../src/commands/tag-rename.js';

const mockedPut = vi.mocked(put);

describe('tagRename command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exits with usage message when no args provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(tagRename([])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Usage: tgp tag-rename <tag_id> "New Name"');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('exits with usage message when only ID provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(tagRename(['123'])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Usage: tgp tag-rename <tag_id> "New Name"');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('exits on non-numeric tag ID', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(tagRename(['abc', 'New'])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Invalid tag ID: "abc". Must be a number.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('renames tag and prints confirmation', async () => {
    mockedPut.mockResolvedValue({ id: 456, name: 'Feature' });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await tagRename(['456', 'Feature']);

    expect(mockedPut).toHaveBeenCalledWith('/workspaces/123/tags/456', {
      name: 'Feature',
    });
    expect(logSpy).toHaveBeenCalledWith('Tag 456 renamed to "Feature"');
    logSpy.mockRestore();
  });

  it('handles 404 error gracefully', async () => {
    mockedPut.mockRejectedValue(new Error('Toggl API 404: Not Found'));
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await tagRename(['999', 'New']);

    expect(logSpy).toHaveBeenCalledWith('Tag 999 not found.');
    logSpy.mockRestore();
  });

  it('re-throws non-404 errors', async () => {
    mockedPut.mockRejectedValue(new Error('Toggl API 500: Server Error'));

    await expect(tagRename(['123', 'New'])).rejects.toThrow('500');
  });
});
