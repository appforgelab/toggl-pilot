# `client-list` — List Clients

Lists clients in your workspace with IDs, names, notes, and status.

## Usage

```bash
tgp client-list
tgp client-list --status active
tgp client-list --status archived
tgp client-list --status both
tgp client-list --name Acme
```

## Options

| Option                            | Description                                  |
| --------------------------------- | -------------------------------------------- |
| `--status active\|archived\|both` | Filter by client status. Defaults to active. |
| `--name <filter>`                 | Case-insensitive client name filter.         |

## Output

```text
Clients in workspace 21355416

  ID           Name                           Notes                Status
  ──────────── ────────────────────────────── ──────────────────── ────────
  123456789    Acme Corp                      Main client          active
  123456790    Beta Inc                       —                    active
```

## Columns

| Column | Description                   |
| ------ | ----------------------------- |
| ID     | Toggl client ID               |
| Name   | Client name                   |
| Notes  | Client notes, or `—` if blank |
| Status | `active` or `archived`        |
