import { execSync, execFileSync } from 'node:child_process';

function getStagedFiles(): string[] {
  const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
    encoding: 'utf8',
  });

  return output
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);
}

function restage(files: string[], cwd: string): void {
  if (files.length === 0) {
    return;
  }

  execFileSync('git', ['add', '--', ...files], { stdio: 'inherit', cwd });
}

function main(): void {
  const repoRoot = execSync('git rev-parse --show-toplevel', {
    encoding: 'utf8',
  }).trim();
  const staged = getStagedFiles();

  console.log('Running format...');
  execSync('npm run format', { stdio: 'inherit', cwd: repoRoot });
  restage(staged, repoRoot);

  console.log('Running markdown lint...');
  execSync('npm run lint:md', { stdio: 'inherit', cwd: repoRoot });
}

try {
  main();
} catch (error) {
  if (error && typeof error === 'object') {
    if ('stdout' in error && error.stdout) {
      process.stdout.write(error.stdout as Buffer);
    }
    if ('stderr' in error && error.stderr) {
      process.stderr.write(error.stderr as Buffer);
    }
    if ('status' in error && typeof error.status === 'number') {
      process.exit(error.status);
    }
  }
  process.exit(1);
}
