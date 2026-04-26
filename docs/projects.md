# `projects` — List Projects

Lists all projects in your workspace with IDs, names, clients, and status.

## Usage

```bash
npm run projects
```

## Output

```
Projects in workspace 21355416

  ID           Name                            Client                Status
  ──────────── ────────────────────────────── ──────────────────── ────────
  1234567890   Dev-Pilot                       —                     active
  1234567891   Client-X                        Acme Corp             active
  1234567892   Old Project                     —                     archived
```

## Columns

| Column | Description |
|--------|-------------|
| ID | Toggl project ID (use with `tasks` command) |
| Name | Project name |
| Client | Client name, or `—` if unassigned |
| Status | `active` or `archived` |
