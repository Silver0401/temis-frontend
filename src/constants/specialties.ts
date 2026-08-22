export type SpecialtyIconKey =
  | "Stethoscope"
  | "Wheelchair"
  | "MedicalBag"
  | "Brain"
  | "Heart"
  | "Mask"
  | "Poop"
  | "Bone"
  | "UVRays"
  | "LabTubes"
  | "KidSmiling"
  | "HandsUp"
  | "Sperm"
  | "Virus";

export type Specialty = {
  id: string;
  name: string;
  accent: string;
  available: boolean;
  iconKey: SpecialtyIconKey;
  sub: string;
  items: string[];
};

export const SPECIALTIES: Specialty[] = [
  {
    id: "medicina-general",
    name: "Medicina General",
    accent: "#81edc0",
    available: true,
    iconKey: "MedicalBag",
    sub: "Trazabilidad de infecciones, hemocultivos y esquemas antimicrobianos a lo largo del historial del paciente.",
    items: [
      "Registro de focos infecciosos localizados sobre el gemelo digital",
      "Historial de cultivos, antibiogramas y escaladas de tratamiento",
      "Seguimiento de pacientes con VIH, tuberculosis e inmunodeficiencias",
      "Alertas por resistencia antimicrobiana detectada en resultados de laboratorio",
    ],
  },
  {
    id: "medicina-interna",
    name: "Medicina Interna",
    accent: "#00a35e",
    available: true,
    iconKey: "Stethoscope",
    sub: "Expediente clínico integrado para el médico internista: seguimiento de sistemas, comorbilidades y polifarmacia en un solo lugar.",
    items: [
      "Gemelo digital del paciente con marcación de sistemas afectados por consulta",
      "Registro estructurado de diagnósticos CIE-10 e historia de comorbilidades",
      "Panel de medicamentos activos con alertas de interacciones y polifarmacia",
      "Seguimiento longitudinal de laboratorios y signos vitales en el tiempo",
    ],
  },
  {
    id: "geriatria",
    name: "Geriatría",
    accent: "#afe36b",
    available: true,
    iconKey: "Wheelchair",
    sub: "Valoración geriátrica integral con seguimiento funcional, cognitivo y farmacológico del paciente adulto mayor.",
    items: [
      "Valoración geriátrica integral (funcional, cognitiva, nutricional y social) en el expediente",
      "Escala de fragilidad y riesgo de caída actualizada en cada consulta",
      "Panel de polifarmacia con criterios Beers integrados al módulo de prescripción",
      "Seguimiento de funcionalidad: índice de Barthel, escala de Lawton y MMSE",
    ],
  },
  {
    id: "neuro",
    name: "Neurología",
    accent: "#39bd70",
    available: false,
    iconKey: "Brain",
    sub: "Mapeo tridimensional del sistema nervioso central y periférico integrado al expediente clínico del paciente.",
    items: [
      "Visualización 3D de lesiones cerebrales y medulares sobre el gemelo digital",
      "Seguimiento longitudinal de déficits neurológicos por consulta",
      "Alertas automáticas ante signos de alarma (cefalea en trueno, déficit focal agudo)",
      "Integración con estudios de imagen: TC, IRM y EEG",
    ],
  },
  {
    id: "cardio",
    name: "Cardiología",
    accent: "#f87171",
    available: false,
    iconKey: "Heart",
    sub: "Monitoreo continuo del estado cardiovascular del paciente con visualización anatómica del corazón y grandes vasos.",
    items: [
      "Gemelo digital cardíaco con marcación de territorios coronarios",
      "Registro de ECG, ecocardiograma y pruebas de esfuerzo en el expediente",
      "Estratificación automática de riesgo cardiovascular (Framingham, SCORE)",
      "Alertas clínicas por valores fuera de rango en parámetros hemodinámicos",
    ],
  },
  {
    id: "neumo",
    name: "Neumología",
    accent: "#67ca95",
    available: false,
    iconKey: "Mask",
    sub: "Seguimiento de la función pulmonar con representación visual de los pulmones y la vía aérea del paciente.",
    items: [
      "Visualización 3D de campos pulmonares con marcación de hallazgos radiológicos",
      "Registro de espirometrías y oximetrías integrado al historial",
      "Flujos de consulta adaptados a EPOC, asma y fibrosis pulmonar",
      "Alertas por caída de saturación o empeoramiento funcional progresivo",
    ],
  },
  {
    id: "gastro",
    name: "Gastroenterología",
    accent: "#27cf7e",
    available: false,
    iconKey: "Poop",
    sub: "Trazabilidad del tracto gastrointestinal y órganos sólidos con historial endoscópico y de laboratorio integrado.",
    items: [
      "Mapa anatómico del tracto GI con marcación de hallazgos endoscópicos",
      "Registro estructurado de reportes de colonoscopía y SEGD",
      "Seguimiento de enzimas hepáticas, pancreatitis y EII en el tiempo",
      "Alertas por patrones de laboratorio compatibles con sangrado o hepatotoxicidad",
    ],
  },
  {
    id: "trauma",
    name: "Traumatología",
    accent: "#fb923c",
    available: false,
    iconKey: "Bone",
    sub: "Documentación musculoesquelética visual con seguimiento de fracturas, cirugías e implantes por paciente.",
    items: [
      "Marcación de fracturas y lesiones sobre el esqueleto 3D del paciente",
      "Registro de intervenciones quirúrgicas e implantes con fecha y localización",
      "Seguimiento de consolidación ósea y rehabilitación por consulta",
      "Alertas por signos de complicación: infección de implante, pseudoartrosis",
    ],
  },
  {
    id: "dermato",
    name: "Dermatología",
    accent: "#ea94c1",
    available: false,
    iconKey: "UVRays",
    sub: "Registro fotográfico y topográfico de lesiones cutáneas sobre el mapa corporal del paciente.",
    items: [
      "Mapa corporal interactivo para localización y seguimiento de lesiones",
      "Galería fotográfica de evolución de lesiones por zona anatómica",
      "Clasificación estructurada: morfología, distribución, cronología",
      "Alertas por lesiones de riesgo: cambios en ABCDE de melanoma",
    ],
  },
  {
    id: "endocrino",
    name: "Endocrinología",
    accent: "#facc15",
    available: false,
    iconKey: "LabTubes",
    sub: "Monitoreo metabólico y hormonal con visualización de glándulas endocrinas en el expediente tridimensional.",
    items: [
      "Seguimiento gráfico de glucosa, HbA1c, TSH y perfil hormonal en el tiempo",
      "Visualización de tiroides, suprarrenales e hipófisis en el gemelo digital",
      "Flujos de consulta para diabetes, hipotiroidismo y síndrome metabólico",
      "Alertas por descontrol glucémico o valores hormonales fuera de rango",
    ],
  },
  {
    id: "pediatria",
    name: "Pediatría",
    accent: "#6be3cb",
    available: false,
    iconKey: "KidSmiling",
    sub: "Expediente adaptado al paciente pediátrico con curvas de crecimiento, vacunas y desarrollo integrados.",
    items: [
      "Curvas de crecimiento OMS/CDC actualizadas automáticamente por edad",
      "Registro de esquema de vacunación con alertas de dosis pendientes",
      "Gemelo digital ajustado a proporciones pediátricas por grupo etario",
      "Flujos de consulta para neonatos, lactantes, preescolares y escolares",
    ],
  },
  {
    id: "ginecologia",
    name: "Ginecología y Obstetricia",
    accent: "#e360d4",
    available: false,
    iconKey: "HandsUp",
    sub: "Seguimiento del ciclo reproductivo, embarazo y salud ginecológica con representación anatómica femenina.",
    items: [
      "Control prenatal estructurado con biometrías, RCTG y ultrasonidos integrados",
      "Mapa ginecológico para documentación de hallazgos en exploración y colposcopía",
      "Seguimiento de ciclo menstrual, anticoncepción y climaterio",
      "Alertas obstétricas: preeclampsia, RCIU, bienestar fetal comprometido",
    ],
  },
  {
    id: "urologia",
    name: "Urología",
    accent: "#3ebd80",
    available: false,
    iconKey: "Sperm",
    sub: "Documentación del aparato urológico masculino y femenino con historial de procedimientos y estudios integrado.",
    items: [
      "Visualización del aparato urinario y reproductivo masculino en el gemelo digital",
      "Registro de urocultivos, urografías y cistoscopías en el expediente",
      "Seguimiento de PSA, función renal y litiasis en el tiempo",
      "Alertas por deterioro de función renal o valores de PSA en ascenso",
    ],
  },
];

export const getSpecialty = (id: string): Specialty | undefined =>
  SPECIALTIES.find((sp) => sp.id === id);
