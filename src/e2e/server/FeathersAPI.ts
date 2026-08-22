"use server";

import {
  SOMAS_FIELDS,
  GLUCEMIA_TIPO,
  GLUCEMIA_OBTENIDA,
  somasInputId,
} from "@/scripts/somasFields";

// ------------- User Functions ------------------------------

export const Register_User = (
  registerFormData: FormData,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "users",
      logId: "user_registered",
      logs: true,
      successToast:
        "Has sido registrado con éxito, ahora puedes iniciar sesión",
      data: {
        email: registerFormData.get("regMail"),
        password: registerFormData.get("regPass"),
        clues: registerFormData.get("CluesResult")
          ? registerFormData.get("CluesResult")
          : "NLSSA000000",
        name: registerFormData.get("regName"),
        professionType: registerFormData.get("PersonalTypeResult"),
        medicalLicenses: [
          {
            id: registerFormData.get("medicalLicense")
              ? // @ts-ignore
                registerFormData.get("medicalLicense")
              : "12345",
          },
        ],
        UID: {
          type: "INE",
          frontImg:
            process.env.NEXT_PUBLIC_ENV_TYPE === "production"
              ? // @ts-ignore
                registerFormData.get("IdVerif").split("|")[0]
              : "null",
          reverseImg:
            process.env.NEXT_PUBLIC_ENV_TYPE === "production"
              ? // @ts-ignore
                registerFormData.get("IdVerif").split("|")[1]
              : "null",
          faceImg:
            process.env.NEXT_PUBLIC_ENV_TYPE === "production"
              ? // @ts-ignore
                registerFormData.get("IdVerif").split("|")[2]
              : "null",
        },
      },
    }),
  );
};

export interface RegisterUserFullPayload {
  email: string;
  password: string;
  name: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  curpPrestador: string;
  clues: string;
  professionType: string;
  medicalLicense: string;
  uidString: string;
  nufiPreVerified: boolean;
  nufiData?: {
    sex: string;
    birthDate: string;
    birthPlace: string;
    domicile: string;
    curp: string;
    vigencia: string;
    model: string;
    mrz: string;
  };
  birthLocalizacion?: Partial<LocalizacionItem> & { domicilioTexto?: string };
  residenceLocalizacion?: Partial<LocalizacionItem> & {
    domicilioTexto?: string;
  };
}

export const Register_User_Full = (
  payload: RegisterUserFullPayload,
): Promise<feathersApiProps> => {
  const [frontImg, reverseImg, faceImg] =
    process.env.NEXT_PUBLIC_ENV_TYPE === "production" && payload.uidString
      ? payload.uidString.split("|")
      : ["null", "null", "null"];

  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "users",
      logId: "user_registered",
      logs: true,
      // noAuthService: true,
      successToast:
        "Has sido registrado con éxito, ahora puedes iniciar sesión",
      data: {
        email: payload.email,
        password: payload.password,
        clues: [payload.clues || "NLSSA000000"],
        name: payload.name,
        nombre: payload.nombre,
        primerApellido: payload.primerApellido,
        segundoApellido: payload.segundoApellido,
        curpPrestador: payload.curpPrestador,
        professionType: payload.professionType,
        medicalLicenses: [{ id: payload.medicalLicense || "12345" }],
        UID: { type: "INE", frontImg, reverseImg, faceImg },
        nufiPreVerified: payload.nufiPreVerified,
        nufiData: payload.nufiData,
        birthLocalizacion: payload.birthLocalizacion,
        residenceLocalizacion: payload.residenceLocalizacion,
      },
    }),
  );
};

export const Verify_Nufi_Identity = (
  frontImg: string,
  reverseImg: string,
  faceImg: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "verify-nufi",
      logId: "nufi_identity_pre_verified",
      logs: false,
      noAuthService: true,
      data: { frontImg, reverseImg, faceImg },
    }),
  );
};

export const Get_User_Patients = (): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "patients",
      logId: "user_patients_retrieved",
      logs: false,
    }),
  );
};

