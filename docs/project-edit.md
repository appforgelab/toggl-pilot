# `project-edit` — Edit a Project

Edits an existing project in your workspace.

## Usage

```bash
tgp project-edit <project> [-n "New Name"] [-c "Client Name"] [--color "#0b83d9"] [--public|--private]
```

At least one edit flag is required.
`<project>` can be a numeric project ID or an exact project name. Quotes are
only needed when your shell requires them, such as names containing spaces or
special characters.

## Output

```text
Project 1234567890 updated: name="Project Name" client="Acme Corp" color=#0b83d9 public
```

## Arguments

| Argument  | Description                              |
| --------- | ---------------------------------------- |
| `project` | Project ID or exact project name to edit |

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
tgp project-edit Backend -c "Acme Corp"
tgp project-edit 1234567890 --client ""
tgp project-edit "Old Project" --color "#ff0000" --public
```

## Errors

- `Project "<name>" not found.` — no project has that exact name
- `Multiple projects match "<name>". Use the numeric project ID:` — more than
  one project matches case-insensitively, including names that differ only by
  case
- Numeric-looking project names are interpreted as IDs and cannot be targeted by
  name
