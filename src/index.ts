#!/usr/bin/env node
import { get } from './api.js';
import { hasConfig, ConfigNotFoundError } from './config.js';
import { entryList } from './commands/entry-list.js';
import { projectList } from './commands/project-list.js';
import { entryDelete } from './commands/entry-delete.js';
import { track } from './commands/track.js';
import { stop } from './commands/stop.js';
import { tagList } from './commands/tag-list.js';
import { tagCreate } from './commands/tag-create.js';
import { tagRename } from './commands/tag-rename.js';
import { tagDelete } from './commands/tag-delete.js';
import { entryEdit } from './commands/entry-edit.js';
import { projectRename } from './commands/project-rename.js';
import { auth } from './commands/auth.js';
import { version } from './commands/version.js';

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
} else if (command === 'version') {
  version();
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
    case 'tag-create':
      tagCreate(args);
      break;
    case 'tag-rename':
      tagRename(args);
      break;
    case 'tag-delete':
      tagDelete(args);
      break;
    case 'entry-edit':
      entryEdit(args);
      break;
    case 'project-rename':
      projectRename(args);
      break;
    default:
      console.error('Usage: tgp <command>');
      console.error(
        [
          'Commands: auth, version, me,',
          'track, stop, entry-edit, entry-list [-d DATE], entry-delete <entry_id>,',
          'project-list, project-rename <project_id> "New Name", tag-list, tag-create "Tag Name", tag-rename <tag_id> "New Name", tag-delete <tag_id>',
        ].join('\n')
      );
  }
}
