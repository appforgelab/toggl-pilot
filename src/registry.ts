import { auth } from './commands/auth.js';
import { version } from './commands/version.js';
import { me } from './commands/me.js';
import { workspaceList } from './commands/workspace-list.js';
import { workspaceUse } from './commands/workspace-use.js';
import { entryList } from './commands/entry-list.js';
import { track } from './commands/track.js';
import { stop } from './commands/stop.js';
import { resume } from './commands/resume.js';
import { entryEdit } from './commands/entry-edit.js';
import { week } from './commands/week.js';
import { entryDelete } from './commands/entry-delete.js';
import { clientList } from './commands/client-list.js';
import { clientAdd } from './commands/client-add.js';
import { clientDelete } from './commands/client-delete.js';
import { clientRename } from './commands/client-rename.js';
import { projectList } from './commands/project-list.js';
import { projectCreate } from './commands/project-create.js';
import { projectEdit } from './commands/project-edit.js';
import { projectRename } from './commands/project-rename.js';
import { projectDelete } from './commands/project-delete.js';
import { projectArchive } from './commands/project-archive.js';
import { projectRestore } from './commands/project-restore.js';
import { tagList } from './commands/tag-list.js';
import { tagCreate } from './commands/tag-create.js';
import { tagRename } from './commands/tag-rename.js';
import { tagDelete } from './commands/tag-delete.js';

export const GROUPS = ['General', 'Entries', 'Clients', 'Projects', 'Tags'] as const;

export type CommandGroup = (typeof GROUPS)[number];

export interface Command {
  name: string;
  group: CommandGroup;
  summary: string;
  usage: string;
  /** False only for commands that must work before `tgp auth` has been run. */
  requiresConfig: boolean;
  run: (args: string[]) => void | Promise<void>;
}

/**
 * Single source of truth for dispatch and help. Commands appear in help in the
 * order listed here, grouped by GROUPS order.
 */
