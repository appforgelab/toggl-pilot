# `project-create` — Create a Project

Creates a new project in your workspace. Projects are private by default.

## Usage

```bash
tgp project-create "Project Name" [-c "Client Name"] [--color "#0b83d9"] [--public]
```

## Output

```text
Project 1234567890 created: "Project Name" [Client: Acme Corp]
```

## Arguments

| Argument         | Description              |
| ---------------- | ------------------------ |
| `"Project Name"` | Name for the new project |

## Flags

| Flag                          | Description                                                          |
| ----------------------------- | -------------------------------------------------------------------- |
| `-c`, `--client <name or id>` | Associate the project with a client (name or numeric ID)             |
| `--color <hex>`               | Project color (e.g. `"#0b83d9"`)                                     |
| `--public`                    | Make the project visible to all workspace members (default: private) |

## Examples

```bash
tgp project-create "Website Redesign"
tgp project-create "Mobile App" -c "Acme Corp"
tgp project-create "Internal Tool" --public --color "#ff0000"
tgp project-create "API" -c 99
```
