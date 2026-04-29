# `entry-delete` — Delete a Time Entry

Deletes a time entry by its ID. Find the ID using `tgt entry-list`.

## Usage

```bash
tgt entry-delete <entry_id>
```

## Example

```bash
tgt entry-list
#   4383678597   20:02-20:13   0h10m   Ch 15 wrap up   Learning

tgt entry-delete 4383678597
#   Deleted: Ch 15 wrap up (20:02-20:13) [Learning]
```

## Errors

- `Toggl API 403` — entry not found or not yours
- `Toggl API 404` — entry does not exist
