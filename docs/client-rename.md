# `client-rename` — Rename a Client

Renames an existing client in your workspace.

## Usage

```bash
tgp client-rename <client_id> "New Name"
```

## Output

```text
Client 123456789 renamed to "New Name"
```

## Arguments

| Argument     | Description               |
| ------------ | ------------------------- |
| `client_id`  | Toggl client ID to rename |
| `"New Name"` | New name for the client   |

## Examples

```bash
tgp client-rename 123456789 "Acme Corp"
```

## Errors

- `Client <id> not found.` — client does not exist in the workspace
