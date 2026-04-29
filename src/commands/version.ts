import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getVersion(): string {
  if (process.env.npm_package_version) return process.env.npm_package_version;
  const candidates = [join(__dirname, '..', '..', 'package.json'), join(__dirname, '..', 'package.json')];
  for (const p of candidates) {
    try {
      return JSON.parse(readFileSync(p, 'utf-8')).version;
    } catch {
      continue;
    }
  }
  return 'unknown';
}

export function version() {
  console.log(`tgt v${getVersion()}`);
}
