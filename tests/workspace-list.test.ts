import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api.js', () => ({
  get: vi.fn(),
}));

import { get } from '../src/api.js';
import { workspaceList } from '../src/commands/workspace-list.js';

const mockedGet = vi.mocked(get);

describe('workspaceList command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists workspaces', async () => {
    mockedGet.mockResolvedValue([
      { id: 12345, name: 'My Workspace', organization_id: 1 },
      { id: 67890, name: 'Client Workspace', organization_id: 2 },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await workspaceList();

    expect(mockedGet).toHaveBeenCalledWith('/me/workspaces');
    expect(logSpy).toHaveBeenCalledWith('ID           Name');
    expect(logSpy).toHaveBeenCalledWith('──────────── ────────────────────');
    expect(logSpy).toHaveBeenCalledWith('12345        My Workspace');
    expect(logSpy).toHaveBeenCalledWith('67890        Client Workspace');
    logSpy.mockRestore();
  });

  it('prints a message when no workspaces are found', async () => {
    mockedGet.mockResolvedValue([]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await workspaceList();

    expect(mockedGet).toHaveBeenCalledWith('/me/workspaces');
    expect(logSpy).toHaveBeenCalledWith('No workspaces found');
    logSpy.mockRestore();
  });
});
