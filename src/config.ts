import 'dotenv/config';
import { get } from './api.js';

export const config = {
  get apiToken() {
    const token = process.env.TOGGL_API_TOKEN;
    if (!token || token === 'your_token_here') {
      throw new Error('TOGGL_API_TOKEN not set. Copy .env.example to .env and add your token.');
    }
    return token;
  },
  _workspaceId: null as number | null,
  async getWorkspaceId(): Promise<number> {
    if (this._workspaceId) return this._workspaceId;
    const envId = process.env.TOGGL_WORKSPACE_ID;
    if (envId) {
      this._workspaceId = Number(envId);
      return this._workspaceId;
    }
    const me = await get<{ default_workspace_id: number }>('/me');
    this._workspaceId = me.default_workspace_id;
    return this._workspaceId;
  },
};
