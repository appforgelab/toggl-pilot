import { config } from '../config.js';
import { get, post } from '../api.js';
import type { CommandOption, TimeEntry } from '../types.js';
import {
  parseDuration,
  buildStartTime,
  parseOrExit,
  localYesterdayDate,
  formatDate,
  matchFlag,
  unhandledOption,
  requireOptionValue,
} from '../utils.js';

export const trackUsage =
  'tgp track "Description" [-p "Project name"] [-t tag1,tag2] [--at [H]H:MM] [--dur 1h30m] [-d YYYY-MM-DD|yesterday]';

export const trackOptions: CommandOption[] = [
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
];

function isValidCalendarDate(s: string): boolean {
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

interface Project {
  id: number;
  name: string;
}

const USAGE = `Usage: ${trackUsage}`;

export function parseArgs(args: string[]): {
  description: string;
  project: string | null;
  tags: string[];
  at: string | null;
  dur: string | null;
  date: string | null;
} {
  let description: string | null = null;
  let project: string | null = null;
  let tags: string[] = [];
  let at: string | null = null;
  let dur: string | null = null;
  let date: string | null = null;
  const seen = new Set<CommandOption>();

  for (let i = 0; i < args.length; i++) {
    const option = matchFlag(args[i], trackOptions, seen);
    if (!option) {
      if (description !== null) throw new Error(USAGE);
      description = args[i];
      continue;
    }

    switch (option.long) {
      case '--project':
        project = requireOptionValue(args, i, option);
        break;
      case '--tags':
        tags = requireOptionValue(args, i, option)
          .split(',')
          .map((t) => t.trim());
        break;
      case '--at':
        at = requireOptionValue(args, i, option);
        break;
      case '--dur':
        dur = requireOptionValue(args, i, option);
        break;
      case '--date':
        date = requireOptionValue(args, i, option);
        break;
      default:
        unhandledOption(option);
    }
    if (option.value) i++;
  }

  if (!description) {
    throw new Error(USAGE);
  }

  return { description, project, tags, at, dur, date };
}

export async function track(args: string[]) {
  const {
    description,
    project: projectName,
    tags,
    at,
    dur,
    date: rawDate,
  } = parseOrExit(() => parseArgs(args));
  const wsId = await config.getWorkspaceId();

  let projectId: number | null = null;
  if (projectName) {
    const projects = await get<Project[]>(`/workspaces/${wsId}/projects`);
    const matches = projects.filter((p) => p.name.toLowerCase() === projectName.toLowerCase());
    if (matches.length === 0) {
      console.error(`Project "${projectName}" not found. Use "tgp project-list" to list available projects.`);
      process.exit(1);
    }
    if (matches.length > 1) {
      console.error(`Multiple projects match "${projectName}":`);
      matches.forEach((p) => console.error(`  ${p.id}  ${p.name}`));
      process.exit(1);
    }
    projectId = matches[0].id;
  }

  const isTimed = at !== null && dur !== null;
  if ((at !== null) !== (dur !== null)) {
    console.error('Both --at and --dur must be provided together, or neither for a running timer.');
    process.exit(1);
  }

  if (rawDate !== null && !isTimed) {
    console.error('--date requires both --at and --dur (cannot start a running timer in the past).');
    process.exit(1);
  }

  const resolvedDate = rawDate === 'yesterday' ? formatDate(localYesterdayDate()) : rawDate;

  if (resolvedDate !== null && !isValidCalendarDate(resolvedDate)) {
    console.error(`Invalid date: ${rawDate}. Use YYYY-MM-DD or "yesterday".`);
    process.exit(1);
  }

  const startTime = at ? buildStartTime(at, resolvedDate ?? undefined) : new Date().toISOString();
  const duration = dur ? parseDuration(dur) : -1;

  const entry = await post<TimeEntry>(`/workspaces/${wsId}/time_entries`, {
    description,
    project_id: projectId,
    tags: tags.length > 0 ? tags : undefined,
    start: startTime,
    duration,
    workspace_id: wsId,
    created_with: 'toggl-pilot',
  });

  const projectLabel = entry.project_name ? ` [${entry.project_name}]` : '';
  const tagLabel = entry.tags?.length ? ` {${entry.tags.join(', ')}}` : '';
  const action = isTimed ? 'Logged' : 'Started';
  console.log(`${action}: ${description}${projectLabel}${tagLabel} (id: ${entry.id})`);
}
