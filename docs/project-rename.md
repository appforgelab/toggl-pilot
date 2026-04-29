# `project-rename` — Rename a Project

Renames an existing project in your workspace.

## Usage

```bash
tgt project-rename <project_id> "New Name"
```

## Output

```text
Project 1234567890 renamed to "New Name"
```

## Arguments

| Argument     | Description                |
| ------------ | -------------------------- |
| `project_id` | Toggl project ID to rename |
| `"New Name"` | New name for the project   |

## Examples

```bash
tgt project-rename 1234567890 "Website Redesign"
```
