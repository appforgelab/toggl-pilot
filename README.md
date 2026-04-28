# toggl-pilot

Unofficial CLI for [Toggl Track](https://toggl.com/) time management, using the [Toggl Track API v9](https://developers.track.toggl.com/docs/).

## Setup

```bash
npm install
bash scripts/setup-hooks.sh
tgt auth <your-api-token>
```

Get your API token from [Toggl Profile](https://track.toggl.com/profile) (scroll to API Token section).

Config is saved to `~/.config/tgt/config.env` (macOS/Linux) or
`%APPDATA%\tgt\config.env` (Windows). You can also set `TOGGL_API_TOKEN`
as an environment variable, which takes priority over the config file.

## Commands

| Command                                 | Description                 | Docs                                         |
| --------------------------------------- | --------------------------- | -------------------------------------------- |
| `tgt auth <token>`                      | Save API token              |                                              |
| `tgt me`                                | Verify authentication       | [docs/me.md](docs/me.md)                     |
| `tgt entry-list`                        | List time entries for a day | [docs/entry-list.md](docs/entry-list.md)     |
| `tgt project-list`                      | List workspace projects     | [docs/project-list.md](docs/project-list.md) |
| `tgt entry-delete <id>`                 | Delete a time entry         | [docs/entry-delete.md](docs/entry-delete.md) |
| `tgt track "Desc" -p "Project" -t tags` | Start a timer or log time   | [docs/track.md](docs/track.md)               |
| `tgt stop`                              | Stop running timer          | [docs/stop.md](docs/stop.md)                 |
| `tgt tag-list`                          | List workspace tags         | [docs/tag-list.md](docs/tag-list.md)         |
| `tgt entry-edit <id> -d/-p/-t`          | Edit a time entry           | [docs/entry-edit.md](docs/entry-edit.md)     |

## Environment Variables

| Variable             | Required | Description                        |
| -------------------- | -------- | ---------------------------------- |
| `TOGGL_API_TOKEN`    | Yes      | Your Toggl Track API token         |
| `TOGGL_WORKSPACE_ID` | No       | Defaults to your primary workspace |

## Architecture

```text
src/
  paths.ts            # Cross-platform config/cache directory resolution
  config.ts           # Config loading (env vars > config file)
  api.ts              # HTTP client with auth
  index.ts            # CLI entry point
  commands/
    auth.ts           # Save API token (tgt auth)
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
