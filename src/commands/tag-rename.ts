import { config } from '../config.js';
import { put } from '../api.js';

interface Tag {
  id: number;
  name: string;
}

export async function tagRename(args: string[]) {
  const tagId = args[0];
  const newName = args[1];

  if (!tagId || !newName) {
    console.error('Usage: tgp tag-rename <tag_id> "New Name"');
    process.exit(1);
  }

  if (isNaN(Number(tagId))) {
    console.error(`Invalid tag ID: "${tagId}". Must be a number.`);
    process.exit(1);
  }

  const wsId = await config.getWorkspaceId();

  try {
    const updated = await put<Tag>(`/workspaces/${wsId}/tags/${tagId}`, {
      name: newName,
    });
    console.log(`Tag ${updated.id} renamed to "${updated.name}"`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('404')) {
      console.error(`Tag ${tagId} not found.`);
      return;
    }
    throw e;
  }
}
