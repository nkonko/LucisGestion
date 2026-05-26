import { access, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const minLines = Number(process.env.COVERAGE_MIN_LINES ?? 70);
const minBranches = Number(process.env.COVERAGE_MIN_BRANCHES ?? 60);

async function findLcovInfo(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const entryPath = join(dir, entry.name);

    if (entry.isFile() && entry.name === 'lcov.info') {
      return entryPath;
    }

    if (entry.isDirectory()) {
      const nested = await findLcovInfo(entryPath);
      if (nested) {
        return nested;
      }
    }
  }
  return undefined;
}

let lcovPath = 'coverage/lcov.info';

try {
  await access(lcovPath);
} catch {
  lcovPath = await findLcovInfo('coverage');
}

if (!lcovPath) {
  console.error('Coverage file not found. Run tests with coverage enabled (e.g. `pnpm test:ci -- --coverage`) before running coverage:check.');
  process.exit(1);
}

const lcov = await readFile(lcovPath, 'utf8');

let lf = 0;
let lh = 0;
let brf = 0;
let brh = 0;

for (const line of lcov.split('\n')) {
  if (line.startsWith('LF:')) lf += Number(line.slice(3));
  if (line.startsWith('LH:')) lh += Number(line.slice(3));
  if (line.startsWith('BRF:')) brf += Number(line.slice(4));
  if (line.startsWith('BRH:')) brh += Number(line.slice(4));
}

const linePct = lf === 0 ? 100 : (lh / lf) * 100;
const branchPct = brf === 0 ? 100 : (brh / brf) * 100;

if (linePct < minLines || branchPct < minBranches) {
  console.error(`Coverage check failed. Lines: ${linePct.toFixed(2)}% (min ${minLines}%), Branches: ${branchPct.toFixed(2)}% (min ${minBranches}%).`);
  process.exit(1);
}

console.log(`Coverage OK. Lines: ${linePct.toFixed(2)}%, Branches: ${branchPct.toFixed(2)}%.`);
