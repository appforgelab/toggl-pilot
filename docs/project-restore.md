# `project-restore` — Restore a Project

Restores an archived project in your workspace. Find the project ID using `tgp project-list`.

## Usage

```bash
tgp project-restore <project_id>
```

## Output

```text
Project 1234567890 restored.
```

## Arguments

| Argument     | Description                 |
| ------------ | --------------------------- |
| `project_id` | Toggl project ID to restore |

## Examples

```bash
tgp project-list
#   1234567890   Backend
#   9876543210   Frontend

tgp project-restore 1234567890
#   Project 1234567890 restored.
```

## Errors

- `Project <id> not found.` — project does not exist in the workspace