export const Update_User_Patients = (
  resourceId: string,
  patientsList: Array<string>,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "patch",
      service: "users",
      logId: "patient_added_to_user_list",
      logs: false,
      resourceId,
      data: { patientsList: patientsList },
      successToast: "Expediente Agregado a tus Pacientes",
    }),
  );
};

// ------------- Patient Functions ------------------------------

export const Synthesize_New_Patient = (
  ClinicalHistory: string,
  patientIdentification?: PatientIdentification,
  // Entradas completas del catálogo CIE. El router de guías las usa como
  // evidencia dura para decidir qué bloques del formulario pintar.
  diagnosisCatalog?: CIEResponse[],
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "records",
      logId: "patient_record_synthesized",
      logs: true,
      successToast: undefined,
      data: {
        ClinicalHistory,
        ...(patientIdentification ? { patientIdentification } : {}),
        ...(diagnosisCatalog?.length ? { diagnosisCatalog } : {}),
      },
      query: { synthesize: true },
    }),
  );
};

/**
 * Convierte una entrada del catálogo CIE en el diagnóstico que persiste el
 * record. `giisRecordValidator` valida el código contra el catálogo del
 * servidor, así que aquí solo se arma la forma que espera el esquema.
 */
export const DiagnosisFromCIE = (cie: CIEResponse): PatientDiagnosisProps => ({
  id: cie.CATALOG_KEY,
  Name: cie.NOMBRE,
  CIE: cie.CATALOG_KEY,
  Confirmed: false,
});

export const Confirm_New_Patient = (
  recordData: Partial<MedRecord>,
  userLocalizacion?: PatientLocalizacion,
  patientIdentification?: PatientIdentification,
  diagnosisCatalog?: CIEResponse[],
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "records",
      logId: "new_patient_created",
      logs: true,
      successToast: "Paciente Registrado con Éxito",
      data: {
        ...recordData,
        // Sin `Diagnosis` el validador GIIS sale temprano y las restricciones
        // por sexo y edad (LSEX/LINF/LSUP) nunca llegan a correr.
        ...(diagnosisCatalog?.length
          ? {
              diagnosisCatalog,
            }
          : {}),
        ...(userLocalizacion && Object.keys(userLocalizacion).length > 0
          ? { userLocalizacion }
          : {}),
        ...(patientIdentification ? { patientIdentification } : {}),
      },
    }),
  );
};

export const Save_Evo_Note = (
  ClinicalHistory: string,
  patientId: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "records",
      logs: false,
      successToast: "Nota de Evolución guardada con Éxito",
      logId: "new_evo_note_added_to_patient",
      patientId,
      data: {
        ClinicalHistory: ClinicalHistory,
        patientId,
      },
    }),
  );
};

export const Update_Record = (
  recordId: string,
  updateData: MedRecord,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "patch",
      service: "records",
      logId: "record_updated_or_modified",
      logs: false,
      successToast: "Cambios Guardados",
      resourceId: recordId,
      data: updateData,
    }),
  );
};

export const Search_One_Patient = (
  fullName: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      logId: "user_single_patient_search",
      service: "patients",
      logs: false,
      data: fullName,
    }),
  );
};

// Compartir expediente: el médico con acceso genera un link + contraseña.
export const Create_Record_Share = (
  patientId: string,
  password: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "record-share",
      logId: "record_share_created",
      logs: false,
      successToast: "Link de expediente creado",
      data: { patientId, password },
    }),
  );
};

// Canje público del link: token + contraseña + identidad (sesión o NUFI).
export const Redeem_Record_Share = (data: {
  token: string;
  password: string;
  accessToken?: string;
  nufiData?: { frontImg: string; reverseImg: string; faceImg: string };
}): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "record-redeem",
      logId: "record_share_redeemed",
      logs: false,
      noAuthService: true,
      data,
    }),
  );
};

