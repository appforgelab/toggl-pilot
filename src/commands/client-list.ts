import { get } from '../api.js';
import { config } from '../config.js';
import { DASH, parseOrExit } from '../utils.js';

type ClientStatus = 'active' | 'archived' | 'both';

interface ClientListItem {
  id: number;
  name: string;
  notes?: string | null;
  wid: number;
  archived: boolean;
  at: string;
}

interface ClientListArgs {
  status: ClientStatus;
  name?: string;
}

const USAGE = 'Usage: tgp client-list [--status active|archived|both] [--name <filter>]';

function isClientStatus(value: string): value is ClientStatus {
  return value === 'active' || value === 'archived' || value === 'both';
}

export function parseArgs(args: string[]): ClientListArgs {
  const parsed: ClientListArgs = { status: 'active' };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--status') {
      const status = args[++i];
      if (!status || !isClientStatus(status)) {
        throw new Error(USAGE);
      }
      parsed.status = status;
      continue;
    }

    if (arg === '--name') {
      const name = args[++i];
      if (!name) {
        throw new Error(USAGE);
      }
      parsed.name = name;
      continue;
    }

    throw new Error(USAGE);
  }

  return parsed;
}

function filterByStatus(clients: ClientListItem[], status: ClientStatus): ClientListItem[] {
  if (status === 'both') {
    return clients;
  }

  return clients.filter((client) => client.archived === (status === 'archived'));
}

export async function clientList(args: string[] = []) {
  const { status, name } = parseOrExit(() => parseArgs(args));
  const wsId = await config.getWorkspaceId();
  const params = new URLSearchParams({ status });

  if (name) {
    params.set('name', name);
  }

  const list = await get<ClientListItem[]>(`/workspaces/${wsId}/clients?${params.toString()}`);
  const clients = filterByStatus(list, status);

  if (clients.length === 0) {
    console.log('No clients found');
    return;
  }

  console.log(`\nClients in workspace ${wsId}\n`);
  console.log(`  ${'ID'.padEnd(12)} ${'Name'.padEnd(30)} ${'Notes'.padEnd(20)} Status`);
  console.log(`  ${''.padEnd(12, '─')} ${''.padEnd(30, '─')} ${''.padEnd(20, '─')} ${''.padEnd(8, '─')}`);

  for (const client of clients) {
    const notes = client.notes?.trim() ? client.notes : DASH;
    const statusLabel = client.archived ? 'archived' : 'active';
    const line = `  ${String(client.id).padEnd(12)} ${client.name.slice(0, 30).padEnd(30)} ${notes.slice(0, 20).padEnd(20)} ${statusLabel}`;
    console.log(line);
  }

  console.log();
}
