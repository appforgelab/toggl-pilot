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
tgp auth <your-api-token>
tgp me
tgp track "Working on feature" -p "My Project"
tgp stop
tgp entry-list
```

Get your API token from your [Toggl Profile](https://track.toggl.com/profile) (scroll to API Token section).

Running `tgp auth` saves your token so you don't need to pass it every time.
You can also set the `TOGGL_API_TOKEN` environment variable, which takes
priority over the saved config.

Run `tgp` without arguments to see all available commands.

## Commands

### General

| Command              | Description           | Docs                                             |
| -------------------- | --------------------- | ------------------------------------------------ |
| `tgp auth <token>`   | Save API token        |                                                  |
| `tgp version`        | Show CLI version      |                                                  |
| `tgp me`             | Verify authentication | [docs/me.md](docs/me.md)                         |
| `tgp workspace-list` | List workspaces       | [docs/workspace-list.md](docs/workspace-list.md) |

### Entries

| Command                                 | Description                 | Docs                                         |
| --------------------------------------- | --------------------------- | -------------------------------------------- |
| `tgp entry-list`                        | List time entries for a day | [docs/entry-list.md](docs/entry-list.md)     |
| `tgp track "Desc" -p "Project" -t tags` | Start a timer or log time   | [docs/track.md](docs/track.md)               |
| `tgp stop`                              | Stop running timer          | [docs/stop.md](docs/stop.md)                 |
| `tgp entry-edit <id> -d/-p/-t/--dur`    | Edit a time entry           | [docs/entry-edit.md](docs/entry-edit.md)     |
| `tgp week`                              | Weekly summary by project   | [docs/week.md](docs/week.md)                 |
| `tgp entry-delete <id>`                 | Delete a time entry         | [docs/entry-delete.md](docs/entry-delete.md) |

### Clients

Coming soon — `client-list`, `client-add`, `client-rename`, `client-delete`.

### Projects

| Command                          | Description             | Docs                                               |
| -------------------------------- | ----------------------- | -------------------------------------------------- |
| `tgp project-list`               | List workspace projects | [docs/project-list.md](docs/project-list.md)       |
| `tgp project-create`             | Create a project        | [docs/project-create.md](docs/project-create.md)   |
| `tgp project-rename <id> <name>` | Rename a project        | [docs/project-rename.md](docs/project-rename.md)   |
| `tgp project-delete <id>`        | Delete a project        | [docs/project-delete.md](docs/project-delete.md)   |
| `tgp project-archive <id>`       | Archive a project       | [docs/project-archive.md](docs/project-archive.md) |
| `tgp project-restore <id>`       | Restore a project       | [docs/project-restore.md](docs/project-restore.md) |

### Tags

| Command                          | Description  | Docs                                     |
| -------------------------------- | ------------ | ---------------------------------------- |
| `tgp tag-list`                   | List tags    | [docs/tag-list.md](docs/tag-list.md)     |
| `tgp tag-create "Tag Name"`      | Create a tag | [docs/tag-create.md](docs/tag-create.md) |
| `tgp tag-rename <id> "New Name"` | Rename a tag | [docs/tag-rename.md](docs/tag-rename.md) |
| `tgp tag-delete <id>`            | Delete a tag | [docs/tag-delete.md](docs/tag-delete.md) |

## Configuration

Run `tgp auth <token>` to save your API token to
`~/.config/tgp/config.env` (macOS/Linux) or
`%APPDATA%\tgp\config.env` (Windows).

You can also set environment variables, which take priority over the config
file:

| Variable             | Required | Description                        |
| -------------------- | -------- | ---------------------------------- |
| `TOGGL_API_TOKEN`    | Yes      | Your Toggl Track API token         |
| `TOGGL_WORKSPACE_ID` | No       | Defaults to your primary workspace |

## License

[MIT](LICENSE) · Made by [Stefano Locati](https://www.linkedin.com/in/stivlo/)
