import { get } from '../api.js';

interface Workspace {
  id: number;
  name: string;
  organization_id: number;
}

export async function workspaceList() {
  const list = await get<Workspace[]>('/me/workspaces');

  if (list.length === 0) {
    console.log('No workspaces found');
    return;
  }

  console.log(`  ${'ID'.padEnd(12)} Name`);
  console.log(`  ${''.padEnd(12, '─')} ${''.padEnd(20, '─')}`);

  for (const workspace of list) {
    console.log(`  ${String(workspace.id).padEnd(12)} ${workspace.name}`);
  }
}
