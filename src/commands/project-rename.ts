import { config } from '../config.js';
import { put } from '../api.js';
import { resolveProjectId } from '../projects.js';

interface Project {
  id: number;
  name: string;
}

export async function projectRename(args: string[]) {
  const projectInput = args[0];
  const newName = args[1];

  if (!projectInput || !newName) {
    console.error('Usage: tgp project-rename <project> "New Name"');
    process.exit(1);
  }

  const wsId = await config.getWorkspaceId();
  let projectId: number;

  try {
    projectId = await resolveProjectId(wsId, projectInput);
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }

  try {
    const updated = await put<Project>(`/workspaces/${wsId}/projects/${projectId}`, {
      name: newName,
    });
    console.log(`Project ${updated.id} renamed to "${updated.name}"`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('404')) {
      console.error(`Project ${projectInput} not found.`);
      return;
    }
    throw e;
  }
}
