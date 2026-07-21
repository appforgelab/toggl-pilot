# `week` — Weekly Summary

Shows project totals for any week (Monday–Sunday). Defaults to the current week.

## Usage

```bash
tgp week                     # current week
tgp week --week -1           # last week
tgp week --week -3           # 3 weeks ago
tgp week --date 2026-04-01   # week containing Apr 1
tgp week -d yesterday        # week containing yesterday
tgp week --date -2           # week containing the date two days ago
tgp week --verbose           # current week with daily breakdown
tgp week -v --week -1        # last week with daily breakdown
```

### Flags

| Flag        | Shorthand | Description                                                                               |
| ----------- | --------- | ----------------------------------------------------------------------------------------- |
| `--week N`  | `-w N`    | Relative week offset (0 = current, -1 = last, 2 = two weeks ahead)                        |
| `--date D`  | `-d D`    | Week containing ISO date `D`, `yesterday`, or integer day offset (negative past, 0 today) |
| `--verbose` | `-v`      | Show a per-day breakdown matrix for each project                                          |

`--date` and `--week` are mutually exclusive. `--verbose` can be combined with either.
Positive `--date` offsets select future local calendar dates, matching the signed-offset
behavior of `--week`.

## Output

### Compact mode (default)

```text
Week 19 (May 05 – May 11)

Project Alpha   12h30m
Project Beta     8h15m
Internal         3h00m
──────────────────────
Total           23h45m
```

### Verbose mode (`--verbose` / `-v`)

```text
Week 19 (May 05 – May 11)

                 Mon    Tue    Wed    Thu    Fri    Sat    Sun    Total
Project Alpha   2h30m  3h00m  1h00m  2h00m  4h00m      -      -   12h30m
Project Beta    1h15m  2h00m  3h00m      -  2h00m      -      -    8h15m
—                   -  1h00m      -  1h30m      -      -      -    2h30m
──────────────────────────────────────────────────────────────────────────
Daily Total     3h45m  5h00m  4h00m  3h30m  7h30m      -      -   23h45m
```

## Details

- Weeks run Monday through Sunday
- Displays ISO week number and date range
- Running timers are included with a live-calculated duration
- Entries without a project are excluded from per-project totals but included in the grand total
- In verbose mode, entries without a project appear as `—` and are sorted last
- Column widths are calculated dynamically based on the widest value in each column
