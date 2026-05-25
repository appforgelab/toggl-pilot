import { config } from '../config.js';
import { post } from '../api.js';
import { resolveClientId } from '../clients.js';
import { parseOrExit } from '../utils.js';

interface Project {
  id: number;
  name: string;
  client_id: number | null;
  client_name: string | null;
}

const VALID_FLAGS = new Set(['-c', '--client', '--color', '--public']);

function parseArgs(args: string[]) {
  let name = '';
  let client: string | null = null;
  let color: string | null = null;
  let isPublic = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('-') && !VALID_FLAGS.has(args[i])) {
      throw new Error(`Unknown flag: ${args[i]}. Valid flags: -c/--client, --color, --public`);
    }

    if (args[i] === '-c' || args[i] === '--client') {
      if (!args[i + 1]) throw new Error('--client requires a value.');
      client = args[++i];
    } else if (args[i] === '--color') {
      if (!args[i + 1]) throw new Error('--color requires a value.');
      color = args[++i];
    } else if (args[i] === '--public') {
      isPublic = true;
    } else if (!args[i].startsWith('-')) {
      name = args[i];
    }
  }

  if (!name) {
    throw new Error(
      'Usage: tgp project-create "Project Name" [-c "Client Name"] [--color "#0b83d9"] [--public]'
    );
  }

  return { name, client, color, isPublic };
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
