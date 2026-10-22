import { config } from '../config.js';
import { put } from '../api.js';
import { resolveClientId } from '../clients.js';
import { resolveProjectId } from '../projects.js';
import { parseOrExit, nothingToEditError, parseCommandLine } from '../utils.js';
import type { CommandOption } from '../types.js';

export const projectEditUsage =
  'tgp project-edit <project> [-n "New Name"] [-c "Client Name"] [--color "#0b83d9"] [--public|--private]';

export const projectEditOptions: CommandOption[] = [
  { short: '-n', long: '--name', value: '<name>', description: 'New project name', text: true },
  {
    short: '-c',
    long: '--client',
    value: '<client>',
    description: 'Client name or ID ("" removes the client)',
    allowEmpty: true,
    text: true,
  },
  { long: '--color', value: '<hex>', description: 'Project color, e.g. "#0b83d9"' },
  { long: '--public', description: 'Make the project visible to all workspace members' },
  { long: '--private', description: 'Make the project private' },
];

interface Project {
  id: number;
  name: string;
  client_id: number | null;
  client_name: string | null;
  color: string;
  is_private: boolean;
}

interface ParsedArgs {
  project: string;
  name: string | null;
  client: string | null;
  color: string | null;
  isPrivate: boolean | null;
}

const USAGE = `Usage: ${projectEditUsage}`;

export function parseArgs(args: string[]): ParsedArgs {
  const { positionals, values, flags } = parseCommandLine(args, projectEditOptions);
  const [project, extra] = positionals;
  if (!project) {
    throw new Error(USAGE);
  }
  if (extra !== undefined) {
    throw new Error(`Unexpected argument: ${extra}.`);
  }
  if (flags.has('--public') && flags.has('--private')) {
    throw new Error('Cannot use both --public and --private.');
  }

  const name = values.get('--name') ?? null;
  const client = values.get('--client') ?? null;
  const color = values.get('--color') ?? null;
  const isPrivate = flags.has('--private') ? true : flags.has('--public') ? false : null;

  if (name === null && client === null && color === null && isPrivate === null) {
    throw nothingToEditError(projectEditOptions);
  }

  return { project, name, client, color, isPrivate };
}

export async function projectEdit(args: string[]) {
  const { project: projectInput, name, client, color, isPrivate } = parseOrExit(() => parseArgs(args));
  const wsId = await config.getWorkspaceId();
  const body: Record<string, unknown> = {};
  let projectId: number;

  try {
    projectId = await resolveProjectId(wsId, projectInput);
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }

  if (name !== null) {
    body.name = name;
  }

  if (client !== null) {
    try {
      body.client_id = client === '' ? null : await resolveClientId(wsId, client);
    } catch (e) {
      console.error((e as Error).message);
      process.exit(1);
    }
  }

  if (color !== null) {
    body.color = color;
  }

  if (isPrivate !== null) {
    body.is_private = isPrivate;
  }

  try {
    const project = await put<Project>(`/workspaces/${wsId}/projects/${projectId}`, body);
    const clientLabel = project.client_name ?? 'None';
    const visibilityLabel = project.is_private ? 'private' : 'public';
    console.log(
      `Project ${project.id} updated: name="${project.name}" client="${clientLabel}" color=${project.color} ${visibilityLabel}`
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('404')) {
      console.error(`Project ${projectInput} not found.`);
      return;
    }
    throw e;
  }
}
