import { config } from '../config.js';
import { get } from '../api.js';
import { NONE } from '../utils.js';

interface Project {
  id: number;
  name: string;
  active: boolean;
  client_id: number | null;
  client_name: string | null;
  color: string;
  status: string;
}

export async function projectList() {
  const wsId = await config.getWorkspaceId();
  const list = await get<Project[]>(`/workspaces/${wsId}/projects`);

  if (list.length === 0) {
    console.log('No projects found');
    return;
  }

  console.log(`\nProjects in workspace ${wsId}\n`);
  console.log(`  ${'ID'.padEnd(12)} ${'Name'.padEnd(30)} ${'Client'.padEnd(20)} Status`);
  console.log(`  ${''.padEnd(12, '─')} ${''.padEnd(30, '─')} ${''.padEnd(20, '─')} ${''.padEnd(8, '─')}`);

  for (const p of list) {
    const status = p.active ? 'active' : 'archived';
    const client = p.client_name ?? NONE;
    const line = `  ${String(p.id).padEnd(12)} ${p.name.slice(0, 30).padEnd(30)} ${client.slice(0, 20).padEnd(20)} ${status}`;
    console.log(line);
  }
  console.log();
}
