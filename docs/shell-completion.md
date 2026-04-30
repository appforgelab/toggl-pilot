# Shell Completion

## Goal

Add shell tab completion for commands, flags, and dynamic data (project names, tags).

## Approach

- Use a CLI parser that auto-generates completion scripts for bash/zsh/fish (e.g. `commander`, `yargs`, `oclif`)
- For **static** completion (commands, flags): handled by the parser out of the box
- For **dynamic** completion (project names, tags): fetch from API with a cache

## Caching Strategy

Cache file: `~/.tgp-cache.json`

```json
{
  "projects": {
    "data": [{ "id": 123, "name": "My Project" }],
    "fetchedAt": "2026-04-27T10:00:00Z"
  },
  "tags": {
    "data": [{ "id": 456, "name": "billing" }],
    "fetchedAt": "2026-04-27T10:00:00Z"
  }
}
```

- **TTL**: 15 minutes — cache is considered stale after this
- **API budget impact**: 2 requests per 15 min (projects + tags) = 8/hr, well within the 30/hr limit
- On completion: if cache is fresh, use it; if stale, fetch and update
- Commands like `npm run project-list` / `npm run tag-list` should also update the cache as a side effect

## Alternative: Interactive Picker (fzf)

For dynamic data, an fzf-based interactive picker is a simpler alternative to shell completion:

- Fetch list on demand when user runs a command
- Let user fuzzy-search and select
- Cross-platform (brew, apt, choco)
- No shell-specific completion scripts needed

Could be offered as a fallback or optional mode.

## Dependencies

- CLI parser with completion support (research needed: `commander` vs `yargs` vs `oclif`)
- File system access for cache
- Consider: should the cache be per-workspace?
