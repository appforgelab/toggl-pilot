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
import { projectList } from '../src/commands/project-list.js';

const mockedGet = vi.mocked(get);

describe('projectList command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests active projects by default', async () => {
    mockedGet.mockResolvedValue([{ id: 456, name: 'Active Project', active: true, client_name: null }]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectList([]);

    expect(mockedGet).toHaveBeenCalledWith('/workspaces/123/projects?active=true');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Active Project'));
    logSpy.mockRestore();
  });

  it('filters archived projects from default output defensively', async () => {
    mockedGet.mockResolvedValue([
      { id: 456, name: 'Active Project', active: true, client_name: null },
      { id: 789, name: 'Archived Project', active: false, client_name: null },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectList([]);

    expect(mockedGet).toHaveBeenCalledWith('/workspaces/123/projects?active=true');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Active Project'));
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('Archived Project'));
    logSpy.mockRestore();
  });

  it('uses unfiltered endpoint with --all', async () => {
    mockedGet.mockResolvedValue([
      { id: 456, name: 'Active Project', active: true, client_name: null },
      { id: 789, name: 'Archived Project', active: false, client_name: null },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectList(['--all']);

    expect(mockedGet).toHaveBeenCalledWith('/workspaces/123/projects');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Active Project'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Archived Project'));
    logSpy.mockRestore();
  });

  it('uses unfiltered endpoint with -a', async () => {
    mockedGet.mockResolvedValue([{ id: 789, name: 'Archived Project', active: false, client_name: null }]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectList(['-a']);

    expect(mockedGet).toHaveBeenCalledWith('/workspaces/123/projects');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Archived Project'));
    logSpy.mockRestore();
  });

  it('prints a message when no projects are rendered', async () => {
    mockedGet.mockResolvedValue([{ id: 789, name: 'Archived Project', active: false, client_name: null }]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await projectList([]);

    expect(logSpy).toHaveBeenCalledWith('No projects found');
    logSpy.mockRestore();
  });
});
