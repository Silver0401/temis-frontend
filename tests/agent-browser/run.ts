/**
 * Runner principal: orquesta una sesión de Agent Browser para recorrer
 * los pacientes dummy definidos en `patients.ts` y confirmar que cada uno
 * dispara el formulario condicional esperado en `ConfirmMedRecord`.
 *
 * Flujo por caso:
 *   1. /dashboard/newPatient → "Manual" → wizard identidad (3 pasos).
 *   2. Formato "Historia Clínica Completa" → método "Texto".
 *   3. Pegar nota de evolución → Enviar → síntesis AI (OpenAI real, lento).
 *   4. SavePatientForm: somatometría + "Guardar paciente".
 *   5. ConfirmMedRecord aparece → buscar form con id esperado.
 *
 * Ejecuta una sola sesión de navegador, una pestaña por caso (para limpiar
 * sessionStorage y que cada paciente parta limpio). Se autentica por API
 * (helpers/api.ts), inyecta el JWT en localStorage al abrir el dashboard.
 *
 * Uso: `npx tsx tests/agent-browser/run.ts`
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import {
  authenticate,
  ensureTestUser,
} from "../e2e/helpers/api";
import { E2E_BASE_URL } from "../e2e/helpers/env";
import { dummyCases, type DummyPatient } from "./patients";
import * as ab from "./agent";

interface CaseResult {
  case: string;
  expectedConsultationType: DummyPatient["expectedConsultationType"];
  expectedForm: DummyPatient["expectedForm"] | null;
  detectedForms: string[];
  status: "PASS" | "FAIL";
  reason?: string;
  screenshot?: string;
}

const SHOTS_DIR = path.join(__dirname, "shots");

function formIdFor(caseExpected: DummyPatient["expectedForm"]): string | null {
  return caseExpected; // coinciden: identifier == clave esperada
}

/** Lee el DOM buscado formularios concretos en ConfirmMedRecord. */
async function detectForms(): Promise<string[]> {
  const found: string[] = [];
  for (const id of [
    "GynecologyVariablesForm",
    "PediatricsVariablesForm",
    "GeriatricsVariablesForm",
  ]) {
    try {
      const out = await ab.snapScoped(`form#${id}`);
      if (out.raw.trim().length > 0 && !out.raw.includes("not found")) {
        found.push(id);
      }
    } catch {
      // ok: el selector no existe
    }
  }
  return found;
}

/** Snap interactivo y devuelve texto plano de la página. */
async function pageText(): Promise<string> {
  return (await ab.snapInteractive()).raw;
}

/**
 * Paso a paso el wizard. Usa snapshots interactivos para encontrar refs
 * frescas en cada momento (después de cada click render cambia). Para
 * inputs con testid conocido (`input-names`, `input-birthDate`, etc.)
 * usamos `find testid`.
 */
