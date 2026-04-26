# `entries` — List Time Entries

Lists all time entries for a given day with totals by project.

## Usage

```bash
npm run entries                        # today
npm run entries -- -d 2026-04-29       # specific date
npm run entries -- --date 2026-04-29   # long form
```

## Output

```
Time entries for 2026-04-29

  ID           Time           Dur.    Description            Project
  1234567890   09:00-10:30   1h30m   Dev: API client         Dev-Pilot
  1234567891   10:30-11:00   0h30m   Code review             Dev-Pilot
  1234567892   13:00-...     1h45m   Bug fixing              Client-X  ● running

─── Totals ─────────────────────────────────────────────
  Dev-Pilot      2h00m
  Client-X       1h45m
  Total          3h45m
```

## Columns

| Column | Description |
|--------|-------------|
| ID | Toggl time entry ID (use with `delete`) |
| Time | Start and stop times (`...` if still running) |
| Dur. | Duration of the entry |
| Description | Entry description |
| Project | Project name, or `—` if unassigned |

## Running Entries

Running time entries show `...` as the stop time, a live-calculated duration, and a `● running` indicator.
