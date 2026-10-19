import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/config.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/config.js')>()),
  hasConfig: vi.fn(),
}));
vi.mock('../src/commands/auth.js', () => ({ auth: vi.fn() }));
vi.mock('../src/commands/version.js', () => ({ version: vi.fn() }));
vi.mock('../src/commands/stop.js', () => ({ stop: vi.fn() }));
vi.mock('../src/commands/tag-create.js', () => ({ tagCreate: vi.fn() }));

import { hasConfig, ConfigNotFoundError } from '../src/config.js';
import { auth } from '../src/commands/auth.js';
import { version } from '../src/commands/version.js';
import { stop } from '../src/commands/stop.js';
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

  describe('dispatch', () => {
    it('passes the remaining args to the command', () => {
      main(['tag-create', 'Bug']);

      expect(tagCreate).toHaveBeenCalledWith(['Bug']);
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
