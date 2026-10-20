import { hasConfig, ConfigNotFoundError } from './config.js';
import { findCommand } from './registry.js';
import { isHelpFlag, renderCommandHelp, renderGlobalHelp } from './help.js';

export function main(argv: string[]): void | Promise<void> {
  const [name, ...args] = argv;

  if (name === undefined || isHelpFlag(name)) {
    console.log(renderGlobalHelp());
    return;
  }

  // `tgp help <command> ...` is an alias for `tgp <command> ... --help`, so both
  // forms share one code path (bare `tgp help` shows the global help).
  if (name === 'help') {
    return main(args.length > 0 ? [...args, '--help'] : []);
  }

  const command = findCommand(name);
  if (!command) {
    console.error(`Unknown command: ${name}`);
    console.error('Run "tgp --help" to see available commands.');
    process.exit(1);
  }

  // Intercept help before dispatch so a help flag is never handed to a command
  // as an argument (e.g. `tgp stop --help` must not stop the running timer, and
  // `tgp tag-create --help` must not create a tag named "--help").
  if (args.some(isHelpFlag)) {
    console.log(renderCommandHelp(command));
    return;
  }

  // Commands that document no arguments or options (e.g. `tgp stop`) take none, so
  // stray input such as a mistyped flag is an error rather than silently ignored.
  if (args.length > 0 && !command.arguments && !command.options) {
    console.error(`Usage: ${command.usage}`);
    process.exit(1);
  }

  if (command.requiresConfig && !hasConfig()) {
    console.error(new ConfigNotFoundError().message);
    process.exit(1);
  }

  return command.run(args);
}