export interface ConsentCreatePayload {
  templateId: string;
  patientId?: string;
  patientName?: string;
}

export interface ConsentSignPayload {
  token: string;
  mode: "canvas" | "acceptance";
  signerName: string;
  signatureImage?: string;
}

export const Create_Consent = (
  data: ConsentCreatePayload,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "consents",
      logId: "consent_created",
      logs: false,
      successToast: "Link de consentimiento creado",
      patientId: data.patientId,
      data,
    }),
  );
};

// El servicio mantiene `find`; `get('list')` adapta esa consulta al wrapper
// actual, cuyo tipo de métodos todavía no incluye `find`.
export const Get_Consents = (patientId?: string): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "consents",
      logId: "consents_retrieved",
      logs: false,
      data: "list",
      query: patientId ? { patientId } : undefined,
    }),
  );
};

export const Get_Public_Consent = (
  token: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "consent-sign",
      logId: "public_consent_retrieved",
      logs: false,
      nonLoggable: true,
      noAuthService: true,
      data: token,
    }),
  );
};

export const Sign_Consent = (
  data: ConsentSignPayload,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "consent-sign",
      logId: "public_consent_signed",
      logs: false,
      nonLoggable: true,
      noAuthService: true,
      data,
    }),
  );
};

export const Get_Patient_Records = (
  patientId: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "records",
      logs: false,
      logId: "single_patient_records_retrieved",
      patientId: patientId,
      data: patientId,
    }),
  );
};

export const Get_Patients_For_GIIS = (
  dateForm: FormData,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "patients",
      logId: "giis_report_patients_retrieved",
      logs: false,
      data: "giisRequest",
      query: {
        startDate: dateForm.get("initialDate"),
        endDate: dateForm.get("finalDate"),
      },
    }),
  );
};

export const Delete_Patient_Complete_Records = (
  patientId: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "remove",
      service: "patients",
      logs: false,
      logId: "patient_deleted_completely",
      patientId: patientId,
      data: patientId,
      successToast: "Expediente eliminado correctamente",
    }),
  );
};

// ------------- Group Functions ------------------------------

export const Create_Group = (data: FormData): Promise<feathersApiProps> => {
  return new Promise<feathersApiProps>((resolve) =>
    resolve({
      method: "create",
      service: "groups",
      logs: false,
      successToast: `El grupo fue creado exitosamente`,
      logId: "user_created_new_group",
      data: {
        name: data.get("groupName"),
      },
    }),
  );
};

export const Get_Group_Patients = (
  groupId: string,
): Promise<feathersApiProps> => {
  return new Promise<feathersApiProps>((resolve) =>
    resolve({
      method: "get",
      service: "groups",
      logs: false,
      logId: "user_retrieved_patients_from_group",
      data: groupId,
      query: { populatePatients: true },
    }),
  );
};

export const Get_User_Groups = (
  resourceId: string,
): Promise<feathersApiProps> => {
  return new Promise<feathersApiProps>((resolve) =>
    resolve({
      method: "get",
      service: "groups",
      logs: false,
      logId: "retrieved_current_user_groups",
      data: resourceId,
      query: { getUserGroups: true },
    }),
  );
};

export const Add_Patient_To_Group = (
  groupID: string,
  newPatientId: string,
  groupName: string,
  patientName: string,
): Promise<feathersApiProps> => {
  return new Promise<feathersApiProps>((resolve) =>
    resolve({
      method: "patch",
      service: "groups",
      logId: "user_added_patient_to_group",
      logs: false,
      resourceId: groupID,
      patientId: newPatientId,
      successToast: `${patientName} añadido al grupo ${groupName}`,
      data: {
        patients: [newPatientId],
        action: "add",
      },
    }),
  );
};

