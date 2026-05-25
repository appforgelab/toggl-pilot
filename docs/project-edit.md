# `project-edit` — Edit a Project

Edits an existing project in your workspace.

## Usage

```bash
tgp project-edit <project_id> [-n "New Name"] [-c "Client Name"] [--color "#0b83d9"] [--public|--private]
```

At least one edit flag is required.

## Output

```text
Project 1234567890 updated: name="Project Name" client="Acme Corp" color=#0b83d9 public
```

## Arguments

| Argument     | Description              |
| ------------ | ------------------------ |
| `project_id` | Toggl project ID to edit |

## Flags

| Flag                          | Description                                       |
| ----------------------------- | ------------------------------------------------- |
| `-n`, `--name <name>`         | Rename the project                                |
| `-c`, `--client <name or id>` | Assign a client by name or numeric ID             |
| `--client ""`                 | Remove the project client                         |
| `--color <hex>`               | Project color (e.g. `"#0b83d9"`)                  |
| `--public`                    | Make the project visible to all workspace members |
| `--private`                   | Make the project private                          |

## Examples

```bash
tgp project-edit 1234567890 -n "Website Redesign"
tgp project-edit 1234567890 -c "Acme Corp"
tgp project-edit 1234567890 --client ""
tgp project-edit 1234567890 --color "#ff0000" --public
```
