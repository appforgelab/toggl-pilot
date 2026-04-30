# `tag-rename` — Rename a Tag

Renames an existing tag in your workspace.

## Usage

```bash
tgp tag-rename <tag_id> "New Name"
```

## Output

```text
Tag 1234567890 renamed to "New Name"
```

## Arguments

| Argument     | Description            |
| ------------ | ---------------------- |
| `tag_id`     | Toggl tag ID to rename |
| `"New Name"` | New name for the tag   |

## Examples

```bash
tgp tag-rename 1234567890 "Backend"
```
