# Interactive Mode

## Goal

When commands are run without required arguments, prompt the user interactively instead of showing an error.

## Approach: Interactive Prompts

Use a prompt library (`inquirer`, `@clack/prompts`, or `prompts`) to ask step-by-step questions in the terminal.

### Example Flow: `npm run track` (no args)

```text
$ npm run track

? Description: Fix login bug
? Project: (type to search…)
  › My Project
    Internal
    Client Work
? Tags: (press space to select)
  ◯ billing
  ◉ backend
  ◯ frontend
? Start time (or 'now'): now
? Duration or end time: 2h
```

### Candidate Commands

| Command   | Current behavior (no args) | Interactive behavior                       |
| --------- | -------------------------- | ------------------------------------------ |
| `track`   | Error                      | Prompt for desc, project, tags             |
| `edit`    | Error                      | Prompt for entry ID, then fields to change |
| `entries` | Show today                 | Prompt for date range                      |

### Libraries to Evaluate

- **`@clack/prompts`** — modern, lightweight, nice visuals (used by `create-vite`, `create-svelte`)
- **`inquirer`** — most popular, well-established, heavier
- **`prompts`** (terkelg) — minimal, fast, by the Next.js author

### Relationship to Shell Completion & Cache

Interactive mode and shell completion can share the same cache (`~/.tgt-cache.json`):

- When prompting for a project → show cached project list
  as selectable options
- When prompting for tags → show cached tags as multi-select
- If cache is stale (15min TTL), fetch fresh data first

This means interactive prompts get dynamic data without extra API calls beyond what the cache already handles.

## Future: Full TUI

A terminal UI (`ink`, `blessed`, `terminal-kit`) could provide a richer
experience — think `lazygit`-style interface showing entries, projects,
and timers in a single view. This would be a v2 effort if there's user
demand.

Not recommended for v1 due to complexity.
