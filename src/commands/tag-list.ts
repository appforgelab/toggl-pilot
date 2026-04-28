import { config } from '../config.js';
import { get } from '../api.js';

interface Tag {
  id: number;
  name: string;
}

export async function tagList() {
  const wsId = await config.getWorkspaceId();
  const list = await get<Tag[]>(`/workspaces/${wsId}/tags`);

  if (list.length === 0) {
    console.log('No tags found. Tags are created automatically when you use them in a time entry.');
    return;
  }

  console.log(`\nTags in workspace ${wsId}\n`);
  console.log(`  ${'ID'.padEnd(12)} Name`);
  console.log(`  ${''.padEnd(12, '─')} ${''.padEnd(20, '─')}`);

  for (const t of list) {
    console.log(`  ${String(t.id).padEnd(12)} ${t.name}`);
  }
  console.log();
}
