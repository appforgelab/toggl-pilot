# AGENTS.md

## Project

CLI tool for Toggl Track time management. TypeScript, runs via `tsx`.

## Stack

- Node 22 + TypeScript (strict mode, ES modules)
- `tsx` for running TS directly
- Config via `~/.config/tgt/config.env` (macOS/Linux) or `%APPDATA%\tgt\config.env` (Windows)
- No framework — plain `fetch` for HTTP, no CLI parser yet

## Commands

See README.md for available commands and usage.

## Guidelines

- **Never commit directly to `main`** — always create a feature branch first
- **After merging a PR**, switch to `main`, run `git pull && git fetch --prune`, then delete the local branch (`git branch -d <branch>`)

This file describes common mistakes and confusion points that an agent may encounter as
they work on this project. If you ever encounter something that surprises you or
confuses you, please alert the developer working with you and edit AGENTS.md to prevent
future agents from having the issue.

## Branch Naming Convention

Format: `<type>/<issue-number>-<short-description>` or `<type>/<short-description>`

- **Types**: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
- **Issue number**: include when one exists, omit for quick fixes
- **Description**: kebab-case, concise

Examples:

- `fix/16-entries-column-alignment`
- `feat/42-add-time-filtering`
- `fix/typo-in-help-text`
- `chore/update-deps`

## API Quota (Free Plan)

30 requests per hour, per user, per organization. When developing/testing, be mindful
of this limit. During testing you may see 402 errors — wait for the quota reset
(time shown in the error message).
