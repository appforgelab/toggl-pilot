import { config } from '../config.js';
import { post } from '../api.js';

interface Tag {
  id: number;
  name: string;
}

export async function tagCreate(args: string[]) {
  const name = args[0];

  if (!name) {
    console.error('Usage: tgp tag-create "Tag Name"');
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
