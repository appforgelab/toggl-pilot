import { existsSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { get } from './api.js';
import { getConfigFile } from './paths.js';

class ConfigNotFoundError extends Error {
  constructor() {
    super(
      'No config found. Run: tgp auth <api-token>\n' +
        'Or set TOGGL_API_TOKEN in your environment.\n' +
        'Get your token at https://track.toggl.com/profile'
    );
    this.name = 'ConfigNotFoundError';
  }
}

let cachedConfig: Record<string, string> | null = null;

function loadConfigFile(): Record<string, string> {
  if (cachedConfig) return cachedConfig;
  const file = getConfigFile();
  if (!existsSync(file)) return {};
  const content = readFileSync(file, 'utf-8');
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  cachedConfig = result;
  return result;
}

function getVar(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  return loadConfigFile()[name];
}

export function hasConfig(): boolean {
  const token = getVar('TOGGL_API_TOKEN');
  return !!token && token !== 'your_token_here';
}

export function setConfigVar(key: string, value: string): string {
  const file = getConfigFile();
  let lines: string[] = [];
  if (existsSync(file)) {
    const content = readFileSync(file, 'utf-8');
    lines = content.split('\n');
    if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  }
  let found = false;
  lines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return line;
    if (trimmed.slice(0, eq).trim() === key) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) lines.push(`${key}=${value}`);
  writeFileSync(file, lines.join('\n') + '\n', { mode: 0o600 });
  if (cachedConfig) cachedConfig[key] = value;

  try {
    const st = statSync(file);
    const mode = st.mode & 0o777;
    if (process.platform !== 'win32' && mode !== 0o600) {
      console.warn(
        `Warning: config file permissions are ${mode.toString(8)}. Consider running: chmod 600 ${file}`
      );
    }
  } catch {
    // skip permission check
  }
  return file;
}

export const config = {
  get apiToken() {
    const token = getVar('TOGGL_API_TOKEN');
    if (!token || token === 'your_token_here') {
      throw new ConfigNotFoundError();
    }
    return token;
  },
  _workspaceId: null as number | null,
  async getWorkspaceId(): Promise<number> {
    if (this._workspaceId) return this._workspaceId;
    const envId = getVar('TOGGL_WORKSPACE_ID');
    if (envId) {
      this._workspaceId = Number(envId);
      return this._workspaceId;
    }
    const me = await get<{ default_workspace_id: number }>('/me');
    this._workspaceId = me.default_workspace_id;
    return this._workspaceId;
  },
};

export { ConfigNotFoundError };
