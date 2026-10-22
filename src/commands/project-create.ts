import { config } from '../config.js';
import { post } from '../api.js';
import { resolveClientId } from '../clients.js';
import { parseOrExit, parseCommandLine } from '../utils.js';
import type { CommandOption } from '../types.js';

export const projectCreateUsage =
  'tgp project-create "Project Name" [-c "Client Name"] [--color "#0b83d9"] [--public]';

export const projectCreateOptions: CommandOption[] = [
  { short: '-c', long: '--client', value: '<client>', description: 'Client name or ID', text: true },
  { long: '--color', value: '<hex>', description: 'Project color, e.g. "#0b83d9"' },
  { long: '--public', description: 'Make the project visible to all workspace members' },
];

interface Project {
  id: number;
  name: string;
  client_id: number | null;
  client_name: string | null;
}

const USAGE = `Usage: ${projectCreateUsage}`;

export function parseArgs(args: string[]) {
  const { positionals, values, flags } = parseCommandLine(args, projectCreateOptions);
  const [name] = positionals;
  if (positionals.length !== 1 || !name) {
    throw new Error(USAGE);
  }

  return {
    name,
    client: values.get('--client') ?? null,
    color: values.get('--color') ?? null,
    isPublic: flags.has('--public'),
  };
}

export async function projectCreate(args: string[]) {
  const { name, client, color, isPublic } = parseOrExit(() => parseArgs(args));
  const wsId = await config.getWorkspaceId();

  const body: Record<string, unknown> = {
    name,
    workspace_id: wsId,
    active: true,
    is_private: !isPublic,
  };

  if (client) {
    try {
      body.client_id = await resolveClientId(wsId, client);
    } catch (e) {
      console.error((e as Error).message);
      process.exit(1);
    }
  }

  if (color) {
    body.color = color;
  }

  try {
    const project = await post<Project>(`/workspaces/${wsId}/projects`, body);
    const clientLabel = project.client_name ? ` [Client: ${project.client_name}]` : '';
    console.log(`Project ${project.id} created: "${project.name}"${clientLabel}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('400')) {
      console.error(`Project "${name}" could not be created. Check for duplicates or invalid parameters.`);
      return;
    }
    throw e;
  }
}
