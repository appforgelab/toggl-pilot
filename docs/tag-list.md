# `tag-list` — List Tags

Lists all tags in your workspace.

## Usage

```bash
npm run tag-list
```

## Output

```text
Tags in workspace 21355416

  ID           Name
  ──────────── ────────────────────
  123456       dev
  123457       meeting
  123458       review
```

Tags are created automatically when you use them with `npm run track -- -t tagname`. There's no need to create them separately.
