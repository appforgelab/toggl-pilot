import { get } from '../api.js';

interface Me {
  id: number;
  email: string;
  fullname: string;
  default_workspace_id: number;
}

export async function me() {
  const user = await get<Me>('/me');
  console.log(`Authenticated as: ${user.fullname} (${user.email})`);
  console.log(`Default workspace: ${user.default_workspace_id}`);
}
