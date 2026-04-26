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
```

## License

MIT
