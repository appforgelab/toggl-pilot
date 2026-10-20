export interface TimeEntry {
  id: number;
  description: string;
  start: string;
  stop: string | null;
  duration: number;
  project_id: number | null;
  project_name: string | null;
  tags: string[] | null;
  workspace_id: number;
}

/**
 * A command-line option. Each command file exports its list; the parser derives
 * the flags it accepts from it and the registry shows it in `--help`.
 */
export interface CommandOption {
  short?: string;
  long: string;
  /** Placeholder for the flag's value, e.g. `<name>`. Omit for boolean flags. */
  value?: string;
  description: string;
  /** Accept an empty value, e.g. `--tags ""` to clear tags. */
  allowEmpty?: boolean;
}
