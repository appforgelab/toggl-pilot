import { get } from './api.js';
import { entryList } from './commands/entry-list.js';
import { projectList } from './commands/project-list.js';
import { entryDelete } from './commands/entry-delete.js';
import { track } from './commands/track.js';
import { stop } from './commands/stop.js';
import { tagList } from './commands/tag-list.js';
import { entryEdit } from './commands/entry-edit.js';

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
const args = process.argv.slice(2);

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
    track(args.slice(1));
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
    console.log('Usage: tsx src/index.ts <command>');
    console.log(
      'Commands: me, entry-list [-d DATE], project-list, entry-delete <entry_id>, track, stop, tag-list, entry-edit'
    );
}
