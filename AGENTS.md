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
  (`src/cli.ts`) and `tgp --help`. `--help`/`-h` is intercepted before dispatch, so commands
  never see it as an argument. `help` itself is not a registry command: `src/cli.ts` rewrites
  `tgp help <command>` to `tgp <command> --help`.
- **Usage strings and flags are defined once, in the command file.** A command that prints a
  usage line exports `<command>Usage` (e.g. `trackUsage`, without the `Usage:` prefix) and
  uses it in its error; a command with flags exports `<command>Options` (e.g. `trackOptions`)
  and parses against it with the helpers in `src/utils.ts`: `parseOptions` for option-only
  commands (values keyed by long flag), or `matchFlag` plus a `switch (option.long)` ending in
  `default: unhandledOption(option)` for commands with positional arguments. Both reject
  unknown and repeated flags. The registry references both exports, so `--help` can't drift
  from the parser. For a command without `options`, `src/cli.ts` rejects flag-like arguments
  (and, if it also has no `arguments`, any argument at all) before dispatch; `--` ends flags
  there so a value can start with `-` (`tgp tag-create -- -wip`). Help flags show help even
  after `--`. Commands with options don't support `--` yet; mark free-text arguments with
  `text: true` so the unknown-flag error suggests `--`.
- **To add a flag**, add it to `<command>Options`, handle it in the parser, update
  `<command>Usage`, and add a sample value to `SAMPLE_VALUES` in `tests/help.test.ts` (that
  test fails if a documented option isn't handled). Help text must fit in 80 columns (the
  `Usage:` line is exempt); break `description` lines with `\n`.

## API Quota (Free Plan)

30 requests per hour, per user, per organization. When developing/testing, be mindful
of this limit. During testing you may see 402 errors — wait for the quota reset
(time shown in the error message).
