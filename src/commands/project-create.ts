import { config } from '../config.js';
import { get, post } from '../api.js';
import { parseOrExit } from '../utils.js';

interface Project {
  id: number;
  name: string;
  client_id: number | null;
  client_name: string | null;
}

interface Client {
  id: number;
  name: string;
  wid: number;
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

    if ((args[i] === '-c' || args[i] === '--client') && args[i + 1]) {
      client = args[++i];
    } else if (args[i] === '--color' && args[i + 1]) {
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

async function resolveClientId(wsId: number, clientInput: string): Promise<number> {
  if (!isNaN(Number(clientInput))) {
    return Number(clientInput);
  }

  const clients = await get<Client[]>(`/workspaces/${wsId}/clients`);
  const matches = clients.filter((c) => c.name.toLowerCase() === clientInput.toLowerCase());

  if (matches.length === 0) {
    throw new Error(`Client "${clientInput}" not found.`);
  }
  if (matches.length > 1) {
    const list = matches.map((c) => `  ${c.id}  ${c.name}`).join('\n');
    throw new Error(`Multiple clients match "${clientInput}":\n${list}`);
  }

  return matches[0].id;
}

export async function projectCreate(args: string[]) {
  const { name, client, color, isPublic } = parseOrExit(() => parseArgs(args));
  const wsId = await config.getWorkspaceId();

  const body: Record<string, unknown> = {
    name,
    workspace_id: wsId,
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
