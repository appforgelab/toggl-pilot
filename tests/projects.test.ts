import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api.js', () => ({
  get: vi.fn(),
}));

import { get } from '../src/api.js';
import { resolveProjectId } from '../src/projects.js';

const mockedGet = vi.mocked(get);

describe('resolveProjectId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns numeric project input without fetching projects', async () => {
    await expect(resolveProjectId(123, '456')).resolves.toBe(456);

    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('resolves an exact project name case-insensitively', async () => {
    mockedGet.mockResolvedValue([
      { id: 456, name: 'Backend' },
      { id: 789, name: 'Frontend' },
    ]);

    await expect(resolveProjectId(123, 'backend')).resolves.toBe(456);

    expect(mockedGet).toHaveBeenCalledWith('/workspaces/123/projects');
  });

  it('fails when the project name is not found', async () => {
    mockedGet.mockResolvedValue([{ id: 456, name: 'Backend' }]);

    await expect(resolveProjectId(123, 'Missing')).rejects.toThrow('Project "Missing" not found.');
  });

  it('fails when multiple projects match case-insensitively', async () => {
    mockedGet.mockResolvedValue([
      { id: 456, name: 'Backend' },
      { id: 789, name: 'backend' },
    ]);

    await expect(resolveProjectId(123, 'Backend')).rejects.toThrow(
      'Multiple projects match "Backend". Use the numeric project ID:\n  456  Backend\n  789  backend'
    );
  });
});
