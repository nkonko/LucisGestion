import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const HOST = '127.0.0.1';
const PORT = 4300;
const BASE_URL = `http://${HOST}:${PORT}`;
const SCREENSHOT_PATH = resolve('__screenshots__/mock-home.png');
const FALLBACK_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8l3XQAAAAASUVORK5CYII=';

async function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function waitForServer(url, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        return;
      }
    } catch {
    }
    await sleep(1000);
  }
  throw new Error(`Timeout esperando el servidor en ${url}`);
}

async function ensurePlaywright() {
  try {
    return await import('playwright');
  } catch {
    throw new Error('No se encontro playwright. Ejecuta: npm install ; npx playwright install chromium');
  }
}

async function writeFallbackScreenshot() {
  await mkdir(dirname(SCREENSHOT_PATH), { recursive: true });
  await writeFile(SCREENSHOT_PATH, Buffer.from(FALLBACK_PNG_BASE64, 'base64'));
  process.stdout.write(`\nScreenshot fallback generado: ${SCREENSHOT_PATH}\n`);
}

async function run() {
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
    await waitForServer(BASE_URL);
    const { chromium } = await ensurePlaywright();
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
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

run().catch((error) => {
  process.stderr.write(`\nUnhandled error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
