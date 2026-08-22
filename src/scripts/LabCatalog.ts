/**
 * Catálogo de laboratorios conocidos.
 *
 * Espeja `LabBaseParameters` del backend (`src/json/Constants.ts`). Existe para
 * que el formulario ofrezca nombre, abreviación y unidad ya normalizados: antes
 * el médico escribía los resultados en texto libre y un modelo de lenguaje los
 * acomodaba. En Temis la captura es estructurada, así que el catálogo tiene que
 * vivir también del lado del cliente.
 *
 * Si agregas una entrada aquí, agrégala igual en el backend o el valor viajará
 * con una unidad que el resto del sistema no reconoce.
 */
export interface LabCatalogEntry {
  key: string;
  abbreviation: string;
  name: string;
  fullName: string;
  category: string;
  unit: string;
}

export const LabCatalog: LabCatalogEntry[] = [
  {
    key: "Leu",
    abbreviation: "WBC",
    name: "Leucocitos",
    fullName: "Recuento Total de Leucocitos",
    category: "Biometría Hemática",
    unit: "x10³/µL",
  },
  {
    key: "Er",
    abbreviation: "RBC",
    name: "Eritrocitos",
    fullName: "Recuento de Eritrocitos",
    category: "Biometría Hemática",
    unit: "x10⁶/µL",
  },
  {
    key: "Hb",
    abbreviation: "Hb",
    name: "Hemoglobina",
    fullName: "Concentración de Hemoglobina",
    category: "Biometría Hemática",
    unit: "g/dL",
  },
  {
    key: "Hcto",
    abbreviation: "Hct",
    name: "Hematocrito",
    fullName: "Porcentaje de Hematocrito",
    category: "Biometría Hemática",
    unit: "%",
  },
  {
    key: "VCM",
    abbreviation: "MCV",
    name: "Volumen Corpuscular Medio",
    fullName: "Volumen Corpuscular Medio",
    category: "Índices Eritrocitarios",
    unit: "fL",
  },
  {
    key: "HbCM",
    abbreviation: "MCH",
    name: "Hemoglobina Corpuscular Media",
    fullName: "Hemoglobina Corpuscular Media",
    category: "Índices Eritrocitarios",
    unit: "pg",
  },
  {
    key: "PCR",
    abbreviation: "CRP",
    name: "Proteína C Reactiva",
    fullName: "Proteína C Reactiva",
    category: "Inflamación",
    unit: "mg/dL",
  },
  {
    key: "PLT",
    abbreviation: "PLT",
    name: "Plaquetas",
    fullName: "Recuento Plaquetario",
    category: "Biometría Hemática",
    unit: "x10³/µL",
  },
  {
    key: "Na",
    abbreviation: "Na+",
    name: "Sodio",
    fullName: "Sodio Sérico",
    category: "Electrolitos",
    unit: "mEq/L",
  },
  {
    key: "K",
    abbreviation: "K+",
    name: "Potasio",
    fullName: "Potasio Sérico",
    category: "Electrolitos",
    unit: "mEq/L",
  },
  {
    key: "Cl",
    abbreviation: "Cl-",
    name: "Cloro",
    fullName: "Cloro Sérico",
    category: "Electrolitos",
    unit: "mEq/L",
  },
];

export const LabCatalogByFullName = LabCatalog.reduce<
  Record<string, LabCatalogEntry>
>((acc, entry) => {
  acc[entry.fullName] = entry;
  return acc;
}, {});
