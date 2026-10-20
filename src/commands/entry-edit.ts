import { get, put } from '../api.js';
import {
  parseDuration,
  parseOrExit,
  parseStartTime,
  requireFlagValue,
  matchFlag,
  unhandledOption,
  nothingToEditError,
} from '../utils.js';
import type { CommandOption } from '../types.js';

export const entryEditUsage =
  'tgp entry-edit <entry_id> [-d "New desc"] [-p "Project"] [-t tag1,tag2] [--dur 1h30m] [--start [H]H:MM]';

export const entryEditOptions: CommandOption[] = [
  { short: '-d', long: '--description', value: '<text>', description: 'New description' },
  { short: '-p', long: '--project', value: '<name>', description: 'New project name (case-insensitive)' },
  {
    short: '-t',
    long: '--tags',
    value: '<tags>',
    description: 'Replace tags (comma-separated; "" clears)',
  },
  { long: '--dur', value: '<duration>', description: 'New duration, e.g. 1h30m (stopped entries only)' },
  {
    long: '--start',
    value: '<time>',
    description: 'New start: [H]H:MM today, or ISO 8601 with timezone',
  },
];

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

const USAGE = `Usage: ${entryEditUsage}`;

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
  start: string,
  duration: number,
  stop: string | null,
  tags?: string[]
): TimeEntryUpdate {
  return {
    description,
    project_id: projectId,
    start,
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
  start: string | null;
} {
  let id: string | null = null;
  let description: string | null = null;
  let project: string | null = null;
  let tags: string[] | null = null;
  let dur: string | null = null;
  let start: string | null = null;
  const seen = new Set<CommandOption>();

  for (let i = 0; i < args.length; i++) {
    const option = matchFlag(args[i], entryEditOptions, seen);
    if (!option) {
      if (id !== null) throw new Error(USAGE);
      id = args[i];
      continue;
    }

    switch (option.long) {
      case '--description':
        description = requireFlagValue(args, i, args[i]);
        break;
      case '--project':
        project = requireFlagValue(args, i, args[i]);
        break;
      case '--tags':
        tags = normalizeTags(requireFlagValue(args, i, args[i], { allowEmpty: true }).split(','));
        break;
      case '--dur':
        dur = requireFlagValue(args, i, args[i]);
        break;
      case '--start':
        start = requireFlagValue(args, i, args[i]);
        break;
      default:
        unhandledOption(option);
    }
    if (option.value) i++;
  }

  if (!id) {
    throw new Error(USAGE);
  }

  if (!description && !project && !tags && !dur && !start) {
    throw nothingToEditError(entryEditOptions);
  }

  return { id, description, project, tags, dur, start };
}

export async function entryEdit(args: string[]) {
  const {
    id,
    description,
    project: projectName,
    tags: newTags,
    dur,
    start: startInput,
  } = parseOrExit(() => parseArgs(args));

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
  let newStartISO = entry.start;

  if (startInput) {
    // parseStartTime throws on invalid format or future start times.
    const newStart = parseStartTime(startInput);
    newStartISO = newStart.toISOString();
  }

  if (dur) {
    if (!entry.stop) {
      console.error('Cannot change duration of a running timer. Stop it first with: tgp stop');
      process.exit(1);
    }
    newDuration = parseDuration(dur);
    // stop = start + dur; uses the (possibly amended) start.
    newStop = new Date(new Date(newStartISO).getTime() + newDuration * 1000).toISOString();
  } else if (startInput) {
    if (!entry.stop) {
      // Running entry: keep it running via Toggl's negative-duration convention.
      newDuration = -Math.floor(new Date(newStartISO).getTime() / 1000);
      newStop = null;
    } else {
      // Stopped entry: keep stop fixed, recompute duration from the new start.
      const stopEpoch = new Date(entry.stop).getTime();
      const startEpoch = new Date(newStartISO).getTime();
      if (startEpoch >= stopEpoch) {
        console.error('Start time must be before the stop time.');
        process.exit(1);
      }
      newDuration = Math.floor((stopEpoch - startEpoch) / 1000);
    }
  }

  const nextDescription = description ?? entry.description;
  const hasEntryChanges = description !== null || projectName !== null || dur !== null || startInput !== null;
  const hasTagChanges =
    newTags !== null &&
    (diffTags(normalizeTags(entry.tags), newTags).length > 0 ||
      diffTags(newTags, normalizeTags(entry.tags)).length > 0);

  let updated = entry;

  if (hasEntryChanges || hasTagChanges) {
    updated = await put<TimeEntry>(
      `/workspaces/${wsId}/time_entries/${entry.id}`,
      buildUpdateBody(
        entry,
        nextDescription,
        projectId,
        newStartISO,
        newDuration,
        newStop,
        newTags !== null ? newTags : undefined
      )
    );
  }

  if (!hasEntryChanges && !hasTagChanges) {
    console.log('No changes.');
    return;
  }

  const projectLabel = updated.project_name ? ` [${updated.project_name}]` : '';
  const tagLabel = updated.tags?.length ? ` {${updated.tags.join(', ')}}` : '';
  console.log(`Updated: ${updated.description}${projectLabel}${tagLabel} (id: ${updated.id})`);
}
