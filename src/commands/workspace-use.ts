import { get } from '../api.js';
import { setConfigVar } from '../config.js';

interface Workspace {
  id: number;
  name: string;
}

export async function workspaceUse(args: string[]) {
  const raw = args[0];
  if (!raw) {
    console.error('Usage: tgp workspace-use <workspace_id>');
    process.exit(1);
  }

  const id = Number(raw);
  if (!Number.isInteger(id)) {
    console.error(`Invalid workspace ID: ${raw}. Must be a number.`);
    process.exit(1);
  }

  const list = await get<Workspace[]>('/me/workspaces');
  const workspace = list.find((w) => w.id === id);
  if (!workspace) {
    console.error(`Workspace ${id} not found. Run 'tgp workspace-list' to see available workspaces.`);
    process.exit(1);
  }

  setConfigVar('TOGGL_WORKSPACE_ID', String(workspace.id));
  console.log(`Active workspace set to: ${workspace.name} (${workspace.id})`);
}
