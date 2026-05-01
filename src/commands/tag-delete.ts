import { config } from '../config.js';
import { del } from '../api.js';

export async function tagDelete(args: string[]) {
  const tagId = args[0];

  if (!tagId) {
    console.error('Usage: tgp tag-delete <tag_id>');
    process.exit(1);
  }

  if (isNaN(Number(tagId))) {
    console.error(`Invalid tag ID: "${tagId}". Must be a number.`);
    process.exit(1);
  }

  const wsId = await config.getWorkspaceId();

  try {
    await del(`/workspaces/${wsId}/tags/${tagId}`);
    console.log(`Tag ${tagId} deleted.`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('404')) {
      console.error(`Tag ${tagId} not found.`);
      return;
    }
    throw e;
  }
}
