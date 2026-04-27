# `edit` — Edit a Time Entry

Edit the description, project, or tags of an existing time entry. Preserves the timer
state — running entries stay running, stopped entries stay stopped.

## Usage

```bash
npm run edit -- <entry_id> [-d "New description"] [-p "Project name"] [-t tag1,tag2]
```

## Examples

```bash
npm run edit -- 4383745312 -d "Updated description"
npm run edit -- 4383745312 -p "Dev-Pilot"
npm run edit -- 4383745312 -t dev,review
npm run edit -- 4383745312 -d "Fixed typo" -p "Dev-Pilot" -t dev
```

## Options

| Flag            | Short | Description                         |
| --------------- | ----- | ----------------------------------- |
| `--description` | `-d`  | New description                     |
| `--project`     | `-p`  | New project name (case-insensitive) |
| `--tags`        | `-t`  | New tags (replaces existing)        |

You must provide at least one option. Find the entry ID using `npm run entries`.

## Output

```text
Updated: Fixed typo [Dev-Pilot] {dev, review} (id: 4383745312)
```
