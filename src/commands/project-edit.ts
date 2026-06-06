import { config } from '../config.js';
import { put } from '../api.js';
import { resolveClientId } from '../clients.js';
import { resolveProjectId } from '../projects.js';
import { parseOrExit, requireFlagValue } from '../utils.js';

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

const USAGE =
  'Usage: tgp project-edit <project> [-n "New Name"] [-c "Client Name"] [--color "#0b83d9"] [--public|--private]';
const VALID_FLAGS = new Set(['-n', '--name', '-c', '--client', '--color', '--public', '--private']);

export function parseArgs(args: string[]): ParsedArgs {
  const project = args[0];
  let name: string | null = null;
  let client: string | null = null;
  let color: string | null = null;
  let isPrivate: boolean | null = null;

  if (!project) {
    throw new Error(USAGE);
  }

  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('-') && !VALID_FLAGS.has(args[i])) {
      throw new Error(
        `Unknown flag: ${args[i]}. Valid flags: -n/--name, -c/--client, --color, --public, --private`
      );
    }

    if (args[i] === '-n' || args[i] === '--name') {
      name = requireFlagValue(args, i, args[i]);
      i++;
    } else if (args[i] === '-c' || args[i] === '--client') {
      client = requireFlagValue(args, i, args[i]);
      i++;
    } else if (args[i] === '--color') {
      color = requireFlagValue(args, i, args[i]);
      i++;
    } else if (args[i] === '--public') {
      if (isPrivate === true) {
        throw new Error('Cannot use both --public and --private.');
      }
      isPrivate = false;
    } else if (args[i] === '--private') {
      if (isPrivate === false) {
        throw new Error('Cannot use both --public and --private.');
      }
      isPrivate = true;
    } else {
      throw new Error(`Unexpected argument: ${args[i]}.`);
    }
  }

  if (name === null && client === null && color === null && isPrivate === null) {
    throw new Error('Nothing to edit. Provide at least one of: -n, -c, --color, --public, --private');
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
