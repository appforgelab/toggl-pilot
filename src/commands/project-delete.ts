import { config } from '../config.js';
import { del } from '../api.js';
import { resolveProjectId } from '../projects.js';

export async function projectDelete(args: string[]) {
  const projectInput = args[0];

  if (!projectInput) {
    console.error('Usage: tgp project-delete <project>');
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
    await del(`/workspaces/${wsId}/projects/${projectId}`);
    console.log(`Project ${projectId} deleted.`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('404')) {
      console.error(`Project ${projectInput} not found.`);
      return;
    }
    throw e;
  }
}
