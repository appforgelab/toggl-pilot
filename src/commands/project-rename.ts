import { config } from '../config.js';
import { put } from '../api.js';

interface Project {
  id: number;
  name: string;
}

export async function projectRename(args: string[]) {
  const projectId = args[0];
  const newName = args[1];

  if (!projectId || !newName) {
    console.error('Usage: tgt project-rename <project_id> "New Name"');
    process.exit(1);
  }

  if (isNaN(Number(projectId))) {
    console.error(`Invalid project ID: "${projectId}". Must be a number.`);
    process.exit(1);
  }

  const wsId = await config.getWorkspaceId();

  try {
    const updated = await put<Project>(`/workspaces/${wsId}/projects/${projectId}`, {
      name: newName,
    });
    console.log(`Project ${updated.id} renamed to "${updated.name}"`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('404')) {
      console.error(`Project ${projectId} not found.`);
      return;
    }
    throw e;
  }
}
