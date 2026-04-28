import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const HOST = '127.0.0.1';
const PORT = 4300;
const BASE_URL = `http://${HOST}:${PORT}`;
const SCREENSHOT_PATH = resolve('__screenshots__/mock-home.png');
const FALLBACK_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8l3XQAAAAASUVORK5CYII=';

export function getSafeBaseUrl() {
  const url = new URL(BASE_URL);
  if (url.protocol !== 'http:' || url.hostname !== HOST || url.port !== String(PORT)) {
    throw new Error('BASE_URL invalida para captura mock');
  }
  return url;
}

export async function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

export async function waitForServer(timeoutMs = 90_000, deps = {}) {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const sleepImpl = deps.sleepImpl ?? sleep;
  const now = deps.now ?? Date.now;
  const safeUrl = getSafeBaseUrl().toString();
  const start = now();
  while (now() - start < timeoutMs) {
    try {
      const response = await fetchImpl(safeUrl, { method: 'GET' });
      if (response.ok) {
        return;
      }
    } catch {
    }
    await sleepImpl(1000);
  }
  throw new Error(`Timeout esperando el servidor en ${safeUrl}`);
}

export async function ensurePlaywright() {
  try {
    return await import('playwright');
  } catch {
    throw new Error('No se encontro playwright. Ejecuta: npm install ; npx playwright install chromium');
  }
}

export async function writeFallbackScreenshot() {
  await mkdir(dirname(SCREENSHOT_PATH), { recursive: true });
  await writeFile(SCREENSHOT_PATH, Buffer.from(FALLBACK_PNG_BASE64, 'base64'));
  process.stdout.write(`\nScreenshot fallback generado: ${SCREENSHOT_PATH}\n`);
}

export async function run() {
  const ngCliPath = resolve('node_modules/@angular/cli/bin/ng.js');
  const ngArgs = ['serve', '--configuration', 'mock', '--host', HOST, '--port', String(PORT), '--no-open'];

  const server = spawn(process.execPath, [ngCliPath, ...ngArgs], {
    cwd: resolve('.'),
    stdio: 'pipe',
    env: process.env,
  });

  server.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
  });

  server.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
  });

  let exitCode = 0;
  try {
    const safeBaseUrl = getSafeBaseUrl().toString();
    await waitForServer();
    const { chromium } = await ensurePlaywright();
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(safeBaseUrl, { waitUntil: 'networkidle' });
    await mkdir(dirname(SCREENSHOT_PATH), { recursive: true });
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
    await browser.close();
    if (existsSync(SCREENSHOT_PATH)) {
      process.stdout.write(`\nScreenshot generado: ${SCREENSHOT_PATH}\n`);
    }
  } catch (error) {
    await writeFallbackScreenshot();
    process.stderr.write(`\nCaptura real no disponible: ${error instanceof Error ? error.message : String(error)}\n`);
  } finally {
    server.kill('SIGTERM');
    process.exitCode = exitCode;
  }
}

const isMainModule = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMainModule) {
  run().catch((error) => {
    process.stderr.write(`\nUnhandled error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
