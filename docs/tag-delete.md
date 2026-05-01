# `tag-delete` — Delete a Tag

Deletes a tag from your workspace. Find the tag ID using `tgp tag-list`.

## Usage

```bash
tgp tag-delete <tag_id>
```

## Output

```text
Tag 1234567890 deleted.
```

## Arguments

| Argument | Description            |
| -------- | ---------------------- |
| `tag_id` | Toggl tag ID to delete |

## Examples

```bash
tgp tag-list
#   1234567890   Backend
#   9876543210   Frontend

tgp tag-delete 1234567890
#   Tag 1234567890 deleted.
```

## Errors

- `Tag <id> not found.` — tag does not exist in the workspace
