# Distributed Config

## Problem

Currently config lives in `.env` inside the project directory.
When distributed via npm (`npm i -g dev-pilot` or `npx dev-pilot`),
users won't have a cloned repo.

## Approach: Hybrid

Support both environment variables and a config file, with env vars taking priority.

### Precedence Order

1. **Environment variables** (`TOGGL_API_TOKEN`, `TOGGL_WORKSPACE_ID`)
   — for CI/CD, scripting, `~/.zshrc`
2. **Config file** (`~/.dev-pilot.env`) — for interactive daily use,
   same dotenv format

### Config File Location

`~/.dev-pilot.env`

```env
TOGGL_API_TOKEN=your_token_here
TOGGL_WORKSPACE_ID=123456
```

### Setup Flow for New Users

```text
$ npm i -g dev-pilot
$ dev-pilot
  No config found. Run: dev-pilot auth <api-token>
  Or set TOGGL_API_TOKEN in your environment.
  Get your token at https://track.toggl.com/profile

$ dev-pilot auth my_api_token_here
  Config saved to ~/.dev-pilot.env

$ dev-pilot me
  ✓ Authenticated as Stefano Locati (user@domain.com)
```

### Changes Needed

- `config.ts`: check env vars first, then fall back to `~/.dev-pilot.env`
- New `auth` command: validate token via API, save to `~/.dev-pilot.env`
- Remove `.env` dependency on project directory
- Keep `.env.example` in repo for contributors who clone

### Notes

- Config file is plain text — avoid storing anything beyond the API token
- `dev-pilot auth` without a token could prompt interactively (see interactive-mode.md)
- Consider warning if config file has overly permissive permissions (e.g. `chmod 600`)
