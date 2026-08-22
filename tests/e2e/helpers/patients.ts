/**
 * Fábrica de pacientes de prueba.
 *
 * Los nombres se generan únicos por corrida (sufijo alfabético aleatorio)
 * porque el backend bloquea duplicados por similitud de LUID
 * (duplicate-patient-analyzer). Solo letras: el formulario valida
 * ^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ -,./'¨]+$ (src/scripts/Generator.tsx).
 */

export interface TestPatient {
  /** Etiquetas tal como se capturan en el formulario */
  names: string;
  middleName: string;
  lastName: string;
  sexLabel: "Masculino" | "Femenino";
  /** Valor que persiste el backend */
  sex: "Masc" | "Fem";
  genre: string;
  /** ISO para el <input type="date"> */
  birthDateISO: string;
  /** DD/MM/YYYY como lo guarda el flujo */
  birthDateDisplay: string;
  /** Término a teclear en el buscador de país y texto de la opción esperada */
  paisSearch: string;
  paisOption: RegExp;
  esMexico: boolean;
  entidadSearch?: string;
  entidadOption?: RegExp;
  /** Texto visible del checkbox de derechohabiencia a marcar */
  derechohabiencia: string;
  domicilioSearch: string;
  curp?: string;
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

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

function randAlpha(n: number): string {
  let out = "";
  for (let i = 0; i < n; i++)
    out += LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return out;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Sufijo único por corrida para evitar el detector de duplicados. */
export function uniqueNameParts() {
  return {
    names: `Zetape${cap(randAlpha(5))}`,
    middleName: `Pruebae${cap(randAlpha(5))}`,
    lastName: `Cronose${cap(randAlpha(5))}`,
  };
}

const BASE_SOMAS: TestPatient["somas"] = {
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

const HISTORIA = (nombre: string) =>
  `Paciente ${nombre} acude a consulta por odinofagia de 2 dias de evolucion, ` +
  `acompañada de fiebre de 38 grados y malestar general. Niega tos, niega disnea. ` +
  `Exploracion: faringe hiperemica con exudado amigdalino. ` +
  `Diagnostico probable: faringitis aguda. Plan: tratamiento sintomatico e hidratacion.`;

export function makeValidPatient(
  overrides: Partial<Omit<TestPatient, "somas">> & {
    somas?: Partial<TestPatient["somas"]>;
  } = {},
): TestPatient {
  const parts = uniqueNameParts();
  const base: TestPatient = {
    ...parts,
    sexLabel: "Masculino",
    sex: "Masc",
    genre: "Masculino",
    birthDateISO: "1990-05-15",
    birthDateDisplay: "15/05/1990",
    paisSearch: "méxico",
    paisOption: /m[eé]xico/i,
    esMexico: true,
    entidadSearch: "nuevo le",
    entidadOption: /nuevo le[oó]n/i,
    derechohabiencia: "IMSS",
    domicilioSearch: "Monterrey Nuevo León",
    historiaClinica: HISTORIA(`${parts.names} ${parts.middleName}`),
    somas: { ...BASE_SOMAS },
  };
  return { ...base, ...overrides, somas: { ...base.somas, ...overrides.somas } };
}

/** Variantes válidas para parametrizar el flujo completo. */
export function validPatientVariants(): Array<{
  label: string;
  patient: TestPatient;
}> {
  return [
    {
      label: "masculino adulto con IMSS",
      patient: makeValidPatient(),
    },
    {
      label: "femenino con género distinto y derechohabiencia distinta",
      patient: makeValidPatient({
        sexLabel: "Femenino",
        sex: "Fem",
        genre: "Femenino",
        birthDateISO: "1985-11-30",
        birthDateDisplay: "30/11/1985",
        derechohabiencia: "ISSSTE",
        somas: { peso: "62", talla: "160", fc: "82" },
      }),
    },
    {
      label: "adulto mayor límite de edad válida",
      patient: makeValidPatient({
        sexLabel: "Masculino",
        sex: "Masc",
        genre: "No Especificado",
        // ~95 años: dentro del máximo de 120
        birthDateISO: "1931-01-02",
        birthDateDisplay: "02/01/1931",
        somas: { peso: "58", talla: "165", fc: "68" },
      }),
    },
  ];
}
