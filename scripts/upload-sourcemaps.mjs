#!/usr/bin/env node
/**
 * Sube los source maps a Sentry después del build de producción.
 * Uso: node scripts/upload-sourcemaps.mjs <version>
 * Ejemplo: node scripts/upload-sourcemaps.mjs v0.1.0
 *
 * Requiere SENTRY_AUTH_TOKEN en el entorno.
 * El token se genera en Settings → Account → API → Auth Tokens con scope org:ci.
 */
import { execFileSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

const args = process.argv.slice(2);
const version = args[0];

if (!version) {
  console.error('❌ Error: Debes pasar la versión como argumento');
  console.error('Uso: node scripts/upload-sourcemaps.mjs [version]');
  process.exit(1);
}

const ORG = process.env.SENTRY_ORG?.trim() || 'pegasusteam';
const PROJECT_FROM_ENV = process.env.SENTRY_PROJECT?.trim() || '';
const PROJECT_FALLBACK = 'lucis-gestion';
const DIST_DIR = './dist/lucis-gestion/browser';
const ENVIRONMENT_FILE = './src/environments/environment.ts';

function readProjectFromDsn() {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) {
    return '';
  }

  try {
    const parsed = new URL(dsn);
    const segments = parsed.pathname.split('/').filter(Boolean);
    return segments.at(-1) ?? '';
  } catch {
    return '';
  }
}

function readTokenFromEnvironmentConfig() {
  if (!existsSync(ENVIRONMENT_FILE)) {
    return '';
  }

  const content = readFileSync(ENVIRONMENT_FILE, 'utf-8');
  const authTokenMatch = content.match(/authToken\s*:\s*['\"]([^'\"]+)['\"]/);
  return authTokenMatch?.[1]?.trim() ?? '';
}

const authTokenFromEnv = process.env.SENTRY_AUTH_TOKEN?.trim() ?? '';
const authTokenFromConfig = readTokenFromEnvironmentConfig();
const sentryAuthToken = authTokenFromEnv || authTokenFromConfig;
const projectFromDsn = readProjectFromDsn();
const sentryProject = PROJECT_FROM_ENV || projectFromDsn || PROJECT_FALLBACK;

if (!sentryAuthToken || sentryAuthToken === 'YOUR_SENTRY_AUTH_TOKEN') {
  console.error('❌ Error: Falta token de autenticación para Sentry');
  console.error('   Opción 1: export SENTRY_AUTH_TOKEN=<token>');
  console.error(`   Opción 2: configurar sentry.authToken en ${ENVIRONMENT_FILE}`);
  console.error('   Creá un token en https://sentry.io/settings/account/api/auth-tokens/');
  console.error('   Scope necesario: org:ci (Source Map Upload, Release Creation)');
  process.exit(1);
}

if (!existsSync(DIST_DIR)) {
  console.error(`❌ Error: No existe ${DIST_DIR}. Ejecutá 'pnpm build' primero.`);
  process.exit(1);
}

if (!sentryProject) {
  console.error('❌ Error: No se pudo resolver SENTRY_PROJECT para subir source maps');
  console.error('   Definí SENTRY_PROJECT en el entorno o proveé un SENTRY_DSN válido');
  process.exit(1);
}

const sentry = (args) =>
  execFileSync('npx', ['@sentry/cli', ...args], {
    stdio: 'inherit',
    env: {
      ...process.env,
      SENTRY_ORG: ORG,
      SENTRY_AUTH_TOKEN: sentryAuthToken,
    },
  });

const sentryRelease = (args) => sentry(['releases', '--org', ORG, ...args]);
const sentrySourcemaps = (args) => sentry(['sourcemaps', '--org', ORG, '--project', sentryProject, ...args]);

try {
  // 1. Crear o actualizar la release en Sentry
  console.log(`\n📦 Creando release ${version} en Sentry...`);
  sentryRelease(['new', version]);

  // 2. Asociar commits de git
  console.log('\n🔗 Asociando commits...');
  sentryRelease(['set-commits', version, '--auto']);

  // 3. Subir source maps
  console.log('\n📤 Subiendo source maps...');
  sentrySourcemaps(['upload', `--release=${version}`, DIST_DIR]);

  // 4. Finalizar la release
  console.log('\n✅ Finalizando release...');
  sentryRelease(['finalize', version]);

  console.log(`\n🎉 Source maps subidos correctamente para ${version}`);
} catch (error) {
  console.error('\n❌ Error al subir source maps:', error.message);
  process.exit(1);
}
