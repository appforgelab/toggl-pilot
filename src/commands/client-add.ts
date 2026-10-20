import { config } from '../config.js';
import { post } from '../api.js';
import { parseOrExit, parseCommandLine } from '../utils.js';
import type { CommandOption } from '../types.js';

export const clientAddUsage = 'tgp client-add "Client Name" [--notes "Some notes"]';

export const clientAddOptions: CommandOption[] = [
  { long: '--notes', value: '<text>', description: 'Notes for the client', text: true },
];

interface Client {
  id: number;
  name: string;
  notes?: string | null;
  wid: number;
}

const USAGE = `Usage: ${clientAddUsage}`;

export function parseArgs(args: string[]) {
  const { positionals, values } = parseCommandLine(args, clientAddOptions);
  const [name] = positionals;
  if (positionals.length !== 1 || !name) {
    throw new Error(USAGE);
  }

  return { name, notes: values.get('--notes') ?? null };
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
