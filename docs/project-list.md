# `project-list` — List Projects

Lists active projects in your workspace with IDs, names, clients, and status.
Pass `--all` or `-a` to include archived projects.

## Usage

```bash
tgp project-list
tgp project-list --all
tgp project-list -a
```

## Output with `--all`

```text
Projects in workspace 21355416

  ID           Name                            Client                Status
  ──────────── ────────────────────────────── ──────────────────── ────────
  1234567890   Dev-Pilot                       —                     active
  1234567891   Client-X                        Acme Corp             active
  1234567892   Old Project                     —                     archived
```

## Columns

| Column | Description                                 |
| ------ | ------------------------------------------- |
| ID     | Toggl project ID (use with `tasks` command) |
| Name   | Project name                                |
| Client | Client name, or `—` if unassigned           |
| Status | `active` or `archived`                      |
