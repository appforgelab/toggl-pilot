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
import { clientDelete } from '../src/commands/client-delete.js';

const mockedDel = vi.mocked(del);

describe('clientDelete command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exits with usage message when no ID provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(clientDelete([])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Usage: tgp client-delete <client_id>');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('exits on non-numeric client ID', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(clientDelete(['abc'])).rejects.toThrow('exit');

    expect(logSpy).toHaveBeenCalledWith('Invalid client ID: "abc". Must be a number.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('deletes client and prints confirmation', async () => {
    mockedDel.mockResolvedValue(undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await clientDelete(['456']);

    expect(mockedDel).toHaveBeenCalledWith('/workspaces/123/clients/456');
    expect(logSpy).toHaveBeenCalledWith('Client 456 deleted.');
    logSpy.mockRestore();
  });

  it('handles 404 error gracefully', async () => {
    mockedDel.mockRejectedValue(new Error('Toggl API 404: Not Found'));
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await clientDelete(['999']);

    expect(logSpy).toHaveBeenCalledWith('Client 999 not found.');
    logSpy.mockRestore();
  });

  it('re-throws non-404 errors', async () => {
    mockedDel.mockRejectedValue(new Error('Toggl API 500: Server Error'));

    await expect(clientDelete(['123'])).rejects.toThrow('500');
  });
});
