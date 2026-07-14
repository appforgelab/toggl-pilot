# `entry-edit` — Edit a Time Entry

Edit the description, project, tags, start time, or duration of an existing time entry. Preserves the timer
state — running entries stay running, stopped entries stay stopped. When editing duration,
the start time stays fixed and the end time is recomputed. When editing the start time, the
timer state is preserved: a running entry keeps running from the new start, a stopped entry
keeps its end time fixed and recomputes the duration.

## Usage

```bash
tgp entry-edit <entry_id> [-d "New description"] [-p "Project name"] [-t tag1,tag2] [--dur 1h30m] [--start HH:MM]
```

## Examples

```bash
tgp entry-edit 4383745312 -d "Updated description"
tgp entry-edit 4383745312 -p "Dev-Pilot"
tgp entry-edit 4383745312 -t dev,review
tgp entry-edit 4383745312 --dur 1h30m
tgp entry-edit 4383745312 --start 11:20
tgp entry-edit 4383745312 --start 2026-07-14T11:20:00+07:00
tgp entry-edit 4383745312 -d "Fixed typo" -p "Dev-Pilot" -t dev
tgp entry-edit 4383745312 -d "Fixed typo" --dur 45m
tgp entry-edit 4383745312 --start 11:20 --dur 1h30m
```

## Options

| Flag            | Short | Description                                       |
| --------------- | ----- | ------------------------------------------------- |
| `--description` | `-d`  | New description                                   |
| `--project`     | `-p`  | New project name (case-insensitive)               |
| `--tags`        | `-t`  | New tags (replaces existing)                      |
| `--dur`         |       | New duration (e.g. `1h30m`, `2h`, `45m`)          |
| `--start`       |       | New start time (`HH:MM` today local, or ISO 8601) |

You must provide at least one option. Find the entry ID using `tgp entry-list`.

## Editing the start time

`--start` accepts a bare `HH:MM` (interpreted as today in your local timezone) or a full
ISO 8601 timestamp (e.g. `2026-07-14T11:20:00+07:00`). Future start times are rejected.

- **Running entry:** the timer keeps running from the new start time.
- **Stopped entry:** the end time stays fixed and the duration is recomputed. The new start
  must be before the end time.
- **`--start` + `--dur` together (stopped entry):** the end time is set to `start + duration`.

## Output

```text
Updated: Fixed typo [Dev-Pilot] {dev, review} (id: 4383745312)
```
