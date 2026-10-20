import { config } from '../config.js';
import { del } from '../api.js';

export const clientDeleteUsage = 'tgp client-delete <client_id>';

export async function clientDelete(args: string[]) {
  const clientId = args[0];

  if (args.length !== 1 || !clientId) {
    console.error(`Usage: ${clientDeleteUsage}`);
    process.exit(1);
  }

  if (isNaN(Number(clientId))) {
    console.error(`Invalid client ID: "${clientId}". Must be a number.`);
    process.exit(1);
  }

  const wsId = await config.getWorkspaceId();

  try {
    await del(`/workspaces/${wsId}/clients/${clientId}`);
    console.log(`Client ${clientId} deleted.`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('404')) {
      console.error(`Client ${clientId} not found.`);
      return;
    }
    throw e;
  }
}
