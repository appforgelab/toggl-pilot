import { hasConfig, ConfigNotFoundError } from './config.js';
import { findCommand } from './registry.js';
import { isHelpFlag, renderCommandHelp, renderGlobalHelp } from './help.js';
import { splitAtDoubleDash } from './utils.js';

export function main(argv: string[]): void | Promise<void> {
  const [name, ...args] = argv;

  if (name === undefined || isHelpFlag(name)) {
    console.log(renderGlobalHelp());
    return;
  }

  // `tgp help <command>` is an alias for `tgp <command> --help`, so both forms
  // share one code path (bare `tgp help` shows the global help). Anything after
  // the command name is irrelevant: help never runs the command.
  if (name === 'help') {
    const target = args.find((a) => !a.startsWith('-'));
    return main(target === undefined ? [] : [target, '--help']);
  }

  const command = findCommand(name);
  if (!command) {
    console.error(`Unknown command: ${name}`);
    console.error('Run "tgp --help" to see available commands.');
    process.exit(1);
  }

  // Intercept help before dispatch so a help flag is never handed to a command
  // as an argument, even after `--` (e.g. `tgp stop --help` must not stop the
  // running timer, and `tgp tag-create -- --help` must not create a tag).
  if (args.some(isHelpFlag)) {
    console.log(renderCommandHelp(command));
    return;
  }

  // Commands with options handle `--` in their parser (parseCommandLine). For the
  // rest, `--` ends flags here so a name may start with "-" (`tgp tag-create -- -wip`),
  // and stray input is an error instead of data: a command without options takes
  // no flags, and one without arguments takes nothing (e.g. `tgp stop --hlep` must
  // not stop the timer, and `tgp tag-create --verbose` must not create a tag).
  let commandArgs = args;
  if (!command.options) {
    const { before, after } = splitAtDoubleDash(args);
    commandArgs = [...before, ...after];
    const flagIndex = before.findIndex((a) => a.startsWith('-'));
    const flag = flagIndex === -1 ? undefined : before[flagIndex];
    const unexpected = command.arguments ? undefined : commandArgs[0];
    if (flag !== undefined || unexpected !== undefined) {
      // Everything before the first flag-like value is positional, so its index is
      // the argument it was meant for; suggest `--` only if that is a name.
      const escapeHint = command.arguments?.[flagIndex]?.text
        ? ' To pass a name that starts with "-", put -- before it.'
        : '';
      console.error(
        flag !== undefined ? `Unknown flag: ${flag}.${escapeHint}` : `Unexpected argument: ${unexpected}.`
      );
      console.error(`Usage: ${command.usage}`);
      process.exit(1);
    }
  }

  if (command.requiresConfig && !hasConfig()) {
    console.error(new ConfigNotFoundError().message);
    process.exit(1);
  }

  return command.run(commandArgs);
}
