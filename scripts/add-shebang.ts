import { existsSync, readFileSync, writeFileSync } from 'fs';

const file = 'dist/index.js';

if (!existsSync(file)) {
  console.error(`Error: ${file} not found. Did the build succeed?`);
  process.exit(1);
}

let content = readFileSync(file, 'utf8');
content = '#!/usr/bin/env node\n' + content.replace(/^#!.*\n?/, '');
writeFileSync(file, content);
