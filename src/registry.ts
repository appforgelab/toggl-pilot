import { auth, authUsage } from './commands/auth.js';
import { version } from './commands/version.js';
import { me } from './commands/me.js';
import { workspaceList } from './commands/workspace-list.js';
import { workspaceUse, workspaceUseUsage } from './commands/workspace-use.js';
import { entryList, entryListOptions, entryListUsage } from './commands/entry-list.js';
import { track, trackOptions, trackUsage } from './commands/track.js';
import { stop } from './commands/stop.js';
import { resume, resumeUsage } from './commands/resume.js';
import { entryEdit, entryEditOptions, entryEditUsage } from './commands/entry-edit.js';
import { week, weekOptions, weekUsage } from './commands/week.js';
import { entryDelete, entryDeleteUsage } from './commands/entry-delete.js';
import { clientList, clientListOptions, clientListUsage } from './commands/client-list.js';
import { clientAdd, clientAddOptions, clientAddUsage } from './commands/client-add.js';
import { clientDelete, clientDeleteUsage } from './commands/client-delete.js';
import { clientRename, clientRenameUsage } from './commands/client-rename.js';
import { projectList, projectListOptions, projectListUsage } from './commands/project-list.js';
import { projectCreate, projectCreateOptions, projectCreateUsage } from './commands/project-create.js';
import { projectEdit, projectEditOptions, projectEditUsage } from './commands/project-edit.js';
import { projectRename, projectRenameUsage } from './commands/project-rename.js';
import { projectDelete, projectDeleteUsage } from './commands/project-delete.js';
import { projectArchive, projectArchiveUsage } from './commands/project-archive.js';
import { projectRestore, projectRestoreUsage } from './commands/project-restore.js';
import { tagList } from './commands/tag-list.js';
import { tagCreate, tagCreateUsage } from './commands/tag-create.js';
import { tagRename, tagRenameUsage } from './commands/tag-rename.js';
import { tagDelete, tagDeleteUsage } from './commands/tag-delete.js';
import type { CommandOption } from './types.js';

export const GROUPS = ['General', 'Entries', 'Clients', 'Projects', 'Tags'] as const;

export type CommandGroup = (typeof GROUPS)[number];

export interface CommandArgument {
  /** Written exactly as it appears in `usage`, e.g. `<entry_id>` or `"Tag Name"`. */
  name: string;
  description: string;
  /** Free text such as a name (not an ID), so it may legitimately start with "-". */
  text?: boolean;
}

export interface Command {
  name: string;
  group: CommandGroup;
  /** One line, shown in `tgp --help`. */
  summary: string;
  usage: string;
  /** Shown in `tgp <command> --help`. Break lines with `\n` to stay within 80 columns. */
  description: string;
  arguments?: CommandArgument[];
  /** `-h, --help` is added automatically; don't list it here. */
  options?: CommandOption[];
  examples?: string[];
  /** False only for commands that must work before `tgp auth` has been run. */
  requiresConfig: boolean;
  run: (args: string[]) => void | Promise<void>;
}

const PROJECT_ARG = 'Project ID or name (case-insensitive)';

/**
 * Single source of truth for dispatch and help. Commands appear in help in the
 * order listed here, grouped by GROUPS order.
 */