export const Remove_Patient_From_Group = (
  groupID: string,
  newPatientId: string,
): Promise<feathersApiProps> => {
  return new Promise<feathersApiProps>((resolve) =>
    resolve({
      method: "patch",
      service: "groups",
      logId: "user_removed_patient_from_group",
      logs: false,
      resourceId: groupID,
      patientId: newPatientId,
      successToast: `Paciente removido al grupo`,
      loadingToast: "Removiendo paciente...",
      data: {
        patients: [newPatientId],
        action: "remove",
      },
    }),
  );
};

export const Delete_Entire_Group = (
  groupID: string,
): Promise<feathersApiProps> => {
  return new Promise<feathersApiProps>((resolve) =>
    resolve({
      method: "remove",
      service: "groups",
      logId: "user_deleted_entire_group",
      logs: false,
      successToast: `Folder eliminado Correctamente`,
      loadingToast: "Eliminando folder...",
      data: groupID,
    }),
  );
};

// ------------- Agenda Functions ------------------------------

export const Get_User_Agenda = (): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "agenda",
      logId: "user_retrieved_agenda",
      logs: false,
    }),
  );
};

export const Add_Patient_To_Agenda = ({
  agendaId,
  patientId,
  patientName,
  startDate,
  endDate,
}: NewAppointment): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "patch",
      service: "agenda",
      logId: "user_added_event_to_agenda",
      logs: false,
      resourceId: agendaId,
      patientId,
      successToast: "Paciente Agregado a la Agenda",
      query: { patchType: "newEvent" },
      data: {
        appointments: [
          {
            id: `${Math.floor(Math.random() * 100000000).toString()}`, // Generating a random ID for the new event
            patientId,
            patientName,
            startDate,
            endDate,
          },
        ],
      },
    }),
  );
};

export const Delete_Agenda_Event = ({
  patientId,
  patientName,
  startDate,
  endDate,
  agendaId,
  id,
}: AppointmentWithId): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "patch",
      service: "agenda",
      logs: false,
      resourceId: agendaId,
      patientId: patientId,
      successToast: "Cita eliminada",
      logId: "user_deleted_agenda_event",
      query: { patchType: "deleteEvent" },
      data: {
        appointments: [
          {
            id,
            patientName,
            patientId,
            startDate,
            endDate,
          },
        ],
      },
    }),
  );
};

export const Modify_Agenda_Event = ({
  patientId,
  patientName,
  startDate,
  endDate,
  agendaId,
  id,
}: AppointmentWithId): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "patch",
      service: "agenda",
      logId: "user_modified_agenda_event",
      logs: false,
      resourceId: agendaId,
      patientId: patientId,
      successToast: "Agenda modificada",
      query: { patchType: "eventUpdate" },
      data: {
        appointments: [
          {
            id,
            patientName,
            patientId,
            startDate,
            endDate,
          },
        ],
      },
    }),
  );
};

export const Synthesize_Exchange_Document = (
  patientId: string,
  recordId: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "exchange-file",
      logId: "exchange_document_synthesized",
      logs: false,
      successToast: undefined,
      patientId,
      data: {
        patientId,
        recordId,
      },
      query: { synthesizeExchange: true },
    }),
  );
};

export const Create_Insurance_Report = (
  patientId: string,
  recordIds: string[],
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "ai",
      logId: "insurance_report_synthesized",
      logs: true,
      patientId,
      data: {
        type: "insuranceReport",
        patientId,
        recordIds,
      },
    }),
  );
};

// ------------- Laboratories ------------------------------

export const Get_Patient_Laboratories = (
  patientId: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "labs",
      logs: false,
      patientId,
      logId: "user_retrieved_laboratories_from_patient",
      data: patientId,
    }),
  );
};

export const Get_Diagnosis_Laboratories = (
  patientId: string,
  diagnosisId: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "labs",
      nonLoggable: true,
      logId: "user_retrieved_laboratories_from_diagnosis",
      patientId,
      logs: false,
      data: `${patientId}~${diagnosisId}`,
    }),
  );
};

export const Modify_Laboratories = (
  labsId: string,
  labForm: Object,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "patch",
      service: "labs",
      logs: false,
      successToast: `Labs modificados`,
      resourceId: labsId,
      logId: "user_modified_patient_laboratories",
      data: labForm,
    }),
  );
};

