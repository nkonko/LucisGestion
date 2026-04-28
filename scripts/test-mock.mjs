import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

async function hasTestFiles() {
  const entries = await readdir('src', { withFileTypes: true, recursive: true });
  return entries.some(
    (entry) =>
      entry.isFile() && (entry.name.endsWith('.spec.ts') || entry.name.endsWith('.test.ts')),
  );
}

async function run() {
  const testFilesAvailable = await hasTestFiles();

  if (!testFilesAvailable) {
    process.stdout.write('No hay archivos de test (*.spec.ts/*.test.ts). Se considera OK en modo mock.\n');
    process.exit(0);
    return;
  }

  const ngCliPath = resolve('node_modules/@angular/cli/bin/ng.js');
  const testArgs = [ngCliPath, 'test', '--watch=false'];
  const child = spawn(process.execPath, testArgs, {
    cwd: resolve('.'),
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code) => {
    process.exit(code ?? 1);
  });
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
