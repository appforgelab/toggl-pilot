# AGENTS.md

## Project

CLI tool for Toggl Track time management. TypeScript, runs via `tsx`.

## Stack

- Node 22 + TypeScript (strict mode, ES modules)
- `tsx` for running TS directly
- Config via `~/.config/tgp/config.env` (macOS/Linux) or `%APPDATA%\tgp\config.env` (Windows)
- No framework — plain `fetch` for HTTP, no CLI parser yet

## Commands

See README.md for available commands and usage.

## Guidelines

- **Never commit directly to `main`** — always create a feature branch first
- **Never amend commits** that have been pushed to remote — create a new commit instead
- **After merging a PR**, switch to `main`, run `git pull && git fetch --prune`,
  then delete the local branch (`git branch -D <branch>` — use `-D` since squash
  merges require force delete)
- **When squash-merging a PR**, use `--subject` and `--body` to keep a clean commit
  message. The default includes all commit titles as bullet points in the body, which
  is messy. Example:
  `gh pr merge <number> --squash --subject "feat: add project-rename (#21)" --body "" --delete-branch`
- **Run `gh` commands outside the sandbox**. Sandboxed `gh` may report invalid auth
  or fail to reach GitHub even when the host keychain token is valid.
- **Prefer the installed `tgp` CLI** when exercising the tool (`tgp entry-list`, etc.).
  `tsx` is not on PATH; use `tgp` or `npx tsx src/index.ts`. Only drop to a
  one-off script hitting `src/api.ts` directly when no command covers the need
  (e.g. fetching `/me/time_entries/current`, or a rolling multi-day window —
  `entry-list` misses entries that started on a previous UTC day, such as
  overnight runners).

This file describes common mistakes and confusion points that an agent may encounter as
they work on this project. If you ever encounter something that surprises you or
confuses you, please alert the developer working with you and edit AGENTS.md to prevent
future agents from having the issue.

## PR Title Convention

Prefix PR titles with the type of change using conventional commit format:

- `feat:` — new feature or enhancement
- `fix:` — bug fix
- `chore:` — maintenance, tooling, dependency updates
- `docs:` — documentation changes
- `refactor:` — code restructuring without behavior change
- `test:` — adding or updating tests

This matters because CI will use `feat:` and `fix:` PRs for auto-generated release notes, while other types are excluded.

Example PR title: `feat: set up version management and workflow (#42)`

## Code Conventions

- **Usage messages** should use `tgp <command>` (user-facing), not `tsx src/index.ts <command>` (dev-facing)
- **New commands** must be added to `COMMANDS` in `src/registry.ts` — it drives both dispatch
  (`src/cli.ts`) and `tgp --help`. Keep its `usage` string in sync with the command's own
  `Usage:` error message. `--help`/`-h` is intercepted before dispatch, so commands never
  see it as an argument. `help` itself is not a registry command: `src/cli.ts` rewrites
  `tgp help <command>` to `tgp <command> --help`.
- **Flags are defined once**, in the `<command>Options` array exported by the command file
  (e.g. `trackOptions` in `src/commands/track.ts`). The parser builds its accepted flags and
  its `Unknown flag ... Valid flags:` message from it (`flagSet`, `validFlagsHint`, or
  `rejectUnknownArgs` for option-only commands in `src/utils.ts`), and the registry passes the
  same array to `--help`. To add a flag, add it there and handle it in the parser; also add it
  to the `usage` strings. Help text must fit in 80 columns (the `Usage:` line is exempt);
  break `description` lines with `\n`.

## API Quota (Free Plan)

30 requests per hour, per user, per organization. When developing/testing, be mindful
of this limit. During testing you may see 402 errors — wait for the quota reset
(time shown in the error message).
