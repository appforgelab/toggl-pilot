import { config } from '../config.js';
import { post } from '../api.js';
import { parseOrExit, requireFlagValue, flagSet, validFlagsHint } from '../utils.js';
import type { CommandOption } from '../types.js';

export const clientAddUsage = 'tgp client-add "Client Name" [--notes "Some notes"]';

export const clientAddOptions: CommandOption[] = [
  { long: '--notes', value: '<text>', description: 'Notes for the client' },
];

interface Client {
  id: number;
  name: string;
  notes?: string | null;
  wid: number;
}

const USAGE = `Usage: ${clientAddUsage}`;
const VALID_FLAGS = flagSet(clientAddOptions);

function parseArgs(args: string[]) {
  let name: string | null = null;
  let notes: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('-') && !VALID_FLAGS.has(args[i])) {
      throw new Error(`Unknown flag: ${args[i]}. ${validFlagsHint(clientAddOptions)}`);
    }

    if (args[i] === '--notes') {
      notes = requireFlagValue(args, i, '--notes');
      i++;
    } else if (!args[i].startsWith('-')) {
      if (name !== null) throw new Error(USAGE);
      name = args[i];
    }
  }

  if (!name) {
    throw new Error(USAGE);
  }

  return { name, notes };
}

export async function clientAdd(args: string[]) {
  const { name, notes } = parseOrExit(() => parseArgs(args));
  const wsId = await config.getWorkspaceId();

  const body: Record<string, unknown> = { name };
  if (notes) {
    body.notes = notes;
  }

  try {
    const client = await post<Client>(`/workspaces/${wsId}/clients`, body);
    console.log(`Created: ${client.name} (id: ${client.id})`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('400')) {
      console.error(`Client "${name}" could not be created. Check for duplicates or invalid parameters.`);
      return;
    }
    throw e;
  }
}
