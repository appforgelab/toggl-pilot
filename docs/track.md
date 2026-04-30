# `track` — Start a Timer or Log Time

Starts a running timer or logs a completed time entry with project and tags.

## Usage

```bash
tgp track "Description" [-p "Project name"] [-t tag1,tag2] [--at HH:MM] [--dur 1h30m]
```

## Running Timer

Omit `--at` and `--dur` to start a running timer:

```bash
tgp track "Fixing login bug"
tgp track "Code review" -p "Dev-Pilot"
tgp track "Sprint planning" -p "Client-X" -t meeting,planning
```

## Log Completed Entry

Provide both `--at` and `--dur` to create a completed entry:

```bash
tgp track "Morning standup" --at 09:00 --dur 30m
tgp track "Code review" -p "Dev-Pilot" --at 10:00 --dur 1h
tgp track "Bug fix" -p "Dev-Pilot" -t dev,bug --at 14:00 --dur 1h30m
```

## Options

| Flag        | Short | Description                                            |
| ----------- | ----- | ------------------------------------------------------ |
| `--project` | `-p`  | Project name (case-insensitive)                        |
| `--tags`    | `-t`  | Comma-separated tag names                              |
| `--at`      |       | Start time in HH:MM format (today) — requires `--dur`  |
| `--dur`     |       | Duration (e.g. `30m`, `1h`, `1h30m`) — requires `--at` |

## Project Lookup

Projects are looked up by name (case-insensitive). If no match is found, you'll get an
error. Use `tgp project-list` to see available names. If multiple projects share the
same name, the ambiguous matches are listed.

## Output

```text
Started: Fixing login bug [Dev-Pilot] {dev, bug} (id: 4383678598)
Logged: Morning standup [Dev-Pilot] (id: 4383678599)
```

## Tags

Tags are created automatically if they don't exist. Use them to categorize work (e.g. `meeting`, `dev`, `review`, `bug`).
