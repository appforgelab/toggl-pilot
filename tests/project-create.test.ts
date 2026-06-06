import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api.js', () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('../src/config.js', () => ({
  config: {
    getWorkspaceId: vi.fn().mockResolvedValue(123),
  },
}));

import { get, post } from '../src/api.js';
import { projectCreate } from '../src/commands/project-create.js';

const mockedGet = vi.mocked(get);
const mockedPost = vi.mocked(post);

describe('projectCreate command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exits with usage message when no name provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectCreate([])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith(
      'Usage: tgp project-create "Project Name" [-c "Client Name"] [--color "#0b83d9"] [--public]'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('creates project with just a name', async () => {
    mockedPost.mockResolvedValue({ id: 100, name: 'New Project', client_id: null, client_name: null });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectCreate(['New Project']);

    expect(mockedPost).toHaveBeenCalledWith('/workspaces/123/projects', {
      name: 'New Project',
      workspace_id: 123,
      active: true,
      is_private: true,
    });
    expect(logSpy).toHaveBeenCalledWith('Project 100 created: "New Project"');
    logSpy.mockRestore();
  });

  it('creates project with --public flag', async () => {
    mockedPost.mockResolvedValue({ id: 101, name: 'Open Project', client_id: null, client_name: null });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectCreate(['Open Project', '--public']);

    expect(mockedPost).toHaveBeenCalledWith('/workspaces/123/projects', {
      name: 'Open Project',
      workspace_id: 123,
      active: true,
      is_private: false,
    });
    logSpy.mockRestore();
  });

  it('creates project with --color', async () => {
    mockedPost.mockResolvedValue({ id: 102, name: 'Colored', client_id: null, client_name: null });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectCreate(['Colored', '--color', '#0b83d9']);

    expect(mockedPost).toHaveBeenCalledWith('/workspaces/123/projects', {
      name: 'Colored',
      workspace_id: 123,
      active: true,
      is_private: true,
      color: '#0b83d9',
    });
    logSpy.mockRestore();
  });

  it('creates project with client name (resolved to ID)', async () => {
    mockedGet.mockResolvedValue([{ id: 50, name: 'Acme Corp', wid: 123 }]);
    mockedPost.mockResolvedValue({ id: 103, name: 'Big Project', client_id: 50, client_name: 'Acme Corp' });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectCreate(['Big Project', '-c', 'Acme Corp']);

    expect(mockedGet).toHaveBeenCalledWith('/workspaces/123/clients');
    expect(mockedPost).toHaveBeenCalledWith('/workspaces/123/projects', {
      name: 'Big Project',
      workspace_id: 123,
      active: true,
      is_private: true,
      client_id: 50,
    });
    expect(logSpy).toHaveBeenCalledWith('Project 103 created: "Big Project" [Client: Acme Corp]');
    logSpy.mockRestore();
  });

  it('creates project with numeric client ID directly', async () => {
    mockedPost.mockResolvedValue({ id: 104, name: 'Direct ID', client_id: 99, client_name: null });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectCreate(['Direct ID', '-c', '99']);

    expect(mockedGet).not.toHaveBeenCalled();
    expect(mockedPost).toHaveBeenCalledWith('/workspaces/123/projects', {
      name: 'Direct ID',
      workspace_id: 123,
      active: true,
      is_private: true,
      client_id: 99,
    });
    logSpy.mockRestore();
  });

  it('treats hex-like client input as a name, not a number', async () => {
    mockedGet.mockResolvedValue([{ id: 16, name: '0x10', wid: 123 }]);
    mockedPost.mockResolvedValue({ id: 106, name: 'Test', client_id: 16, client_name: '0x10' });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectCreate(['Test', '-c', '0x10']);

    expect(mockedGet).toHaveBeenCalledWith('/workspaces/123/clients');
    logSpy.mockRestore();
  });

  it('creates project with all options combined', async () => {
    mockedGet.mockResolvedValue([{ id: 50, name: 'Acme Corp', wid: 123 }]);
    mockedPost.mockResolvedValue({ id: 105, name: 'Full', client_id: 50, client_name: 'Acme Corp' });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectCreate(['Full', '-c', 'Acme Corp', '--color', '#ff0000', '--public']);

    expect(mockedPost).toHaveBeenCalledWith('/workspaces/123/projects', {
      name: 'Full',
      workspace_id: 123,
      active: true,
      is_private: false,
      client_id: 50,
      color: '#ff0000',
    });
    logSpy.mockRestore();
  });

  it('exits when client name not found', async () => {
    mockedGet.mockResolvedValue([{ id: 50, name: 'Other Corp', wid: 123 }]);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectCreate(['Project', '-c', 'Missing'])).rejects.toThrow('exit');

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

    await expect(projectCreate(['Project', '-c', 'Acme Corp'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith(
      'Multiple clients match "Acme Corp":\n  50  Acme Corp\n  51  acme corp'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('handles 400 error (duplicate/invalid)', async () => {
    mockedPost.mockRejectedValue(new Error('Toggl API 400: Bad Request'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await projectCreate(['Duplicate']);

    expect(errorSpy).toHaveBeenCalledWith(
      'Project "Duplicate" could not be created. Check for duplicates or invalid parameters.'
    );
    errorSpy.mockRestore();
  });

  it('re-throws non-400 errors', async () => {
    mockedPost.mockRejectedValue(new Error('Toggl API 500: Server Error'));

    await expect(projectCreate(['Project'])).rejects.toThrow('500');
  });

  it('exits on unknown flag', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectCreate(['Project', '--unknown'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith(
      'Unknown flag: --unknown. Valid flags: -c/--client, --color, --public'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exits when --color has no value', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectCreate(['Project', '--color'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith('Missing value for --color.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exits when -c has no value', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectCreate(['Project', '-c'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith('Missing value for -c.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exits when --color is followed by another flag', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectCreate(['Project', '--color', '--public'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith('Missing value for --color.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exits when -c is followed by another flag', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectCreate(['Project', '-c', '--color', 'red'])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith('Missing value for -c.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exits when --color value is empty', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectCreate(['Project', '--color', ''])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith('Missing value for --color.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('exits when -c value is empty', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(projectCreate(['Project', '-c', ''])).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith('Missing value for -c.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
