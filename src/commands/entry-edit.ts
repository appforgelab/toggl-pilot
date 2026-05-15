import { get, put } from '../api.js';
import { parseDuration, parseOrExit } from '../utils.js';

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

interface TimeEntryUpdate {
  description: string;
  project_id: number | null;
  start: string;
  stop: string | null;
  duration: number;
  workspace_id: number;
  billable: boolean;
  tags?: string[];
}

const VALID_FLAGS = new Set(['-p', '--project', '-t', '--tags', '-d', '--description', '--dur']);

function normalizeTags(tags: string[] | null): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const rawTag of tags ?? []) {
    const tag = rawTag.trim();
    const key = tag.toLowerCase();

    if (!tag || seen.has(key)) continue;
    seen.add(key);
    normalized.push(tag);
  }

  return normalized;
}

function tagKey(tag: string): string {
  return tag.toLowerCase();
}

function diffTags(source: string[], target: string[]): string[] {
  const targetKeys = new Set(target.map(tagKey));
  return source.filter((tag) => !targetKeys.has(tagKey(tag)));
}

function buildUpdateBody(
  entry: TimeEntry,
  description: string,
  projectId: number | null,
  duration: number,
  stop: string | null,
  tags?: string[]
): TimeEntryUpdate {
  return {
    description,
    project_id: projectId,
    start: entry.start,
    stop,
    duration,
    workspace_id: entry.workspace_id,
    billable: entry.billable,
    ...(tags !== undefined ? { tags } : {}),
  };
}

export function parseArgs(args: string[]): {
  id: string;
  description: string | null;
  project: string | null;
  tags: string[] | null;
  dur: string | null;
} {
  let id: string | null = null;
  let description: string | null = null;
  let project: string | null = null;
  let tags: string[] | null = null;
  let dur: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('-') && !VALID_FLAGS.has(args[i])) {
      throw new Error(
        `Unknown flag: ${args[i]}. Valid flags: -d/--description, -p/--project, -t/--tags, --dur`
      );
    }

    if ((args[i] === '-d' || args[i] === '--description') && args[i + 1]) {
      description = args[++i];
    } else if ((args[i] === '-p' || args[i] === '--project') && args[i + 1]) {
      project = args[++i];
    } else if ((args[i] === '-t' || args[i] === '--tags') && i + 1 < args.length) {
      tags = normalizeTags(args[++i].split(','));
    } else if (args[i] === '--dur' && args[i + 1]) {
      dur = args[++i];
    } else if (!args[i].startsWith('-') && !id) {
      id = args[i];
    }
  }

  if (!id) {
    throw new Error(
      'Usage: tgp entry-edit <entry_id> [-d "New desc"] [-p "Project"] [-t tag1,tag2] [--dur 1h30m]'
    );
  }

  if (!description && !project && !tags && !dur) {
    throw new Error('Nothing to edit. Provide at least one of: -d, -p, -t, --dur');
  }

  return { id: id!, description, project, tags, dur };
}

export async function entryEdit(args: string[]) {
  const { id, description, project: projectName, tags: newTags, dur } = parseOrExit(() => parseArgs(args));

  let entry: TimeEntry;
  try {
    entry = await get<TimeEntry>(`/me/time_entries/${id}`);
  } catch {
    console.error(`Entry ${id} not found.`);
    return;
  }

  const wsId = entry.workspace_id;

  let projectId = entry.project_id;
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

  let newDuration = entry.duration;
  let newStop = entry.stop;
  if (dur) {
    if (!entry.stop) {
      console.error('Cannot change duration of a running timer. Stop it first with: tgp stop');
      process.exit(1);
    }
    newDuration = parseDuration(dur);
    newStop = new Date(new Date(entry.start).getTime() + newDuration * 1000).toISOString();
  }

  const nextDescription = description ?? entry.description;
  const hasEntryChanges = description !== null || projectName !== null || dur !== null;
  const hasTagChanges =
    newTags !== null &&
    (diffTags(normalizeTags(entry.tags), newTags).length > 0 ||
      diffTags(newTags, normalizeTags(entry.tags)).length > 0);

  let updated = entry;

  if (hasEntryChanges || hasTagChanges) {
    await put<TimeEntry>(
      `/workspaces/${wsId}/time_entries/${entry.id}`,
      buildUpdateBody(
        entry,
        nextDescription,
        projectId,
        newDuration,
        newStop,
        newTags !== null ? newTags : undefined
      )
    );
    updated = await get<TimeEntry>(`/me/time_entries/${id}`);
  }

  const projectLabel = updated.project_name ? ` [${updated.project_name}]` : '';
  const tagLabel = updated.tags?.length ? ` {${updated.tags.join(', ')}}` : '';
  console.log(`Updated: ${updated.description}${projectLabel}${tagLabel} (id: ${updated.id})`);
}
