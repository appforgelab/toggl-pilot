import { get, put } from '../api.js';

interface TimeEntry {
  id: number;
  description: string;
  start: string;
  stop: string | null;
  duration: number;
  project_id: number | null;
  project_name: string | null;
  tags: string[] | null;
  workspace_id: number;
  billable: boolean;
}

interface Project {
  id: number;
  name: string;
}

const VALID_FLAGS = new Set(['-p', '--project', '-t', '--tags', '-d', '--description']);

function parseArgs(args: string[]): {
  id: string;
  description: string | null;
  project: string | null;
  tags: string[] | null;
} {
  let id: string | null = null;
  let description: string | null = null;
  let project: string | null = null;
  let tags: string[] | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('-') && !VALID_FLAGS.has(args[i])) {
      console.log(`Unknown flag: ${args[i]}`);
      console.log('Valid flags: -d/--description, -p/--project, -t/--tags');
      process.exit(1);
    }

    if ((args[i] === '-d' || args[i] === '--description') && args[i + 1]) {
      description = args[++i];
    } else if ((args[i] === '-p' || args[i] === '--project') && args[i + 1]) {
      project = args[++i];
    } else if ((args[i] === '-t' || args[i] === '--tags') && args[i + 1]) {
      tags = args[++i].split(',').map((t) => t.trim());
    } else if (!args[i].startsWith('-') && !id) {
      id = args[i];
    }
  }

  if (!id) {
    console.log('Usage: tsx src/index.ts edit <entry_id> [-d "New desc"] [-p "Project"] [-t tag1,tag2]');
    process.exit(1);
  }

  if (!description && !project && !tags) {
    console.log('Nothing to edit. Provide at least one of: -d, -p, -t');
    process.exit(1);
  }

  return { id: id!, description, project, tags };
}

export async function edit(args: string[]) {
  const { id, description, project: projectName, tags: newTags } = parseArgs(args.slice(1));

  let entry: TimeEntry;
  try {
    entry = await get<TimeEntry>(`/me/time_entries/${id}`);
  } catch {
    console.log(`Entry ${id} not found.`);
    return;
  }

  const wsId = entry.workspace_id;

  let projectId = entry.project_id;
  if (projectName) {
    const projects = await get<Project[]>(`/workspaces/${wsId}/projects`);
    const matches = projects.filter((p) => p.name.toLowerCase() === projectName.toLowerCase());
    if (matches.length === 0) {
      console.log(`Project "${projectName}" not found. Use "npm run projects" to list available projects.`);
      process.exit(1);
    }
    if (matches.length > 1) {
      console.log(`Multiple projects match "${projectName}":`);
      matches.forEach((p) => console.log(`  ${p.id}  ${p.name}`));
      process.exit(1);
    }
    projectId = matches[0].id;
  }

  const updated = await put<TimeEntry>(`/workspaces/${wsId}/time_entries/${entry.id}`, {
    ...entry,
    description: description ?? entry.description,
    project_id: projectId,
    tags: newTags ?? entry.tags,
  });

  const projectLabel = updated.project_name ? ` [${updated.project_name}]` : '';
  const tagLabel = updated.tags?.length ? ` {${updated.tags.join(', ')}}` : '';
  console.log(`Updated: ${updated.description}${projectLabel}${tagLabel} (id: ${updated.id})`);
}
