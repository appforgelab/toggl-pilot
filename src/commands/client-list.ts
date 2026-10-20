import { get } from '../api.js';
import { config } from '../config.js';
import { DASH, parseOrExit, validateOptionArgs } from '../utils.js';
import type { CommandOption } from '../types.js';

export const clientListUsage = 'tgp client-list [--status active|archived|both] [--name <filter>]';

export const clientListOptions: CommandOption[] = [
  { long: '--status', value: '<status>', description: 'active, archived, or both (default: active)' },
  { long: '--name', value: '<filter>', description: 'Filter by client name' },
];

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

const USAGE = `Usage: ${clientListUsage}`;

function isClientStatus(value: string): value is ClientStatus {
  return value === 'active' || value === 'archived' || value === 'both';
}

export function parseArgs(args: string[]): ClientListArgs {
  validateOptionArgs(args, clientListOptions, USAGE);

  const parsed: ClientListArgs = { status: 'active' };
  // Every client-list option takes a value, so validated args are flag/value pairs.
  for (let i = 0; i < args.length; i += 2) {
    const value = args[i + 1];
    if (args[i] === '--status') {
      if (!value || !isClientStatus(value)) throw new Error(USAGE);
      parsed.status = value;
    } else if (args[i] === '--name') {
      if (!value) throw new Error(USAGE);
      parsed.name = value;
    }
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
