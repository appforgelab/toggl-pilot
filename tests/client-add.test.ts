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
import { clientAdd } from '../src/commands/client-add.js';

const mockedPost = vi.mocked(post);

describe('clientAdd command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exits with usage message when no name provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(clientAdd([])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Usage: tgp client-add "Client Name" [--notes "Some notes"]');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('exits on unknown flag', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(clientAdd(['Acme', '--bogus'])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Unknown flag: --bogus. Valid flag: --notes');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('creates client and prints confirmation', async () => {
    mockedPost.mockResolvedValue({ id: 123456789, name: 'Acme Corp' });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await clientAdd(['Acme Corp']);

    expect(mockedPost).toHaveBeenCalledWith('/workspaces/123/clients', {
      name: 'Acme Corp',
    });
    expect(logSpy).toHaveBeenCalledWith('Created: Acme Corp (id: 123456789)');
    logSpy.mockRestore();
  });

  it('passes --notes to body when provided', async () => {
    mockedPost.mockResolvedValue({ id: 1, name: 'Acme Corp' });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await clientAdd(['Acme Corp', '--notes', 'Some notes']);

    expect(mockedPost).toHaveBeenCalledWith('/workspaces/123/clients', {
      name: 'Acme Corp',
      notes: 'Some notes',
    });
    logSpy.mockRestore();
  });

  it('handles 400 error (duplicate/invalid name)', async () => {
    mockedPost.mockRejectedValue(new Error('Toggl API 400: Bad Request'));
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await clientAdd(['Acme Corp']);

    expect(logSpy).toHaveBeenCalledWith(
      'Client "Acme Corp" could not be created. Check for duplicates or invalid parameters.'
    );
    logSpy.mockRestore();
  });

  it('re-throws non-400 errors', async () => {
    mockedPost.mockRejectedValue(new Error('Toggl API 500: Server Error'));

    await expect(clientAdd(['Acme Corp'])).rejects.toThrow('500');
  });
});