export const Save_Laboratories_Custom = ({
  name,
  values,
  dateTaken,
  patientId,
  diagnosisId,
  recordId,
}: NewLabSomaRequest): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "labs",
      logs: false,
      patientId: patientId,
      successToast: `Laboratorios agregados al expediente`,
      logId: "user_added_laboratories_to_patient_with_document",
      data: {
        name,
        values,
        dateTaken,
        patientId,
        diagnosisId,
        recordId,
      },
    }),
  );
};

// ------------- Gabinet Imgs ------------------------------

export const Get_Patient_Gabinet_Imgs = (
  patientId: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "imgs",
      patientId,
      logId: "user_retrieved_imgs_from_patient",
      logs: false,
      data: patientId,
    }),
  );
};

export const Delete_Gabinet_Img = (
  imgId: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "remove",
      service: "imgs",
      logId: "user_deleted_img_from_patient",
      logs: false,
      data: imgId,
      successToast: "Imágen eliminada correctamente",
    }),
  );
};

export const Get_Diagnosis_Imgs = (
  patientId: string,
  diagnosisId: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "imgs",
      patientId,
      logId: "user_retrieved_imgs_from_diagnosis",
      nonLoggable: true,
      logs: false,
      data: `${patientId}~${diagnosisId}`,
    }),
  );
};

// ------------- Somatometries ------------------------------

export const Get_Patient_Somatometrias = (
  patientId: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "somas",
      patientId,
      logId: "user_retrieved_somas_from_patient",
      logs: false,
      data: patientId,
    }),
  );
};

export const Get_Diagnosis_Somatometrias = (
  patientId: string,
  diagnosisId: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "somas",
      patientId,
      logs: false,
      nonLoggable: true,
      logId: "user_retrieved_somas_from_patient_diagnosis",
      data: `${patientId}~${diagnosisId}`,
    }),
  );
};

/**
 * Traduce los campos del formulario de somatometría a las claves que espera el
 * hook `build_somas_from_values` del backend. El catálogo (nombre completo,
 * abreviación, unidad, rangos) vive SOLO en el backend a propósito: duplicarlo
 * aquí garantizaría que los dos se desincronicen.
 */
/**
 * Los trece campos del formulario, tal como los escribió el médico. El backend
 * los valida y los normaliza a número; aquí no se convierte nada.
 */
export const BuildSomasValues = (formData: FormData): SomasFormValues => {
  const campo = (k: string) => ((formData.get(k) as string) ?? "").trim();
  const codigo = (
    k: string,
    catalogo: Array<{ value: number; label: string }>,
  ) => {
    const etiqueta = campo(k);
    const opcion = catalogo.find((o) => o.label === etiqueta);
    return opcion ? String(opcion.value) : "";
  };

  const values: SomasFormValues = {};
  SOMAS_FIELDS.forEach((field) => {
    values[field.key] = campo(somasInputId(field.key));
  });
  values.glucemiaTipo = codigo("somasGlucemiaType", GLUCEMIA_TIPO);
  values.glucemiaObtenida = codigo("somasGlucemiaObt", GLUCEMIA_OBTENIDA);
  return values;
};

export const Save_Somatometrias = (
  somasData: FormData,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "somas",
      logs: false,
      logId: "user_added_somas_to_patient_from_original_form",
      successToast: `Somatometrías agregados al expediente`,
      data: {
        values: BuildSomasValues(somasData),
        dateTaken: somasData.get("somasDate") as string,
        patientId: somasData.get("patientId") as string,
      },
    }),
  );
};

export const Save_Somatometrias_Custom = ({
  dateTaken,
  patientId,
  recordId,
  values,
}: NewSomasRequest): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "somas",
      logs: false,
      successToast: `Somatometrías agregados al expediente`,
      logId: "user_added_somas_to_patient_with_document",
      data: {
        values,
        dateTaken,
        patientId,
        recordId,
      },
    }),
  );
};

