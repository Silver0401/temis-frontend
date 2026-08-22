import FormCC from "@/components/Form-CC";
import { DashboardContext } from "@/e2e/dashboardContext";
import { GlobalContext } from "@/e2e/globalContext";
import {
  Confirm_New_Patient,
  Create_Patient_Orders,
  Get_ServByType,
  Save_Drugs,
  Save_Laboratories_Custom,
  Save_Somatometrias_Custom,
} from "@/e2e/server/FeathersAPI";
import { Save_Gabinet_Img2 } from "@/e2e/server/AxiosAPI";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { curpStateCodeFromCatalogKey, ValidateCURP } from "@/scripts/Generator";
import PaisesSearchCC from "@/components/SearchInputs/PaisesSearch-CC";
import EntFedSearchCC from "@/components/SearchInputs/EntFedSearch-CC";
import DomicilioSearchCC from "@/components/SearchInputs/DomicilioSearch-CC";
import { toast } from "sonner";
/**
 * Reparte los valores del formulario en los grupos del record.
 *
 * El mapa identifier → grupo lo manda el backend en `routing.fieldTargets`: es
 * el router quien sabe a qué guía pertenece cada variable. Antes esto se
 * adivinaba con un switch por tipo de consulta que solo contemplaba tres
 * grupos, así que Detecciones, Planificación Familiar y Administrativas nunca
 * llegaban a guardarse desde el formulario.
 */
const groupVariablesByTarget = (
  formData: FormData,
  fieldTargets: Record<string, GuideTarget>,
  fieldTypes: Record<string, "integer" | "string">,
): Partial<MedRecord> => {
  const payload: Record<string, Record<string, number | string>> = {};

  for (const [identifier, target] of Object.entries(fieldTargets)) {
    const raw = formData.get(identifier);
    if (typeof raw !== "string" || raw === "" || raw === "default") continue;

    // Los selects del router se pintan como "N - Etiqueta": el valor es la
    // clave del catálogo. Si va a un campo declarado como cadena en el record
    // se guarda como texto; convertirla a número reventaba la validación.
    const clave = raw.split(" - ")[0].trim();
    if (fieldTypes[identifier] === "string") {
      payload[target] ??= {};
      payload[target][identifier] = clave;
      continue;
    }

    const value = Number.parseInt(clave, 10);
    if (Number.isNaN(value)) continue;
    payload[target] ??= {};
    payload[target][identifier] = value;
  }

  return payload as Partial<MedRecord>;
};

const isMexicoLocation = (location?: LocalizacionItem) =>
  location?.pais?.catalogKey === 142 ||
  location?.pais?.nombre
    ?.toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .includes("MEXICO") === true;

