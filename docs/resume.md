# `resume` - Resume Last Stopped Timer

Starts a new running timer using the most recent stopped entry from today.

## Usage

```bash
tgp resume
```

## Behavior

`resume` fetches recent time entries from Toggl and finds the latest stopped entry
whose stop time is today in your local calendar. It starts a new timer with the
same description, project, tags, and workspace.

If a timer is already running, `resume` prints an error and does not start a new
one. Stop the running timer with `tgp stop` first.

Entries from previous days are ignored, even if they are the most recent stopped
entries overall. Running entries are ignored.

## Output

With a stopped task today:

```text
Started: Fixing login bug [Dev-Pilot] {dev, bug} (id: 4383678598)
```

Without a stopped task today:

```text
No stopped task found today to resume.
```

With a timer already running:

```text
Timer "Fixing login bug" is already running. Stop it first with 'tgp stop'.
```
