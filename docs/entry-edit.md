# `entry-edit` — Edit a Time Entry

Edit the description, project, or tags of an existing time entry. Preserves the timer
state — running entries stay running, stopped entries stay stopped.

## Usage

```bash
tgt entry-edit <entry_id> [-d "New description"] [-p "Project name"] [-t tag1,tag2]
```

## Examples

```bash
tgt entry-edit 4383745312 -d "Updated description"
tgt entry-edit 4383745312 -p "Dev-Pilot"
tgt entry-edit 4383745312 -t dev,review
tgt entry-edit 4383745312 -d "Fixed typo" -p "Dev-Pilot" -t dev
```

## Options

| Flag            | Short | Description                         |
| --------------- | ----- | ----------------------------------- |
| `--description` | `-d`  | New description                     |
| `--project`     | `-p`  | New project name (case-insensitive) |
| `--tags`        | `-t`  | New tags (replaces existing)        |

You must provide at least one option. Find the entry ID using `tgt entry-list`.

## Output

```text
Updated: Fixed typo [Dev-Pilot] {dev, review} (id: 4383745312)
```
