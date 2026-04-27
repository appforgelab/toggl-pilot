# Publishing

## Identity

- **npm package**: `toggl-pilot`
- **Binary command**: `tgt`

## Before Publishing Checklist

- [ ] Add `bin` field to package.json: `{ "tgt": "./dist/index.js" }`
- [ ] Add build step (compile TS to JS)
- [ ] Add shebang `#!/usr/bin/env node` to entry point
- [ ] Add keywords to package.json (`toggl`, `toggl-track`, `time-tracking`, `cli`)
- [ ] Add `.npmignore` or `files` field to control published contents
- [ ] Implement `auth` command (see distributed-config.md)
- [ ] Update AGENTS.md project name
- [ ] Test `npm pack` to verify published contents
- [ ] `npm publish`

## Future Interface Expansion

The `toggl-pilot` name scales beyond CLI:

- `tgt` — CLI mode (current)
- `tgt` — TUI mode (just `tgt` with no args, see interactive-mode.md)
- Desktop app — `toggl-pilot` works as an app name too
