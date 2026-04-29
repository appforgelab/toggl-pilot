#!/usr/bin/env node
import { get } from './api.js';
import { hasConfig, ConfigNotFoundError } from './config.js';
import { entryList } from './commands/entry-list.js';
import { projectList } from './commands/project-list.js';
import { entryDelete } from './commands/entry-delete.js';
import { track } from './commands/track.js';
import { stop } from './commands/stop.js';
import { tagList } from './commands/tag-list.js';
import { entryEdit } from './commands/entry-edit.js';
import { auth } from './commands/auth.js';

interface Me {
  id: number;
  email: string;
  fullname: string;
  default_workspace_id: number;
}

async function me() {
  const user = await get<Me>('/me');
  console.log(`Authenticated as: ${user.fullname} (${user.email})`);
  console.log(`Default workspace: ${user.default_workspace_id}`);
}

const command = process.argv[2];
const args = process.argv.slice(3);

if (command === 'auth') {
  auth(args);
} else if (!hasConfig()) {
  console.error(new ConfigNotFoundError().message);
  process.exit(1);
} else {
  switch (command) {
    case 'me':
      me();
      break;
    case 'entry-list':
      entryList(args);
      break;
    case 'project-list':
      projectList();
      break;
    case 'entry-delete':
      entryDelete(args);
      break;
    case 'track':
      track(args);
      break;
    case 'stop':
      stop();
      break;
    case 'tag-list':
      tagList();
      break;
    case 'entry-edit':
      entryEdit(args);
      break;
    default:
      console.error('Usage: tgt <command>');
      console.error(
        'Commands: auth, me, entry-list [-d DATE], project-list, entry-delete <entry_id>, track, stop, tag-list, entry-edit'
      );
  }
}
