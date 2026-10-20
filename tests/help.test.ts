import { describe, it, expect } from 'vitest';
import { COMMANDS, GROUPS, findCommand } from '../src/registry.js';
import { isHelpFlag, renderCommandHelp, renderGlobalHelp } from '../src/help.js';

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
    expect(lines.at(-1)).toBe('Run "tgp <command> --help" for details on a command.');
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
});

describe('renderCommandHelp', () => {
  it('prints usage and summary', () => {
    expect(renderCommandHelp(findCommand('tag-create')!)).toBe(
      'Usage: tgp tag-create "Tag Name"\n\nCreate a tag'
    );
  });
});
