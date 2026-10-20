import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { COMMANDS, GROUPS, findCommand, type Command } from '../src/registry.js';
import { isHelpFlag, renderCommandHelp, renderGlobalHelp } from '../src/help.js';
import { entryListOptions, parseArgs as parseEntryList } from '../src/commands/entry-list.js';
import { trackOptions, parseArgs as parseTrack } from '../src/commands/track.js';
import { entryEditOptions, parseArgs as parseEntryEdit } from '../src/commands/entry-edit.js';
import { weekOptions, parseWeekArgs } from '../src/commands/week.js';
import { clientListOptions, parseArgs as parseClientList } from '../src/commands/client-list.js';
import { clientAddOptions, parseArgs as parseClientAdd } from '../src/commands/client-add.js';
import { projectListOptions, parseArgs as parseProjectList } from '../src/commands/project-list.js';
import { projectCreateOptions, parseArgs as parseProjectCreate } from '../src/commands/project-create.js';
import { projectEditOptions, parseArgs as parseProjectEdit } from '../src/commands/project-edit.js';

const MAX_WIDTH = 80;

/** True if `token` appears in `usage` as a whole word, e.g. `-d` but not inside `--dur`. */
function usageMentions(usage: string, token: string): boolean {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[\\s[|])${escaped}($|[\\s\\]|])`).test(usage);
}

/**
 * The positional tokens of a usage line: everything after `tgp <name>` except
 * option groups such as `[-p "Project"]` or `[--at [H]H:MM]` (brackets may nest).
 * Optional positionals keep their brackets, e.g. `[<entry_id>]`.
 */
function usagePositionals(command: Command): string[] {
  const rest = command.usage.slice(`tgp ${command.name}`.length);
  let kept = '';
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '[' && rest[i + 1] === '-') {
      for (let depth = 0; i < rest.length; i++) {
        if (rest[i] === '[') depth++;
        else if (rest[i] === ']' && --depth === 0) break;
      }
    } else {
      kept += rest[i];
    }
  }
  return kept.match(/"[^"]*"|\S+/g) ?? [];
}

/** Each command with options, its parser, and the minimal positional args it needs. */
const PARSERS: [string, (args: string[]) => unknown, string[]][] = [
  ['entry-list', parseEntryList, []],
  ['track', parseTrack, ['Desc']],
  ['entry-edit', parseEntryEdit, ['123']],
  ['week', parseWeekArgs, []],
  ['client-list', parseClientList, []],
  ['client-add', parseClientAdd, ['Acme']],
  ['project-list', parseProjectList, []],
  ['project-create', parseProjectCreate, ['Name']],
  ['project-edit', parseProjectEdit, ['proj']],
];

/** A valid value for every option that takes one, keyed by long flag. */
const SAMPLE_VALUES: Record<string, string> = {
  '--date': '2026-04-01',
  '--project': 'Dev',
  '--tags': 'dev,review',
  '--at': '09:00',
  '--dur': '1h',
  '--description': 'New',
  '--start': '09:00',
  '--week': '-1',
  '--status': 'both',
  '--name': 'Acme',
  '--notes': 'Notes',
  '--client': 'Acme',
  '--color': '#0b83d9',
};

describe('command registry', () => {
  it('has unique command names', () => {
    const names = COMMANDS.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(COMMANDS.map((c) => [c.name, c]))('%s usage starts with "tgp <name>"', (name, command) => {
    expect(command.usage === `tgp ${name}` || command.usage.startsWith(`tgp ${name} `)).toBe(true);
  });

  it('has at least one command in every group', () => {
    for (const group of GROUPS) {
      expect(COMMANDS.some((c) => c.group === group)).toBe(true);
    }
  });

  it('only lets auth and version run without config', () => {
    const noConfig = COMMANDS.filter((c) => !c.requiresConfig).map((c) => c.name);
    expect(noConfig).toEqual(['auth', 'version']);
  });

  it('finds commands by exact name', () => {
    expect(findCommand('track')?.name).toBe('track');
    expect(findCommand('trac')).toBeUndefined();
    expect(findCommand('--help')).toBeUndefined();
  });

  it.each(COMMANDS.map((c) => [c.name, c]))(
    '%s documents exactly the positional arguments in its usage',
    (_, command) => {
      expect((command.arguments ?? []).map((a) => a.name)).toEqual(usagePositionals(command));
    }
  );

  it.each(COMMANDS.map((c) => [c.name, c]))(
    '%s documents only flags that appear in its usage',
    (_, command) => {
      for (const option of command.options ?? []) {
        const mentioned = [option.short, option.long].some((f) => f && usageMentions(command.usage, f));
        expect(mentioned, `${option.long} missing from usage`).toBe(true);
      }
    }
  );

  it.each(COMMANDS.map((c) => [c.name, c]))('%s does not list the built-in help flag', (_, command) => {
    for (const option of command.options ?? []) {
      expect(isHelpFlag(option.long)).toBe(false);
      expect(option.short && isHelpFlag(option.short)).toBeFalsy();
    }
  });

  it.each(COMMANDS.map((c) => [c.name, c]))('%s examples invoke the command', (name, command) => {
    for (const example of command.examples ?? []) {
      expect(example.startsWith(`tgp ${name} `)).toBe(true);
    }
  });

  it.each([
    ['entry-list', entryListOptions],
    ['track', trackOptions],
    ['entry-edit', entryEditOptions],
    ['week', weekOptions],
    ['client-list', clientListOptions],
    ['client-add', clientAddOptions],
    ['project-list', projectListOptions],
    ['project-create', projectCreateOptions],
    ['project-edit', projectEditOptions],
  ] as const)('%s help shows the option list its parser validates against', (name, options) => {
    expect(findCommand(name)!.options).toBe(options);
  });

  it('has a parser test entry for every command with options', () => {
    expect(PARSERS.map(([name]) => name)).toEqual(COMMANDS.filter((c) => c.options).map((c) => c.name));
  });

  it.each(COMMANDS.map((c) => [c.name, c]))('%s has no duplicate flags', (_, command) => {
    const flags = (command.options ?? []).flatMap((o) => (o.short ? [o.short, o.long] : [o.long]));
    expect(new Set(flags).size).toBe(flags.length);
  });
});

describe('isHelpFlag', () => {
  it.each(['--help', '-h'])('accepts %s', (flag) => {
    expect(isHelpFlag(flag)).toBe(true);
  });

  it.each(['help', '-help', '--h', '-H', ''])('rejects %j', (arg) => {
    expect(isHelpFlag(arg)).toBe(false);
  });
});

describe('renderGlobalHelp', () => {
  const lines = renderGlobalHelp().split('\n');

  it('starts with the usage line and ends with the per-command hint', () => {
    expect(lines[0]).toBe('Usage: tgp <command> [options]');
    expect(lines.at(-1)).toBe('Run "tgp <command> --help" or "tgp help <command>" for details.');
  });

  it('lists group headings in order', () => {
    const headings = lines.filter((l) => (GROUPS as readonly string[]).includes(l));
    expect(headings).toEqual([...GROUPS]);
  });

  it('lists every command exactly once under its group with its summary', () => {
    for (const command of COMMANDS) {
      const matches = lines.filter((l) => l.trim().split(/\s+/)[0] === command.name);
      expect(matches).toHaveLength(1);
      expect(matches[0]).toMatch(new RegExp(`^  ${command.name}\\s+${command.summary}$`));

      const headingIdx = lines.lastIndexOf(command.group, lines.indexOf(matches[0]));
      const nextHeadingIdx = lines.findIndex(
        (l, i) => i > headingIdx && (GROUPS as readonly string[]).includes(l)
      );
      expect(headingIdx).toBeGreaterThan(-1);
      expect(nextHeadingIdx === -1 || lines.indexOf(matches[0]) < nextHeadingIdx).toBe(true);
    }
  });

  it('aligns summaries in a single column', () => {
    const commandLines = lines.filter((l) => l.startsWith('  '));
    const columns = new Set(
      commandLines.map((l) => {
        const command = COMMANDS.find((c) => l.trim().startsWith(c.name))!;
        return l.indexOf(command.summary);
      })
    );
    expect(columns.size).toBe(1);
  });

  it(`fits in ${MAX_WIDTH} columns`, () => {
    for (const line of lines) {
      expect(line.length, line).toBeLessThanOrEqual(MAX_WIDTH);
    }
  });
});

describe('renderCommandHelp', () => {
  it('renders usage, description, arguments, options, and examples', () => {
    expect(renderCommandHelp(findCommand('track')!)).toBe(
      [
        'Usage: tgp track "Description" [-p "Project name"] [-t tag1,tag2] [--at [H]H:MM] [--dur 1h30m] [-d YYYY-MM-DD|yesterday]',
        '',
        'Start a running timer, or log a completed entry with --at and --dur.',
        "Tags that don't exist yet are created automatically.",
        '',
        'Arguments:',
        '  "Description"         Entry description',
        '',
        'Options:',
        '  -p, --project <name>  Project name (case-insensitive)',
        '  -t, --tags <tags>     Comma-separated tag names',
        '      --at <time>       Start time as [H]H:MM (requires --dur)',
        '      --dur <duration>  Duration, e.g. 30m, 1h, 1h30m (requires --at)',
        '  -d, --date <date>     YYYY-MM-DD or "yesterday" (requires --at and --dur)',
        '  -h, --help            Show this help',
        '',
        'Examples:',
        '  tgp track "Code review" -p "Dev-Pilot" -t dev,review',
        '  tgp track "Standup" --at 09:00 --dur 30m',
        '  tgp track "Bug fix" --at 14:00 --dur 1h --date yesterday',
      ].join('\n')
    );
  });

  it('omits empty sections but always lists the help flag', () => {
    expect(renderCommandHelp(findCommand('stop')!)).toBe(
      [
        'Usage: tgp stop',
        '',
        'Stop the currently running timer.',
        '',
        'Options:',
        '  -h, --help  Show this help',
      ].join('\n')
    );
  });

  it.each(COMMANDS.map((c) => [c.name, c]))(
    `%s help fits in ${MAX_WIDTH} columns after the usage line`,
    (_, command) => {
      const [, ...rest] = renderCommandHelp(command).split('\n');
      for (const line of rest) {
        expect(line.length, line).toBeLessThanOrEqual(MAX_WIDTH);
      }
    }
  );
});

describe.each(PARSERS)('%s parser', (name, parse, base) => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each(findCommand(name)!.options!.map((o) => [o.long, o]))(
    'handles documented option %s',
    (flag, option) => {
      const value = option.value ? [SAMPLE_VALUES[flag]] : [];
      expect(value, `add a sample value for ${flag} to SAMPLE_VALUES`).not.toContain(undefined);

      // Throws "Bug: ... not handled" if the parser has no case for the option.
      const result = parse([...base, flag, ...value]);

      // Where the base args parse on their own, the option must change the result
      // (catches an option that is accepted but ignored).
      let baseline: unknown;
      try {
        baseline = parse(base);
      } catch {
        return;
      }
      expect(result).not.toEqual(baseline);
    }
  );
});
