# toggl-pilot

[![npm version](https://img.shields.io/npm/v/toggl-pilot.svg)](https://www.npmjs.com/package/toggl-pilot) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

Get your API token from [Toggl Profile](https://track.toggl.com/profile) (scroll to API Token section).

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

Config is saved to `~/.config/tgt/config.env` (macOS/Linux) or
`%APPDATA%\tgt\config.env` (Windows). You can also set `TOGGL_API_TOKEN`
as an environment variable, which takes priority over the config file.

## Environment Variables

| Variable             | Required | Description                        |
| -------------------- | -------- | ---------------------------------- |
| `TOGGL_API_TOKEN`    | Yes      | Your Toggl Track API token         |
| `TOGGL_WORKSPACE_ID` | No       | Defaults to your primary workspace |

## Releasing

### PR Title Convention

Prefix PR titles with the type of change:

- `feat:` — new feature or enhancement (included in release notes)
- `fix:` — bug fix (included in release notes)
- `chore:`, `docs:`, `refactor:`, `test:` — excluded from release notes

### Version Bump

```bash
npm version patch   # 0.1.0 → 0.1.1 (bug fixes)
npm version minor   # 0.1.0 → 0.2.0 (new features)
npm version major   # 0.1.0 → 1.0.0 (breaking changes)
```

This bumps `package.json`, creates a git commit and tag (e.g. `v0.2.0`). Then push:

```bash
git push --follow-tags
```

### Release Notes

Release notes are auto-generated from `feat:` and `fix:` commits between tags. This will be set up in CI when a `v*` tag is pushed.

## Architecture

```text
src/
  paths.ts            # Cross-platform config/cache directory resolution
  config.ts           # Config loading (env vars > config file)
  api.ts              # HTTP client with auth
  index.ts            # CLI entry point
  commands/
    auth.ts           # Save API token (tgt auth)
    version.ts        # Show CLI version (tgt version)
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
