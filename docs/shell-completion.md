# Shell Completion

## Goal

Add shell tab completion for commands, flags, and dynamic data (project names, tags).

## Approach

- Generate completion scripts for bash/zsh/fish from the command registry (`COMMANDS` in
  `src/registry.ts`), which already drives dispatch and `--help`. tgp deliberately has no CLI
  parser dependency (see #97)
- For **static** completion (commands, flags): command names come from `COMMANDS[].name`, flags
  from each command's structured `options` (`short`, `long`, and whether it takes a `value`)
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

- A small generator that turns `COMMANDS` into bash/zsh/fish completion scripts
- File system access for cache
- Consider: should the cache be per-workspace?
