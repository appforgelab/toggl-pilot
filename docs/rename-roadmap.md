# Rename: dev-pilot → toggl-pilot

## New Identity

- **npm package**: `toggl-pilot` (available on npm)
- **Binary command**: `tgt`
- **Repo**: rename GitHub repo when created
- Name is interface-agnostic — works for CLI, TUI, or desktop if added later

## Usage

```text
tgt me
tgt entries
tgt track "Fix bug" -p "My Project"
tgt stop
tgt edit <id> -d "New description"
tgt delete <id>
tgt tags
tgt projects
tgt auth <api-token>
```

## Changes Needed

### package.json

- `name`: `toggl-pilot`
- `bin`: `{ "tgt": "./dist/index.js" }` (after build setup)
- Update `description`, keywords (`toggl`, `toggl-track`, `time-tracking`, `cli`, `pilot`)

### npm scripts (development only)

Stay as `npm run` shortcuts for dev:

```json
"me": "tsx src/index.ts me",
"entries": "tsx src/index.ts entries",
"projects": "tsx src/index.ts projects",
"delete": "tsx src/index.ts delete",
"track": "tsx src/index.ts track",
"stop": "tsx src/index.ts stop",
"tags": "tsx src/index.ts tags",
"edit": "tsx src/index.ts edit"
```

### Source Code

- Replace all `dev-pilot` references with `toggl-pilot`
- Cache file: `~/.tgt-cache.json`
- Config file: `~/.tgt.env`
- Error messages, help text

### Docs

- `README.md` — update title, examples, install instructions
- `AGENTS.md` — update project name
- All files in `docs/`

### Distribution

- Add shebang `#!/usr/bin/env node` to entry point
- Add build step (compile TS to JS for npm publish)
- `.npmignore` or `files` field in package.json to control what gets published

## Future Interface Expansion

The `toggl-pilot` name scales beyond CLI:

- `tgt` — CLI mode (current)
- `tgt` — TUI mode (just `tgt` with no args, see interactive-mode.md)
- Desktop app — `toggl-pilot` works as an app name too

No renaming needed when adding new interfaces.

## Before Publishing Checklist

- [ ] Rename package and binary
- [ ] Add `bin` field to package.json
- [ ] Add build step (tsx → compiled JS)
- [ ] Add shebang to entry point
- [ ] Update all docs and README
- [ ] Implement `auth` command (see distributed-config.md)
- [ ] Test `npm pack` to verify published contents
- [ ] `npm publish`
