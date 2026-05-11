# `week` — Weekly Summary

Shows project totals for any week (Monday–Sunday). Defaults to the current week.

## Usage

```bash
tgp week                     # current week
tgp week --week -1           # last week
tgp week --week -3           # 3 weeks ago
tgp week --date 2026-04-01   # week containing Apr 1
```

### Flags

| Flag                | Shorthand       | Description                                                        |
| ------------------- | --------------- | ------------------------------------------------------------------ |
| `--week N`          | `-w N`          | Relative week offset (0 = current, -1 = last, 2 = two weeks ahead) |
| `--date YYYY-MM-DD` | `-d YYYY-MM-DD` | Show the week containing the given date                            |

`--date` and `--week` are mutually exclusive.

## Output

```text
Week 19 (May 05 – May 11)

  Project Alpha    12h30m
  Project Beta      8h15m
  Internal          3h00m
  ───────────────────────
  Total            23h45m
```

## Details

- Weeks run Monday through Sunday
- Displays ISO week number and date range
- Running timers are included with a live-calculated duration
- Entries without a project are excluded from per-project totals but included in the grand total
