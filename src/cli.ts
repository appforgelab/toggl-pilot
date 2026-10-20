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

  // A command without options takes no flags, and one without arguments takes
  // nothing, so stray input is an error instead of data (e.g. `tgp stop --hlep`
  // must not stop the timer, and `tgp tag-create --verbose` must not create a tag).
  if (!command.options) {
    const stray = command.arguments ? args.find((a) => a.startsWith('-')) : args[0];
    if (stray !== undefined) {
      console.error(`Usage: ${command.usage}`);
      process.exit(1);
    }
  }

  if (command.requiresConfig && !hasConfig()) {
    console.error(new ConfigNotFoundError().message);
    process.exit(1);
  }

  return command.run(args);
}
