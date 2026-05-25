import { config } from '../config.js';
import { get } from '../api.js';
import { DASH, parseOrExit } from '../utils.js';

interface Project {
  id: number;
  name: string;
  active: boolean;
  client_id: number | null;
  client_name: string | null;
  color: string;
  status: string;
}

export function parseArgs(args: string[]): { includeArchived: boolean } {
  if (args.length === 0) {
    return { includeArchived: false };
  }

  if (args.length === 1 && (args[0] === '--all' || args[0] === '-a')) {
    return { includeArchived: true };
  }

  throw new Error('Usage: tgp project-list [--all|-a]');
}

export async function projectList(args: string[] = []) {
  const { includeArchived } = parseOrExit(() => parseArgs(args));
  const wsId = await config.getWorkspaceId();
  const path = includeArchived ? `/workspaces/${wsId}/projects` : `/workspaces/${wsId}/projects?active=true`;
  const list = await get<Project[]>(path);
  const projects = includeArchived ? list : list.filter((p) => p.active);

  if (projects.length === 0) {
    console.log('No projects found');
    return;
  }

  console.log(`\nProjects in workspace ${wsId}\n`);
  console.log(`  ${'ID'.padEnd(12)} ${'Name'.padEnd(30)} ${'Client'.padEnd(20)} Status`);
  console.log(`  ${''.padEnd(12, '─')} ${''.padEnd(30, '─')} ${''.padEnd(20, '─')} ${''.padEnd(8, '─')}`);

  for (const p of projects) {
    const status = p.active ? 'active' : 'archived';
    const client = p.client_name ?? DASH;
    const line = `  ${String(p.id).padEnd(12)} ${p.name.slice(0, 30).padEnd(30)} ${client.slice(0, 20).padEnd(20)} ${status}`;
    console.log(line);
  }
  console.log();
}
