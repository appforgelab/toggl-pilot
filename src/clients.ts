import { get } from './api.js';

interface Client {
  id: number;
  name: string;
  wid: number;
}

export async function resolveClientId(wsId: number, clientInput: string): Promise<number> {
  if (/^\d+$/.test(clientInput)) {
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
