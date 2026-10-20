import { config } from '../config.js';
import { post } from '../api.js';

export const tagCreateUsage = 'tgp tag-create "Tag Name"';

interface Tag {
  id: number;
  name: string;
}

export async function tagCreate(args: string[]) {
  const name = args[0];

  if (args.length !== 1 || !name) {
    console.error(`Usage: ${tagCreateUsage}`);
    process.exit(1);
  }

  const wsId = await config.getWorkspaceId();

  try {
    const tag = await post<Tag>(`/workspaces/${wsId}/tags`, {
      name,
      workspace_id: wsId,
    });
    console.log(`Tag ${tag.id} created: "${tag.name}"`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('400')) {
      console.error(`Tag "${name}" already exists or is invalid.`);
      return;
    }
    throw e;
  }
}
