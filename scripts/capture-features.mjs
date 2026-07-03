import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const HOST = '127.0.0.1';
const PORT = 4200;
const BASE_URL = `http://${HOST}:${PORT}`;
const FEATURES_PATH = resolve('public/images/features');

// Esperar a que el servidor esté listo
async function waitForServer(timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${BASE_URL}/demo/dashboard`, { method: 'GET' });
      if (response.ok) return;
    } catch (error) {
      // Continuar esperando
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Timeout esperando servidor en ${BASE_URL}`);
}

async function captureScreenshots() {
  try {
    console.log('⏳ Esperando servidor...');
    await waitForServer();
    console.log('✅ Servidor listo');
    
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    
    const routes = [
      { name: 'dashboard', path: '/demo/dashboard', title: 'Dashboard' },
      { name: 'recetas', path: '/demo/recetas', title: 'Recetas' },
      { name: 'ventas', path: '/demo/ventas', title: 'Ventas' },
      { name: 'stock', path: '/demo/stock', title: 'Stock' },
    ];
    
    await mkdir(FEATURES_PATH, { recursive: true });
    
    for (const route of routes) {
      try {
        console.log(`📸 Capturando ${route.title}...`);
        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle' });
        const screenshotPath = resolve(FEATURES_PATH, `${route.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`✅ ${route.title} guardado: ${screenshotPath}`);
      } catch (error) {
        console.error(`❌ Error capturando ${route.title}:`, error.message);
      }
    }
    
    await browser.close();
    console.log('\n✨ ¡Todas las capturas completadas!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

captureScreenshots();
