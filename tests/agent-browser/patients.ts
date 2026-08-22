/**
 * Set de pacientes dummy para Verificación de los formularios condicionales.
 *
 * Cada caso combina:
 *  - Identificación (CURP opcional, nombres, sexo, género, fecha nacimiento).
 *  - Nota de evolución que el clasificador del backend (gpt-4o) debe mapear
 *    al `consultationType` esperado según la prioridad documentada en
 *    `cronos-backend/src/hooks/records/consult-type-detection.ts`:
 *    embarazo > pediatria (edad <18) > geriatria (edad ≥60) > general.
 *
 * Notas/requisitos del formulario de identidad (newPatientWizard.ts):
 *  - `birthDateISO` (formato ISO `YYYY-MM-DD`) se captura con <input type=date>.
 *  - `paisSearch/paisOption`, `entidadSearch/entidadOption`, `domicilioSearch`,
 *    `derechohabiencia` son obligatorios en el wizard real.
 */

// Reusamos la forma del paciente del helper Playwright sin acoplar imports
// (es un archivo agnóstico).
export interface DummyPatient {
  label: string;
  expectedForm: "GynecologyVariablesForm" | "PediatricsVariablesForm" | "GeriatricsVariablesForm" | null;
  expectedConsultationType: "embarazo" | "pediatria" | "geriatria" | "general";
  identity: {
    names: string;
    middleName: string;
    lastName: string;
    curp?: string;
    sexLabel: "Masculino" | "Femenino";
    genre: string;
    birthDateISO: string;
    paisSearch: string;
    paisOption: RegExp;
    esMexico: boolean;
    entidadSearch: string;
    entidadOption: RegExp;
    derechohabiencia: string;
    domicilioSearch: string;
  };
  historiaClinica: string;
  somas: {
    talla: string;
    peso: string;
    circAbd: string;
    fc: string;
    fr: string;
    spo2: string;
    sistolica: string;
    diastolica: string;
    temp: string;
  };
}

const BASE_SOMAS = {
  talla: "170",
  peso: "70",
  circAbd: "85",
  fc: "75",
  fr: "16",
  spo2: "97",
  sistolica: "120",
  diastolica: "80",
  temp: "36.5",
};

// Nombre + apellidos únicos por corrida para no chocar con el detector de
// duplicados del backend. Se generan al construir el set (ver más abajo).
function uniqueNameParts() {
  const r = (n: number) =>
    Array.from(
      { length: n },
      () => "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)],
    ).join("");
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    names: `Zeta${cap(r(5))}`,
    middleName: `Tesa${cap(r(5))}`,
    lastName: `Crono${cap(r(5))}`,
  };
}

function build(
  label: string,
  expectedConsultationType: DummyPatient["expectedConsultationType"],
  expectedForm: DummyPatient["expectedForm"],
  identityOverrides: Partial<DummyPatient["identity"]>,
  historiaClinica: string,
  somasOverrides?: Partial<DummyPatient["somas"]>,
): DummyPatient {
  const p = uniqueNameParts();
  return {
    label,
    expectedForm,
    expectedConsultationType,
    identity: {
      names: p.names,
      middleName: p.middleName,
      lastName: p.lastName,
      sexLabel: "Femenino",
      genre: "Femenino",
      birthDateISO: "1990-01-01",
      paisSearch: "mexico",
      paisOption: /m[eé]xico/i,
      esMexico: true,
      entidadSearch: "nuevo le",
      entidadOption: /nuevo le[oó]n/i,
      derechohabiencia: "IMSS",
      domicilioSearch: "Monterrey Nuevo León",
      ...identityOverrides,
    },
    historiaClinica,
    somas: { ...BASE_SOMAS, ...somasOverrides },
  };
}

/** Casos dummy que ejercitan cada rama condicional del dispatcher. */
export function dummyCases(): DummyPatient[] {
  return [
    // === EMBARAZO (prioridad 1) ===
    build(
      "embarazada 28 semanas (Femenino)",
      "embarazo",
      "GynecologyVariablesForm",
      {
        sexLabel: "Femenino",
        genre: "Femenino",
        birthDateISO: "1995-06-15",
        derechohabiencia: "IMSS",
      },
      "Paciente femenina de 29 años, G2P1, embarazada de 28 semanas por " +
        "FUM, control prenatal subsecuente. Refiere movimientos fetales " +
        "adecuados, niega sangrado ni contracciones. TA 110/70, FCF 140. " +
        "Plan: continuar control prenatal, suplementación con ácido fólico " +
        "y sulfato ferroso. Dx: Embarazo intrauterino de 28 semanas, " +
        "subsecuente, no complicado.",
      { peso: "68", talla: "160", fc: "82" },
    ),

    // === GERIATRÍA (edad ≥60) ===
    build(
      "geriátrico 72a con neumonía (Masculino)",
      "geriatria",
      "GeriatricsVariablesForm",
      {
        sexLabel: "Masculino",
        genre: "Masculino",
        birthDateISO: "1950-03-20", // ~75 años
        derechohabiencia: "ISSSTE",
      },
      "Paciente masculino de 75 años, right-handed, jubilado, con " +
        "antecedente de hipertensión arterial e DM2. Acude por disnea y " +
        "tos productive de 5 días, febrícula. RX tórax: condensación " +
        "lóbulo inferior derecho. Dx: Neumonía adquirida en la comunidad. " +
        "Se valora fragilidad, marcha y actividades instrumentales (AIVD). " +
        "Plan: antibiotic IV y valoración gerontológica integral.",
      { peso: "62", talla: "168", fc: "92", fr: "22" },
    ),

    // === PEDIATRÍA (edad <18) ===
    build(
      "pediátrico 4a con neumonía (Masculino)",
      "pediatria",
      "PediatricsVariablesForm",
      {
        sexLabel: "Masculino",
        genre: "Masculino",
        birthDateISO: new Date(
          Date.now() - 4 * 365.25 * 24 * 3600 * 1000,
        )
          .toISOString()
          .slice(0, 10), // ~4 años
        derechohabiencia: "IMSS",
      },
      "Paciente masculino de 4 años, acude con madre por tos y febrícula " +
        "de 3 días, dificultad respiratoria leve. RX tórax: neumonía " +
        "lóbulo inferior derecho. Se evalúa plan A vs B según evacuencia de " +
        "deshidratación, relación temporal IRA. Dx: Neumonía + deshidratación " +
        "leve. Plan: antimicrobiano según plan tratamiento IRA, signos de " +
        "alarma.",
      { peso: "16", talla: "102", fc: "110", fr: "28" },
    ),

    // === CONTROL GENERAL (no cumple criterios) ===
    build(
      "adulto general con incapacidad (general)",
      "general",
      null,
      {
        sexLabel: "Masculino",
        genre: "Masculino",
        birthDateISO: "1988-09-01", // ~37 años
        derechohabiencia: "IMSS",
      },
      "Paciente masculino de 37 años, sin antecedentes de importancia, " +
        "acude por lumbalgia mecánica de 2 semanas postraumática. Niega " +
        "radiculopatía, neurológico intacto. Exploración: dolor a la " +
        "palpación de musculatura paravertebral lumbar sin signos de alarma. " +
        "Dx: Lumbalgia mecánica aguda. Plan: AINE, reposo relativo y " +
        "fisioterapia.",
      { peso: "78", talla: "175" },
    ),
  ];
}
