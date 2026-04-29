# toggl-pilot

[![npm version](https://img.shields.io/npm/v/toggl-pilot.svg)](https://www.npmjs.com/package/toggl-pilot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-toggl--pilot-blue?logo=github)](https://github.com/appforgelab/toggl-pilot)

Unofficial CLI for [Toggl Track](https://toggl.com/) time management, using the [Toggl Track API v9](https://developers.track.toggl.com/docs/).

Track your time from the terminal — start/stop timers, log entries, list projects and tags, edit and delete entries.

## Install

```bash
npm install -g toggl-pilot
```

## Quick Start

```bash
tgt auth <your-api-token>
tgt me
tgt track "Working on feature" -p "My Project"
tgt stop
tgt entry-list
```

Get your API token from your [Toggl Profile](https://track.toggl.com/profile) (scroll to API Token section).

Running `tgt auth` saves your token so you don't need to pass it every time.
You can also set the `TOGGL_API_TOKEN` environment variable, which takes
priority over the saved config.

Run `tgt` without arguments to see all available commands.

## Commands

| Command                                 | Description                 | Docs                                         |
| --------------------------------------- | --------------------------- | -------------------------------------------- |
| `tgt auth <token>`                      | Save API token              |                                              |
| `tgt version`                           | Show CLI version            |                                              |
| `tgt me`                                | Verify authentication       | [docs/me.md](docs/me.md)                     |
| `tgt entry-list`                        | List time entries for a day | [docs/entry-list.md](docs/entry-list.md)     |
| `tgt project-list`                      | List workspace projects     | [docs/project-list.md](docs/project-list.md) |
| `tgt entry-delete <id>`                 | Delete a time entry         | [docs/entry-delete.md](docs/entry-delete.md) |
| `tgt track "Desc" -p "Project" -t tags` | Start a timer or log time   | [docs/track.md](docs/track.md)               |
| `tgt stop`                              | Stop running timer          | [docs/stop.md](docs/stop.md)                 |
| `tgt tag-list`                          | List workspace tags         | [docs/tag-list.md](docs/tag-list.md)         |
| `tgt entry-edit <id> -d/-p/-t`          | Edit a time entry           | [docs/entry-edit.md](docs/entry-edit.md)     |

## Configuration

Run `tgt auth <token>` to save your API token to
`~/.config/tgt/config.env` (macOS/Linux) or
`%APPDATA%\tgt\config.env` (Windows).

You can also set environment variables, which take priority over the config
file:

| Variable             | Required | Description                        |
| -------------------- | -------- | ---------------------------------- |
| `TOGGL_API_TOKEN`    | Yes      | Your Toggl Track API token         |
| `TOGGL_WORKSPACE_ID` | No       | Defaults to your primary workspace |

## License

[MIT](LICENSE) · Made by [Stefano Locati](https://www.linkedin.com/in/stivlo/)
