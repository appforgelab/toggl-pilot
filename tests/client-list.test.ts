import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api.js', () => ({
  get: vi.fn(),
}));

vi.mock('../src/config.js', () => ({
  config: {
    getWorkspaceId: vi.fn().mockResolvedValue(123),
  },
}));

import { get } from '../src/api.js';
import { clientList } from '../src/commands/client-list.js';

const mockedGet = vi.mocked(get);

describe('clientList command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests active clients by default', async () => {
    mockedGet.mockResolvedValue([
      { id: 456, name: 'Acme Corp', notes: 'Main client', wid: 123, archived: false, at: '' },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await clientList([]);

    expect(mockedGet).toHaveBeenCalledWith('/workspaces/123/clients?status=active');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Acme Corp'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Main client'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('active'));
    logSpy.mockRestore();
  });

  it('requests archived clients with --status archived', async () => {
    mockedGet.mockResolvedValue([
      { id: 789, name: 'Old Client', notes: 'Done', wid: 123, archived: true, at: '' },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await clientList(['--status', 'archived']);

    expect(mockedGet).toHaveBeenCalledWith('/workspaces/123/clients?status=archived');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Old Client'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Done'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('archived'));
    logSpy.mockRestore();
  });

  it('filters active clients from archived output defensively', async () => {
    mockedGet.mockResolvedValue([
      { id: 456, name: 'Acme Corp', notes: 'Main client', wid: 123, archived: false, at: '' },
      { id: 789, name: 'Old Client', notes: 'Done', wid: 123, archived: true, at: '' },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await clientList(['--status', 'archived']);

    expect(mockedGet).toHaveBeenCalledWith('/workspaces/123/clients?status=archived');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Old Client'));
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('Acme Corp'));
    logSpy.mockRestore();
  });

  it('includes encoded status and name query params', async () => {
    mockedGet.mockResolvedValue([
      { id: 456, name: 'Acme & Sons', notes: 'Main client', wid: 123, archived: false, at: '' },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await clientList(['--status', 'both', '--name', 'Acme & Sons']);

    expect(mockedGet).toHaveBeenCalledWith('/workspaces/123/clients?status=both&name=Acme+%26+Sons');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Acme & Sons'));
    logSpy.mockRestore();
  });

  it('prints a dash for blank notes', async () => {
    mockedGet.mockResolvedValue([
      { id: 456, name: 'Acme Corp', notes: '  ', wid: 123, archived: false, at: '' },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await clientList([]);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('—'));
    logSpy.mockRestore();
  });

  it('prints a dash for null or missing notes', async () => {
    mockedGet.mockResolvedValue([
      { id: 456, name: 'Null Notes', notes: null, wid: 123, archived: false, at: '' },
      { id: 457, name: 'Missing Notes', wid: 123, archived: false, at: '' },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await clientList([]);

    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/Null Notes\s+—\s+active/));
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/Missing Notes\s+—\s+active/));
    logSpy.mockRestore();
  });

  it('prints a message when no clients are rendered', async () => {
    mockedGet.mockResolvedValue([
      { id: 789, name: 'Old Client', notes: null, wid: 123, archived: true, at: '' },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await clientList([]);

    expect(logSpy).toHaveBeenCalledWith('No clients found');
    logSpy.mockRestore();
  });
});
