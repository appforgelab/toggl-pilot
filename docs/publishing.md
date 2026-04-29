# Publishing

## Identity

- **npm package**: `toggl-pilot`
- **Binary command**: `tgt`

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

## Future Interface Expansion

The `toggl-pilot` name scales beyond CLI:

- `tgt` — CLI mode (current)
- `tgt` — TUI mode (just `tgt` with no args, see interactive-mode.md)
- Desktop app — `toggl-pilot` works as an app name too
