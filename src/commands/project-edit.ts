import { config } from '../config.js';
import { put } from '../api.js';
import { resolveClientId } from '../clients.js';
import { parseOrExit } from '../utils.js';

interface Project {
  id: number;
  name: string;
  client_id: number | null;
  client_name: string | null;
  color: string;
  is_private: boolean;
}

interface ParsedArgs {
  projectId: string;
  name: string | null;
  client: string | null;
  color: string | null;
  visibility: boolean | null;
}

const USAGE =
  'Usage: tgp project-edit <project_id> [-n "New Name"] [-c "Client Name"] [--color "#0b83d9"] [--public|--private]';
const VALID_FLAGS = new Set(['-n', '--name', '-c', '--client', '--color', '--public', '--private']);

function requireValue(args: string[], index: number, flagName: string): string {
  if (index + 1 >= args.length) {
    throw new Error(`${flagName} requires a value.`);
  }
  return args[index + 1];
}

export function parseArgs(args: string[]): ParsedArgs {
  const projectId = args[0];
  let name: string | null = null;
  let client: string | null = null;
  let color: string | null = null;
  let visibility: boolean | null = null;

  if (!projectId) {
    throw new Error(USAGE);
  }

  if (isNaN(Number(projectId))) {
    throw new Error(`Invalid project ID: "${projectId}". Must be a number.`);
  }

  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('-') && !VALID_FLAGS.has(args[i])) {
      throw new Error(
        `Unknown flag: ${args[i]}. Valid flags: -n/--name, -c/--client, --color, --public, --private`
      );
    }

    if (args[i] === '-n' || args[i] === '--name') {
      name = requireValue(args, i, '--name');
      i++;
    } else if (args[i] === '-c' || args[i] === '--client') {
      client = requireValue(args, i, '--client');
      i++;
    } else if (args[i] === '--color') {
      color = requireValue(args, i, '--color');
      i++;
    } else if (args[i] === '--public') {
      if (visibility === true) {
        throw new Error('Cannot use both --public and --private.');
      }
      visibility = false;
    } else if (args[i] === '--private') {
      if (visibility === false) {
        throw new Error('Cannot use both --public and --private.');
      }
      visibility = true;
    } else {
      throw new Error(`Unexpected argument: ${args[i]}.`);
    }
  }

  if (name === null && client === null && color === null && visibility === null) {
    throw new Error('Nothing to edit. Provide at least one of: -n, -c, --color, --public, --private');
  }

  return { projectId, name, client, color, visibility };
}

export async function projectEdit(args: string[]) {
  const { projectId, name, client, color, visibility } = parseOrExit(() => parseArgs(args));
  const wsId = await config.getWorkspaceId();
  const body: Record<string, unknown> = {};

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

  if (visibility !== null) {
    body.is_private = visibility;
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
      console.error(`Project ${projectId} not found.`);
      return;
    }
    throw e;
  }
}
