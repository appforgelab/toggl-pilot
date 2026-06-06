import { config } from '../config.js';
import { get, post } from '../api.js';
import { parseDuration, buildStartTime, parseOrExit, localYesterdayDate, formatLocalDate } from '../utils.js';

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

interface TimeEntry {
  id: number;
  description: string;
  start: string;
  duration: number;
  project_id: number | null;
  project_name: string | null;
  tags: string[] | null;
  workspace_id: number;
}

const VALID_FLAGS = new Set(['-p', '--project', '-t', '--tags', '--at', '--dur', '-d', '--date']);

export function parseArgs(args: string[]): {
  description: string;
  project: string | null;
  tags: string[];
  at: string | null;
  dur: string | null;
  date: string | null;
} {
  let description = '';
  let project: string | null = null;
  let tags: string[] = [];
  let at: string | null = null;
  let dur: string | null = null;
  let date: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('-') && !VALID_FLAGS.has(args[i])) {
      throw new Error(
        `Unknown flag: ${args[i]}. Valid flags: -p/--project, -t/--tags, --at, --dur, -d/--date`
      );
    }

    if ((args[i] === '-p' || args[i] === '--project') && args[i + 1]) {
      project = args[++i];
    } else if ((args[i] === '-t' || args[i] === '--tags') && args[i + 1]) {
      tags = args[++i].split(',').map((t) => t.trim());
    } else if (args[i] === '--at' && args[i + 1]) {
      at = args[++i];
    } else if (args[i] === '--dur' && args[i + 1]) {
      dur = args[++i];
    } else if (args[i] === '-d' || args[i] === '--date') {
      if (!args[i + 1] || args[i + 1].startsWith('-')) {
        throw new Error(`Missing value for ${args[i]}. Use YYYY-MM-DD or "yesterday".`);
      }
      date = args[++i];
    } else if (!args[i].startsWith('-')) {
      description = args[i];
    }
  }

  if (!description) {
    throw new Error(
      'Usage: tgp track "Description" [-p "Project name"] [-t tag1,tag2] [--at HH:MM] [--dur 1h30m] [-d YYYY-MM-DD|yesterday]'
    );
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

  const resolvedDate = rawDate === 'yesterday' ? formatLocalDate(localYesterdayDate()) : rawDate;

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
