#!/usr/bin/env node
import { execSync } from 'child_process';
import process from 'process';

const args = process.argv.slice(2);
const version = args[0];

// Validar que se pasó versión
if (!version) {
  console.error('❌ Error: Debes pasar la versión como argumento');
  console.error('Uso: npm run release -- v0.1.0');
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

// Validar que no haya cambios pendientes
try {
  const status = execSync('git status --porcelain').toString().trim();
  if (status) {
    console.error('❌ Error: Hay cambios sin commitear. Commit primero con:');
    console.error('   git add . && git commit -m "message"');
    process.exit(1);
  }
} catch {
  console.error('❌ Error: No se puede verificar el estado del repositorio');
  process.exit(1);
}

// Verificar que el tag no existe ya
try {
  execSync(`git rev-parse ${version}`, { stdio: 'pipe' });
  console.error(`❌ Error: El tag '${version}' ya existe`);
  console.error(`Borra el tag local con: git tag -d ${version}`);
  process.exit(1);
} catch {
  // El tag no existe, está bien
}

// Crear el tag anotado
try {
  console.log(`📝 Creando tag '${version}'...`);
  execSync(`git tag -a ${version} -m "Release ${version}"`, { stdio: 'inherit' });
  console.log(`✅ Tag '${version}' creado localmente`);
} catch {
  console.error(`❌ Error al crear el tag`);
  process.exit(1);
}

// Pushear el tag a origin
try {
  console.log(`📤 Pusheando tag '${version}' a origin...`);
  execSync(`git push origin ${version}`, { stdio: 'inherit' });
  console.log(`✅ Tag '${version}' pusheado a GitHub`);
  console.log(`🚀 El workflow Firebase Release se ejecutará automáticamente`);
} catch {
  console.error(`❌ Error al pushear el tag`);
  console.error(`Puedes hacerlo manualmente con: git push origin ${version}`);
  process.exit(1);
}
