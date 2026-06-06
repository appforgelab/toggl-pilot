import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api.js', () => ({
  get: vi.fn(),
  put: vi.fn(),
}));

vi.mock('../src/config.js', () => ({
  config: {
    getWorkspaceId: vi.fn().mockResolvedValue(123),
  },
}));

import { get, put } from '../src/api.js';
import { projectEdit } from '../src/commands/project-edit.js';

const mockedGet = vi.mocked(get);
const mockedPut = vi.mocked(put);

const updatedProject = {
  id: 456,
  name: 'New Project',
  client_id: 50,
  client_name: 'Acme Corp',
  color: '#0b83d9',
  is_private: false,
};

describe('projectEdit command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exits with usage message when no ID provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectEdit([])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith(
      'Usage: tgp project-edit <project> [-n "New Name"] [-c "Client Name"] [--color "#0b83d9"] [--public|--private]'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exits when project name is not found', async () => {
    mockedGet.mockResolvedValue([{ id: 456, name: 'Backend' }]);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectEdit(['abc', '-n', 'New Project'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith('Project "abc" not found.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exits on unknown flag', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectEdit(['456', '--unknown'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith(
      'Unknown flag: --unknown. Valid flags: -n/--name, -c/--client, --color, --public, --private'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exits when flag value is missing', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectEdit(['456', '--color'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith('Missing value for --color.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exits when flag value is another flag (--color --name)', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectEdit(['456', '--color', '--name', 'foo'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith('Missing value for --color.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exits when -n is followed by another flag', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectEdit(['456', '-n', '--public'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith('Missing value for -n.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exits when --client is followed by another flag', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectEdit(['456', '--client', '--color', 'red'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith('Missing value for --client.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exits when no edit flags are provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectEdit(['456'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith(
      'Nothing to edit. Provide at least one of: -n, -c, --color, --public, --private'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exits on unexpected positional argument', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectEdit(['456', 'stray', '-n', 'New Project'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith('Unexpected argument: stray.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('updates name only and does not send visibility when omitted', async () => {
    mockedPut.mockResolvedValue(updatedProject);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectEdit(['456', '-n', 'New Project']);

    expect(mockedGet).not.toHaveBeenCalled();
    expect(mockedPut).toHaveBeenCalledWith('/workspaces/123/projects/456', {
      name: 'New Project',
    });
    expect(mockedPut.mock.calls[0][1]).not.toHaveProperty('is_private');
    logSpy.mockRestore();
  });

  it('updates project by name', async () => {
    mockedGet.mockResolvedValue([{ id: 456, name: 'Backend' }]);
    mockedPut.mockResolvedValue(updatedProject);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectEdit(['Backend', '-n', 'New Project']);

    expect(mockedGet).toHaveBeenCalledWith('/workspaces/123/projects');
    expect(mockedPut).toHaveBeenCalledWith('/workspaces/123/projects/456', {
      name: 'New Project',
    });
    logSpy.mockRestore();
  });

  it('updates color only', async () => {
    mockedPut.mockResolvedValue(updatedProject);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectEdit(['456', '--color', '#0b83d9']);

    expect(mockedPut).toHaveBeenCalledWith('/workspaces/123/projects/456', {
      color: '#0b83d9',
    });
    logSpy.mockRestore();
  });

  it('updates project to public', async () => {
    mockedPut.mockResolvedValue(updatedProject);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectEdit(['456', '--public']);

    expect(mockedPut).toHaveBeenCalledWith('/workspaces/123/projects/456', {
      is_private: false,
    });
    logSpy.mockRestore();
  });

  it('updates project to private', async () => {
    mockedPut.mockResolvedValue({ ...updatedProject, is_private: true });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectEdit(['456', '--private']);

    expect(mockedPut).toHaveBeenCalledWith('/workspaces/123/projects/456', {
      is_private: true,
    });
    logSpy.mockRestore();
  });

  it('updates multiple project fields together', async () => {
    mockedPut.mockResolvedValue({ ...updatedProject, name: 'Combined', color: '#ff0000' });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectEdit(['456', '-n', 'Combined', '--color', '#ff0000', '--public']);

    expect(mockedPut).toHaveBeenCalledWith('/workspaces/123/projects/456', {
      name: 'Combined',
      color: '#ff0000',
      is_private: false,
    });
    logSpy.mockRestore();
  });

  it('rejects both visibility flags', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectEdit(['456', '--public', '--private'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith('Cannot use both --public and --private.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('updates client with numeric ID directly', async () => {
    mockedPut.mockResolvedValue(updatedProject);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectEdit(['456', '-c', '50']);

    expect(mockedGet).not.toHaveBeenCalled();
    expect(mockedPut).toHaveBeenCalledWith('/workspaces/123/projects/456', {
      client_id: 50,
    });
    logSpy.mockRestore();
  });

  it('updates client by name', async () => {
    mockedGet.mockResolvedValue([{ id: 50, name: 'Acme Corp', wid: 123 }]);
    mockedPut.mockResolvedValue(updatedProject);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectEdit(['456', '-c', 'Acme Corp']);

    expect(mockedGet).toHaveBeenCalledWith('/workspaces/123/clients');
    expect(mockedPut).toHaveBeenCalledWith('/workspaces/123/projects/456', {
      client_id: 50,
    });
    logSpy.mockRestore();
  });

  it('unsets client with empty client value', async () => {
    mockedPut.mockResolvedValue({ ...updatedProject, client_id: null, client_name: null });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectEdit(['456', '--client', '']);

    expect(mockedGet).not.toHaveBeenCalled();
    expect(mockedPut).toHaveBeenCalledWith('/workspaces/123/projects/456', {
      client_id: null,
    });
    logSpy.mockRestore();
  });

  it('exits when client name is not found', async () => {
    mockedGet.mockResolvedValue([{ id: 50, name: 'Other Corp', wid: 123 }]);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectEdit(['456', '-c', 'Missing'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith('Client "Missing" not found.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exits on ambiguous client name match', async () => {
    mockedGet.mockResolvedValue([
      { id: 50, name: 'Acme Corp', wid: 123 },
      { id: 51, name: 'acme corp', wid: 123 },
    ]);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectEdit(['456', '-c', 'Acme Corp'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith(
      'Multiple clients match "Acme Corp":\n  50  Acme Corp\n  51  acme corp'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exits on ambiguous project name match', async () => {
    mockedGet.mockResolvedValue([
      { id: 456, name: 'Backend' },
      { id: 789, name: 'backend' },
    ]);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectEdit(['Backend', '-n', 'New Project'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith(
      'Multiple projects match "Backend". Use the numeric project ID:\n  456  Backend\n  789  backend'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('handles 404 error gracefully', async () => {
    mockedPut.mockRejectedValue(new Error('Toggl API 404: Not Found'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await projectEdit(['999', '-n', 'New Project']);

    expect(errorSpy).toHaveBeenCalledWith('Project 999 not found.');
    errorSpy.mockRestore();
  });

  it('re-throws non-404 errors', async () => {
    mockedPut.mockRejectedValue(new Error('Toggl API 500: Server Error'));

    await expect(projectEdit(['456', '-n', 'New Project'])).rejects.toThrow('500');
  });

  it('prints confirmation from updated project response', async () => {
    mockedPut.mockResolvedValue(updatedProject);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectEdit(['456', '-n', 'New Project']);

    expect(logSpy).toHaveBeenCalledWith(
      'Project 456 updated: name="New Project" client="Acme Corp" color=#0b83d9 public'
    );
    logSpy.mockRestore();
  });

  it('prints None for missing client in confirmation', async () => {
    mockedPut.mockResolvedValue({ ...updatedProject, client_id: null, client_name: null, is_private: true });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectEdit(['456', '--client', '']);

    expect(logSpy).toHaveBeenCalledWith(
      'Project 456 updated: name="New Project" client="None" color=#0b83d9 private'
    );
    logSpy.mockRestore();
  });
});
