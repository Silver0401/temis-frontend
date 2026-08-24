#!/usr/bin/env node

/**
 * bump-version.js
 *
 * Script interactivo de versionamiento para CronosMD.
 * Se ejecuta automáticamente como pre-commit hook.
 *
 * Formato de versión: MAJOR.SYSTEM.FEATURE.PATCH
 *
 *   PATCH  (4°) — Bug fix, estilo, diseño, cambio pequeño
 *   FEATURE(3°) — Nuevo componente importante, sección grande de código
 *   SYSTEM (2°) — Sistema completo nuevo (pagos, reportes, etc.)
 *   MAJOR  (1°) — Cambio total de flujo/procesos (requiere re-verificación completa)
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");

// ── Helpers ──────────────────────────────────────────────────────────────────

function abort(msg) {
  console.error(`\n❌  ${msg}\n`);
  process.exit(1);
}

function getRepoRoot() {
  try {
    return execSync("git rev-parse --show-toplevel", {
      stdio: ["pipe", "pipe", "pipe"],
    })
      .toString()
      .trim();
  } catch {
    abort("No se encontró un repositorio git en el directorio actual.");
  }
}

function parseVersion(version) {
  const parts = (version || "1.0.0.0").split(".").map(Number);
  while (parts.length < 4) parts.push(0);
  return parts.slice(0, 4); // [major, system, feature, patch]
}

function bumpVersion(parts, level) {
  const [major, system, feature, patch] = parts;
  switch (level) {
    case 1:
      return [major, system, feature, patch + 1]; // PATCH
    case 2:
      return [major, system, feature + 1, 0]; // FEATURE
    case 3:
      return [major, system + 1, 0, 0]; // SYSTEM
    case 4:
      return [major + 1, 0, 0, 0]; // MAJOR
    default:
      abort("Nivel de versión inválido.");
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

const repoRoot = getRepoRoot();
const pkgPath = path.join(repoRoot, "package.json");

if (!fs.existsSync(pkgPath)) {
  abort(`No se encontró package.json en: ${pkgPath}`);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const currentVersion = pkg.version || "1.0.0.0";
const parts = parseVersion(currentVersion);
const [major, system, feature, patch] = parts;

const preview = (level) => bumpVersion(parts, level).join(".");

// Colores ANSI para la terminal
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;

console.log(
  "\n" + bold("── Versionamiento Temis ────────────────────────────────"),
);
console.log(`   Versión actual: ${yellow(currentVersion)}`);
console.log(
  bold("────────────────────────────────────────────────────────") + "\n",
);

console.log(bold("  ¿Qué tipo de cambio estás commiteando?\n"));

console.log(
  `  ${cyan("[1]")} 🔧  ${bold("Small Feature")}   ${dim("—")} Bug fix, implementacion pequeña, diseño\n` +
    `         ${dim(`${currentVersion}  →  ${green(preview(1))}`)}`,
);
console.log(
  `\n  ${cyan("[2]")} ✨  ${bold("Big Feature")}  ${dim("—")} Nuevo componente, modificación de sección grande\n` +
    `         ${dim(`${currentVersion}  →  ${green(preview(2))}`)}`,
);
console.log(
  `\n  ${cyan("[3]")} 🚀  ${bold("System Feature")}  ${dim("—")} Sistema completo nuevo integrado (ej. módulo de pagos)\n` +
    `         ${dim(`${currentVersion}  →  ${green(preview(3))}`)}`,
);
console.log(
  `\n  ${cyan("[4]")} 💥  ${bold("Mayor Reworkout")}    ${dim("—")} Cambio total de flujo/procesos (requiere re-verificación completa)\n` +
    `         ${dim(`${currentVersion}  →  ${green(preview(4))}`)}`,
);
console.log(
  `\n  ${cyan("[0]")} ⏭️   ${bold("Omitir")}   ${dim("—")} Continuar el commit sin cambiar la versión\n`,
);

console.log(bold("────────────────────────────────────────────────────────"));

// Usar /dev/tty para que readline funcione dentro de git hooks
// (en hooks, stdin está redirigido y no es un TTY)
let inputStream;
try {
  inputStream = fs.createReadStream("/dev/tty");
} catch {
  abort(
    "No se pudo abrir /dev/tty. Corre el script manualmente: node scripts/bump-version.js",
  );
}

const rl = readline.createInterface({
  input: inputStream,
  output: process.stdout,
  terminal: true,
});

rl.question("\n  Selecciona una opción (0–4): ", (answer) => {
  rl.close();

  const choice = parseInt(answer.trim(), 10);

  if (choice === 0) {
    console.log(dim("\n  Versión sin cambios. Continuando commit...\n"));
    process.exit(0);
  }

  if (![1, 2, 3, 4].includes(choice)) {
    abort(`Opción "${answer.trim()}" no válida. Commit cancelado.`);
  }

  const newParts = bumpVersion(parts, choice);
  const newVersion = newParts.join(".");

  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  // Agregar package.json al stage para que quede incluido en el commit
  execSync(`git add "${pkgPath}"`);

  console.log(
    `\n  ${green("✔")}  Versión actualizada: ${yellow(currentVersion)} → ${bold(green(newVersion))}\n`,
  );

  process.exit(0);
});
