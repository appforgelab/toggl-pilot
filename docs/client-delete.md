# `client-delete` — Delete a Client

Deletes a client from your workspace. Find the client ID using `tgp client-list`.

## Usage

```bash
tgp client-delete <client_id>
```

## Output

```text
Client 123456789 deleted.
```

## Arguments

| Argument    | Description               |
| ----------- | ------------------------- |
| `client_id` | Toggl client ID to delete |

## Examples

```bash
tgp client-list
#   123456789   Acme Corp
#   987654321   Globex

tgp client-delete 123456789
#   Client 123456789 deleted.
```

## Errors

- `Client <id> not found.` — client does not exist in the workspace
