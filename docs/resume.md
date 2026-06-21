# `resume` - Resume a Stopped Timer

Starts a new running timer from a previously stopped entry.

## Usage

```bash
tgp resume            # resume the latest task stopped today
tgp resume <id>       # resume a specific entry by ID
```

The `<id>` is the value shown in the first column of `tgp entry-list`, matching the
convention used by `tgp entry-edit <id>` and `tgp entry-delete <id>`.

## Behavior

### No argument (`tgp resume`)

Fetches recent time entries from Toggl and finds the latest stopped entry whose
stop time is today in your local calendar. It starts a new timer with the same
description, project, tags, and workspace.

Entries from previous days are ignored, even if they are the most recent stopped
entries overall. Running entries are ignored.

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

No stopped task today (no-arg form):

```text
No stopped task found today to resume.
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
