import React, { useContext, useMemo, useRef } from "react";
import ClinicalTextArea from "../Dashboard/ClinicalTextArea";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Create_Patient_Orders,
  Save_Drugs,
  Save_Evo_Note,
  Save_Laboratories_Custom,
  Synthesize_New_Patient,
  Save_Somatometrias_Custom,
  Validate_Somatometrias_Custom,
  Search_One_Patient,
  Update_User_Patients,
} from "@/e2e/server/FeathersAPI";
import { useGlobalContext } from "@/e2e/globalContext";
import { toast } from "sonner";
import { DashboardContext } from "@/e2e/dashboardContext";
import ButtonCC from "@/components/Button-CC";
import { Verify_Login } from "@/e2e/server/Queries";
import { ClinicalHistorySections } from "@/library/Records/SectionsRegistry";
import { GlobalModalDefault } from "@/scripts/Constants";
import AddNewDocForm from "../Dashboard/AddNewDocForm";
import { SynthesyzeTemporalPatient } from "@/scripts/Generator";
import CardsDisplayCC from "@/components/CardsDisplay-CC";
import PatientIdentityPanel from "../Dashboard/PatientIdentityPanel";
import { Save_Gabinet_Img2 } from "@/e2e/server/AxiosAPI";
import { useRouter } from "next/navigation";
import { resolveUserRole } from "@/library/Dashboard/userRole";
import { useTutorTarget } from "@/library/Dashboard/useTutors";
import { SOMAS_FIELDS, somasSummary } from "@/scripts/somasFields";
import MultiCIESearchCC from "@/components/SearchInputs/MultiCieSearch-CC";

// Texto con el que se abre el expediente cuando quien registra es enfermería:
// captura la ficha de identidad y la somatometría, no la nota clínica.
const NURSE_HISTORY_TEXT =
  "Registro de identificación y somatometría capturado por enfermería. Nota clínica pendiente de elaboración por el médico.";

interface SavePatientFormProps {
  loading?: boolean;
}

// Etiquetas cortas para el tooltip de cada OptionBallButton
const BallLabels: Record<CHSections, string> = {
  Drugs: "Fármacos y Suplementos",
  Request: "Solicitudes de Estudio",
  Imgs: "Estudios de Imagen",
  Labs: "Laboratorios",
  Somas: "Somatometrías",
} as Record<CHSections, string>;

