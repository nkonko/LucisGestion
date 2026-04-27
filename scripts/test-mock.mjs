import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

async function collectTestFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectTestFiles(fullPath);
      results.push(...nested);
      continue;
    }

    if (entry.isFile() && (entry.name.endsWith('.spec.ts') || entry.name.endsWith('.test.ts'))) {
      results.push(fullPath);
    }
  }

  return results;
}

async function run() {
  const srcPath = resolve('src');
  const testFiles = await collectTestFiles(srcPath);

  if (testFiles.length === 0) {
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
