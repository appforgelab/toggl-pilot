import { config } from '../config.js';
import { put } from '../api.js';
import { resolveProjectId } from '../projects.js';

export const projectRestoreUsage = 'tgp project-restore <project>';

interface Project {
  id: number;
}

export async function projectRestore(args: string[]) {
  const projectInput = args[0];

  if (args.length !== 1 || !projectInput) {
    console.error(`Usage: ${projectRestoreUsage}`);
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
      active: true,
    });
    console.log(`Project ${updated.id} restored.`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('404')) {
      console.error(`Project ${projectInput} not found.`);
      return;
    }
    throw e;
  }
}
