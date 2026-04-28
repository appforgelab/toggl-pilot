# toggl-pilot

Unofficial CLI for [Toggl Track](https://toggl.com/) time management, using the [Toggl Track API v9](https://developers.track.toggl.com/docs/).

## Setup

```bash
cp .env.example .env
# Edit .env and add your Toggl API token
npm install
bash scripts/setup-hooks.sh
```

Get your API token from [Toggl Profile](https://track.toggl.com/profile) (scroll to API Token section).

## Commands

| Command                                        | Description                 | Docs                                         |
| ---------------------------------------------- | --------------------------- | -------------------------------------------- |
| `npm run me`                                   | Verify authentication       | [docs/me.md](docs/me.md)                     |
| `npm run entry-list`                           | List time entries for a day | [docs/entry-list.md](docs/entry-list.md)     |
| `npm run project-list`                         | List workspace projects     | [docs/project-list.md](docs/project-list.md) |
| `npm run entry-delete -- <id>`                 | Delete a time entry         | [docs/entry-delete.md](docs/entry-delete.md) |
| `npm run track -- "Desc" -p "Project" -t tags` | Start a timer or log time   | [docs/track.md](docs/track.md)               |
| `npm run stop`                                 | Stop running timer          | [docs/stop.md](docs/stop.md)                 |
| `npm run tag-list`                             | List workspace tags         | [docs/tag-list.md](docs/tag-list.md)         |
| `npm run entry-edit -- <id> -d/-p/-t`          | Edit a time entry           | [docs/entry-edit.md](docs/entry-edit.md)     |

## Environment Variables

| Variable             | Required | Description                        |
| -------------------- | -------- | ---------------------------------- |
| `TOGGL_API_TOKEN`    | Yes      | Your Toggl Track API token         |
| `TOGGL_WORKSPACE_ID` | No       | Defaults to your primary workspace |

## Architecture

```text
src/
  config.ts           # Env config + workspace resolution
  api.ts              # HTTP client with auth
  index.ts            # CLI entry point
  commands/
    entry-list.ts     # List time entries + totals
    project-list.ts   # List workspace projects
    entry-delete.ts   # Delete a time entry
    track.ts          # Start timer or log completed entry
    stop.ts           # Stop running timer
    tag-list.ts       # List workspace tags
    entry-edit.ts     # Edit time entry (desc, project, tags)
```

## License

[MIT](LICENSE) · Made by [Stefano Locati](https://www.linkedin.com/in/stivlo/)
