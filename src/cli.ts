import { hasConfig, ConfigNotFoundError } from './config.js';
import { findCommand, type Command } from './registry.js';
import { isHelpFlag, renderCommandHelp, renderGlobalHelp } from './help.js';
import { parseCommandLine, UnknownFlagError } from './utils.js';

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

  // Check the arguments against the registry before dispatch, so syntax errors
  // never reach a command: stray input is an error instead of data (e.g.
  // `tgp stop --hlep` must not stop the timer, and `tgp tag-create --verbose`
  // must not create a tag), and `--` works the same everywhere.
  const parsed = checkArguments(command, args);

  if (command.requiresConfig && !hasConfig()) {
    console.error(new ConfigNotFoundError().message);
    process.exit(1);
  }

  // Commands with options parse their own arguments again for the values; the
  // others take just the positionals (without `--`).
  return command.run(command.options ? args : parsed.positionals);
}

function checkArguments(command: Command, args: string[]): ReturnType<typeof parseCommandLine> {
  let parsed: ReturnType<typeof parseCommandLine>;
  try {
    parsed = parseCommandLine(args, command.options ?? []);
  } catch (e) {
    // Suggest `--` only if the flag-like value sits where a name goes, not an ID.
    let message = (e as Error).message;
    if (e instanceof UnknownFlagError && command.arguments?.[e.position]?.text) {
      message = `${message.replace(/\.?$/, '.')} To pass a name that starts with "-", put -- before it.`;
    }
    return rejectArguments(command, message);
  }

  if (!command.arguments && parsed.positionals.length > 0) {
    return rejectArguments(command, `Unexpected argument: ${parsed.positionals[0]}.`);
  }
  return parsed;
}

function rejectArguments(command: Command, message: string): never {
  console.error(message);
  console.error(`Usage: ${command.usage}`);
  process.exit(1);
}
