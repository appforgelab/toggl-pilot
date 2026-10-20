import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/config.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/config.js')>()),
  hasConfig: vi.fn(),
}));
vi.mock('../src/commands/auth.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/commands/auth.js')>()),
  auth: vi.fn(),
}));
vi.mock('../src/commands/version.js', () => ({ version: vi.fn() }));
vi.mock('../src/commands/stop.js', () => ({ stop: vi.fn() }));
vi.mock('../src/commands/track.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/commands/track.js')>()),
  track: vi.fn(),
}));
vi.mock('../src/commands/tag-create.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/commands/tag-create.js')>()),
  tagCreate: vi.fn(),
}));

import { hasConfig, ConfigNotFoundError } from '../src/config.js';
import { auth } from '../src/commands/auth.js';
import { version } from '../src/commands/version.js';
import { stop } from '../src/commands/stop.js';
import { track } from '../src/commands/track.js';
import { tagCreate } from '../src/commands/tag-create.js';
import { findCommand } from '../src/registry.js';
import { renderCommandHelp, renderGlobalHelp } from '../src/help.js';
import { main } from '../src/cli.js';

const mockedHasConfig = vi.mocked(hasConfig);

describe('main', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockedHasConfig.mockReturnValue(true);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  describe('global help', () => {
    it.each([[[]], [['help']], [['--help']], [['-h']]])(
      'prints grouped help for %j without requiring config',
      (argv) => {
        mockedHasConfig.mockReturnValue(false);

        main(argv);

        expect(logSpy).toHaveBeenCalledWith(renderGlobalHelp());
        expect(errorSpy).not.toHaveBeenCalled();
        expect(exitSpy).not.toHaveBeenCalled();
      }
    );
  });

  describe('unknown command', () => {
    it('prints an error with a hint and exits 1', () => {
      expect(() => main(['nope'])).toThrow('exit');

      expect(errorSpy).toHaveBeenCalledWith('Unknown command: nope');
      expect(errorSpy).toHaveBeenCalledWith('Run "tgp --help" to see available commands.');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('per-command help', () => {
    it.each(['--help', '-h'])('prints stop help for %s without stopping the timer', (flag) => {
      main(['stop', flag]);

      expect(logSpy).toHaveBeenCalledWith(renderCommandHelp(findCommand('stop')!));
      expect(stop).not.toHaveBeenCalled();
    });

    it.each([[['tag-create', '--help']], [['tag-create', 'Bug', '-h']], [['tag-create', '-h', 'Bug']]])(
      'never runs the command for %j',
      (argv) => {
        main(argv);

        expect(logSpy).toHaveBeenCalledWith(renderCommandHelp(findCommand('tag-create')!));
        expect(tagCreate).not.toHaveBeenCalled();
      }
    );

    it('works without config', () => {
      mockedHasConfig.mockReturnValue(false);

      main(['stop', '--help']);

      expect(logSpy).toHaveBeenCalledWith(renderCommandHelp(findCommand('stop')!));
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });

  describe('help <command>', () => {
    it.each([[['help', 'stop']], [['help', 'stop', '--help']], [['help', 'stop', 'extra']]])(
      'behaves like `<command> --help` for %j, without running it or requiring config',
      (argv) => {
        mockedHasConfig.mockReturnValue(false);

        main(argv);

        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(logSpy).toHaveBeenCalledWith(renderCommandHelp(findCommand('stop')!));
        expect(stop).not.toHaveBeenCalled();
        expect(exitSpy).not.toHaveBeenCalled();
      }
    );

    it.each([[['help', '--help']], [['help', '-h']], [['help', 'help']]])(
      'prints grouped help for %j',
      (argv) => {
        main(argv);

        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(logSpy).toHaveBeenCalledWith(renderGlobalHelp());
      }
    );

    it('rejects an unknown command', () => {
      expect(() => main(['help', 'nope'])).toThrow('exit');

      expect(errorSpy).toHaveBeenCalledWith('Unknown command: nope');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('dispatch', () => {
    it('passes the remaining args to the command', () => {
      main(['tag-create', 'Bug']);

      expect(tagCreate).toHaveBeenCalledWith(['Bug']);
    });

    it.each([
      [['stop', 'now'], 'Unexpected argument: now.'],
      [['stop', '--hlep'], 'Unknown flag: --hlep.'],
      [['version', 'extra'], 'Unexpected argument: extra.'],
      [['stop', '--', 'x'], 'Unexpected argument: x.'],
    ])('rejects arguments for a command that takes none: %j', (argv, message) => {
      expect(() => main(argv)).toThrow('exit');

      expect(errorSpy).toHaveBeenCalledWith(message);
      expect(errorSpy).toHaveBeenCalledWith(`Usage: ${findCommand(argv[0])!.usage}`);
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(stop).not.toHaveBeenCalled();
      expect(version).not.toHaveBeenCalled();
    });

    it.each([
      [['tag-create', '--verbose'], '--verbose'],
      [['tag-create', 'Bug', '-x'], '-x'],
    ])('rejects a flag for a command without options: %j', (argv, flag) => {
      expect(() => main(argv)).toThrow('exit');

      expect(errorSpy).toHaveBeenCalledWith(
        `Unknown flag: ${flag}. To pass a value that starts with "-", put -- before it.`
      );
      expect(errorSpy).toHaveBeenCalledWith('Usage: tgp tag-create "Tag Name"');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(tagCreate).not.toHaveBeenCalled();
    });

    it.each([
      [['tag-create', '--', '-wip'], ['-wip']],
      [['tag-create', '--', '--help'], ['--help']],
      [['tag-create', 'Bug', '--'], ['Bug']],
    ])('passes values after -- through as data: %j', (argv, expected) => {
      main(argv);

      expect(tagCreate).toHaveBeenCalledWith(expected);
      expect(logSpy).not.toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it('leaves -- to the parser for commands with options', () => {
      main(['track', '--', '-x']);

      expect(track).toHaveBeenCalledWith(['--', '-x']);
    });

    it('rejects config-requiring commands when no config exists', () => {
      mockedHasConfig.mockReturnValue(false);

      expect(() => main(['stop'])).toThrow('exit');

      expect(errorSpy).toHaveBeenCalledWith(new ConfigNotFoundError().message);
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(stop).not.toHaveBeenCalled();
    });

    it('runs auth and version without config', () => {
      mockedHasConfig.mockReturnValue(false);

      main(['auth', 'tok']);
      main(['version']);

      expect(auth).toHaveBeenCalledWith(['tok']);
      expect(version).toHaveBeenCalledWith([]);
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });
});
