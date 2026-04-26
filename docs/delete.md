# `delete` — Delete a Time Entry

Deletes a time entry by its ID. Find the ID using `npm run entries`.

## Usage

```bash
npm run delete -- <entry_id>
```

The `--` is required so npm passes the argument to the script.

## Example

```bash
npm run entries
#   4383678597   20:02-20:13   0h10m   Ch 15 wrap up   Learning

npm run delete -- 4383678597
#   Deleted: Ch 15 wrap up (20:02-20:13) [Learning]
```

## Errors

- `Toggl API 403` — entry not found or not yours
- `Toggl API 404` — entry does not exist
