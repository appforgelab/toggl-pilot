# `workspace-list` — List Workspaces

Lists all Toggl Track workspaces available to the authenticated user.

This command does not require `TOGGL_WORKSPACE_ID`. It is useful for finding the
workspace ID to use in configuration.

## Usage

```bash
tgp workspace-list
```

## Output

```text
ID           Name
──────────── ────────────────────
12345        My Workspace
67890        Client Workspace
```

## Columns

| Column | Description          |
| ------ | -------------------- |
| ID     | Toggl workspace ID   |
| Name   | Toggl workspace name |
