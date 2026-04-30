import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const APP_NAME = 'tgp';

function isWindows(): boolean {
  return process.platform === 'win32';
}

export function getConfigDir(): string {
  const dir = isWindows()
    ? join(process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'), APP_NAME)
    : join(homedir(), '.config', APP_NAME);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export function getConfigFile(): string {
  return join(getConfigDir(), 'config.env');
}

export function getCacheDir(): string {
  const dir = isWindows()
    ? join(process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'), APP_NAME, 'Cache')
    : join(homedir(), '.cache', APP_NAME);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}
