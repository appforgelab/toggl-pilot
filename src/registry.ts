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

export interface CommandArgument {
  /** Written exactly as it appears in `usage`, e.g. `<entry_id>` or `"Tag Name"`. */
  name: string;
  description: string;
}

export interface CommandOption {
  short?: string;
  long: string;
  /** Placeholder for the flag's value, e.g. `<name>`. Omit for boolean flags. */
  value?: string;
  description: string;
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
    usage: 'tgp auth <api-token>',
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
    usage: 'tgp workspace-use <workspace_id>',
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
    usage: 'tgp entry-list [-d YYYY-MM-DD|yesterday|<offset>]',
    description: 'List time entries for a day, with totals by project. Defaults to today.',
    options: [
      {
        short: '-d',
        long: '--date',
        value: '<date>',
        description: 'YYYY-MM-DD, "yesterday", or a day offset (e.g. -2)',
      },
    ],
    examples: ['tgp entry-list -d yesterday', 'tgp entry-list -d -2', 'tgp entry-list -d 2026-04-29'],
    requiresConfig: true,
    run: entryList,
  },
  {
    name: 'track',
    group: 'Entries',
    summary: 'Start a timer or log time',
    usage:
      'tgp track "Description" [-p "Project name"] [-t tag1,tag2] [--at [H]H:MM] [--dur 1h30m] [-d YYYY-MM-DD|yesterday]',
    description:
      'Start a running timer, or log a completed entry with --at and --dur.\n' +
      "Tags that don't exist yet are created automatically.",
    arguments: [{ name: '"Description"', description: 'Entry description' }],
    options: [
      { short: '-p', long: '--project', value: '<name>', description: 'Project name (case-insensitive)' },
      { short: '-t', long: '--tags', value: '<tags>', description: 'Comma-separated tag names' },
      { long: '--at', value: '<time>', description: 'Start time as [H]H:MM (requires --dur)' },
      { long: '--dur', value: '<duration>', description: 'Duration, e.g. 30m, 1h, 1h30m (requires --at)' },
      {
        short: '-d',
        long: '--date',
        value: '<date>',
        description: 'YYYY-MM-DD or "yesterday" (requires --at and --dur)',
      },
    ],
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
    usage: 'tgp resume [<entry_id>]',
    description:
      'Start a new timer with the description, project, and tags of a stopped\n' +
      'entry. Without an ID, resumes the latest entry stopped today, falling\n' +
      'back to yesterday.',
    arguments: [{ name: '<entry_id>', description: 'Entry to resume (ID from "tgp entry-list")' }],
    requiresConfig: true,
    run: resume,
  },
  {
    name: 'entry-edit',
    group: 'Entries',
    summary: 'Edit a time entry',
    usage:
      'tgp entry-edit <entry_id> [-d "New desc"] [-p "Project"] [-t tag1,tag2] [--dur 1h30m] [--start [H]H:MM]',
    description:
      'Edit a time entry. Provide at least one option. Running entries stay\n' +
      'running. On a stopped entry, --dur keeps the start time fixed and --start\n' +
      'keeps the end time fixed.',
    arguments: [{ name: '<entry_id>', description: 'Entry ID from "tgp entry-list"' }],
    options: [
      { short: '-d', long: '--description', value: '<text>', description: 'New description' },
      { short: '-p', long: '--project', value: '<name>', description: 'New project name (case-insensitive)' },
      {
        short: '-t',
        long: '--tags',
        value: '<tags>',
        description: 'Replace tags (comma-separated; "" clears)',
      },
      { long: '--dur', value: '<duration>', description: 'New duration, e.g. 30m, 1h, 1h30m' },
      {
        long: '--start',
        value: '<time>',
        description: 'New start: [H]H:MM today, or ISO 8601 with timezone',
      },
    ],
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
    usage: 'tgp week [-d YYYY-MM-DD|yesterday|<offset>] [-w <offset>] [-v]',
    description:
      'Show project totals for a week (Monday to Sunday). Defaults to the\n' +
      "current week. --date and --week can't be combined.",
    options: [
      {
        short: '-d',
        long: '--date',
        value: '<date>',
        description: 'Week containing YYYY-MM-DD, "yesterday", or a day offset',
      },
      {
        short: '-w',
        long: '--week',
        value: '<offset>',
        description: 'Week offset: 0 is this week, -1 last week',
      },
      { short: '-v', long: '--verbose', description: 'Show a per-day breakdown for each project' },
    ],
    examples: ['tgp week -w -1', 'tgp week -d 2026-04-01', 'tgp week -v -w -1'],
    requiresConfig: true,
    run: week,
  },
  {
    name: 'entry-delete',
    group: 'Entries',
    summary: 'Delete a time entry',
    usage: 'tgp entry-delete <entry_id>',
    description: 'Delete a time entry.',
    arguments: [{ name: '<entry_id>', description: 'Entry ID from "tgp entry-list"' }],
    requiresConfig: true,
    run: entryDelete,
  },
  {
    name: 'client-list',
    group: 'Clients',
    summary: 'List workspace clients',
    usage: 'tgp client-list [--status active|archived|both] [--name <filter>]',
    description: 'List clients in the workspace. Shows active clients by default.',
    options: [
      { long: '--status', value: '<status>', description: 'active, archived, or both (default: active)' },
      { long: '--name', value: '<filter>', description: 'Case-insensitive name filter' },
    ],
    requiresConfig: true,
    run: clientList,
  },
  {
    name: 'client-add',
    group: 'Clients',
    summary: 'Create a client',
    usage: 'tgp client-add "Client Name" [--notes "Some notes"]',
    description: 'Create a client in the workspace.',
    arguments: [{ name: '"Client Name"', description: 'Name for the new client' }],
    options: [{ long: '--notes', value: '<text>', description: 'Notes for the client' }],
    requiresConfig: true,
    run: clientAdd,
  },
  {
    name: 'client-delete',
    group: 'Clients',
    summary: 'Delete a client',
    usage: 'tgp client-delete <client_id>',
    description: 'Delete a client from the workspace.',
    arguments: [{ name: '<client_id>', description: 'Client ID from "tgp client-list"' }],
    requiresConfig: true,
    run: clientDelete,
  },
  {
    name: 'client-rename',
    group: 'Clients',
    summary: 'Rename a client',
    usage: 'tgp client-rename <client_id> "New Name"',
    description: 'Rename a client.',
    arguments: [
      { name: '<client_id>', description: 'Client ID from "tgp client-list"' },
      { name: '"New Name"', description: 'New client name' },
    ],
    requiresConfig: true,
    run: clientRename,
  },
  {
    name: 'project-list',
    group: 'Projects',
    summary: 'List workspace projects',
    usage: 'tgp project-list [--all|-a]',
    description: 'List active projects in the workspace.',
    options: [{ short: '-a', long: '--all', description: 'Include archived projects' }],
    requiresConfig: true,
    run: projectList,
  },
  {
    name: 'project-create',
    group: 'Projects',
    summary: 'Create a project',
    usage: 'tgp project-create "Project Name" [-c "Client Name"] [--color "#0b83d9"] [--public]',
    description: 'Create a project. Projects are private unless --public is given.',
    arguments: [{ name: '"Project Name"', description: 'Name for the new project' }],
    options: [
      { short: '-c', long: '--client', value: '<client>', description: 'Client name or ID' },
      { long: '--color', value: '<hex>', description: 'Project color, e.g. "#0b83d9"' },
      { long: '--public', description: 'Make the project visible to all workspace members' },
    ],
    requiresConfig: true,
    run: projectCreate,
  },
  {
    name: 'project-edit',
    group: 'Projects',
    summary: 'Edit a project',
    usage:
      'tgp project-edit <project> [-n "New Name"] [-c "Client Name"] [--color "#0b83d9"] [--public|--private]',
    description: 'Edit a project. Provide at least one option.',
    arguments: [{ name: '<project>', description: PROJECT_ARG }],
    options: [
      { short: '-n', long: '--name', value: '<name>', description: 'New project name' },
      {
        short: '-c',
        long: '--client',
        value: '<client>',
        description: 'Client name or ID ("" removes the client)',
      },
      { long: '--color', value: '<hex>', description: 'Project color, e.g. "#0b83d9"' },
      { long: '--public', description: 'Make the project visible to all workspace members' },
      { long: '--private', description: 'Make the project private' },
    ],
    examples: ['tgp project-edit Backend -c "Acme Corp" --public', 'tgp project-edit 1234567890 --client ""'],
    requiresConfig: true,
    run: projectEdit,
  },
  {
    name: 'project-rename',
    group: 'Projects',
    summary: 'Rename a project',
    usage: 'tgp project-rename <project> "New Name"',
    description: 'Rename a project.',
    arguments: [
      { name: '<project>', description: PROJECT_ARG },
      { name: '"New Name"', description: 'New project name' },
    ],
    requiresConfig: true,
    run: projectRename,
  },
  {
    name: 'project-delete',
    group: 'Projects',
    summary: 'Delete a project',
    usage: 'tgp project-delete <project>',
    description: 'Delete a project from the workspace.',
    arguments: [{ name: '<project>', description: PROJECT_ARG }],
    requiresConfig: true,
    run: projectDelete,
  },
  {
    name: 'project-archive',
    group: 'Projects',
    summary: 'Archive a project',
    usage: 'tgp project-archive <project>',
    description: 'Archive an active project. Restore it later with "tgp project-restore".',
    arguments: [{ name: '<project>', description: PROJECT_ARG }],
    requiresConfig: true,
    run: projectArchive,
  },
  {
    name: 'project-restore',
    group: 'Projects',
    summary: 'Restore a project',
    usage: 'tgp project-restore <project>',
    description: 'Restore an archived project. List archived projects with\n"tgp project-list --all".',
    arguments: [{ name: '<project>', description: PROJECT_ARG }],
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
    usage: 'tgp tag-create "Tag Name"',
    description: 'Create a tag in the workspace.',
    arguments: [{ name: '"Tag Name"', description: 'Name for the new tag' }],
    requiresConfig: true,
    run: tagCreate,
  },
  {
    name: 'tag-rename',
    group: 'Tags',
    summary: 'Rename a tag',
    usage: 'tgp tag-rename <tag_id> "New Name"',
    description: 'Rename a tag.',
    arguments: [
      { name: '<tag_id>', description: 'Tag ID from "tgp tag-list"' },
      { name: '"New Name"', description: 'New tag name' },
    ],
    requiresConfig: true,
    run: tagRename,
  },
  {
    name: 'tag-delete',
    group: 'Tags',
    summary: 'Delete a tag',
    usage: 'tgp tag-delete <tag_id>',
    description: 'Delete a tag from the workspace.',
    arguments: [{ name: '<tag_id>', description: 'Tag ID from "tgp tag-list"' }],
    requiresConfig: true,
    run: tagDelete,
  },
];

export function findCommand(name: string): Command | undefined {
  return COMMANDS.find((c) => c.name === name);
}
