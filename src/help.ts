import { COMMANDS, GROUPS, type Command } from './registry.js';
import type { CommandOption } from './types.js';
import { optionLabel } from './utils.js';

const HELP_OPTION: CommandOption = { short: '-h', long: '--help', description: 'Show this help' };

export function isHelpFlag(arg: string): boolean {
  return arg === HELP_OPTION.short || arg === HELP_OPTION.long;
}

export function renderGlobalHelp(commands: Command[] = COMMANDS): string {
  const width = Math.max(...commands.map((c) => c.name.length)) + 2;
  const lines = ['Usage: tgp <command> [options]'];

  for (const group of GROUPS) {
    const inGroup = commands.filter((c) => c.group === group);
    if (inGroup.length === 0) continue;
    lines.push('', group);
    for (const c of inGroup) {
      lines.push(`  ${c.name.padEnd(width)}${c.summary}`);
    }
  }

  lines.push('', 'Run "tgp <command> --help" or "tgp help <command>" for details.');
  return lines.join('\n');
}

export function renderCommandHelp(command: Command): string {
  const args = (command.arguments ?? []).map((a) => [a.name, a.description]);
  const options = [...(command.options ?? []), HELP_OPTION].map((o) => [optionLabel(o), o.description]);
  // Arguments and options share one description column.
  const width = Math.max(...[...args, ...options].map(([label]) => label.length)) + 2;
  const rows = (entries: string[][]) => entries.map(([label, text]) => `  ${label.padEnd(width)}${text}`);

  const sections = [`Usage: ${command.usage}`, command.description];
  if (args.length > 0) sections.push(['Arguments:', ...rows(args)].join('\n'));
  sections.push(['Options:', ...rows(options)].join('\n'));
  if (command.examples?.length) {
    sections.push(['Examples:', ...command.examples.map((e) => `  ${e}`)].join('\n'));
  }
  return sections.join('\n\n');
}
