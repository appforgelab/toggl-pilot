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

### Release Process (via GitHub Actions)

The release uses two manual workflows.

#### Step 1: Prepare Release

1. Go to **Actions → Prepare Release → Run workflow**
2. Select bump type: `patch`, `minor`, or `major`
3. The workflow will:
   - Create a `release/vX.Y.Z` branch with the version bump
   - Create a PR with auto-generated release notes from `feat:`/`fix:` commits
   - Create a **draft** GitHub Release

#### Step 2: Review & Merge

1. Review the PR (package.json + package-lock.json version bump)
2. Edit the draft release notes if needed (at Releases → draft)
3. Merge the PR

#### Step 3: Publish

1. Go to **Actions → Publish → Run workflow**
2. The workflow reads the version from `package.json` — no input needed
3. The workflow will:
   - Read the version from `package.json`
   - Run all checks (typecheck, lint, test, format)
   - Create and push the git tag
   - Build and publish to npm
   - Mark the draft GitHub Release as published

### Prerequisites

- `NPM_TOKEN` must be configured as a GitHub Actions secret
  (npmjs.com → Access Tokens → Generate New Token → publish type)

## Future Interface Expansion

The `toggl-pilot` name scales beyond CLI:

- `tgt` — CLI mode (current)
- `tgt` — TUI mode (just `tgt` with no args, see interactive-mode.md)
- Desktop app — `toggl-pilot` works as an app name too
