/**
 * Los trece parámetros de una somatometría. Es la única definición: la usan el
 * formulario de captura, la gráfica del expediente y la tarjeta de la nota.
 *
 * Antes cada documento guardado repetía el nombre, la abreviatura y la unidad de
 * cada parámetro, y el formulario tenía sus propias etiquetas escritas aparte.
 */
export type SomasFieldKey =
  | "peso"
  | "talla"
  | "imc"
  | "circAbdominal"
  | "sistolica"
  | "diastolica"
  | "frecuenciaCardiaca"
  | "frecuenciaRespiratoria"
  | "temperatura"
  | "saturacionOxigeno"
  | "glucemia";

export interface SomasFieldDef {
  key: SomasFieldKey;
  /** Nombre corto para el formulario. */
  label: string;
  /** Nombre completo para el expediente. */
  fullName: string;
  unit: string;
}

export const SOMAS_FIELDS: SomasFieldDef[] = [
  { key: "talla", label: "Talla", fullName: "Talla", unit: "cm" },
  { key: "peso", label: "Peso", fullName: "Peso Corporal", unit: "kg" },
  {
    key: "imc",
    label: "IMC",
    fullName: "Índice de Masa Corporal",
    unit: "kg/m²",
  },
  {
    key: "circAbdominal",
    label: "Circ. Abd",
    fullName: "Circunferencia de Cintura",
    unit: "cm",
  },
  {
    key: "frecuenciaCardiaca",
    label: "FC",
    fullName: "Frecuencia Cardiaca",
    unit: "lpm",
  },
  {
    key: "frecuenciaRespiratoria",
    label: "FR",
    fullName: "Frecuencia Respiratoria",
    unit: "rpm",
  },
  {
    key: "saturacionOxigeno",
    label: "SpO2",
    fullName: "Saturación de Oxígeno",
    unit: "%",
  },
  {
    key: "sistolica",
    label: "Sistólica",
    fullName: "Presión Arterial Sistólica",
    unit: "mmHg",
  },
  {
    key: "diastolica",
    label: "Diastólica",
    fullName: "Presión Arterial Diastólica",
    unit: "mmHg",
  },
  { key: "temperatura", label: "Temp", fullName: "Temperatura", unit: "°C" },
  { key: "glucemia", label: "Glucemia", fullName: "Glucemia", unit: "mg/dL" },
];

/** Catálogo GIIS del tipo de medición de glucemia. */
export const GLUCEMIA_TIPO: Array<{ value: number; label: string }> = [
  { value: 1, label: "Ayuno" },
  { value: 2, label: "Casual" },
];

/** Catálogo GIIS del origen del resultado de glucemia. */
export const GLUCEMIA_OBTENIDA: Array<{ value: number; label: string }> = [
  { value: 1, label: "Laboratorio" },
  { value: 2, label: "Tira Reactiva" },
];

/** Identificador del input en el formulario, a partir de la clave guardada. */
export const somasInputId = (key: SomasFieldKey): string => `somas_${key}`;

/**
 * Resumen legible de lo capturado, para la tarjeta que se ve antes de guardar.
 * Sustituye al `baseText` que antes se armaba concatenando una frase y se
 * guardaba en el documento.
 */
export const somasSummary = (
  values: Record<string, string> | undefined,
): string => {
  if (!values) return "Sin parámetros capturados";
  const partes = SOMAS_FIELDS.filter((field) => {
    const valor = (values[field.key] ?? "").trim();
    return valor !== "" && Number.parseFloat(valor) > 0;
  }).map((field) => `${field.label} ${values[field.key]} ${field.unit}`);

  return partes.length ? partes.join(" · ") : "Sin parámetros capturados";
};
