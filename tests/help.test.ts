import { describe, it, expect } from 'vitest';
import { COMMANDS, GROUPS, findCommand } from '../src/registry.js';
import { isHelpFlag, optionLabel, renderCommandHelp, renderGlobalHelp } from '../src/help.js';
import { VALID_FLAGS as trackFlags } from '../src/commands/track.js';
import { VALID_FLAGS as entryEditFlags } from '../src/commands/entry-edit.js';
import { VALID_FLAGS as projectCreateFlags } from '../src/commands/project-create.js';
import { VALID_FLAGS as projectEditFlags } from '../src/commands/project-edit.js';
import { VALID_FLAGS as clientAddFlags } from '../src/commands/client-add.js';

const MAX_WIDTH = 80;

/** True if `token` appears in `usage` as a whole word, e.g. `-d` but not inside `--dur`. */
function usageMentions(usage: string, token: string): boolean {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[\\s[|])${escaped}($|[\\s\\]|])`).test(usage);
}

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
    '%s documents only arguments that appear in its usage',
    (_, command) => {
      for (const arg of command.arguments ?? []) {
        expect(command.usage).toContain(arg.name);
      }
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
    ['track', trackFlags],
    ['entry-edit', entryEditFlags],
    ['project-create', projectCreateFlags],
    ['project-edit', projectEditFlags],
    ['client-add', clientAddFlags],
  ] as const)('%s help lists exactly the flags its parser accepts', (name, validFlags) => {
    const flags = findCommand(name)!.options!.flatMap((o) => (o.short ? [o.short, o.long] : [o.long]));
    expect(flags).toHaveLength(new Set(flags).size);
    expect(new Set(flags)).toEqual(validFlags);
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

describe('optionLabel', () => {
  it('joins short and long flags with the value placeholder', () => {
    expect(optionLabel({ short: '-p', long: '--project', value: '<name>', description: '' })).toBe(
      '-p, --project <name>'
    );
  });

  it('indents long-only flags so long flags line up', () => {
    expect(optionLabel({ long: '--dur', value: '<duration>', description: '' })).toBe('    --dur <duration>');
  });

  it('omits the placeholder for boolean flags', () => {
    expect(optionLabel({ short: '-v', long: '--verbose', description: '' })).toBe('-v, --verbose');
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
