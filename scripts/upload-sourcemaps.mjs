#!/usr/bin/env node
/**
 * Sube los source maps a Sentry después del build de producción.
 * Uso: node scripts/upload-sourcemaps.mjs <version>
 * Ejemplo: node scripts/upload-sourcemaps.mjs v0.1.0
 *
 * Requiere SENTRY_AUTH_TOKEN en el entorno.
 * El token se genera en Settings → Account → API → Auth Tokens con scope org:ci.
 */
import { execSync } from 'child_process';
import { existsSync } from 'fs';

const args = process.argv.slice(2);
const version = args[0];

if (!version) {
  console.error('❌ Error: Debes pasar la versión como argumento');
  console.error('Uso: node scripts/upload-sourcemaps.mjs <version>');
  process.exit(1);
}

const ORG = 'pegasusteam';
const PROJECT = 'lucis-gestion';
const DIST_DIR = './dist/lucis-gestion/browser';

if (!process.env.SENTRY_AUTH_TOKEN) {
  console.error('❌ Error: Falta SENTRY_AUTH_TOKEN en el entorno');
  console.error('   Creá un token en https://sentry.io/settings/account/api/auth-tokens/');
  console.error('   Scope necesario: org:ci (Source Map Upload, Release Creation)');
  process.exit(1);
}

if (!existsSync(DIST_DIR)) {
  console.error(`❌ Error: No existe ${DIST_DIR}. Ejecutá 'pnpm build' primero.`);
  process.exit(1);
}

const sentry = (cmd) =>
  execSync(`npx @sentry/cli ${cmd}`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      SENTRY_ORG: ORG,
      SENTRY_PROJECT: PROJECT,
      SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    },
  });

try {
  // 1. Crear o actualizar la release en Sentry
  console.log(`\n📦 Creando release ${version} en Sentry...`);
  sentry(`releases new ${version}`);

  // 2. Asociar commits de git
  console.log('\n🔗 Asociando commits...');
  sentry(`releases set-commits ${version} --auto`);

  // 3. Subir source maps
  console.log('\n📤 Subiendo source maps...');
  sentry(`sourcemaps upload --release=${version} ${DIST_DIR}`);

  // 4. Finalizar la release
  console.log('\n✅ Finalizando release...');
  sentry(`releases finalize ${version}`);

  console.log(`\n🎉 Source maps subidos correctamente para ${version}`);
} catch (error) {
  console.error('\n❌ Error al subir source maps:', error.message);
  process.exit(1);
}
