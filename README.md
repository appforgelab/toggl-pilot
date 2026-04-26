# dev-pilot

CLI tool for Toggl Track time management.

## Setup

```bash
cp .env.example .env
# Edit .env and add your Toggl API token
npm install
```

Get your API token from [Toggl Profile](https://track.toggl.com/profile) (scroll to API Token section).

## Commands

| Command | Description | Docs |
|---------|-------------|------|
| `npm run me` | Verify authentication | [docs/me.md](docs/me.md) |
| `npm run entries` | List time entries for a day | [docs/entries.md](docs/entries.md) |
| `npm run projects` | List workspace projects | [docs/projects.md](docs/projects.md) |
| `npm run delete -- <id>` | Delete a time entry | [docs/delete.md](docs/delete.md) |
| `npm run track -- "Desc" -p "Project" -t tags` | Start a timer or log time | [docs/track.md](docs/track.md) |
| `npm run stop` | Stop running timer | [docs/stop.md](docs/stop.md) |
| `npm run tags` | List workspace tags | [docs/tags.md](docs/tags.md) |
| `npm run edit -- <id> -d/-p/-t` | Edit a time entry | [docs/edit.md](docs/edit.md) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TOGGL_API_TOKEN` | Yes | Your Toggl Track API token |
| `TOGGL_WORKSPACE_ID` | No | Defaults to your primary workspace |

## Architecture

```
src/
  config.ts           # Env config + workspace resolution
  api.ts              # HTTP client with auth
  index.ts            # CLI entry point
  commands/
    entries.ts        # List time entries + totals
    projects.ts       # List workspace projects
    delete.ts         # Delete a time entry
    track.ts          # Start timer or log completed entry
    stop.ts           # Stop running timer
    tags.ts           # List workspace tags
    edit.ts           # Edit time entry (desc, project, tags)
```

## License

MIT