async function runCase(
  patient: DummyPatient,
  token: string,
  base: string,
  idx: number,
): Promise<CaseResult> {
  const id = patient.identity;
  const shots = path.join(SHOTS_DIR, `${idx}-${patient.label.replace(/\W+/g, "_")}`);
  const result: CaseResult = {
    case: patient.label,
    expectedConsultationType: patient.expectedConsultationType,
    expectedForm: patient.expectedForm,
    detectedForms: [],
    status: "PASS",
  };

  await ab.open(`${base}/dashboard/newPatient`);
  // Tras open, inyectamos el token ANTES de que el layout lea auth.
  await ab.injectToken(base, token);
  await ab.open(`${base}/dashboard/newPatient`); // recarga con token
  await ab.waitText("Identificación", { timeoutMs: 150_000 });
  await ab.waitLoad();

  // Click "Manual" en la pantalla de identificación
  // (texto exacto, primera coincidencia).
  await ab.clickByText("Manual", { exact: true });

  // === Wizard de identidad paso 1/3 ===
  await ab.waitText("Nombre", { timeoutMs: 30_000 });
  if (id.curp) await ab.fillByTestid("input-curp", id.curp);
  await ab.fillByTestid("input-names", id.names);
  await ab.fillByTestid("input-middleName", id.middleName);
  await ab.fillByTestid("input-lastName", id.lastName);
  await ab.clickByText("Continuar", { exact: true });

  // === Paso 2/3: sexo, género, fecha nacimiento, país ===
  await ab.waitText("Sexo", { timeoutMs: 30_000 });
  await ab.selectByLabel("Sexo", id.sexLabel);
  await ab.selectByLabel("Género", id.genre);
  await ab.fillByTestid("input-birthDate", id.birthDateISO);
  await ab.searchAndPick("BirthPaisSearch", id.paisSearch, id.paisOption);
  await ab.clickByText("Continuar", { exact: true });

  // === Paso 3/3: entidad (si MX), derechohabiencia, domicilio ===
  if (id.esMexico) {
    await ab.searchAndPick(
      "BirthEntFedSearch",
      id.entidadSearch,
      id.entidadOption,
    );
  }
  await ab.clickByText(id.derechohabiencia, { exact: true });
  await ab.searchAndPickFirst("DomicilioSearch", id.domicilioSearch);
  await ab.clickByText("Enviar", { exact: true });

  // === Formato de la información ===
  await ab.waitText(/formato de la informaci/i, { timeoutMs: 60_000 });
  await ab.clickByText("Historia Clínica Completa", { exact: true });

  // === Método de agregación → Texto ===
  await ab.waitText(/m[eé]todo de agregaci/i, { timeoutMs: 30_000 });
  await ab.clickByText("Texto", { exact: true });

  // /newPatient/textTranscriber
  await ab.waitSelector('textarea[name="TxtTsrbrInput"]', {
    timeoutMs: 60_000,
  });
  await ab.fillBySelector(
    'textarea[name="TxtTsrbrInput"]',
    patient.historiaClinica,
  );
  await ab.clickByText("Enviar", { exact: true });

  // === Síntesis AI: esperar "Guardar paciente" ===
  await ab.waitText(/guardar paciente/i, { timeoutMs: 240_000 });

  // === SavePatientForm: somatometría + "Guardar Paciente" ===
  await ab.addSomas(patient.somas);
  await ab.clickByText(/guardar paciente/i, { exact: false });

  // === ConfirmMedRecord: esperar "Diagnósticos y Atención" ===
  // (Aparece DESPUÉS del form condicional si el tipo no es general;
  // antes aparece solo el form de especialidad.)
  // Por eso primero buscamos el form condicional con timeout corto.
  let detected: string[] = [];
  try {
    await ab.waitText(/diagn[oó]sticos y atenci[oó]n/i, {
      timeoutMs: 45_000,
    });
  } catch {
    // okish: puede estar aún detrás del form condicional.
  }
  // Cierto timeout para que el form condicional renderice.
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    detected = await detectForms();
    if (
      (patient.expectedForm && detected.length > 0) ||
      (patient.expectedForm === null && Date.now() > deadline - 45_000)
    ) {
      if (detected.length > 0 || patient.expectedForm === null) break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  detected = await detectForms();
  result.detectedForms = detected;

  await ab.screenshot(`${shots}-confirm.png`).catch(() => {});

  // Veredicto
  const want = formIdFor(patient.expectedForm);
  if (want === null) {
    if (detected.length === 0) {
      result.status = "PASS";
      result.reason = "general: no se disparó ningún form condicional (esperado)";
    } else {
      result.status = "FAIL";
      result.reason = `general esperado pero apareció ${detected.join(", ")}`;
    }
  } else {
    if (detected.includes(want)) {
      result.status = "PASS";
      result.reason = `detectado ${want}`;
    } else {
      result.status = "FAIL";
      result.reason = `esperado ${want} pero apareció [${detected.join(", ")}]`;
    }
  }
  return result;
}

async function main() {
  const base = process.env.E2E_BASE_URL || E2E_BASE_URL;
  const results: CaseResult[] = [];

  // Token JWT único para toda la corrida (provisión automática o entorno).
  let token: string | null = null;
  try {
    const { accessToken } = await ensureTestUser(0);
    token = accessToken;
  } catch (e) {
    throw new Error(
      `No se pudo obtener token E2E (¿backend en :3030 con ENV_TYPE=development?): ${(e as Error).message}`,
    );
  }

  const cases = dummyCases();
  for (let i = 0; i < cases.length; i++) {
    const patient = cases[i];
    const startMsg = `\n[${i + 1}/${cases.length}] ${patient.label} (esperado: ${patient.expectedConsultationType}/${patient.expectedForm ?? "—"})`;
    console.log(startMsg);
    try {
      const res = await runCase(patient, token, base, i);
      results.push(res);
      console.log(`  → ${res.status}: ${res.reason ?? ""}`);
    } catch (e) {
      const res: CaseResult = {
        case: patient.label,
        expectedConsultationType: patient.expectedConsultationType,
        expectedForm: patient.expectedForm,
        detectedForms: [],
        status: "FAIL",
        reason: `excepción: ${(e as Error).message}`,
      };
      results.push(res);
      console.log(`  → FAIL (excepción): ${(e as Error).message}`);
      await ab.screenshot(
        path.join(SHOTS_DIR, `${i}-error.png`),
      ).catch(() => {});
    }
  }

  // Resumen final
  console.log("\n=== RESUMEN ===");
  for (const r of results) {
    console.log(
      `${r.status === "PASS" ? "PASA" : "FALLA"} | ${r.case} | ` +
        `esperado=${r.expectedForm ?? "—"} detectados=[${r.detectedForms.join(",")}]`,
    );
  }
  const pass = results.filter((r) => r.status === "PASS").length;
  console.log(`\n${pass}/${results.length} casos PASA`);

  writeFileSync(
    path.join(__dirname, "last-run.json"),
    JSON.stringify(results, null, 2),
  );

  await ab.closeAll().catch(() => {});
  process.exit(pass === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error("Runner failed:", e);
  ab.closeAll().catch(() => {});
  process.exit(2);
});
