import { COMMANDS, GROUPS, type Command } from './registry.js';

export function isHelpFlag(arg: string): boolean {
  return arg === '--help' || arg === '-h';
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

  lines.push('', 'Run "tgp <command> --help" for details on a command.');
  return lines.join('\n');
}

export function renderCommandHelp(command: Command): string {
  return `Usage: ${command.usage}\n\n${command.summary}`;
}
