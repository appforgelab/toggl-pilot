import { config } from '../config.js';
import { put } from '../api.js';
import { resolveClientId } from '../clients.js';
import { resolveProjectId } from '../projects.js';
import { parseOrExit, requireFlagValue, matchFlag, unhandledOption, nothingToEditError } from '../utils.js';
import type { CommandOption } from '../types.js';

export const projectEditUsage =
  'tgp project-edit <project> [-n "New Name"] [-c "Client Name"] [--color "#0b83d9"] [--public|--private]';

export const projectEditOptions: CommandOption[] = [
  { short: '-n', long: '--name', value: '<name>', description: 'New project name' },
  {
    short: '-c',
    long: '--client',
    value: '<client>',
    description: 'Client name or ID ("" removes the client)',
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
  const project = args[0];
  let name: string | null = null;
  let client: string | null = null;
  let color: string | null = null;
  let isPrivate: boolean | null = null;
  const seen = new Set<CommandOption>();

  if (!project) {
    throw new Error(USAGE);
  }

  for (let i = 1; i < args.length; i++) {
    const option = matchFlag(args[i], projectEditOptions, seen);
    if (!option) {
      throw new Error(`Unexpected argument: ${args[i]}.`);
    }

    switch (option.long) {
      case '--name':
        name = requireFlagValue(args, i, args[i]);
        break;
      case '--client':
        client = requireFlagValue(args, i, args[i], { allowEmpty: true });
        break;
      case '--color':
        color = requireFlagValue(args, i, args[i]);
        break;
      case '--public':
      case '--private':
        if (isPrivate !== null) {
          throw new Error('Cannot use both --public and --private.');
        }
        isPrivate = option.long === '--private';
        break;
      default:
        unhandledOption(option);
    }
    if (option.value) i++;
  }

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
