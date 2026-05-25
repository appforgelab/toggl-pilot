import { config } from '../config.js';
import { put } from '../api.js';

interface Project {
  id: number;
}

export async function projectRestore(args: string[]) {
  const projectId = args[0];

  if (!projectId) {
    console.error('Usage: tgp project-restore <project_id>');
    process.exit(1);
  }

  if (isNaN(Number(projectId))) {
    console.error(`Invalid project ID: "${projectId}". Must be a number.`);
    process.exit(1);
  }

  const wsId = await config.getWorkspaceId();

  try {
    const updated = await put<Project>(`/workspaces/${wsId}/projects/${projectId}`, {
      active: true,
    });
    console.log(`Project ${updated.id} restored.`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('404')) {
      console.error(`Project ${projectId} not found.`);
      return;
    }
    throw e;
  }
}
