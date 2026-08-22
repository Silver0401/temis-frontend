import axios, { AxiosResponse } from "axios";

// ------------------- Server API Request Base Functions -----------------

// export const ClientSideRequest = async <T,>(
//   props: fetchProps
// ): Promise<AxiosResponse<T, any>> => {
//   const { accessToken } = GetAccessToken();

//   return axios({
//     url: `${process.env.NEXT_PUBLIC_NOT_BACKEND_URL}${props.route}`,
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${accessToken}`,
//     },
//     method: props.method,
//     data: props.method !== "get" ? props.data : undefined,
//   });
// };

export const ServerSideRequest = async <T>(
  props: fetchProps,
): Promise<AxiosResponse<T, any>> => {
  return axios({
    url: `${process.env.NEXT_PUBLIC_NOT_BACKEND_URL}${props.route}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${props.accessToken}`,
    },
    method: props.method,
    data: props.method !== "get" ? props.data : undefined,
  });
};

// -------------------  Clinical History Constants -----------------

export const GabinetImgTypes: GabinetImgs[] = [
  "MRI",
  "TAC",
  "US",
  "XRay",
  "Foto",
  "Otro",
];

export const RiskTypesArray: RiskTypes[] = [
  "Controlled",
  "High",
  "Medium",
  "Low",
];

export const RiskTypesListWithProps: RiskTypesIndexed = {
  Controlled: {
    spanishName: "Controlado",
  },
  High: {
    spanishName: "Alto",
  },
  Medium: {
    spanishName: "Medio",
  },
  Low: {
    spanishName: "Bajo",
  },
};

export const LabBaseParameters: LabSomaBaseDataIndexed = {
  Leu: {
    name: "Leucocitos",
    topRange: 11,
    bottomRange: 4.5,
  },
  Er: {
    name: "Eritrocitos",
    topRange: 6,
    bottomRange: 4,
  },
  Hb: {
    name: "Hemoglobina",
    topRange: 16,
    bottomRange: 12,
  },
  Hcto: {
    name: "Hematocrito",
    topRange: 53,
    bottomRange: 35,
  },
  VCM: {
    name: "Volumen Corpuscular Medio",
    topRange: 100,
    bottomRange: 70,
  },
  HbCM: {
    name: "Hemoglobina Corpuscular Media",
    topRange: 31,
    bottomRange: 27,
  },
  "Linf%": {
    name: "Porcentaje de Linfocitos",
    topRange: 40,
    bottomRange: 20,
  },
  "Neu%": {
    name: "Porcentaje de Neutrófilos",
    topRange: 70,
    bottomRange: 50,
  },
  PCR: {
    name: "Proteina C Reactiva",
    topRange: 0.5,
    bottomRange: 0,
  },
  PLT: {
    name: "Plaquetas",
    topRange: 350,
    bottomRange: 150,
  },
  Na: {
    name: "Sodio",
    topRange: 145,
    bottomRange: 135,
  },
  K: {
    name: "Potasio",
    topRange: 5.5,
    bottomRange: 3.5,
  },
  Cl: {
    name: "Cloro",
    topRange: 110,
    bottomRange: 95,
  },
};

export const DefaultPatientData: Patient = {
  LUID: "John Doe ~ 05/07/1944 ~ Monterrey NLE, MX ~ Masculino",
  _id: "testingID",
  personalInfo: {
    names: "John",
    middleName: "Doe",
    lastName: "Espinoza",
    sex: "Masculino",
    birthDate: "02/08/1950",
    birthPlace: "Mty NL MX",
    domicile: "Euclides 218, Col Tecnologico, Monterrey NL",
    curp: "JDEZ2893471019823",
    genre: "Masculino",
    derechohabiencia: [],
  },
  localizacion: {},
  records: [
    {
      Entry: {
        text: "",
        type: "ClinicalHistoryInit",
      },
      _id: "",
      patientId: "",
      ClinicalHistory: "",
      Temporality: "PrimeraVez",
      Diagnosis: [
        {
          id: "1",
          Name: "Demencia de Cuerpos de Lewis",
          Confirmed: true,
        },
        {
          id: "2",
          Name: "Pneumonia",
          Confirmed: true,
        },
        {
          id: "3",
          Name: "Síndrome de Intestino Irritable",
          Confirmed: true,
        },
        {
          id: "4",
          Name: "APP Fractura de Cadera Izquierda",
          Confirmed: true,
        },
        {
          id: "5",
          Name: "Hallux Valgus",
          Confirmed: true,
        },
      ],
    },
  ],
};

export const DefaultSessionData: SessionData = {
  toBeAdded: "init",
  method: "init",
  currentStep: 0,
  currentPatientData: undefined,
  currentRecord: undefined,
  currentModText: "init",
  patientIdentification: undefined,
  docType: "CCH",
  diagnosisCatalog: [],
  extraData: {
    Drugs: [],
    Imgs: [],
    Request: [],
    Labs: [],
    Somas: [],
  },
};

export const GlobalModalDefault: GlobalModalProps = {
  Component: undefined,
  Settings: {
    identifier: "GlobalModal",
    size: "imgFullScreen",
    animation: "popUp",
  },
};

export const DefaultFichaDeIdentificacionValues = [
  "Ficha de Identificación",
  "- Nombre:",
  "- Edad:",
  "- Sexo:",
  "- Fecha Nac:",
  "- Originario:",
  "- Domicilio:",
  "- Vive Actualmente:",
  "- Exp:",
  "- Ocupación:",
  "- Escolaridad:",
  "- Estado Civil:",
  "- CURP:",
  "- Tel:",
];

export const PopularOrderedStudiesIndexed: OrdersIndexed = {
  "Biometria Hemática (BH)": {
    defaultObservation: "No requiere ayuno, evitar ejercicio intenso previo",
  },
  "Perfil Bioquímico (PB)": {
    defaultObservation:
      "Ayuno de 8 a 12 horas (solo agua natural). Evitar alcohol 48 horas antes",
  },
  "Química Sanguínea (QS)": {
    defaultObservation:
      "Ayuno de 8 a 12 horas. Evitar alcohol y ejercicio Intenso 48 horas antes",
  },
  "Examen General de Orina (EGO)": {
    defaultObservation:
      "No requiere ayuno. Primera orina de la mañana. Aseo genital previo.",
  },
  "Pruebas de Función Hepática (PFH)": {
    defaultObservation: "Ayuno de 8 a 12 horas. Evitar alcohol 72 horas antes",
  },
  "Proteina C Reactiva (PCR)": {
    defaultObservation:
      "No requiere ayuno, evitar ejercicio intenso 24 horas antes.",
  },
  "Perfil Tiroideo (PT)": {
    defaultObservation:
      "No requiere ayuno. Ideal tomar antes de uso de levotiroxina",
  },
  "Hemoglobina Glucosilada (HbA1c)": {
    defaultObservation:
      "No requiere ayuno. No se afecta por ingesta de alimentos",
  },
  "Radiografía (Rx)": { defaultObservation: undefined },
  "Ultrasonido (US)": { defaultObservation: undefined },
  "Tomografía Axial Computarizada (TAC)": { defaultObservation: undefined },
  "Resonancia Magnética (RM)": { defaultObservation: undefined },
  "Hormona Foliculoestimulante (FSH)": {
    defaultObservation:
      "No requiere ayuno. Mujeres entre dia 2 y 5 del ciclo menstrual",
  },
  "Hormona Luteinizante (LH)": {
    defaultObservation:
      "No requiere ayuno. Mujeres entre dia 2 y 5 del ciclo menstrual",
  },
  "Índice HOMA": { defaultObservation: undefined },
  "Estradiol (E2)": {
    defaultObservation:
      "No requiere ayuno. Mujeres entre dia 2 y 5 del ciclo menstrual",
  },
  "Testosterona Total": { defaultObservation: undefined },
  "Testosterona Libre": { defaultObservation: undefined },
  Otro: { defaultObservation: undefined },
};

export const TipoPersonal = [
  "MÉDICA(O) PASANTE",
  "MÉDICA(O) GENERAL",
  "MÉDICA(O) RESIDENTE",
  "MÉDICA(O) ESPECIALISTA",
  "PASANTE DE ENFERMERÍA",
  "ENFERMERA(O)",
  // "MÉDICA(O) GENERAL HABILITADA(O) PARA SALUD MENTAL",
  // "MÉDICA(O) ESPECIALISTA HABILITADA(O) PARA SALUD MENTAL",
  // "PASANTE DE NUTRICIÓN",
  // "NUTRIÓLOGA(O)",
  // "HOMEÓPATA",
  // "MÉDICA(O) TRADICIONAL INDÍGENA",
  // "TAPS",
  // "PASANTE DE PSICOLOGÍA",
  // "PSICÓLOGA(O)",
  // "LICENCIADA(O) EN ENFERMERÍA Y OBSTETRICIA",
  // "PARTERA(O) TÉCNICA(O)",
  // "PROMOTOR(A) DE SALUD",
  // "LICENCIADA(O) EN GERONTOLOGÍA",
  // "PASANTE DE GERONTOLOGÍA",
  // "ACUPUNTURISTA",
];

export const Especialidades = [
  "3 – CIRUGÍA",
  "4 – CONSULTA EXTERNA GENERAL",
  "5 – GINECOOBSTETRICIA",
  "7 – MEDICINA INTERNA",
  "13 – OFTALMOLOGÍA",
  "14 – OTORRINOLARINGOLOGÍA",
  "16 – PEDIATRÍA",
  "23 – TRAUMATOLOGÍA Y ORTOPEDIA",
  "25 – ALERGOLOGÍA",
  "26 – ANESTESIOLOGÍA",
  "27 – ANGIOLOGÍA",
  "28 – AUDIOLOGÍA, OTONEUROLOGÍA Y FONIATRÍA",
  "30 – CARDIOLOGÍA",
  "31 – CIRUGÍA MAXILOFACIAL",
  "32 – CIRUGÍA PLÁSTICA Y RECONSTRUCTIVA",
  "33 – CLÍNICA DE DOWN",
  "34 – DERMATOLOGÍA",
  "35 – ENDOCRINOLOGÍA",
  "36 – EPIDEMIOLOGÍA",
  "37 – GASTROENTEROLOGÍA",
  "38 – GENÉTICA",
  "39 – GERIATRÍA",
  "40 – HEMATOLOGÍA",
  "41 – INFECTOLOGÍA",
  "42 – INMUNOLOGÍA",
  "43 – MEDICINA INTEGRADA",
  "44 – MEDICINA NUCLEAR E IMAGENOLOGÍA MOLECULAR",
  "45 – NEFROLOGÍA",
  "46 – NEONATOLOGÍA",
  "47 – NEUMOLOGÍA",
  "48 – NEUROCIRUGÍA",
  "49 – NEUROLOGÍA",
  "51 – ONCOLOGÍA",
  "53 – PROCTOLOGÍA",
  "54 – REHABILITACIÓN",
  "55 – REUMATOLOGÍA",
  "57 – TRANSPLANTES",
  "59 – UROLOGÍA",
  "61 – CUIDADOS PALIATIVOS",
  "62 – GERONTOLOGÍA",
  "88 – OTROS",
];
