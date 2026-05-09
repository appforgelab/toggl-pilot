import { config } from '../config.js';
import { del } from '../api.js';

export async function projectDelete(args: string[]) {
  const projectId = args[0];

  if (!projectId) {
    console.error('Usage: tgp project-delete <project_id>');
    process.exit(1);
  }

  if (isNaN(Number(projectId))) {
    console.error(`Invalid project ID: "${projectId}". Must be a number.`);
    process.exit(1);
  }

  const wsId = await config.getWorkspaceId();

  try {
    await del(`/workspaces/${wsId}/projects/${projectId}`);
    console.log(`Project ${projectId} deleted.`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('404')) {
      console.error(`Project ${projectId} not found.`);
      return;
    }
    throw e;
  }
}
