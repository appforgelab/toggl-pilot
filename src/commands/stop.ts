import { config } from "../config.js";
import { get, put } from "../api.js";

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
  const current = await get<TimeEntry | null>("/me/time_entries/current");

  if (!current) {
    console.log("No running timer.");
    return;
  }

  const wsId = current.workspace_id;
  const stopped = await put<TimeEntry>(`/workspaces/${wsId}/time_entries/${current.id}`, {
    ...current,
    stop: new Date().toISOString(),
  });

  const projectLabel = stopped.project_name ? ` [${stopped.project_name}]` : "";
  const dur = formatDuration(stopped.duration);
  console.log(`Stopped: ${stopped.description || "(no description)"}${projectLabel} (${dur})`);
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h${String(m).padStart(2, "0")}m`;
}