export const COMMANDS: Command[] = [
  {
    name: 'auth',
    group: 'General',
    summary: 'Save API token',
    usage: 'tgp auth <api-token>',
    requiresConfig: false,
    run: auth,
  },
  {
    name: 'version',
    group: 'General',
    summary: 'Show CLI version',
    usage: 'tgp version',
    requiresConfig: false,
    run: version,
  },
  {
    name: 'me',
    group: 'General',
    summary: 'Verify authentication',
    usage: 'tgp me',
    requiresConfig: true,
    run: me,
  },
  {
    name: 'workspace-list',
    group: 'General',
    summary: 'List workspaces',
    usage: 'tgp workspace-list',
    requiresConfig: true,
    run: workspaceList,
  },
  {
    name: 'workspace-use',
    group: 'General',
    summary: 'Set active workspace',
    usage: 'tgp workspace-use <workspace_id>',
    requiresConfig: true,
    run: workspaceUse,
  },
  {
    name: 'entry-list',
    group: 'Entries',
    summary: 'List time entries for a day',
    usage: 'tgp entry-list [-d YYYY-MM-DD|yesterday|<offset>]',
    requiresConfig: true,
    run: entryList,
  },
  {
    name: 'track',
    group: 'Entries',
    summary: 'Start a timer or log time',
    usage:
      'tgp track "Description" [-p "Project name"] [-t tag1,tag2] [--at [H]H:MM] [--dur 1h30m] [-d YYYY-MM-DD|yesterday]',
    requiresConfig: true,
    run: track,
  },
  {
    name: 'stop',
    group: 'Entries',
    summary: 'Stop running timer',
    usage: 'tgp stop',
    requiresConfig: true,
    run: stop,
  },
  {
    name: 'resume',
    group: 'Entries',
    summary: 'Resume a stopped timer',
    usage: 'tgp resume [<entry_id>]',
    requiresConfig: true,
    run: resume,
  },
  {
    name: 'entry-edit',
    group: 'Entries',
    summary: 'Edit a time entry',
    usage:
      'tgp entry-edit <entry_id> [-d "New desc"] [-p "Project"] [-t tag1,tag2] [--dur 1h30m] [--start [H]H:MM]',
    requiresConfig: true,
    run: entryEdit,
  },
  {
    name: 'week',
    group: 'Entries',
    summary: 'Weekly summary by project',
    usage: 'tgp week [-d YYYY-MM-DD|yesterday|<offset>] [-w <weeks>] [-v]',
    requiresConfig: true,
    run: week,
  },
  {
    name: 'entry-delete',
    group: 'Entries',
    summary: 'Delete a time entry',
    usage: 'tgp entry-delete <entry_id>',
    requiresConfig: true,
    run: entryDelete,
  },
  {
    name: 'client-list',
    group: 'Clients',
    summary: 'List workspace clients',
    usage: 'tgp client-list [--status active|archived|both] [--name <filter>]',
    requiresConfig: true,
    run: clientList,
  },
  {
    name: 'client-add',
    group: 'Clients',
    summary: 'Create a client',
    usage: 'tgp client-add "Client Name" [--notes "Some notes"]',
    requiresConfig: true,
    run: clientAdd,
  },
  {
    name: 'client-delete',
    group: 'Clients',
    summary: 'Delete a client',
    usage: 'tgp client-delete <client_id>',
    requiresConfig: true,
    run: clientDelete,
  },
  {
    name: 'client-rename',
    group: 'Clients',
    summary: 'Rename a client',
    usage: 'tgp client-rename <client_id> "New Name"',
    requiresConfig: true,
    run: clientRename,
  },
  {
    name: 'project-list',
    group: 'Projects',
    summary: 'List workspace projects',
    usage: 'tgp project-list [--all|-a]',
    requiresConfig: true,
    run: projectList,
  },
  {
    name: 'project-create',
    group: 'Projects',
    summary: 'Create a project',
    usage: 'tgp project-create "Project Name" [-c "Client Name"] [--color "#0b83d9"] [--public]',
    requiresConfig: true,
    run: projectCreate,
  },
  {
    name: 'project-edit',
    group: 'Projects',
    summary: 'Edit a project',
    usage:
      'tgp project-edit <project> [-n "New Name"] [-c "Client Name"] [--color "#0b83d9"] [--public|--private]',
    requiresConfig: true,
    run: projectEdit,
  },
  {
    name: 'project-rename',
    group: 'Projects',
    summary: 'Rename a project',
    usage: 'tgp project-rename <project> "New Name"',
    requiresConfig: true,
    run: projectRename,
  },
  {
    name: 'project-delete',
    group: 'Projects',
    summary: 'Delete a project',
    usage: 'tgp project-delete <project>',
    requiresConfig: true,
    run: projectDelete,
  },
  {
    name: 'project-archive',
    group: 'Projects',
    summary: 'Archive a project',
    usage: 'tgp project-archive <project>',
    requiresConfig: true,
    run: projectArchive,
  },
  {
    name: 'project-restore',
    group: 'Projects',
    summary: 'Restore a project',
    usage: 'tgp project-restore <project>',
    requiresConfig: true,
    run: projectRestore,
  },
  {
    name: 'tag-list',
    group: 'Tags',
    summary: 'List tags',
    usage: 'tgp tag-list',
    requiresConfig: true,
    run: tagList,
  },
  {
    name: 'tag-create',
    group: 'Tags',
    summary: 'Create a tag',
    usage: 'tgp tag-create "Tag Name"',
    requiresConfig: true,
    run: tagCreate,
  },
  {
    name: 'tag-rename',
    group: 'Tags',
    summary: 'Rename a tag',
    usage: 'tgp tag-rename <tag_id> "New Name"',
    requiresConfig: true,
    run: tagRename,
  },
  {
    name: 'tag-delete',
    group: 'Tags',
    summary: 'Delete a tag',
    usage: 'tgp tag-delete <tag_id>',
    requiresConfig: true,
    run: tagDelete,
  },
];

export function findCommand(name: string): Command | undefined {
  return COMMANDS.find((c) => c.name === name);
}
