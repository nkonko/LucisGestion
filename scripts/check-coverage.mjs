import { readFile } from 'node:fs/promises';

const minLines = Number(process.env.COVERAGE_MIN_LINES ?? 70);
const minBranches = Number(process.env.COVERAGE_MIN_BRANCHES ?? 60);

const lcov = await readFile('coverage/lcov.info', 'utf8');

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