export const COMMANDS: Command[] = [
  {
    name: 'auth',
    group: 'General',
    summary: 'Save API token',
    usage: authUsage,
    description:
      'Verify an API token and save it to the config file.\n' +
      'Get your token at https://track.toggl.com/profile',
    arguments: [{ name: '<api-token>', description: 'Toggl Track API token' }],
    requiresConfig: false,
    run: auth,
  },
  {
    name: 'version',
    group: 'General',
    summary: 'Show CLI version',
    usage: 'tgp version',
    description: 'Show the installed tgp version.',
    requiresConfig: false,
    run: version,
  },
  {
    name: 'me',
    group: 'General',
    summary: 'Verify authentication',
    usage: 'tgp me',
    description: 'Verify your API token and show your Toggl user and default workspace.',
    requiresConfig: true,
    run: me,
  },
  {
    name: 'workspace-list',
    group: 'General',
    summary: 'List workspaces',
    usage: 'tgp workspace-list',
    description: 'List the workspaces available to you, with their IDs.',
    requiresConfig: true,
    run: workspaceList,
  },
  {
    name: 'workspace-use',
    group: 'General',
    summary: 'Set active workspace',
    usage: workspaceUseUsage,
    description:
      'Set the active workspace and save it to the config file. The\n' +
      'TOGGL_WORKSPACE_ID environment variable takes priority over it.',
    arguments: [{ name: '<workspace_id>', description: 'Workspace ID from "tgp workspace-list"' }],
    requiresConfig: true,
    run: workspaceUse,
  },
  {
    name: 'entry-list',
    group: 'Entries',
    summary: 'List time entries for a day',
    usage: entryListUsage,
    description: 'List time entries for a day, with totals by project. Defaults to today.',
    options: entryListOptions,
    examples: ['tgp entry-list -d yesterday', 'tgp entry-list -d -2', 'tgp entry-list -d 2026-04-29'],
    requiresConfig: true,
    run: entryList,
  },
  {
    name: 'track',
    group: 'Entries',
    summary: 'Start a timer or log time',
    usage: trackUsage,
    description:
      'Start a running timer, or log a completed entry with --at and --dur.\n' +
      "Tags that don't exist yet are created automatically.",
    arguments: [{ name: '"Description"', description: 'Entry description', text: true }],
    options: trackOptions,
    examples: [
      'tgp track "Code review" -p "Dev-Pilot" -t dev,review',
      'tgp track "Standup" --at 09:00 --dur 30m',
      'tgp track "Bug fix" --at 14:00 --dur 1h --date yesterday',
    ],
    requiresConfig: true,
    run: track,
  },
  {
    name: 'stop',
    group: 'Entries',
    summary: 'Stop running timer',
    usage: 'tgp stop',
    description: 'Stop the currently running timer.',
    requiresConfig: true,
    run: stop,
  },
  {
    name: 'resume',
    group: 'Entries',
    summary: 'Resume a stopped timer',
    usage: resumeUsage,
    description:
      'Start a new timer with the description, project, and tags of a stopped\n' +
      'entry. Without an ID, resumes the latest entry stopped today, falling\n' +
      'back to yesterday.',
    arguments: [{ name: '[<entry_id>]', description: 'Optional entry ID from "tgp entry-list"' }],
    requiresConfig: true,
    run: resume,
  },
  {
    name: 'entry-edit',
    group: 'Entries',
    summary: 'Edit a time entry',
    usage: entryEditUsage,
    description:
      'Edit a time entry. Provide at least one option. Running entries keep\n' +
      'running. --dur only works on stopped entries and keeps the start time\n' +
      'fixed. On a stopped entry, --start alone keeps the end time fixed.',
    arguments: [{ name: '<entry_id>', description: 'Entry ID from "tgp entry-list"' }],
    options: entryEditOptions,
    examples: [
      'tgp entry-edit 4383745312 -d "Fixed typo" -t dev,review',
      'tgp entry-edit 4383745312 --start 11:20 --dur 1h30m',
      'tgp entry-edit 4383745312 --start 2026-07-14T11:20:00+07:00',
    ],
    requiresConfig: true,
    run: entryEdit,
  },
  {
    name: 'week',
    group: 'Entries',
    summary: 'Weekly summary by project',
    usage: weekUsage,
    description:
      'Show project totals for a week (Monday to Sunday). Defaults to the\n' +
      "current week. --date and --week can't be combined.",
    options: weekOptions,
    examples: ['tgp week -w -1', 'tgp week -d 2026-04-01', 'tgp week -v -w -1'],
    requiresConfig: true,
    run: week,
  },
  {
    name: 'entry-delete',
    group: 'Entries',
    summary: 'Delete a time entry',
    usage: entryDeleteUsage,
    description: 'Delete a time entry.',
    arguments: [{ name: '<entry_id>', description: 'Entry ID from "tgp entry-list"' }],
    requiresConfig: true,
    run: entryDelete,
  },
  {
    name: 'client-list',
    group: 'Clients',
    summary: 'List workspace clients',
    usage: clientListUsage,
    description: 'List clients in the workspace. Shows active clients by default.',
    options: clientListOptions,
    requiresConfig: true,
    run: clientList,
  },
  {
    name: 'client-add',
    group: 'Clients',
    summary: 'Create a client',
    usage: clientAddUsage,
    description: 'Create a client in the workspace.',
    arguments: [{ name: '"Client Name"', description: 'Name for the new client', text: true }],
    options: clientAddOptions,
    requiresConfig: true,
    run: clientAdd,
  },
  {
    name: 'client-delete',
    group: 'Clients',
    summary: 'Delete a client',
    usage: clientDeleteUsage,
    description: 'Delete a client from the workspace.',
    arguments: [{ name: '<client_id>', description: 'Client ID from "tgp client-list"' }],
    requiresConfig: true,
    run: clientDelete,
  },
  {
    name: 'client-rename',
    group: 'Clients',
    summary: 'Rename a client',
    usage: clientRenameUsage,
    description: 'Rename a client.',
    arguments: [
      { name: '<client_id>', description: 'Client ID from "tgp client-list"' },
      { name: '"New Name"', description: 'New client name', text: true },
    ],
    requiresConfig: true,
    run: clientRename,
  },
  {
    name: 'project-list',
    group: 'Projects',
    summary: 'List workspace projects',
    usage: projectListUsage,
    description: 'List active projects in the workspace.',
    options: projectListOptions,
    requiresConfig: true,
    run: projectList,
  },
  {
    name: 'project-create',
    group: 'Projects',
    summary: 'Create a project',
    usage: projectCreateUsage,
    description: 'Create a project. Projects are private unless --public is given.',
    arguments: [{ name: '"Project Name"', description: 'Name for the new project', text: true }],
    options: projectCreateOptions,
    requiresConfig: true,
    run: projectCreate,
  },
  {
    name: 'project-edit',
    group: 'Projects',
    summary: 'Edit a project',
    usage: projectEditUsage,
    description: 'Edit a project. Provide at least one option.',
    arguments: [{ name: '<project>', description: PROJECT_ARG, text: true }],
    options: projectEditOptions,
    examples: ['tgp project-edit Backend -c "Acme Corp" --public', 'tgp project-edit 1234567890 --client ""'],
    requiresConfig: true,
    run: projectEdit,
  },
  {
    name: 'project-rename',
    group: 'Projects',
    summary: 'Rename a project',
    usage: projectRenameUsage,
    description: 'Rename a project.',
    arguments: [
      { name: '<project>', description: PROJECT_ARG, text: true },
      { name: '"New Name"', description: 'New project name', text: true },
    ],
    requiresConfig: true,
    run: projectRename,
  },
  {
    name: 'project-delete',
    group: 'Projects',
    summary: 'Delete a project',
    usage: projectDeleteUsage,
    description: 'Delete a project from the workspace.',
    arguments: [{ name: '<project>', description: PROJECT_ARG, text: true }],
    requiresConfig: true,
    run: projectDelete,
  },
  {
    name: 'project-archive',
    group: 'Projects',
    summary: 'Archive a project',
    usage: projectArchiveUsage,
    description: 'Archive an active project. Restore it later with "tgp project-restore".',
    arguments: [{ name: '<project>', description: PROJECT_ARG, text: true }],
    requiresConfig: true,
    run: projectArchive,
  },
  {
    name: 'project-restore',
    group: 'Projects',
    summary: 'Restore a project',
    usage: projectRestoreUsage,
    description: 'Restore an archived project. List archived projects with\n"tgp project-list --all".',
    arguments: [{ name: '<project>', description: PROJECT_ARG, text: true }],
    requiresConfig: true,
    run: projectRestore,
  },
  {
    name: 'tag-list',
    group: 'Tags',
    summary: 'List tags',
    usage: 'tgp tag-list',
    description:
      'List tags in the workspace. Tags are also created automatically when\n' +
      'you use them, e.g. with "tgp track -t".',
    requiresConfig: true,
    run: tagList,
  },
  {
    name: 'tag-create',
    group: 'Tags',
    summary: 'Create a tag',
    usage: tagCreateUsage,
    description: 'Create a tag in the workspace.',
    arguments: [{ name: '"Tag Name"', description: 'Name for the new tag', text: true }],
    requiresConfig: true,
    run: tagCreate,
  },
  {
    name: 'tag-rename',
    group: 'Tags',
    summary: 'Rename a tag',
    usage: tagRenameUsage,
    description: 'Rename a tag.',
    arguments: [
      { name: '<tag_id>', description: 'Tag ID from "tgp tag-list"' },
      { name: '"New Name"', description: 'New tag name', text: true },
    ],
    requiresConfig: true,
    run: tagRename,
  },
  {
    name: 'tag-delete',
    group: 'Tags',
    summary: 'Delete a tag',
    usage: tagDeleteUsage,
    description: 'Delete a tag from the workspace.',
    arguments: [{ name: '<tag_id>', description: 'Tag ID from "tgp tag-list"' }],
    requiresConfig: true,
    run: tagDelete,
  },
];

export function findCommand(name: string): Command | undefined {
  return COMMANDS.find((c) => c.name === name);
}
