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
    let message = (e as Error).message;
    // Suggest `--` for something like `-wip` where a name goes, but not for an ID
    // position or anything shaped like a flag (`-x`, `--tag`), which is likelier a typo.
    if (e instanceof UnknownFlagError && command.arguments?.[e.position]?.text && /^-[^-]./.test(e.flag)) {
      message = `${message.replace(/\.?$/, '.')} To pass a name that starts with "-", put -- after any options and before the name.`;
    }
    return rejectArguments(command, message);
  }

  // Optional arguments are written in brackets, e.g. `[<entry_id>]`.
  const declared = command.arguments ?? [];
  const missing = declared.slice(parsed.positionals.length).find((a) => !a.name.startsWith('['));
  if (missing) {
    return rejectArguments(command, `Missing argument: ${missing.name}.`);
  }
  if (parsed.positionals.length > declared.length) {
    return rejectArguments(command, `Unexpected argument: ${parsed.positionals[declared.length]}.`);
  }
  return parsed;
}

function rejectArguments(command: Command, message: string): never {
  console.error(message);
  console.error(`Usage: ${command.usage}`);
  process.exit(1);
}
