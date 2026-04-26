import { del, get } from "../api.js";

interface TimeEntry {
  id: number;
  description: string;
  start: string;
  stop: string | null;
  project_name: string | null;
  workspace_id: number;
}

export async function deleteEntry(args: string[]) {
  const id = args.find((a) => !a.startsWith("-"));
  if (!id) {
    console.log("Usage: tsx src/index.ts delete <entry_id>");
    process.exit(1);
  }

  const entry = await get<TimeEntry>(`/me/time_entries/${id}`);
  const start = new Date(entry.start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const stop = entry.stop ? new Date(entry.stop).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "...";
  const desc = entry.description || "(no description)";
  const project = entry.project_name ? ` [${entry.project_name}]` : "";

  await del(`/workspaces/${entry.workspace_id}/time_entries/${id}`);
  console.log(`Deleted: ${desc} (${start}-${stop})${project}`);
}
