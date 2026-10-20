import { hasConfig, ConfigNotFoundError } from './config.js';
import { findCommand } from './registry.js';
import { isHelpFlag, renderCommandHelp, renderGlobalHelp } from './help.js';

function unknownCommand(name: string): never {
  console.error(`Unknown command: ${name}`);
  console.error('Run "tgp --help" to see available commands.');
  process.exit(1);
}

/** `tgp help [<command>]` */
function help(args: string[]): void {
  const [name, ...extra] = args;
  if (name === undefined || isHelpFlag(name)) {
    console.log(renderGlobalHelp());
    return;
  }
  if (extra.length > 0) {
    console.error('Usage: tgp help [<command>]');
    process.exit(1);
  }
  console.log(renderCommandHelp(findCommand(name) ?? unknownCommand(name)));
}

export function main(argv: string[]): void | Promise<void> {
  const [name, ...args] = argv;

  if (name === undefined || isHelpFlag(name)) {
    console.log(renderGlobalHelp());
    return;
  }

  if (name === 'help') {
    help(args);
    return;
  }

  const command = findCommand(name) ?? unknownCommand(name);

  // Intercept help before dispatch so a help flag is never handed to a command
  // as an argument (e.g. `tgp stop --help` must not stop the running timer, and
  // `tgp tag-create --help` must not create a tag named "--help").
  if (args.some(isHelpFlag)) {
    console.log(renderCommandHelp(command));
    return;
  }

  if (command.requiresConfig && !hasConfig()) {
    console.error(new ConfigNotFoundError().message);
    process.exit(1);
  }

  return command.run(args);
}
