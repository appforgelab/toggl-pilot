# `entry-delete` — Delete a Time Entry

Deletes a time entry by its ID. Find the ID using `tgp entry-list`.

## Usage

```bash
tgp entry-delete <entry_id>
```

## Example

```bash
tgp entry-list
#   4383678597   20:02-20:13   0h10m   Ch 15 wrap up   Learning

tgp entry-delete 4383678597
#   Deleted: Ch 15 wrap up (20:02-20:13) [Learning]
```

## Errors

- `Toggl API 403` — entry not found or not yours
- `Toggl API 404` — entry does not exist
