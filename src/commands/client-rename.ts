import { config } from '../config.js';
import { put } from '../api.js';

interface Client {
  id: number;
  name: string;
}

export async function clientRename(args: string[]) {
  const clientId = args[0];
  const newName = args[1];

  if (!clientId || !newName) {
    console.error('Usage: tgp client-rename <client_id> "New Name"');
    process.exit(1);
  }

  if (isNaN(Number(clientId))) {
    console.error(`Invalid client ID: "${clientId}". Must be a number.`);
    process.exit(1);
  }

  const wsId = await config.getWorkspaceId();

  try {
    const updated = await put<Client>(`/workspaces/${wsId}/clients/${clientId}`, {
      name: newName,
    });
    console.log(`Client ${updated.id} renamed to "${updated.name}"`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('404')) {
      console.error(`Client ${clientId} not found.`);
      return;
    }
    throw e;
  }
}
