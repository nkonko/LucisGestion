#!/usr/bin/env node
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import process from 'process';

const args = process.argv.slice(2);
const version = args[0];
const skipUpload = args.includes('--skip-upload');

// Validar que se pasó versión
if (!version) {
  console.error('❌ Error: Debes pasar la versión como argumento');
  console.error('Uso: pnpm release -- v0.1.0');
  console.error('     pnpm release -- v0.1.0 --skip-upload  (sin subir source maps)');
  process.exit(1);
}

// Validar formato semántico (vX.Y.Z)
const semVerRegex = /^v\d+\.\d+\.\d+$/;
if (!semVerRegex.test(version)) {
  console.error(`❌ Error: La versión debe estar en formato semántico (vX.Y.Z)`);
  console.error(`Ejemplo válido: v0.1.0, v1.2.3`);
  process.exit(1);
}

// Validar que la rama esté en main
try {
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  if (branch !== 'main') {
    console.error(`❌ Error: Debes estar en la rama 'main' (actualmente en '${branch}')`);
    process.exit(1);
  }
} catch {
  console.error('❌ Error: No se puede determinar la rama actual. ¿Estás en un repositorio git?');
  process.exit(1);
}

const versionWithoutV = version.replace(/^v/, '');

// 1. Actualizar version.ts
console.log(`📝 Actualizando src/environments/version.ts a ${versionWithoutV}...`);
writeFileSync(
  'src/environments/version.ts',
  `/**
 * Version del proyecto, actualizada por create-release.mjs al hacer una release.
 * No modificar manualmente.
 */
export const version = '${versionWithoutV}';
`,
  'utf-8',
);
console.log('✅ version.ts actualizado');

// 2. Commitear el cambio de versión
try {
  execSync('git add src/environments/version.ts', { stdio: 'inherit' });
  const hasStagedChanges = execSync('git diff --cached --name-only').toString().trim().length > 0;

  if (hasStagedChanges) {
    execSync(`git commit -m "chore: bump version to ${versionWithoutV}"`, { stdio: 'inherit' });
    console.log('✅ Commit de versión creado');
  } else {
    console.log(`ℹ️ version.ts ya estaba en ${versionWithoutV}; se omite commit de bump`);
  }
} catch {
  console.error('❌ Error al commitear el cambio de versión');
  process.exit(1);
}

// 3. Validar que no haya otros cambios pendientes
try {
  const status = execSync('git status --porcelain').toString().trim();
  if (status) {
    console.error(`❌ Error: Hay cambios sin commitear además del version.ts:`);
    console.error(status);
    process.exit(1);
  }
} catch {
  console.error('❌ Error: No se puede verificar el estado del repositorio');
  process.exit(1);
}

// 4. Verificar que el tag no existe ya
try {
  execSync(`git rev-parse ${version}`, { stdio: 'pipe' });
  console.error(`❌ Error: El tag '${version}' ya existe`);
  console.error(`Borra el tag local con: git tag -d ${version}`);
  process.exit(1);
} catch {
  // El tag no existe, está bien
}

// 5. Build de producción
console.log('\n🏗️  Build de producción...');
try {
  execSync('pnpm build', { stdio: 'inherit' });
  console.log('✅ Build completado');
} catch {
  console.error('❌ Error en el build');
  process.exit(1);
}

// 6. Subir source maps a Sentry (a menos que se haya explicitado --skip-upload)
if (!skipUpload) {
  console.log('\n📤 Subiendo source maps a Sentry...');
  try {
    execSync(`node scripts/upload-sourcemaps.mjs ${version}`, {
      stdio: 'inherit',
    });
  } catch {
    console.error('❌ Error al subir source maps. Continuando con el release...');
    console.error('   Podés subirlos después con:');
    console.error(`   node scripts/upload-sourcemaps.mjs ${version}`);
  }
} else {
  console.log('\n⏭️  Skip de upload de source maps');
}

// 7. Crear el tag anotado
try {
  console.log(`\n📝 Creando tag '${version}'...`);
  execSync(`git tag -a ${version} -m "Release ${version}"`, { stdio: 'inherit' });
  console.log(`✅ Tag '${version}' creado localmente`);
} catch {
  console.error(`❌ Error al crear el tag`);
  process.exit(1);
}

// 8. Pushear el tag a origin
try {
  console.log(`\n📤 Pusheando tag '${version}' a origin...`);
  execSync(`git push origin ${version}`, { stdio: 'inherit' });
  console.log(`✅ Tag '${version}' pusheado a GitHub`);
  console.log(`🚀 El workflow Firebase Release se ejecutará automáticamente`);
} catch {
  console.error(`❌ Error al pushear el tag`);
  console.error(`Puedes hacerlo manualmente con: git push origin ${version}`);
  process.exit(1);
}
