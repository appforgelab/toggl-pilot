# `workspace-use` — Set Active Workspace

Sets the active workspace, saved to config so it persists across runs.

## Usage

```bash
tgp workspace-use <workspace_id>
```

Run `tgp workspace-list` to find the workspace ID.

## Output

```text
Active workspace set to: My Workspace (12345)
```

## Behavior

- Validates the workspace ID against your available workspaces
- Saves `TOGGL_WORKSPACE_ID` to the config file (same file as `tgp auth`)
- Subsequent commands use the saved workspace via `config.getWorkspaceId()`
- The `TOGGL_WORKSPACE_ID` environment variable takes priority over the saved config
