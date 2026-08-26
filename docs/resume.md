# `resume` - Resume a Stopped Timer

Starts a new running timer from a previously stopped entry.

## Usage

```bash
tgp resume            # resume the latest task stopped today (falls back to yesterday)
tgp resume <id>       # resume a specific entry by ID
```

The `<id>` is the value shown in the first column of `tgp entry-list`, matching the
convention used by `tgp entry-edit <id>` and `tgp entry-delete <id>`.

## Behavior

### No argument (`tgp resume`)

Fetches recent time entries from Toggl and finds the latest stopped entry whose
stop time is today in your local calendar. It starts a new timer with the same
description, project, tags, and workspace.

If nothing was stopped today, it falls back to the latest entry stopped
yesterday and prints a notice so the fallback is never silent. If yesterday
also has no stopped entries (e.g. Monday morning after a weekend off), an
error is printed. Entries older than yesterday are never resumed
automatically — use `tgp resume <id>` for those. Running entries are ignored.

### With an entry ID (`tgp resume <id>`)

Fetches that single entry via `GET /me/time_entries/{id}` and starts a new timer
with the same description, project, tags, and workspace. The "stopped today"
restriction does **not** apply — this lets you reach back further than today's
most recent stop.

## Common behavior

If a timer is already running, `resume` prints an error and does not start a new
one. Stop the running timer with `tgp stop` first.

## Output

Resuming a stopped task:

```text
Started: Fixing login bug [Dev-Pilot] {dev, bug} (id: 4383678598)
```

Falling back to yesterday's last stopped task (no-arg form):

```text
No stopped task found today; resuming yesterday's last:
Started: Fixing login bug [Dev-Pilot] {dev, bug} (id: 4383678598)
```

No stopped task today or yesterday (no-arg form):

```text
No stopped task found today or yesterday to resume.
```

Entry ID not found:

```text
Time entry 999999 not found.
```

Entry ID is still running:

```text
Time entry 4383678598 is still running and cannot be resumed. Stop it first with 'tgp stop'.
```

With a timer already running:

```text
Timer "Fixing login bug" is already running. Stop it first with 'tgp stop'.
```
