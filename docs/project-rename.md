# `project-rename` — Rename a Project

Renames an existing project in your workspace.

## Usage

```bash
tgp project-rename <project> "New Name"
```

`<project>` can be a numeric project ID or an exact project name. Quotes are
only needed when your shell requires them, such as names containing spaces or
special characters.

## Output

```text
Project 1234567890 renamed to "New Name"
```

## Arguments

| Argument     | Description                                |
| ------------ | ------------------------------------------ |
| `project`    | Project ID or exact project name to rename |
| `"New Name"` | New name for the project                   |

## Examples

```bash
tgp project-rename 1234567890 "Website Redesign"
tgp project-rename Backend "API Backend"
```

## Errors

- `Project "<name>" not found.` — no project has that exact name
- `Multiple projects match "<name>". Use the numeric project ID:` — more than
  one project matches case-insensitively, including names that differ only by
  case
- Numeric-looking project names are interpreted as IDs and cannot be targeted by
  name
