import { VariantLabels } from "motion/react";
import { CSSProperties, RefObject } from "react";

export declare global {
  // ----------------------- Exchange File Types -----------------------

  interface ExchangeDocReturn {
    patientId: string;
    recordId: string;
    fileRow: string;
  }

  // ----------------------- Testing Types -----------------------

  type MicSettings =
    | "sr48000"
    | "sr44100"
    | "echoCancel"
    | "noiseSuppresion"
    | "autoGain"
    | "lowVol"
    | "highVol";

  // ----------------------- Catalog Types -----------------------

  interface CIEResponse {
    _id: string;
    CONSECUTIVO: number;
    LETRA: string;
    CATALOG_KEY: string;
    NOMBRE: string;
    DIA_CRONICOS: string;
    DIA_CAINFANTIL: string;
    LSEX: string;
    LINF: string;
    LSUP: string;
    CLAVE_PROGRAMA_SIS: number;
    CLAVE_CAPITULO: string;
    CAPITULO: string;
    ES_SUIVE_MORB: string;
    EPI_CLAVE: number;
    "EPI_CLAVE_DESC 2024": string;
    TIPO_PERSONAL_1VEZ_CE: string;
    TIPO_PERSONAL_SUBSEC_CE: string;
    VALIDO_SM: string;
    VALIDO_SB: string;
    VALIDO_PF: string;
  }

  interface PersonelTypeResponse {
    _id: string;
    CATALOG_KEY: string;
    TIPO_PERSONAL: string;
  }
  interface EstablecimientosResponse {
    _id: string;
    clues: string;
    sub_abreviacion: string;
    tip_abreviacion: string;
    nombre_unidad: string;
    en_operacion: number;
    id_entidad_federativa: number;
    tipo_unidad: number;
    institucion: string;
  }

  interface AfiliacionesResponse {
    _id: string;
    CATALOG_KEY: number;
    "DESCRIPCIÓN CORTA": string;
    "DESCRIPCIÓN LARGA": string;
    VIGENTE: number;
  }

  // A selected afiliación / derechohabiencia. catalogKey === 0 means the value
  // did not come from the GIIS catalog (e.g. extracted by AI from free text).
  interface Afiliacion {
    catalogKey: number;
    descripcion: string;
  }

  interface EntFedResponse {
    _id: string;
    CATALOG_KEY: number;
    ENTIDAD_FEDERATIVA: string;
    ABREVIATURA: string;
  }

  interface LocalidadesResponse {
    _id: string;
    EFE_KEY: number;
    MUN_KEY: number;
    CATALOG_KEY: number;
    LOCALIDAD: string;
    CVEGEO: number;
  }

  interface MunicipiosResponse {
    _id: string;
    EFE_KEY: number;
    CATALOG_KEY: number;
    MUNICIPIO: string;
    CVEGEO: number;
  }

  interface PaisesResponse {
    _id: string;
    CATALOG_KEY: number;
    DESCRIPCION: string;
    ORDEN: number;
  }

  interface ServByTypeResponse {
    _id: string;
    CATALOG_KEY: number;
    DESCRIPCION: string;
  }

  // ----------------------- Nufi Response Types -----------------------

  interface NufiVerifyResult {
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    curp: string;
    sexo: "Masculino" | "Femenino" | "Intersexual";
    fechaNacimiento: string;
    estadoDomicilio: string;
    municipioDomicilio: string;
    calle: string;
    colonia: string;
    localidad: string;
    codigoPostal: string;
    vigencia: string;
    model: string;
    mrz: string;
  }

  interface RenapoCurpResponse {
    claveEntidad: string;
    curp: string;
    datosDocProbatorio: {
      entidadRegistro: string;
      tomo: string;
      claveMunicipioRegistro: string;
      anioReg: string;
      claveEntidadRegistro: string;
    };
    descriptionStatusCurp: string;
    docProbatorio: number;
    entidad: string;
    fechaNacimiento: string;
    nacionalidad: string;
    nombres: string;
    parametro: string;
    primerApellido: string;
    segundoApellido: string;
    sexo: string;
    statusCurp: string;
  }

  interface FrontINEOCRResponse {
    ocr?: {
      instituto?: string;
      credencial?: string;
      apellido_paterno?: string;
      apellido_materno?: string;
      nombre?: string;
      fecha_nacimiento?: string;
      sexo?: string;
      calle_numero?: string;
      codigo_postal?: string;
      colonia?: string;
      estado?: string;
      municipio?: string;
      clave?: string;
      curp?: string;
      anio_registro?: string;
      mes_registro?: string;
      registro?: string;
      estado_code?: string;
      municipio_code?: string;
      seccion?: string;
      localidad?: string;
      emision?: string;
      vigencia?: string;
    };
  }

  // ----------------------- Queries and Requests -----------------------

  type GenericFeathersApiResponse<T> = {
    type: "success" | "error";
    message: string;
    data: T;
    req: feathersApiProps;
  };

  type GenericAxiosApiResponse<T> = {
    type: "success" | "error";
    message: string;
    data: T;
    req: axiosApiProps;
  };

  type feathersApiProps = {
    method: "get" | "create" | "patch" | "remove";
    logId: string;
    logs?: boolean;
    service: string;
    data?: any;
    nonLoggable?: boolean;
    patientId?: string;
    resourceId?: string;
    successToast?: string;
    noAuthService?: boolean;
    loadingToast?: string;
    query?: object;
  };

  interface LogObject {
    patientId?: string;
    action: string;
    timestamp: string;
    resourceType: string;
    resourceId?: string;
    status: "success" | "error";
    errorMessage?: string;
    sessionRef: string;
  }

  type axiosApiProps =
    | {
        method: "get" | "delete";
        route: string;
        logId: string;
        requestType: "internal" | "external";
        logs?: boolean;
        nonLoggable?: boolean;
        successToast?: string;
        patientId?: string;
        resourceId?: string;
        errorToast: sting;
      }
    | {
        method: "post" | "patch";
        requestType: "internal" | "external";
        logId: string;
        route: string;
        data: any;
        logs?: boolean;
        nonLoggable?: boolean;
        patientId?: string;
        resourceId?: string;
        successToast?: string;
        errorToast: sting;
      };

  type fetchProps =
    | {
        method: "get";
        route: string;
        accessToken?: string;
      }
    | {
        method: "post" | "patch" | "delete";
        route: string;
        data: any;
        accessToken?: string;
      };

  interface ServerResponse<T> {
    config: Object;
    data: T;
    headers: Object;
    request: Object;
    status: string;
  }
  type ApiResponse = {
    status: "success" | "error";
    data: AxiosResponse<any>;
    message: string;
  };
  interface ApiRequestProps {
    route: string;
    method: "get" | "post" | "patch" | "delete";
    data: any;
  }

  interface AccessTokenProps {
    accessToken: string | undefined;
    jwtExpired: boolean;
  }

  interface FormActionProps {
    formData: FormData;
    accessToken: string | undefined;
  }

  interface UploadPhotoProps {
    FileList: string[];
    Type: uploadTypes;
    Action: actionTypes;
    Description: string;
  }

  interface UploadPhotoResponse extends UploadPhotoProps {
    Response: any;
  }

  // ----------------------- Component Types -----------------------

  interface AnimParams {
    opacity: number;
    scale: number;
  }

  interface AnimateProps {
    initial: boolean | Target | VariantLabels;
    animate: AnimationControls | TargetAndTransition | VariantLabels | boolean;
    exit: TargetAndTransition | VariantLabels;
    transition: Transition$1;
  }

  interface CardProps {
    size: "lg" | "md" | "sm" | "mini";
    name: string;
    icon?: React.ReactElement;
    title: string;
    subtitle?: string;
    onClick?: () => void;
    onXClick?: () => void;
    animProps?: AnimateProps;
    colorSchema?: colorSchemas;
    styles?: {
      title?: CSSProperties;
      subtitle?: CSSProperties;
      svg?: CSSProperties;
    };
  }

  interface CardsDisplayCCProps {
    itemsList: Array<CardProps | null>;
    schema?: colorSchemas;
    title?: string;
    subtitle?: string;
  }

  // ----------------------- Dashboard Types and Interfaces -----------------------

  type colorSchemas = "day" | "night";

  type DashboardStates =
    | "My Patients"
    | "Consents"
    | "My Team"
    | "New Patient"
    | "Add Document"
    | "My Agenda"
    // Secciones exclusivas del rol `admin`.
    | "Admin Patients"
    | "Admin Stats"
    | "Admin Agendas";

  interface DashboardSectionProps {
    Title: string;
    Subtitle: string;
    Icon: React.ReactElement;
    Route: string;
  }

  type DashboardStatesIndexed = {
    [key in DashboardStates]: DashboardSectionProps;
  };

  type TranscripterStates = "Sleeping" | "Loading" | "Recording";

  // ----------------------- 3D Model Interfaces and Types -----------------------

  type AnatomySections =
    | "Superior"
    | "Top"
    | "Middle"
    | "Bottom"
    | "Inferior"
    | "Ground";

  // Temis: tipos del modelo 3D (MeshProps/ModelObjectProps/ModelRendererProps/
  // CameraRendererProps/ModelCCContainerProps) removidos junto con ModelCC. Ver DECISIONS.md.

  type IndividualPartsProps = {
    [key in string]: {
      onHover: () => {};
    };
  };

  // ----------------------- Input Types -----------------------

  type FormObject = {
    [key in string]: string;
  };

  type InputCCTypes =
    | "text"
    | "number"
    | "email"
    | "date"
    | "password"
    | "checkbox"
    | "checkBoxLink"
    | "custom"
    | "file"
    | "textarea"
    | "select";

  type InputCCTypesIndex = {
    [key in InputCCTypes]: React.ReactElement | null;
  };

  type refTypes =
    | {
        type: "input";
        ref: React.MutableRefObject<HTMLInputElement | null>;
      }
    | {
        type: "textarea";
        ref: React.MutableRefObject<HTMLTextAreaElement | null>;
      };

  interface FileCCProps {
    base64File: string;
    name: string;
  }

  interface InputValidations {
    minLength?: number;
    maxLength?: number;
    trim?: boolean;
    allowedSpecials?: string;
    noConsecutiveSpecials?: boolean;
    isDate?: boolean;
    notFuture?: boolean;
    maxAgeYears?: number;
    pattern?: string;
    patternMessage?: string;
  }

  interface InputCCprops {
    type: InputCCTypes;
    readOnly?: boolean;
    validations?: InputValidations;
    icon?: React.ReactElement;
    debouncer?: boolean;
    fakeHide?: boolean;
    id?: string;
    label?: string;
    loading?: boolean;
    currentValue?: string;
    identifier: string;
    showPhoneQr?: boolean;
    phoneUploadFile?: FileCCProps;
    placeholder?: string;
    children?: ReactElement;
    required?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    onChange?: (e: any) => void;
    onScroll?: React.UIEventHandler<HTMLTextAreaElement> | undefined;
    nonWritable?: boolean;
    dataList?: Array<string>;
    colorSchema?: colorSchemas;
    initialValue?: string;
    fileTypes?: "images" | "documents";
    options?: Array<string>;
    disableSessionSave?: boolean;
    iconCustoms?: {
      icon: React.ReactElement;
      onClick?: () => void;
    };
    // Tooltip lines shown on hover over the input icon. undefined = no tooltip.
    // The error icon auto-fills this with the failed validations.
    iconTooltip?: Array<string>;
    limitFileQuantity?: number;
    showPasswordStrength?: boolean;
    autoComplete?: HTMLInputAutoCompleteAttribute | undefined;
    direction?: "horizontal" | "vertical";
    checkBoxLink?: {
      text: string;
      url: string;
    };
    suggestion?: string;
    styles?: {
      container?: CSSProperties;
      input?: CSSProperties;
    };
  }

  // ----------------------- User and Login Interfaces -----------------------

  type ConsultationType = "general" | "geriatria" | "embarazo" | "pediatria";
  type ClinicalVariableGroup =
    | "General"
    | "Gynecology"
    | "Pediatrics"
    | "Geriatrics";

  interface ClinicalVariableOption {
    value: number | string;
    label: string;
  }

  type ClinicalVariableCatalog = Record<
    ClinicalVariableGroup,
    Record<string, ClinicalVariableOption[]>
  >;

  type ClinicalVariableDraftGroup = Record<string, number | string | undefined>;

  type ClinicalVariablesDraft = Partial<
    Record<ClinicalVariableGroup, ClinicalVariableDraftGroup>
  >;

  /** Grupo del record al que pertenece cada variable de las guías GIIS. */
  type GuideTarget =
    | "General"
    | "Gynecology"
    | "Pediatrics"
    | "Geriatrics"
    | "Detections"
    | "FamilyPlanning"
    | "Administrativas";

  /**
   * Lo que el router de guías resolvió para esta atención: qué formulario debe
   * llenar el médico y a qué grupo del record va cada campo.
   */
  interface RoutingResult {
    applicableGuides: Array<"CEX" | "DET" | "CPF">;
    activeNodes: string[];
    /** Borrador extraído por la IA, agrupado por destino del record. */
    draft: Partial<Record<GuideTarget, Record<string, unknown>>>;
    /** Inputs ya fusionados y deduplicados, en una sola lista plana. */
    inputList: InputCCprops[];
    /** identifier → grupo del record. Evita que el front adivine el destino. */
    fieldTargets: Record<string, GuideTarget>;
    /** identifier → cómo convertir el texto del formulario antes de guardarlo. */
    fieldTypes: Record<string, "integer" | "string">;
    steps?: number;
  }

  interface SynthesizeRecordResponse {
    record: MedRecord;
    /**
     * Solo viene en la mitad de síntesis del alta. Una nota de evolución se
     * crea de una sola llamada y no pasa por el router, así que llega sin él.
     */
    routing?: RoutingResult | null;
    pendingPatientData: Patient;
  }

  interface LoginResponse {
    accessToken: string;
    authentication: {
      payload: Object;
      strategy: string;
    };
    user: UserBasedSchema;
  }

  interface UserPatientsResponse {
    patientsList: Array<Patient>;
  }

  // Access role (version of access). Drives which dashboard the account sees.
  // Undefined on legacy users → treated as "medico".
  // - medico: unico rol creable por registro publico.
  // - enfermeria: unico rol creable desde Mi Equipo, bajo tutela de un medico.
  // - admin: supervision global, se siembra con backend/src/scripts/seed-admin.ts.
  type UserRole = "medico" | "enfermeria" | "admin";

  interface UserBasedSchema {
    _id: string;
    email: string;
    name: string;
    clues: string;
    role?: UserRole;
    password: string;
    googleId: string;
    groups: Array<{
      id: string;
      name: string;
    }>;
    medicalLicenses: Array<{
      id: string;
      institution: string;
      profession: string;
      registrationYear: string;
    }>;
    professionType: string;
    nombrePrestador?: string;
    primerApellidoPrestador?: string;
    segundoApellidoPrestador?: string;
    curpPrestador?: string;
    birthLocalizacion?: LocalizacionItem;
    residenceLocalizacion?: LocalizacionItem;
    institute: {
      Name: string;
      HospitalOrClinic: string;
    };
    patientsList: Array<string>;
    formats: {
      clinicalHistory: string;
      evoNote: string;
    };
    UID: {
      type: string;
      frontImg: string;
      reverseImg: string;
      faceImg: string;
      validity: string;
      model: string;
      mrz: string;
    };
    personalInfo: {
      sex: string;
      birthDate: string;
      birthPlace?: string;
      domicile?: string;
      curp: string;
    };
    status: {
      devices: Array<string>;
      recording: boolean;
    };
  }

  interface UserSchema extends Omit<UserBasedSchema, "patientsList"> {
    patientsList: Array<Patient>;
  }
  interface UserLoggedInProps {
    _id: string;
    name: string;
    email: string;
    accessToken: string;
  }

  interface InputGroupCC {
    orientation?: "horizontal" | "vertical";
    groupLabel?: string;
    inputs: Array<InputCCprops>;
    step?: number;
  }

  // ----------------------- AI Interfaces -----------------------

  type AiTypes = "Doubts Resolver" | "Consult Transcripter";

  interface AIChoice {
    finish_reason: string;
    index: number;
    message: {
      content: string;
      refusal: string;
      role: string;
    };
  }

  interface AIParseChoice<T> {
    finish_reason: string;
    index: number;
    message: {
      content: string;
      annotations: Array<string>;
      parsed: T;
    };
  }

  interface AIUsage {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  }

  interface AIRequest {
    type:
      | "fullCH"
      | "fullEN"
      | "speechCH"
      | "speechEN"
      | "zodFormat"
      | "DfDxMap";
    currentWorkingText?: string;
    inputedText: string;
    patientIdData?: string;
  }

  interface AIResponse {
    completion: {
      choices: Array<AIChoice>;
      created: number;
      id: string;
      model: string;
      object: string;
      system_fingerprint: string;
      usage: AIUsage;
    };
  }

  interface AIParsedResponse<T> {
    completion: {
      choices: Array<AIParseChoice<T>>;
      created: number;
      id: string;
      model: string;
      object: string;
      system_fingerprint: string;
      usage: AIUsage;
    };
  }

  interface AiRequestProps {
    text: string;
    clinicalHistory: string;
  }

  // ----------------------- Clinical History and Patients Types and Interfaces -----------------------

  interface LocalizacionEntry {
    id: string;
    nombre: string;
    catalogKey?: number;
  }

  interface LocalizacionItem {
    pais?: LocalizacionEntry;
    estado?: LocalizacionEntry;
    municipio?: LocalizacionEntry;
    localidad?: LocalizacionEntry;
    calle?: string;
    colonia?: string;
    codigoPostal?: string;
    domicilioTexto?: string;
  }

  interface PatientLocalizacion {
    nacimiento?: LocalizacionItem;
    domicilio?: LocalizacionItem;
  }

  type Sex = "Masculino" | "Femenino" | "Intersexual";

  // Lo deriva el backend de si el registro abre expediente o lo continúa;
  // el médico no elige tipo de documento.
  type EntryTypes = "ClinicalHistoryInit" | "EvolutionNote";

  interface PatientDiagnosisProps {
    id: string;
    Name: string;
    CIE?: string;
    Confirmed: Boolean;
    // System: Array<Systems>;
  }
  interface PatientDiagnosisPropsWithSection extends PatientDiagnosisProps {
    AnatomySection: AnatomySections;
  }

  interface Notes {
    _id: string;
    Type: string;
    Text: string;
  }
  interface labValProps {
    fullName: string;
    abreviation: string;
    unit?: string;
    value: string;
  }

  /** Valores tipados de somatometría, tal como salen del formulario. Las
   *  claves las mapea el backend contra su catálogo (build_somas_from_values). */
  /** Lo que el formulario captura: un texto por parámetro, sin convertir. */
  type SomasFormValues = Record<string, string>;

  /**
   * Somatometría guardada. Los trece parámetros son fijos y `null` significa NO
   * MEDIDO. Las etiquetas y unidades viven en `scripts/somasFields.ts`, no aquí:
   * el documento guarda números.
   */
  interface SomasValues {
    peso: number | null;
    talla: number | null;
    imc: number | null;
    circAbdominal: number | null;
    sistolica: number | null;
    diastolica: number | null;
    frecuenciaCardiaca: number | null;
    frecuenciaRespiratoria: number | null;
    temperatura: number | null;
    saturacionOxigeno: number | null;
    glucemia: number | null;
    /** Catálogo GIIS: 1 AYUNO · 2 CASUAL. */
    glucemiaTipo: number | null;
    /** Catálogo GIIS: 1 LABORATORIO · 2 TIRA REACTIVA. */
    glucemiaObtenida: number | null;
  }

  interface SomasResponse {
    _id: string;
    patientId: string;
    recordId?: string;
    dateTaken: string;
    values: SomasValues;
  }

  interface LabSomaLocalProps {
    dateTaken: string;
    /** Sólo Labs: el nombre del estudio. */
    name?: string;
    /** Sólo Labs: texto base del que se extrajeron los parámetros. */
    baseText?: string;
    /** Sólo Somas: los trece campos del formulario, tal como se capturaron. */
    somasValues?: SomasFormValues;
    /** Labs: un renglón por parámetro capturado. */
    values?: labValProps[];
  }

  interface NewLabSomaRequest {
    dateTaken: string;
    patientId: string;
    name?: string;
    baseText?: string;
    diagnosisId?: string;
    recordId?: string;
    values?: labValProps[];
  }

  interface NewSomasRequest {
    dateTaken: string;
    patientId?: string;
    recordId?: string;
    values: SomasFormValues;
  }

  interface LabSomaResponse extends NewLabSomaRequest {
    _id: string;
    values: labValProps[];
  }

  interface PointProps {
    Name: string;
    Abbr: string;
    yValue: number;
    xValue: string;
  }

  interface FormatedLabSomaParams {
    value: string;
    dateTaken: string;
  }

  interface LabSomaEntry {
    name: string;
    list: Array<FormatedLabSomaParams>;
  }

  type LabSomaIndexed = {
    [key in string]: LabSomaEntry;
  };

  interface LabSomaProps {
    value: string;
    dateTaken: string;
  }

  interface LabSomaBaseProps {
    name: string;
    topRange: number;
    bottomRange: number;
  }

  type LabSomaBaseDataIndexed = {
    [key in string]: LabSomaBaseProps;
  };

  /** Un fármaco recetado: la presentación completa del catálogo y su posología.
   *  Reemplaza los cinco campos que antes deducía un modelo de lenguaje. */
  interface DrugValues {
    name: string;
    indication: string;
  }

  interface MedicationProps {
    drugPresentation: string | undefined;
    indication: string | undefined;
  }

  interface PrescriptionProps {
    drugs: Drugs;
    patientData: Patient;
    userData: UserBasedSchema;
  }
  interface PrescriptionPropsWithQR extends PrescriptionProps {
    qr: string;
  }

  type Drugs =
    | {
        type: "processed";
        _id: string;
        patientId: string;
        recordId?: string;
        diagnosisId?: string;
        values: Array<DrugValues>;
      }
    | {
        type: "local";
        _id: string;
        patientId: string;
        recordId?: string;
        diagnosisId?: string;
        values: Array<MedicationProps>;
      };

  interface PrescriptionRequest {
    patientId: string;
    recordId?: string;
    diagnosisId?: string;
    values: DrugValues[];
  }

  interface ProcessedDrugs {
    _id: string;
    patientId: string;
    recordId?: string;
    diagnosisId?: string;
    values: DrugValues[];
  }

  interface Imgs {
    Name: string;
    Results: string;
    Image: string;
    DateOfStudy: string;
  }
  interface RxNormDrugsResponse {
    drugGroup: {
      conceptGroup: Array<{
        tty: "SBD" | "SCD";
        conceptProperties: Array<{
          language: string;
          name: string;
          rxcui: string;
          suppress: string;
          synonym: string;
          tty: string;
          umlscui: string;
        }>;
      }>;
    };
  }

  type ServiceAreas =
    | "CIRUGÍA"
    | "CONSULTA EXTERNA GENERAL"
    | "GINECOOBSTETRICIA"
    | "MEDICINA INTERNA"
    | "OFTALMOLOGÍA"
    | "OTORRINOLARINGOLOGÍA"
    | "PEDIATRÍA"
    | "TRAUMATOLOGÍA Y ORTOPEDIA"
    | "ALERGOLOGÍA"
    | "ANESTESIOLOGÍA"
    | "ANGIOLOGÍA"
    | "AUDIOLOGÍA | OTONEUROLOGÍA Y FONIATRÍA"
    | "CARDIOLOGÍA"
    | "CIRUGÍA MAXILOFACIAL"
    | "CIRUGÍA PLÁSTICA Y RECONSTRUCTIVA"
    | "CLÍNICA DE DOWN"
    | "DERMATOLOGÍA"
    | "ENDOCRINOLOGÍA"
    | "EPIDEMIOLOGÍA"
    | "GASTROENTEROLOGÍA"
    | "GENÉTICA"
    | "GERIATRÍA"
    | "HEMATOLOGÍA"
    | "INFECTOLOGÍA"
    | "INMUNOLOGÍA"
    | "MEDICINA INTEGRADA"
    | "MEDICINA NUCLEAR E IMAGENOLOGÍA MOLECULAR"
    | "NEFROLOGÍA"
    | "NEONATOLOGÍA"
    | "NEUMOLOGÍA"
    | "NEUROCIRUGÍA"
    | "NEUROLOGÍA"
    | "ONCOLOGÍA"
    | "PROCTOLOGÍA"
    | "REHABILITACIÓN"
    | "REUMATOLOGÍA"
    | "TRANSPLANTES"
    | "UROLOGÍA"
    | "CUIDADOS PALIATIVOS"
    | "GERONTOLOGÍA"
    | "OTROS";

  interface MedRecord {
    _id: string;
    patientId: string;
    ClinicalHistory: string;
    // Los diagnósticos ya NO los genera la IA: el médico los captura con el
    // buscador CIE en ConfirmMedRecord. La lista sigue existiendo y llega vacía.
    Diagnosis: Array<PatientDiagnosisProps>;
    Entry: {
      type: EntryTypes;
      text: string;
    };
    Temporality: string;
    FirstTimeInYear?: boolean;
    ServiceArea?: ServiceAreas;
    sintomaticoRespiratorioTb?: number;
    atencionPregestacionalRT?: number;
    riesgo?: string;
    relacionTemporalEmbarazo?: number;
    trimestreGestacional?: number;
    primeraVezAltoRiesgo?: number;
    complicacionPorDiabetes?: number;
    complicacionPorInfeccionUrinaria?: number;
    complicacionPorPreeclampsiaEclampsia?: number;
    complicacionPorHemorragia?: number;
    hipertensionarterialprexistente?: number;
    otrasAccPrescAcidoFolico?: number;
    puerpera?: number;
    infeccionPuerperal?: number;
    ninoSanoRT?: number;
    pruebaEDI?: number;
    resultadoEDI?: number;
    resultadoBattelle?: number;
    edasRT?: number;
    edasPlanTratamiento?: number;
    recuperadoDeshidratacion?: number;
    irasRT?: number;
    irasPlanTratamiento?: number;
    neumoniaRT?: number;
    sintomaDepresiva?: number;
    alteracionMemoria?: number;
    "aivd-ABVD"?: number;
    sindromeCaidas?: number;
    incontinenciaUrinaria?: number;
    motricidad?: number;
    asesoriaNutricional?: number;
    General?: ClinicalVariableDraftGroup;
    Gynecology?: ClinicalVariableDraftGroup;
    Pediatrics?: ClinicalVariableDraftGroup;
    Geriatrics?: ClinicalVariableDraftGroup;
  }

  type Sex = "Masculino" | "Femenino" | "Intersexual";

  interface Patient {
    _id: string;
    LUID: string;
    personalInfo: {
      names: string;
      middleName: string;
      lastName: string;
      sex: Sex;
      birthDate: string;
      birthPlace?: string;
      domicile?: string;
      curp: string;
      genre: string;
      derechohabiencia: Afiliacion[];
      // GIIS-B015-04-11 campos 18-21
      seAutodenominaAfromexicano?: number;
      seConsideraIndigena?: number;
      migrante?: number;
      paisProcedencia?: number;
    };
    localizacion?: {
      nacimiento?: LocalizacionItem;
      domicilio?: LocalizacionItem;
    };
    records: Array<MedRecord>;
  }

  interface PatientWithGroup extends Patient {
    group?: { name?: string; id?: string };
  }

  type Orders =
    | "Biometria Hemática (BH)"
    | "Perfil Bioquímico (PB)"
    | "Química Sanguínea (QS)"
    | "Examen General de Orina (EGO)"
    | "Pruebas de Función Hepática (PFH)"
    | "Proteina C Reactiva (PCR)"
    | "Perfil Tiroideo (PT)"
    | "Hemoglobina Glucosilada (HbA1c)"
    | "Hormona Foliculoestimulante (FSH)"
    | "Hormona Luteinizante (LH)"
    | "Índice HOMA"
    | "Estradiol (E2)"
    | "Testosterona Total"
    | "Testosterona Libre"
    | "Radiografía (Rx)"
    | "Ultrasonido (US)"
    | "Tomografía Axial Computarizada (TAC)"
    | "Resonancia Magnética (RM)"
    | "Otro";

  type OrdersIndexed = {
    [key in Orders]: {
      defaultObservation: string | undefined;
    };
  };

  interface Order {
    request: string | undefined;
    observations: string | undefined;
  }
  interface OrdersRequest {
    patientId: string;
    ordersArray: Array<Order>;
    diagnosisId?: string;
    recordId?: string;
  }

  interface OrdersResponse {
    _id: string;
    patientId: string;
    recordId?: string;
    ordersArray: Order[];
  }

  interface OrdersProps {
    orders: OrdersResponse;
    patientData: Patient;
    userData: UserBasedSchema;
  }
  interface OrdersPropsWithQr extends OrdersProps {
    qr: string;
  }

  interface ClinicalNoteProps {
    record: MedRecord;
    patientData: Patient;
    userData: UserBasedSchema;
  }

  type ClinicalHistorySections =
    | "FDI"
    | "AHF"
    | "APNP"
    | "APP"
    | "PEEA"
    | "IPAS"
    | "EF"
    | "DX";

  interface ClinicalHistorySectionProps {
    opened: boolean;
    fullName: string;
  }

  type IndexedClinicalHistorySections = {
    [key in ClinicalHistorySections]: ClinicalHistorySectionProps;
  };

  // Temis: SelectedMeshRefProps/MeshRefData/RefPropsArray/MeshVerticesProps
  // (referencias a THREE.Mesh/Vector3 para el modelo 3D) removidos. Ver DECISIONS.md.

  interface SectionProps {
    PatientInfo: Patient;
    onAddNewDoc?: (sectionType: CHSections | undefined) => void;
    onRedirect?: () => void;
    colorSchema?: colorSchemas;
    inverseContentSchema?: boolean;
  }

  interface NewFormDocSectionProps extends SectionProps {
    currentSection: CHSections;
  }

  interface FormActionGeneric extends NewFormDocSectionProps {
    phoneImg: FileCCProps | undefined;
  }

  // ------------ Sections Custom Added Types ----------------
  interface PrescriptionSectionProps extends SectionProps {
    currentPrescriptions?: Array<MedicationProps>;
    onPrescriptionsChange?: (prescriptions: Array<MedicationProps>) => void;
  }

  interface OrdersSectionProps extends SectionProps {
    currentOrders?: Array<Order>;
    onOrdersChange?: (orders: Array<Order>) => void;
  }

  interface CHSectionProps {
    CHAbbreviation: string;
    CHSubtitle: string;
    DocTitle: string;
    DocSubtitle: string;
    Icon: React.ReactElement;
    Component: React.FC<SectionProps>;
    acceptedFormats: AddTypesIndexed;
    SectionType: Array<"ClinicalHistory" | "AddDocument">;
  }

  type CHSections =
    | "Imgs"
    | "Labs"
    | "Drugs"
    | "CCH"
    | "Somas"
    | "Request"
    | "TMN"
    | "Consents";

  type CHSectionsIdexed = {
    [key in CHSections]: CHSectionProps;
  };

  type CHSectionsComponents = {
    [key in CHSections]: React.ReactElement;
  };

  // ----------------------- Dashboard Context -----------------------

  interface GlobalModalCCProps {
    size: "small" | "medium" | "large" | "extra large" | "imgFullScreen";
    animation: "popUp" | "bottomSlide";
    relative?: boolean;
    identifier: string;
    schema?: "day" | "night";
    onModalClose?: () => void;
  }

  interface ModalCCprops extends GlobalModalCCProps {
    useStates: {
      state: boolean;
      setState: React.Dispatch<React.SetStateAction<boolean>>;
    };
  }

  interface GlobalModalProps {
    Settings: GlobalModalCCProps;
    Component: React.ReactElement | undefined;
  }

  type SectionDataMap = {
    Imgs: Array<GabinetImgLocalProps>;
    Labs: Array<LabSomaLocalProps>;
    Drugs: Array<MedicationProps>;
    Somas: Array<LabSomaLocalProps>;
    Request: Array<Order>;
  };

  type AllowedSections = Exclude<CHSections, "CCH" | "TMN" | "Consents">;

  type ExtraData = {
    [key in AllowedSections]: SectionDataMap<key>;
  };

  interface PatientIdentification {
    names: string;
    middleName: string;
    lastName: string;
    sex: Sex;
    birthDate: string;
    birthPlace: string;
    domicile?: string;
    nacimientoLocalizacion?: LocalizacionItem;
    domicilioLocalizacion?: LocalizacionItem;
    genre: string;
    derechohabiencia: Afiliacion[];
    curp: string;
    tel?: string;
    estadoCivil?: string;
    ocupacion?: string;
    escolaridad?: string;
    // GIIS-B015-04-11 campos 18-21
    seAutodenominaAfromexicano?: number;
    seConsideraIndigena?: number;
    migrante?: number;
    paisProcedencia?: number;
  }

  interface SessionData {
    toBeAdded: toBeAddedTypes | "init";
    currentStep: number;
    method: methodTypes;
    docType: CHSections;
    currentPatientData: Patient | undefined;
    currentRecord: SynthesizeRecordResponse | undefined;
    currentModText: string;
    idData?: string;
    /** true = sólo se capturan datos de identificación, sin consulta. Lo fija
     *  el paso de alcance (step 6) del flujo de paciente nuevo. */
    identificationOnly?: boolean;
    patientIdentification: PatientIdentification | undefined;
    /**
     * Diagnósticos CIE elegidos por el médico junto con la nota, con su entrada
     * completa del catálogo. GIIS admite hasta tres; hoy el formulario captura
     * el primero, el arreglo deja lista la ampliación.
     */
    diagnosisCatalog: CIEResponse[];
    extraData: ExtraData;
  }

  type NewFlowIndexed = {
    [key in toBeAddedTypes]: Array<React.ReactElement>;
  };

  // ----------------------- Image & File Uploads -----------------------

  type toBeAddedTypes = "patient" | "document";

  type uploadTypes = "file" | "image";

  type actionTypes =
    | "newPatient"
    | "INEextraction"
    | "CURPRenapo"
    | "OCRextraction"
    | "AIImgExtraction"
    | "phoneUpload";

  type methodTypes = "text" | "init" | uploadTypes;

  interface AddTypesProps {
    description: string;
  }

  type AddTypesIndexed = {
    [key in methodTypes]?: AddTypesProps;
  };

  type GabinetImgs = "XRay" | "TAC" | "MRI" | "US" | "Foto" | "Otro";

  interface GabinetImgLocalProps {
    Name: string;
    Interpretation: string;
    Type: GabinetImgs;
    Image: string;
    DateOfStudy: string;
  }
  interface GabinetImgPropsRequest {
    patientId: string;
    diagnosisId?: string;
    recordId?: string;
    Name: string;
    Interpretation: string;
    Type: GabinetImgs;
    Image: string;
    DateOfStudy: string;
  }

  interface GabinetImgResponse extends GabinetImgPropsRequest {
    _id: string;
  }

  // ----------------------- Maps -----------------------

  interface dxBinary {
    name: string;
    explanation: string;
  }

  interface LocalMapsProps {
    title: string;
    diffDxs: Array<dxBinary>;
  }

  interface MapCreateRequest {
    title?: string;
    patientId: string;
    inputedText?: string;
    recordId?: string;
    diagnosisId?: string;
    diffDxs?: Array<{
      name: string;
      explanation: string;
    }>;
  }
  interface MapResponseProps {
    _id: string;
    title: string;
    patientId: string;
    recordId?: string;
    diagnosisId?: string;
    diffDxs: Array<{
      name: string;
      explanation: string;
    }>;
  }

  interface MapsProps extends MapCreateRequest {
    _id: string;
  }

  // ----------------------- Groups -----------------------

  interface Group {
    _id: string;
    name: string;
    patients: { patientsList: Patient[] };
    members: string[];
  }

  // ----------------------- Agenda -----------------------

  interface Appointments {
    patientName: string;
    patientId: string;
    startDate: string;
    endDate: string;
  }

  interface NewAppointment extends Appointments {
    agendaId: string;
  }

  interface AppointmentWithId extends NewAppointment {
    id: string;
  }

  interface Agenda {
    _id: string;
    userId: string;
    appointments: Array<AppointmentWithId>;
  }

  // ----------------------- Anatomical Types and Interfaces -----------------------

  type HumanSystems = "Skeletal" | "Muscular" | "Organs";

  type HumanSystemsIndexed = {
    [key in HumanSystems]: Array<ModelObjectProps>;
  };

  // Temis: sin campo Mesh (JSX 3D) — solo Name + AnatomySection.
  interface ModelObjectProps {
    Name: AnatomyParts;
    AnatomySection: AnatomySections;
  }

  type AnatomicalSystems =
    | "Transparent System"
    | "Skeletal System"
    | "Muscular Systema"
    | "Nervious Systema"
    | "Gastrointestinal System";

  type RiskTypes = "High" | "Medium" | "Low" | "Controlled";

  interface RiskProps {
    spanishName: string;
  }

  type RiskTypesIndexed = {
    [key in RiskTypes]: RiskProps;
  };

  interface AnatomyPartProps {
    Name: AnatomyParts;
    RiskType: RiskTypes;
  }

  // Temis: CustomModelProps/IndividualAnatomyModelProps (props del modelo 3D)
  // removidos junto con ModelCC/IndividualAnatomy. Ver DECISIONS.md.

  // Expediente completo precargado (modo compartido): evita que ClinicalHistory
  // dispare los fetch por diagnóstico contra endpoints scopeados por CLUES.
  interface SharedRecordBundle {
    somas: SomasResponse[];
    labs: LabSomaResponse[];
    drugs: Drugs[];
    imgs: GabinetImgResponse[];
    orders: OrdersResponse[];
    maps: MapResponseProps[];
  }

  interface ClinicalHistoryProps {
    fullScreen?: boolean;
    chRef?: RefObject<HTMLDivElement>;
    PatientInfo: PatientWithGroup | undefined;
    setPatientInfo?: React.Dispatch<
      React.SetStateAction<PatientWithGroup | undefined>
    >;
    onSectionChange?: () => void;
    // Modo lectura compartido: datos ya cargados, sin llamar a los endpoints.
    sharedBundle?: SharedRecordBundle;
  }
}
