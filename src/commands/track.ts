import { config } from '../config.js';
import { get, post } from '../api.js';
import { parseDuration, buildStartTime, parseOrExit } from '../utils.js';

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

const VALID_FLAGS = new Set(['-p', '--project', '-t', '--tags', '--at', '--dur']);

export function parseArgs(args: string[]): {
  description: string;
  project: string | null;
  tags: string[];
  at: string | null;
  dur: string | null;
} {
  let description = '';
  let project: string | null = null;
  let tags: string[] = [];
  let at: string | null = null;
  let dur: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('-') && !VALID_FLAGS.has(args[i])) {
      throw new Error(`Unknown flag: ${args[i]}. Valid flags: -p/--project, -t/--tags, --at, --dur`);
    }

    if ((args[i] === '-p' || args[i] === '--project') && args[i + 1]) {
      project = args[++i];
    } else if ((args[i] === '-t' || args[i] === '--tags') && args[i + 1]) {
      tags = args[++i].split(',').map((t) => t.trim());
    } else if (args[i] === '--at' && args[i + 1]) {
      at = args[++i];
    } else if (args[i] === '--dur' && args[i + 1]) {
      dur = args[++i];
    } else if (!args[i].startsWith('-')) {
      description = args[i];
    }
  }

  if (!description) {
    throw new Error(
      'Usage: tsx src/index.ts track "Description" [-p "Project name"] [-t tag1,tag2] [--at HH:MM] [--dur 1h30m]'
    );
  }

  return { description, project, tags, at, dur };
}

export async function track(args: string[]) {
  const { description, project: projectName, tags, at, dur } = parseOrExit(() => parseArgs(args));
  const wsId = await config.getWorkspaceId();

  let projectId: number | null = null;
  if (projectName) {
    const projects = await get<Project[]>(`/workspaces/${wsId}/projects`);
    const matches = projects.filter((p) => p.name.toLowerCase() === projectName.toLowerCase());
    if (matches.length === 0) {
      console.log(
        `Project "${projectName}" not found. Use "npm run project-list" to list available projects.`
      );
      process.exit(1);
    }
    if (matches.length > 1) {
      console.log(`Multiple projects match "${projectName}":`);
      matches.forEach((p) => console.log(`  ${p.id}  ${p.name}`));
      process.exit(1);
    }
    projectId = matches[0].id;
  }

  const isTimed = at !== null && dur !== null;
  if ((at !== null) !== (dur !== null)) {
    console.log('Both --at and --dur must be provided together, or neither for a running timer.');
    process.exit(1);
  }

  const startTime = at ? buildStartTime(at) : new Date().toISOString();
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
