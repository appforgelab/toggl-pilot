# `project-delete` — Delete a Project

Deletes a project from your workspace. Find the project ID using `tgp project-list`.

## Usage

```bash
tgp project-delete <project_id>
```

## Output

```text
Project 1234567890 deleted.
```

## Arguments

| Argument     | Description                |
| ------------ | -------------------------- |
| `project_id` | Toggl project ID to delete |

## Examples

```bash
tgp project-list
#   1234567890   Backend
#   9876543210   Frontend

tgp project-delete 1234567890
#   Project 1234567890 deleted.
```

## Errors

- `Project <id> not found.` — project does not exist in the workspace