/** Corre las validaciones del backend sin guardar nada. */
export const Validate_Somatometrias_Custom = ({
  dateTaken,
  values,
}: Pick<
  NewSomasRequest,
  "dateTaken" | "values"
>): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "somas",
      logs: true,
      successToast: undefined,
      logId: "user_validated_somas",
      nonLoggable: true,
      query: { validateOnly: true },
      data: {
        values,
        dateTaken,
      },
    }),
  );
};

// ------------- Meds and Supplements ------------------------------

export const Save_Drugs = ({
  patientId,
  recordId,
  values,
  diagnosisId,
}: PrescriptionRequest): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "drugs",
      logs: false,
      successToast: `Fármacos agregados al expediente`,
      logId: "user_added_drugs_to_patient",
      data: {
        values,
        patientId,
        recordId,
        diagnosisId,
      },
    }),
  );
};

export const Get_Patient_Drugs = (
  patientId: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "drugs",
      patientId,
      logs: false,
      logId: "user_retrieved_drugs_from_patient",
      data: patientId,
    }),
  );
};

export const Get_Diagnosis_Drugs = (
  patientId: string,
  diagnosisId: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "drugs",
      nonLoggable: true,
      patientId,
      logs: false,
      logId: "user_retrieved_drugs_from_patient_diagnosis",
      data: `${patientId}~${diagnosisId}`,
    }),
  );
};

// ------------- DfDx Map Routes ------------------------------

export const Get_Patient_Maps = (
  patientId: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "maps",
      patientId,
      logId: "user_retrieved_maps_from_patient",
      logs: false,
      data: patientId,
    }),
  );
};

export const Get_Patient_Orders = (
  patientId: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "orders",
      patientId,
      logId: "user_retrieved_orders_from_patient",
      logs: false,
      data: patientId,
    }),
  );
};

export const Create_Patient_Orders = ({
  patientId,
  ordersArray,
  diagnosisId,
  recordId,
}: OrdersRequest): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "orders",
      logs: false,
      logId: "user_created_orders_for_patient",
      data: {
        patientId,
        ordersArray,
        diagnosisId,
        recordId,
      },
    }),
  );
};

export const Get_Diagnosis_Orders = (
  patientId: string,
  diagnosisId: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "orders",
      patientId,
      nonLoggable: true,
      logs: false,
      logId: "user_retrieved_orders_from_patient_diagnosis",
      data: `${patientId}~${diagnosisId}`,
    }),
  );
};

// ------------- Nufi Routes ------------------------------

export const Extract_INE_Data = (
  base64imgArray: string[],
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "uploads",
      logs: false,
      logId: "user_extracted_ine_data_from_patient",
      data: {
        FileList: base64imgArray,
        Type: "image",
        Action: "INEextraction",
        Description: "",
      },
    }),
  );
};

export const CURP_Renapo_Extraction = (
  curp: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "uploads",
      logs: false,
      logId: "user_extracted_renapo_curp_data_from_patient",
      data: {
        FileList: [curp],
        Type: "file",
        Action: "CURPRenapo",
        Description: "",
      },
    }),
  );
};

export const User_LogOut = (): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "remove",
      service: "authentication",
      logs: false,
      logId: "user_logged_out",
    }),
  );
};

// ------------- Catalog Routes ------------------------------

export const Search_CIE_By_Name = (
  CIENameOrCode: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "catalogo-dxcie-10",
      logs: false,
      logId: "user_searched_cie_by_name",
      data: CIENameOrCode,
    }),
  );
};

export const Search_Paises_By_Name = (
  name: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "catalogo-paises",
      logs: false,
      logId: "user_searched_pais_by_name",
      nonLoggable: true,
      data: name,
    }),
  );
};

export const Google_Autocomplete = (
  input: string,
  sessionToken: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "google-api",
      logs: false,
      logId: "user_searched_domicilio",
      nonLoggable: true,
      data: { action: "autocomplete", input, sessionToken },
    }),
  );
};

