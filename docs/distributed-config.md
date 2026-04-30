# Distributed Config

## Problem

Currently config lives in `.env` inside the project directory.
When distributed via npm (`npm i -g toggl-pilot` or `npx toggl-pilot`),
users won't have a cloned repo.

## Approach: Hybrid

Support both environment variables and a config file, with env vars taking priority.

### Precedence Order

1. **Environment variables** (`TOGGL_API_TOKEN`, `TOGGL_WORKSPACE_ID`)
   — for CI/CD, scripting, `~/.zshrc`
2. **Config file** — for interactive daily use, same dotenv format

### Paths (cross-platform)

Resolved by `src/paths.ts` — no external dependencies.

|                 | Config                     | Cache                       |
| --------------- | -------------------------- | --------------------------- |
| **macOS/Linux** | `~/.config/tgp/config.env` | `~/.cache/tgp/`             |
| **Windows**     | `%APPDATA%\tgp\config.env` | `%LOCALAPPDATA%\tgp\Cache\` |

### Config File

Example (`~/.config/tgp/config.env`):

```env
TOGGL_API_TOKEN=your_token_here
TOGGL_WORKSPACE_ID=123456
```

### Setup Flow for New Users

```text
$ npm i -g toggl-pilot
$ tgp
  No config found. Run: tgp auth <api-token>
  Or set TOGGL_API_TOKEN in your environment.
  Get your token at https://track.toggl.com/profile

$ tgp auth my_api_token_here
  Config saved to ~/.config/tgp/config.env
  Authenticated as Stefano Locati (user@domain.com)

$ tgp me
  Authenticated as: Stefano Locati (user@domain.com)
  Default workspace: 123456
```

### Implementation

- `src/paths.ts`: cross-platform config/cache directory resolution
- `config.ts`: check env vars first, then fall back to config file via `paths.ts`
- `src/commands/auth.ts`: validate token via API (`getWithToken`), save to config file
- `api.ts`: `getWithToken()` for making API calls with an explicit token (needed by auth before config exists)
- Remove `dotenv` dependency — config file is parsed manually
- Keep `.env.example` in repo for contributors who clone

### Notes

- Config file is plain text — avoid storing anything beyond the API token
- `tgp auth` warns if config file has overly permissive permissions (suggests `chmod 600` on macOS/Linux)
- Config file is created with mode `0o600`
