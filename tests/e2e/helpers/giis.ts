/**
 * Parser y comparador del Archivo de Intercambio GIIS-B015-04-11.
 *
 * El backend arma una línea de 106 campos pipe-delimited en
 * cronos-backend/src/services/exchange-file/exchange-file.class.ts.
 * Este helper la parsea con nombres 1-indexados idénticos al orden del
 * builder para poder comparar campo por campo contra lo guardado.
 */

export const GIIS_FIELD_COUNT = 106;

/** Nombres 1-indexados de los campos relevantes (los no listados son constantes). */
export const GIIS_FIELDS = {
  clues: 1,
  paisNacimientoPrestador: 2,
  curpPrestador: 3,
  nombrePrestador: 4,
  primerApellidoPrestador: 5,
  segundoApellidoPrestador: 6,
  tipoPersonal: 7,
  programaSMyMG: 8,
  curpPaciente: 9,
  nombrePaciente: 10,
  primerApellidoPaciente: 11,
  segundoApellidoPaciente: 12,
  fechaNacimiento: 13,
  paisNacPaciente: 14,
  entidadNacimiento: 15,
  sexoCURP: 16,
  sexoBiologico: 17,
  genero: 22,
  derechohabiencia: 23,
  fechaConsulta: 24,
  servicioAtencion: 25,
  peso: 26,
  talla: 27,
  circunferenciaCintura: 28,
  sistolica: 29,
  diastolica: 30,
  frecuenciaCardiaca: 31,
  frecuenciaRespiratoria: 32,
  temperatura: 33,
  saturacionOxigeno: 34,
  glucemia: 35,
  primeraVezAnio: 40,
  primeraVezUneme: 41,
  relacionTemporal: 42,
  cie1: 43,
  confirmacionDx1: 44,
  primeraVezDx2: 45,
  cie2: 46,
  confirmacionDx2: 47,
  primeraVezDx3: 48,
  cie3: 49,
  confirmacionDx3: 50,
} as const;

export type GiisFieldName = keyof typeof GIIS_FIELDS;

export interface GiisLine {
  raw: string;
  fields: string[];
  /** Acceso 1-indexado, igual a la spec */
  at(index: number): string;
  get(name: GiisFieldName): string;
}

export function parseGiisLine(raw: string): GiisLine {
  const fields = raw.trim().split("|");
  return {
    raw,
    fields,
    at(index: number) {
      return fields[index - 1];
    },
    get(name: GiisFieldName) {
      return fields[GIIS_FIELDS[name] - 1];
    },
  };
}

/** Mapeos espejo de exchange-file.constants.ts (backend). */
export const SEXO_CODE: Record<string, number> = { Masc: 1, Fem: 2 };
export const GENERO_CODE: Record<string, number> = {
  Masculino: 1,
  Femenino: 2,
  "No Binario": 0,
  Transgénero: 3,
  Transexual: 4,
  Travesti: 5,
  Intersexual: 6,
  Otro: 88,
  "No Especificado": 0, // no está en el mapa del backend → cae al default 0
};

/** Campo 1: primera CLUES del médico → primer segmento antes de '-', últimos 4 chars. */
export function expectedCluesField(clues: string): string {
  return clues.split("-")[0].trim().slice(-4);
}

/** Campo 13: dd/mm/aaaa desde lo guardado (ISO o ya-display). */
export function expectedBirthDate(stored: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(stored)) {
    const [y, m, d] = stored.split("T")[0].split("-");
    return `${d}/${m}/${y}`;
  }
  return stored;
}
