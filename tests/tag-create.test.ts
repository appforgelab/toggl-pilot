import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api.js', () => ({
  post: vi.fn(),
}));

vi.mock('../src/config.js', () => ({
  config: {
    getWorkspaceId: vi.fn().mockResolvedValue(123),
  },
}));

import { post } from '../src/api.js';
import { tagCreate } from '../src/commands/tag-create.js';

const mockedPost = vi.mocked(post);

describe('tagCreate command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exits with usage message when no name provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(tagCreate([])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Usage: tgp tag-create "Tag Name"');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('creates tag and prints confirmation', async () => {
    mockedPost.mockResolvedValue({ id: 456, name: 'Bug' });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await tagCreate(['Bug']);

    expect(mockedPost).toHaveBeenCalledWith('/workspaces/123/tags', {
      name: 'Bug',
      workspace_id: 123,
    });
    expect(logSpy).toHaveBeenCalledWith('Tag 456 created: "Bug"');
    logSpy.mockRestore();
  });

  it('handles 400 error (duplicate/invalid name)', async () => {
    mockedPost.mockRejectedValue(new Error('Toggl API 400: Bad Request'));
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await tagCreate(['Bug']);

    expect(logSpy).toHaveBeenCalledWith('Tag "Bug" already exists or is invalid.');
    logSpy.mockRestore();
  });

  it('re-throws non-400 errors', async () => {
    mockedPost.mockRejectedValue(new Error('Toggl API 500: Server Error'));

    await expect(tagCreate(['Bug'])).rejects.toThrow('500');
  });
});