export const Google_Place_Details = (
  placeId: string,
  sessionToken: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "create",
      service: "google-api",
      logs: false,
      logId: "user_selected_domicilio",
      nonLoggable: true,
      data: { action: "details", placeId, sessionToken },
    }),
  );
};

export const Search_EntFed = (query: string): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "catalogo-ent-fed",
      logs: false,
      logId: "user_searched_ent_fed",
      nonLoggable: true,
      data: query,
    }),
  );
};

export const Search_Municipios = (
  query: string,
  efeKey?: number,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "catalogo-municipios",
      logs: false,
      logId: "user_searched_municipio",
      nonLoggable: true,
      data: query,
      ...(efeKey !== undefined && { query: { EFE_KEY: efeKey } }),
    }),
  );
};

export const Search_Localidades = (
  query: string,
  efeKey?: number,
  munKey?: number,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "catalogo-localidades",
      logs: false,
      nonLoggable: true,
      logId: "user_searched_localidad",
      data: query,
      ...((efeKey !== undefined || munKey !== undefined) && {
        query: {
          ...(efeKey !== undefined && { EFE_KEY: efeKey }),
          ...(munKey !== undefined && { MUN_KEY: munKey }),
        },
      }),
    }),
  );
};

export const Search_Establecimientos = (
  query: string,
): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "catalogo-establecimientos",
      logs: false,
      nonLoggable: true,
      logId: "user_searched_establecimiento",
      noAuthService: true,
      data: query,
    }),
  );
};

export const Get_Afiliaciones = (): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "catalogo-afiliaciones",
      logs: false,
      logId: "get_afiliaciones",
      nonLoggable: true,
      data: "all",
    }),
  );
};

export const Get_PersonalType = (): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "catalogo-personal-type",
      logs: false,
      logId: "get_personal_type",
      noAuthService: true,
      nonLoggable: true,
    }),
  );
};

export const Get_ServByType = (): Promise<feathersApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "catalogo-serv-by-type",
      logs: false,
      logId: "get_serv_by_type",
      data: "all",
      nonLoggable: true,
    }),
  );
};

// ─────────────────────────  Consola de administración  ─────────────────────────
// Todas apuntan al servicio `admin-console`, que vive fuera de los servicios
// clínicos porque el rol `admin` los tiene prohibidos y necesita ver a través de
// todos los establecimientos. El backend valida el rol en cada llamada.

export type AdminPatientFilters = {
  q?: string;
  sex?: string;
  from?: string;
  to?: string;
  doctorId?: string;
  clues?: string;
  $limit?: number;
  $skip?: number;
};

const adminConsoleRequest = (
  section: "doctors" | "patients" | "stats" | "agendas",
  logId: string,
  query: Record<string, unknown> = {},
): Promise<feathersApiProps> => {
  const cleanQuery = Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== "" && value !== null,
    ),
  );

  return new Promise((resolve) =>
    resolve({
      method: "get",
      service: "admin-console",
      logs: false,
      nonLoggable: true,
      logId,
      data: section,
      query: { section, ...cleanQuery },
    }),
  );
};

export const Get_Admin_Doctors = (): Promise<feathersApiProps> =>
  adminConsoleRequest("doctors", "admin_doctors_listed");

export const Search_Admin_Patients = (
  filters: AdminPatientFilters,
): Promise<feathersApiProps> =>
  adminConsoleRequest("patients", "admin_patients_searched", filters);

export const Get_Admin_Stats = (
  filters: AdminPatientFilters,
): Promise<feathersApiProps> =>
  adminConsoleRequest("stats", "admin_stats_retrieved", filters);

export const Get_Admin_Agendas = (filters: {
  doctorId?: string;
  clues?: string;
  from?: string;
  to?: string;
}): Promise<feathersApiProps> =>
  adminConsoleRequest("agendas", "admin_agendas_retrieved", filters);