const ConfirmMedRecord: React.FC = () => {
  const { feathersFetchCC, axiosFetchCC } = useContext(GlobalContext);
  const { currentSessionData, ResetSessionData, setShowPatient } =
    useContext(DashboardContext);
  const pendingLocations =
    currentSessionData.currentRecord?.pendingPatientData?.localizacion;
  // Todo el formulario de guías lo arma el backend: qué campos, en qué orden,
  // con qué valores prellenados y a qué grupo del record pertenece cada uno.
  const routing = currentSessionData.currentRecord?.routing ?? null;

  // País, entidad y domicilio se capturan en la ficha de identificación del
  // paciente, antes de escribir la nota. Aquí solo se leen: volver a pedirlos
  // era pedir dos veces el mismo dato, y el segundo podía contradecir al primero.
  const birthLocalizacion = (pendingLocations?.nacimiento ??
    {}) as Partial<LocalizacionItem>;
  const userLocalizacion = (pendingLocations?.domicilio ??
    {}) as Partial<LocalizacionItem>;
  const birthIsMexico = isMexicoLocation(pendingLocations?.nacimiento);

  const save_img_mutation = useMutation({
    mutationFn: async ({
      Name,
      Type,
      DateOfStudy,
      Interpretation,
      Image,
      patientId,
      recordId,
    }: GabinetImgPropsRequest) => {
      const req = await Save_Gabinet_Img2({
        Name,
        Type,
        DateOfStudy,
        Interpretation,
        Image,
        patientId,
        recordId,
      });
      return await axiosFetchCC(req);
    },
  });

  const save_labs_mutation = useMutation({
    mutationFn: async ({
      values,
      name,
      dateTaken,
      patientId,
      recordId,
    }: NewLabSomaRequest) => {
      const req = await Save_Laboratories_Custom({
        values,
        name,
        dateTaken,
        patientId,
        recordId,
      });
      return await feathersFetchCC(req);
    },
  });

  const save_somas_mutation = useMutation({
    mutationFn: async ({
      dateTaken,
      patientId,
      recordId,
      values,
    }: NewSomasRequest) => {
      const req = await Save_Somatometrias_Custom({
        dateTaken,
        patientId,
        recordId,
        values,
      });
      return await feathersFetchCC(req);
    },
  });

  const Make_Order_Request_Mutation = useMutation({
    mutationFn: async ({
      ordersArray,
      patientId,
      recordId,
    }: {
      ordersArray: Order[];
      patientId: string;
      recordId?: string;
    }) => {
      const req = await Create_Patient_Orders({
        ordersArray,
        patientId,
        recordId,
      });
      return await feathersFetchCC(req);
    },
  });

  const Add_Drug_Prescription = useMutation({
    mutationFn: async ({
      prescription,
      patientId,
      recordId,
    }: {
      prescription: MedicationProps[];
      patientId: string;
      recordId: string;
    }) => {
      const req = await Save_Drugs({
        values: prescription
          .filter((med) => med.drugPresentation && med.indication)
          .map((med) => ({
            name: med.drugPresentation as string,
            indication: med.indication as string,
          })),
        patientId,
        recordId,
      });
      return await feathersFetchCC(req);
    },
  });

  const { isPending: servTypePending, data: servtypeData } = useQuery({
    queryFn: async () => {
      const req = await Get_ServByType();
      return feathersFetchCC<Array<ServByTypeResponse>>(req);
    },

    refetchOnWindowFocus: false,
    queryKey: [`fetching_afiliaciones`],
  });

  const recordsInputList = useMemo((): InputCCprops[] => {
    const dxItems: InputCCprops[] = [];
    const firstItems: InputCCprops[] = [
      {
        type: "select",
        label: "Servicio de Atención",
        options: servtypeData?.data
          ? servtypeData.data.map((d) => d.DESCRIPCION)
          : [],
        identifier: "ServiceAreaSelect",
        loading: servTypePending,
        required: true,
      },
      {
        type: "select",
        label: "Temporalidad de Atención",
        options: ["Primera Vez", "Subsecuente"],
        identifier: "TemporalitySelect",
        required: true,
        initialValue:
          currentSessionData.currentRecord?.record?.Temporality ===
          "Subsecuente"
            ? "Subsecuente"
            : currentSessionData.currentRecord?.record?.Temporality ===
                "Primera Vez"
              ? "Primera Vez"
              : undefined,
      },
      {
        type: "select",
        label: "Primera Vez en el Año",
        options: ["Si", "No"],
        identifier: "FirstTimeYearSelect",
        required: true,
        initialValue:
          currentSessionData.currentRecord?.record.FirstTimeInYear === false
            ? "No"
            : currentSessionData.currentRecord?.record.FirstTimeInYear === true
              ? "Si"
              : undefined,
      },
    ];

    // currentSessionData.currentRecord?.record.Diagnosis.map((dx, index) => {
    //   dxItems.push({
    //     type: "text",
    //     identifier: `${dx.id}Name`,
    //     label: `Nombre Diagnóstico #${index + 1}`,
    //     // currentValue: dx.Name,
    //     suggestion: dx.Name,
    //   });
    //   dxItems.push({
    //     type: "custom",
    //     identifier: `${dx.id}Cie`,
    //     children: (
    //       <CIESearchCC
    //         identifier={`${dx.id}Cie`}
    //         key={`${dx.id}Cie`}
    //         suggestion={dx.CIE}
    //         // currentValue={dx.CIE}
    //         onCIESelect={() => {}}
    //       />
    //     ),
    //   });
    //   dxItems.push({
    //     type: "select",
    //     label: `Confirmación Diagnóstico #${index + 1}`,
    //     identifier: `${dx.id}Confirmation`,
    //     currentValue: dx.Confirmed ? "Si" : "No",
    //     options: ["Si", "No"],
    //   });
    // });

    // Los campos de las guías GIIS los arma el router, con sus valores ya
    // prellenados por la IA. El frontend no decide cuáles son ni en qué orden.
    const guideItems = (routing?.inputList ?? []) as InputCCprops[];

    return [...firstItems, ...dxItems, ...guideItems];
  }, [routing, currentSessionData.currentRecord, servtypeData]);

  const path_patient_record = useMutation({
    mutationFn: async (data: FormData) => {
      if (!currentSessionData.currentRecord) return;

      const recordData: Partial<MedRecord> = {
        ClinicalHistory:
          currentSessionData.currentRecord.record.ClinicalHistory,
        // `Entry` ya no viaja: lo deriva el backend de si hay `patientId`.
        patientId: currentSessionData.currentRecord.record.patientId,
        ServiceArea: data.get("ServiceAreaSelect") as ServiceAreas,
        FirstTimeInYear: data.get("FirstTimeYearSelect") === "Si",
        ...groupVariablesByTarget(
          data,
          routing?.fieldTargets ?? {},
          routing?.fieldTypes ?? {},
        ),
      };

      const req = await Confirm_New_Patient(
        recordData,
        {
          nacimiento: birthLocalizacion as LocalizacionItem,
          domicilio: userLocalizacion as LocalizacionItem,
        },
        currentSessionData.patientIdentification,
        // El diagnóstico se capturó junto con la nota; aquí es donde se
        // persiste y donde el validador GIIS lo revisa contra el catálogo.
        currentSessionData.diagnosisCatalog,
      );
      return await feathersFetchCC<MedRecord>(req);
    },
    onSettled: async (data) => {
      if (data?.type === "success") {
        const recordId = data.data._id;
        const patientId = data.data.patientId;
        const promises: Promise<any>[] = [];

        if (currentSessionData.extraData.Labs.length > 0) {
          currentSessionData.extraData.Labs.forEach(
            ({ values, dateTaken, name }: LabSomaLocalProps) => {
              promises.push(
                save_labs_mutation.mutateAsync({
                  values,
                  dateTaken,
                  name,
                  patientId,
                  recordId,
                }),
              );
            },
          );
        }

        if (currentSessionData.extraData.Somas.length > 0) {
          currentSessionData.extraData.Somas.forEach(
            ({ dateTaken, somasValues }: LabSomaLocalProps) => {
              promises.push(
                save_somas_mutation.mutateAsync({
                  dateTaken,
                  values: somasValues ?? {},
                  patientId,
                  recordId,
                }),
              );
            },
          );
        }

        if (currentSessionData.extraData.Request.length > 0) {
          promises.push(
            Make_Order_Request_Mutation.mutateAsync({
              patientId,
              recordId,
              ordersArray: currentSessionData.extraData.Request,
            }),
          );
        }

        if (currentSessionData.extraData.Drugs.length > 0) {
          promises.push(
            Add_Drug_Prescription.mutateAsync({
              patientId,
              recordId,
              prescription: currentSessionData.extraData.Drugs,
            }),
          );
        }

        if (currentSessionData.extraData.Imgs.length > 0) {
          currentSessionData.extraData.Imgs.forEach(
            ({
              Name,
              Interpretation,
              Type,
              Image,
              DateOfStudy,
            }: GabinetImgLocalProps) => {
              promises.push(
                save_img_mutation.mutateAsync({
                  Name,
                  Interpretation,
                  Type,
                  Image,
                  DateOfStudy,
                  patientId,
                  recordId,
                }),
              );
            },
          );
        }

        await Promise.allSettled(promises);

        ResetSessionData({ withRouter: true });
      }
    },
  });

  // Tres pasos fijos daban formularios de 30 campos en una sola pantalla.
  const formSteps = Math.max(3, Math.ceil(recordsInputList.length / 6));

  return (
    <div className="ConfirmMedRecord">
      <FormCC
        title={"Diagnósticos y Atención"}
        subtitle={"Modifica la información acorde a tu consulta"}
        identifier={"DxAttForm"}
        inputList={recordsInputList}
        steps={formSteps}
        onSubmit={(form) => {
          if (!birthLocalizacion.pais) {
            toast.error("Selecciona el país de nacimiento del catálogo");
            return;
          }
          if (birthIsMexico && !birthLocalizacion.estado) {
            toast.error("Selecciona la entidad federativa de nacimiento");
            return;
          }
          const identification =
            currentSessionData.patientIdentification ??
            currentSessionData.currentRecord?.pendingPatientData.personalInfo;
          if (
            identification?.curp &&
            identification.curp !== "XXXX999999XXXXXX99"
          ) {
            const entityCode = birthIsMexico
              ? curpStateCodeFromCatalogKey(
                  birthLocalizacion.estado?.catalogKey,
                )
              : "NE";
            const validation = ValidateCURP(
              identification.curp,
              identification.names,
              identification.middleName,
              identification.lastName,
              identification.birthDate,
              identification.sex,
              entityCode,
            );
            if (!validation.valid) {
              Object.values(validation.errors).forEach(
                (error) => error && toast.error(error),
              );
              return;
            }
          }
          // console.log(
          //   "Form Data Submitted:",
          //   Object.fromEntries(form.entries()),
          // );
          path_patient_record.mutate(form);
        }}
        buttonLoading={path_patient_record.isPending}
      />
    </div>
  );
};

export default ConfirmMedRecord;
