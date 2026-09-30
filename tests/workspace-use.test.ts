import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api.js', () => ({
  get: vi.fn(),
}));

vi.mock('../src/config.js', () => ({
  setConfigVar: vi.fn(),
}));

import { get } from '../src/api.js';
import { setConfigVar } from '../src/config.js';
import { workspaceUse } from '../src/commands/workspace-use.js';

const mockedGet = vi.mocked(get);
const mockedSetConfigVar = vi.mocked(setConfigVar);

function mockExit() {
  return vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('exit');
  });
}

describe('workspaceUse command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exits with usage when no id provided', async () => {
    const exitSpy = mockExit();
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(workspaceUse([])).rejects.toThrow('exit');

    expect(errSpy).toHaveBeenCalledWith('Usage: tgp workspace-use <workspace_id>');
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mockedGet).not.toHaveBeenCalled();
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('exits on non-numeric id', async () => {
    const exitSpy = mockExit();
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(workspaceUse(['abc'])).rejects.toThrow('exit');

    expect(errSpy).toHaveBeenCalledWith('Invalid workspace ID: abc. Must be a number.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mockedGet).not.toHaveBeenCalled();
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('exits when workspace id is not found', async () => {
    mockedGet.mockResolvedValue([{ id: 12345, name: 'My Workspace' }]);
    const exitSpy = mockExit();
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(workspaceUse(['99999'])).rejects.toThrow('exit');

    expect(mockedGet).toHaveBeenCalledWith('/me/workspaces');
    expect(errSpy).toHaveBeenCalledWith(
      "Workspace 99999 not found. Run 'tgp workspace-list' to see available workspaces."
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mockedSetConfigVar).not.toHaveBeenCalled();
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('saves workspace id and prints confirmation', async () => {
    mockedGet.mockResolvedValue([
      { id: 12345, name: 'My Workspace' },
      { id: 67890, name: 'Client Workspace' },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await workspaceUse(['67890']);

    expect(mockedGet).toHaveBeenCalledWith('/me/workspaces');
    expect(mockedSetConfigVar).toHaveBeenCalledWith('TOGGL_WORKSPACE_ID', '67890');
    expect(logSpy).toHaveBeenCalledWith('Active workspace set to: Client Workspace (67890)');
    logSpy.mockRestore();
  });
});
