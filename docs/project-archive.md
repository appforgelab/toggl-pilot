# `project-archive` — Archive a Project

Archives an active project in your workspace. Find the project ID using `tgp project-list`.

## Usage

```bash
tgp project-archive <project_id>
```

## Output

```text
Project 1234567890 archived.
```

## Arguments

| Argument     | Description                 |
| ------------ | --------------------------- |
| `project_id` | Toggl project ID to archive |

## Examples

```bash
tgp project-list
#   1234567890   Backend
#   9876543210   Frontend

tgp project-archive 1234567890
#   Project 1234567890 archived.
```

## Errors

- `Project <id> not found.` — project does not exist in the workspace