const SavePatientForm: React.FC<SavePatientFormProps> = ({ loading }) => {
  const router = useRouter();
  const { feathersFetchCC, axiosFetchCC, getAccessToken } = useGlobalContext();
  const base = "/dashboard";
  const {
    setShowPatient,
    currentSessionData,
    ResetSessionData,
    setCurrentSessionData,
    setDashboardModal,
  } = useContext(DashboardContext);
  const { data: userData } = useQuery(Verify_Login(getAccessToken()));
  // Enfermería levanta la ficha y la somatometría; la nota clínica es del médico.
  const isNurse = resolveUserRole(userData?.data.user) === "enfermeria";
  // Una enfermera puede atender a uno o dos médicos. Leer es la unión de sus
  // pacientes, pero el alta queda a nombre de UN médico, así que si tiene más
  // de un tutor hay que preguntarle para quién es.
  const { tutors, tutorId, setTutorId, mustChoose } = useTutorTarget(isNurse);

  // Paraclinical Save Functions

  const save_img_mutation = useMutation({
    mutationFn: async ({
      Name,
      Type,
      DateOfStudy,
      Interpretation,
      Image,
      patientId,
      diagnosisId,
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
        diagnosisId,
      });
      return await axiosFetchCC(req);
    },
    // onSettled: (data) => {
    //   console.log("Imgs done!");
    //   console.log(data);
    // },
  });

  const save_labs_mutation = useMutation({
    mutationFn: async ({
      baseText,
      name,
      dateTaken,
      patientId,
      recordId,
    }: NewLabSomaRequest) => {
      const req = await Save_Laboratories_Custom({
        baseText,
        name,
        dateTaken,
        patientId,
        recordId,
      });
      return await feathersFetchCC(req);
    },
    // onSettled: (data) => {
    //   console.log("Labs done!");
    //   console.log(data);
    // },
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
    // onSettled: (data) => {
    //   console.log("Somas done!");
    //   console.log(data);
    // },
  });

  const validate_somas_mutation = useMutation({
    mutationFn: async ({
      dateTaken,
      values,
    }: Pick<NewSomasRequest, "dateTaken" | "values">) => {
      const req = await Validate_Somatometrias_Custom({ dateTaken, values });
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
      recordId: string;
    }) => {
      const req = await Create_Patient_Orders({
        ordersArray,
        patientId,
        recordId,
      });
      return await feathersFetchCC(req);
    },
    // onSuccess(data) {
    //   console.log("Orders done!");
    //   console.log(data);
    // },
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
    // onSuccess(data) {
    //   console.log("Drugs done!");
    //   console.log(data);
    // },
  });

  // User Oriented Functions

  const update_user_patients = useMutation({
    mutationFn: async (patientId: string) => {
      if (!userData?.data.user) return;

      if (userData?.data.user.patientsList.includes(patientId)) {
        toast.error("El Paciente ya está en tu Lista de Pacientes");
        ResetSessionData({ withRouter: true });
        return;
      }

      const toastLoad = toast.loading("Agregando Paciente a tu Lista...");

      const req = await Update_User_Patients(userData?.data.user._id, [
        ...userData?.data.user.patientsList,
        patientId,
      ]);
      const feathersReq = await feathersFetchCC(req);
      toast.dismiss(toastLoad);
      return feathersReq;
    },
    onSettled: (data) => {
      if (!data?.message.includes("Error") && data?.type === "success") {
        ResetSessionData({ withRouter: true });
      }
    },
  });

  const search_one_patient_mutation = useMutation({
    mutationFn: async (patientId: string) => {
      const toastLoadID = toast.loading("Cargando Expediente...");
      const req = await Search_One_Patient(patientId);
      const fetch = await feathersFetchCC<{ patientsList: Patient[] }>(req);
      toast.dismiss(toastLoadID);
      return fetch;
    },
    onSuccess(data) {
      if (data.type === "success") {
        // 1.1 Abre el Expediente del Paciente
        // 1.2 Notifica si quiere guardarlo en sus Pacientes

        console.log(data);

        setShowPatient(data.data.patientsList[0]);
        setTimeout(() => {
          const toastID = toast.info(
            `¿Quieres agregar a ${data.data.patientsList[0].personalInfo.names} a tus pacientes?`,
            {
              duration: Infinity,
              dismissible: false,
              action: (
                <ButtonCC
                  type="Solid"
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-6"
                    >
                      <path
                        fillRule="evenodd"
                        d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                  onClick={() => {
                    update_user_patients.mutate(data.data.patientsList[0]._id);
                    toast.dismiss(toastID);
                  }}
                />
              ),
              cancel: (
                <ButtonCC
                  type="Solid"
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-6"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                  onClick={() => {
                    setShowPatient(undefined);
                    toast.dismiss(toastID);
                  }}
                />
              ),
            },
          );
        }, 1000);
      } else {
        toast.error(
          "No se encontraron pacientes. Puedes intentar con nombres y apellidos",
        );
      }
    },
  });

  // const save_patient_mutation = useMutation({
  //   mutationFn: async (ClinicalHistory: string) => {
  //     const req = await Synthesize_New_Patient(ClinicalHistory);
  //     return await feathersFetchCC<MedRecord>(req);
  //   },
  //   onSuccess: (data) => {
  //     if (!data?.message.includes("Error") && data?.type === "success") {
  //       setCurrentSessionData({
  //         ...currentSessionData,
  //         currentRecord: data.data,
  //       });
  //       router.push(`/dashboard/newPatient`);
  //     } else {
  //       if (data?.message.includes("DupPatient")) {
  //         toast.error(
  //           "Paciente posiblemente duplicado. Haz click para verificar si es tu mismo paciente, o si es otro.",
  //           {
  //             duration: Infinity,
  //             dismissible: false,
  //             action: {
  //               label: (
  //                 <ButtonCC
  //                   width="block"
  //                   type="Solid"
  //                   icon={
  //                     <svg
  //                       xmlns="http://www.w3.org/2000/svg"
  //                       viewBox="0 0 24 24"
  //                       fill="currentColor"
  //                       className="size-6"
  //                     >
  //                       <path
  //                         fillRule="evenodd"
  //                         d="M4.5 3.75a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3h-15Zm4.125 3a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm-3.873 8.703a4.126 4.126 0 0 1 7.746 0 .75.75 0 0 1-.351.92 7.47 7.47 0 0 1-3.522.877 7.47 7.47 0 0 1-3.522-.877.75.75 0 0 1-.351-.92ZM15 8.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15ZM14.25 12a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H15a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15Z"
  //                         clipRule="evenodd"
  //                       />
  //                     </svg>
  //                   }
  //                 />
  //               ),
  //               onClick: () => {
  //                 search_one_patient_mutation.mutate(
  //                   data.message.split(";")[1].trim(),
  //                 );
  //               },
  //             },
  //           },
  //         );
  //       }
  //     }
  //   },
  // });

  const upload_evo_note = useMutation({
    mutationFn: async (ClinicalHistory: string) => {
      const req = await Save_Evo_Note(
        ClinicalHistory,
        `${currentSessionData.currentPatientData?._id}`,
      );
      return await feathersFetchCC<{
        record: MedRecord;
        pendingPatientData: Patient;
      }>(req);
    },
    onSettled: async (data) => {
      if (!data?.message.includes("Error") && data?.type === "success") {
        const recordId = data.data.record._id;
        const patientId = data.data.pendingPatientData._id;
        const promises: Promise<any>[] = [];
        setCurrentSessionData({
          ...currentSessionData,
          currentRecord: data.data,
        });

        if (currentSessionData.extraData.Labs.length > 0) {
          currentSessionData.extraData.Labs.forEach(
            ({ baseText, dateTaken, name }: LabSomaLocalProps) => {
              promises.push(
                save_labs_mutation.mutateAsync({
                  baseText,
                  dateTaken,
                  name,
                  patientId,
                  recordId,
                }),
              );
            },
          );
        }

        if (somasAGuardar().length > 0) {
          somasAGuardar().map(
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
          currentSessionData.extraData.Imgs.map(
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

        router.push(`${base}/newPatient`);
      }
    },
  });

  //  Miscelaneous Functions

  const temporalSynthesyzedPatient = useMemo((): Patient => {
    return SynthesyzeTemporalPatient(currentSessionData.currentModText);
  }, [currentSessionData.currentModText]);

  const OpenAddFormOfCurrentSection = (section: CHSections) => {
    setDashboardModal(GlobalModalDefault);

    setDashboardModal({
      Component: (
        <div className="fillSpace" style={{ padding: "20px" }}>
          <AddNewDocForm
            currentSection={section}
            PatientInfo={temporalSynthesyzedPatient}
            colorSchema="day"
            inverseContentSchema
          />
        </div>
      ),
      Settings: {
        animation: "bottomSlide",
        identifier: "CH_Section_Form_Modal",
        size: "large",
      },
    });
  };

  const OpenItemsSectionAddedVisualizer = (section: CHSections) => {
    const DeleteItemFromSessionData = (section: CHSections, index: number) => {
      // @ts-ignore
      const newList = currentSessionData.extraData[section];
      newList.splice(index, 1);

      setCurrentSessionData({
        ...currentSessionData,
        extraData: {
          ...currentSessionData.extraData,
          [section]: newList,
        },
      });

      setDashboardModal(GlobalModalDefault);
      toast.success("Item eliminado");
    };

    setDashboardModal(GlobalModalDefault);

    setDashboardModal({
      Component: (
        <div className="fillSpace" style={{ padding: "20px" }}>
          <div
            className="flexHorizontal"
            style={{ justifyContent: "center", marginTop: "50px" }}
          >
            <h2
              className="fontBg"
              style={{
                paddingRight: "15px",
              }}
            >{`${ClinicalHistorySections[section].CHSubtitle} Agregados`}</h2>
            <ButtonCC
              type="Phantom"
              onClick={() => OpenAddFormOfCurrentSection(section)}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            />
          </div>

          {section === "Labs" ? (
            <CardsDisplayCC
              schema={"day"}
              itemsList={currentSessionData.extraData.Labs.map(
                (lab: LabSomaLocalProps, index: number) => {
                  return {
                    size: "md",
                    name: lab.name,
                    title: lab.name,
                    subtitle: lab.baseText,
                    onXClick: () => DeleteItemFromSessionData("Labs", index),
                  };
                },
              )}
            />
          ) : section === "Somas" ? (
            <CardsDisplayCC
              schema={"day"}
              itemsList={currentSessionData.extraData.Somas.map(
                (soma: LabSomaLocalProps, index: number) => {
                  return {
                    size: "md",
                    name: `Somatometría ${soma.dateTaken}`,
                    title: `Somatometría ${soma.dateTaken}`,
                    subtitle: somasSummary(soma.somasValues),
                    onXClick: () => DeleteItemFromSessionData("Somas", index),
                  };
                },
              )}
            />
          ) : section === "Imgs" ? (
            <CardsDisplayCC
              schema={"day"}
              itemsList={currentSessionData.extraData.Imgs.map(
                (img: GabinetImgLocalProps, index: number) => {
                  return {
                    size: "md",
                    name: img.Name,
                    title: img.Name,
                    subtitle: img.Interpretation,
                    onXClick: () => DeleteItemFromSessionData("Imgs", index),
                  };
                },
              )}
            />
          ) : null}
        </div>
      ),
      Settings: {
        animation: "bottomSlide",
        identifier: "CH_Section_Form_Modal",
        size: "large",
        schema: "day",
      },
    });
  };

  const OpenModalSectionForm = (
    section: CHSections,
    currentItemCount: number,
  ) => {
    if (
      currentItemCount === 0 ||
      section === "Drugs" ||
      section === "Request"
    ) {
      OpenAddFormOfCurrentSection(section);
    } else {
      OpenItemsSectionAddedVisualizer(section);
    }
  };

  // Somatometría "en ceros": lo que se guarda cuando el médico contesta que el
  // paciente no tiene. Vive en un ref y no en el estado de sesión porque se
  // escribe y se lee dentro del mismo tick (el reintento de la mutación), y el
  // estado de React todavía no se habría propagado ahí.
  const somasEnCeroRef = useRef<LabSomaLocalProps | null>(null);
  // Última historia clínica enviada, para poder reintentar el guardado desde
  // el botón del toast sin que el usuario vuelva a darle a "Guardar".
  const ultimaHCRef = useRef<string>("");

  /** Somatometrías de la sesión, más la entrada en ceros si el médico la pidió. */
  const somasAGuardar = (): LabSomaLocalProps[] =>
    currentSessionData.extraData.Somas.length > 0
      ? currentSessionData.extraData.Somas
      : somasEnCeroRef.current
        ? [somasEnCeroRef.current]
        : [];

  /**
   * Todos los parámetros vacíos. El backend los guarda como `null` (no medido) y
   * traduce peso y talla al centinela GIIS 999 para que la validación siga
   * corriendo campo por campo en vez de saltarse por completo.
   */
  const ConstruirSomasEnCero = (): LabSomaLocalProps => ({
    dateTaken: new Date().toISOString().split("T")[0],
    somasValues: Object.fromEntries(
      [
        ...SOMAS_FIELDS.map((f) => f.key),
        "glucemiaTipo",
        "glucemiaObtenida",
      ].map((key) => [key, ""]),
    ),
  });

  /**
   * Pregunta en vez de sólo reclamar. "No" guarda la somatometría en ceros y
   * reintenta el guardado solo; "Sí" abre el formulario de somatometría.
   */
  const PreguntarPorSomatometricos = () => {
    const toastID = toast.info(
      "El paciente no tiene somatométricos, ¿quieres agregárselos?",
      {
        duration: Infinity,
        dismissible: false,
        action: (
          <ButtonCC
            type="Solid"
            text="Sí"
            onClick={() => {
              toast.dismiss(toastID);
              OpenAddFormOfCurrentSection("Somas");
            }}
          />
        ),
        cancel: (
          <ButtonCC
            type="Phantom"
            text="No"
            onClick={() => {
              toast.dismiss(toastID);
              somasEnCeroRef.current = ConstruirSomasEnCero();
              ValidateAndSaveSomasAndData.mutate(ultimaHCRef.current);
            }}
          />
        ),
      },
    );
  };

  const ValidateAndSaveSomasAndData = useMutation({
    mutationFn: async (ClinicalHistory: string) => {
      ultimaHCRef.current = ClinicalHistory;
      const somas = somasAGuardar();

      if (somas.length > 0) {
        //   for (const { dateTaken, somasValues } of somas) {
        //     const result = await validate_somas_mutation.mutateAsync({
        //       dateTaken,
        //       values: somasValues ?? {},
        //     });
        //     if (result.type === "error") {
        //       throw new Error(`${result.message}`);
        //     }
        //   }
      } else {
        PreguntarPorSomatometricos();
        throw new Error("No Somatometricos Added");
      }
      if (mustChoose && !tutorId) {
        throw new Error("Selecciona el médico para el que registras al paciente");
      }
      const req = await Synthesize_New_Patient(
        ClinicalHistory,
        currentSessionData.patientIdentification,
        currentSessionData.diagnosisCatalog,
        tutorId,
      );
      return await feathersFetchCC<SynthesizeRecordResponse>(req);
    },
    onSuccess: (data) => {
      if (!data?.message.includes("Error") && data?.type === "success") {
        setCurrentSessionData({
          ...currentSessionData,
          currentRecord: data.data,
        });
        router.push(`${base}/newPatient`);
      } else {
        if (data?.message.includes("DupPatient")) {
          toast.error(
            "Paciente posiblemente duplicado. Haz click para verificar si es tu mismo paciente, o si es otro.",
            {
              duration: Infinity,
              dismissible: false,
              action: {
                label: (
                  <ButtonCC
                    width="block"
                    type="Solid"
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="size-6"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.5 3.75a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3h-15Zm4.125 3a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm-3.873 8.703a4.126 4.126 0 0 1 7.746 0 .75.75 0 0 1-.351.92 7.47 7.47 0 0 1-3.522.877 7.47 7.47 0 0 1-3.522-.877.75.75 0 0 1-.351-.92ZM15 8.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15ZM14.25 12a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H15a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    }
                  />
                ),
                onClick: () => {
                  search_one_patient_mutation.mutate(
                    data.message.split(";")[1].trim(),
                  );
                },
              },
            },
          );
        }
      }
    },
  });

  return (
    <div className="SavePatientContainer">
      <>
        <div className="OptionBallButtonsContainer">
          <div className="InnerOptionBallButtonsContainer">
            {Object.entries(ClinicalHistorySections).map(([key, value]) => {
              const selectedOptions: CHSections[] = isNurse
                ? ["Somas"]
                : ["Drugs", "Request", "Imgs", "Labs", "Somas"];

              if (selectedOptions.includes(key as CHSections)) {
                const NumberOfCurrentItemsAdded =
                  // @ts-ignore
                  currentSessionData.extraData[key].length;

                return (
                  <div
                    key={key}
                    className="OptionBallButton"
                    id={key}
                    role="button"
                    tabIndex={0}
                    aria-label={BallLabels[key as CHSections]}
                    data-tooltip={BallLabels[key as CHSections]}
                    onClick={() =>
                      OpenModalSectionForm(
                        key as CHSections,
                        NumberOfCurrentItemsAdded,
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        OpenModalSectionForm(
                          key as CHSections,
                          NumberOfCurrentItemsAdded,
                        );
                      }
                    }}
                  >
                    {value.Icon}
                    {NumberOfCurrentItemsAdded !== 0 ? (
                      <span className="BallNumber">
                        {NumberOfCurrentItemsAdded}
                      </span>
                    ) : null}
                  </div>
                );
              } else {
                return null;
              }
            })}
          </div>
        </div>

        <div className="SavePatientStack">
          {currentSessionData.patientIdentification ? (
            <PatientIdentityPanel
              identification={currentSessionData.patientIdentification}
            />
          ) : null}

          {isNurse ? (
            <div className="NursePatientSaveBar">
              <p>
                Captura la somatometría del paciente y guarda el registro. La
                nota clínica la escribirá el médico.
              </p>
              {mustChoose ? (
                <label className="NurseTutorSelect">
                  <span>¿Para qué médico es este paciente?</span>
                  <select
                    value={tutorId ?? ""}
                    onChange={(event) => setTutorId(event.target.value)}
                  >
                    <option value="" disabled>
                      Selecciona un médico
                    </option>
                    {tutors.map((tutor) => (
                      <option key={tutor._id} value={tutor._id}>
                        {tutor.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <ButtonCC
                type="Solid"
                width="block"
                text="Guardar Paciente"
                loading={
                  ValidateAndSaveSomasAndData.isPending ||
                  validate_somas_mutation.isPending ||
                  save_somas_mutation.isPending ||
                  loading
                }
                onClick={() =>
                  ValidateAndSaveSomasAndData.mutate(NURSE_HISTORY_TEXT)
                }
              />
            </div>
          ) : (
            <div className="GeneralTextAreaContainer">
              <ClinicalTextArea
                key={"textTranscriberCHTA"}
                identifier={"textTranscriberCHTA"}
                currentValue={currentSessionData.currentModText}
                onChange={(text) => {
                  setCurrentSessionData({
                    ...currentSessionData,
                    currentModText: text,
                  });
                }}
                saving={
                  ValidateAndSaveSomasAndData.isPending ||
                  validate_somas_mutation.isPending ||
                  save_img_mutation.isPending ||
                  save_labs_mutation.isPending ||
                  save_somas_mutation.isPending ||
                  Add_Drug_Prescription.isPending ||
                  Make_Order_Request_Mutation.isPending ||
                  loading
                }
                mutation={
                  currentSessionData.toBeAdded === "document"
                    ? upload_evo_note
                    : ValidateAndSaveSomasAndData
                }
                belowText={
                  <div className="DiagnosisPickerRow">
                    <label htmlFor="RecordDiagnosisCIE-search">
                      Diagnósticos (CIE-10)
                    </label>
                    <MultiCIESearchCC
                      identifier="RecordDiagnosisCIE"
                      colorSchema="night"
                      value={currentSessionData.diagnosisCatalog}
                      onChange={(diagnoses) =>
                        setCurrentSessionData({
                          ...currentSessionData,
                          diagnosisCatalog: diagnoses,
                        })
                      }
                    />
                  </div>
                }
                submitButton={{
                  text:
                    currentSessionData.toBeAdded === "document"
                      ? "Guardar Nota de Evolución"
                      : "Guardar Paciente",
                }}
              />
            </div>
          )}
        </div>
      </>
    </div>
  );
};

export default SavePatientForm;
