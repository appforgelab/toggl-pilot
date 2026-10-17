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
import { config } from '../src/config.js';
import { tagCreate } from '../src/commands/tag-create.js';

const mockedPost = vi.mocked(post);

describe('tagCreate command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    { args: ['Bug', 'Report'] },
    { args: ['Bug', ''] },
    { args: ['Bug', '', 'Report'] },
    { args: ['', 'Bug'] },
    { args: [''] },
  ])('rejects invalid positional args with usage: $args', async ({ args }) => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(tagCreate(args)).rejects.toThrow('exit');

      expect(errorSpy).toHaveBeenCalledWith('Usage: tgp tag-create "Tag Name"');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(config.getWorkspaceId).not.toHaveBeenCalled();
      expect(mockedPost).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
      errorSpy.mockRestore();
    }
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

  it.each(['Bug', 'Bug Report'])('creates tag and prints confirmation: %s', async (name) => {
    mockedPost.mockResolvedValue({ id: 456, name });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await tagCreate([name]);

    expect(mockedPost).toHaveBeenCalledWith('/workspaces/123/tags', {
      name,
      workspace_id: 123,
    });
    expect(logSpy).toHaveBeenCalledWith(`Tag 456 created: "${name}"`);
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
