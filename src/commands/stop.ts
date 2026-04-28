import { get, put } from '../api.js';
import { formatDuration } from '../utils.js';

interface TimeEntry {
  id: number;
  description: string;
  start: string;
  stop: string | null;
  duration: number;
  project_name: string | null;
  workspace_id: number;
}

export async function stop() {
  const current = await get<TimeEntry | null>('/me/time_entries/current');

  if (!current) {
    console.log('No running timer.');
    return;
  }

  const wsId = current.workspace_id;
  const stopTime = new Date().toISOString();
  const durationSec = Math.floor((Date.now() - new Date(current.start).getTime()) / 1000);

  const stopped = await put<TimeEntry>(`/workspaces/${wsId}/time_entries/${current.id}`, {
    ...current,
    stop: stopTime,
    duration: durationSec,
  });

  const projectLabel = stopped.project_name ? ` [${stopped.project_name}]` : '';
  const dur = formatDuration(stopped.duration);
  console.log(`Stopped: ${stopped.description || '(no description)'}${projectLabel} (${dur})`);
}
