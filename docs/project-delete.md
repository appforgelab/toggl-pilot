# `project-delete` — Delete a Project

Deletes a project from your workspace.

## Usage

```bash
tgp project-delete <project>
```

`<project>` can be a numeric project ID or an exact project name. Quotes are
only needed when your shell requires them, such as names containing spaces or
special characters.

## Output

```text
Project 1234567890 deleted.
```

## Arguments

| Argument  | Description                                |
| --------- | ------------------------------------------ |
| `project` | Project ID or exact project name to delete |

## Examples

```bash
tgp project-list
#   1234567890   Backend
#   9876543210   Frontend

tgp project-delete 1234567890
#   Project 1234567890 deleted.

tgp project-delete Frontend
#   Project 9876543210 deleted.
```

## Errors

- `Project <id> not found.` — project ID does not exist in the workspace
- `Project "<name>" not found.` — no project has that exact name
- `Multiple projects match "<name>". Use the numeric project ID:` — more than
  one project matches case-insensitively, including names that differ only by
  case
- Numeric-looking project names are interpreted as IDs and cannot be targeted by
  name
