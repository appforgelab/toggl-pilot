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
import { clientRename } from '../src/commands/client-rename.js';

const mockedPut = vi.mocked(put);

describe('clientRename command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exits with usage message when no args provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(clientRename([])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Usage: tgp client-rename <client_id> "New Name"');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('exits with usage message when only ID provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(clientRename(['123'])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Usage: tgp client-rename <client_id> "New Name"');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('exits on non-numeric client ID', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(clientRename(['abc', 'New'])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Invalid client ID: "abc". Must be a number.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('renames client and prints confirmation', async () => {
    mockedPut.mockResolvedValue({ id: 456, name: 'Acme Corp' });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await clientRename(['456', 'Acme Corp']);

    expect(mockedPut).toHaveBeenCalledWith('/workspaces/123/clients/456', {
      name: 'Acme Corp',
    });
    expect(logSpy).toHaveBeenCalledWith('Client 456 renamed to "Acme Corp"');
    logSpy.mockRestore();
  });

  it('handles 404 error gracefully', async () => {
    mockedPut.mockRejectedValue(new Error('Toggl API 404: Not Found'));
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await clientRename(['999', 'New']);

    expect(logSpy).toHaveBeenCalledWith('Client 999 not found.');
    logSpy.mockRestore();
  });

  it('re-throws non-404 errors', async () => {
    mockedPut.mockRejectedValue(new Error('Toggl API 500: Server Error'));

    await expect(clientRename(['123', 'New'])).rejects.toThrow('500');
  });
});
