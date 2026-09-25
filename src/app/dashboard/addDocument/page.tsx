"use client";

import React, { useContext, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

import ButtonCC from "@/components/Button-CC";
import CardsDisplayCC from "@/components/CardsDisplay-CC";
import PatientSearchCC from "@/components/PatientSearch-CC";
import { DashboardContext } from "@/e2e/dashboardContext";
import AddNewDocForm from "@/library/Dashboard/AddNewDocForm";
import MiniPatient from "@/library/Dashboard/MiniPatient";
import { ClinicalHistorySections } from "@/library/Records/SectionsRegistry";
import { DefaultSessionData } from "@/scripts/Constants";

/**
 * Flujo de "agregar documento al expediente". Antes era un re-export de
 * `newPatient/page`, y las dos ramas convivían en el mismo componente separadas
 * por `currentSessionData.toBeAdded`. Ahora cada flujo es su propia ruta, así
 * que la URL basta para saber en cuál estamos.
 *
 * Pasos: 0 buscar paciente · 1 tipo de documento · 2 formulario del documento.
 */
const AddDocumentIndex: React.FC = () => {
  const { currentSessionData, setCurrentSessionData } =
    useContext(DashboardContext);

  // Al entrar por la ruta se arranca en el paso 0. No se resetea si ya se venía
  // a media captura (hay paciente elegido), para que volver atrás no borre todo.
  useEffect(() => {
    if (currentSessionData.currentPatientData) return;
    setCurrentSessionData({
      ...DefaultSessionData,
      // `toBeAdded` ya no ramifica esta página, pero sigue siendo el marcador
      // que `SavePatientForm` lee en /dashboard/newPatient/clinicalRecord, que
      // es una pantalla compartida por los dos flujos.
      toBeAdded: "document",
      currentStep: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patientData =
    currentSessionData.currentPatientData &&
    typeof currentSessionData.currentPatientData !== "string"
      ? currentSessionData.currentPatientData
      : undefined;

  const AddDocumentFlow: Array<React.ReactElement> = [
    // Step #0: buscar al paciente al que se le agrega el documento
    <AnimatePresence key={"SearchPatientToAddDocAnimatePresence"}>
      <motion.div
        className="SearchPatientToAddDoc"
        key={"SearchPatientToAddDoc"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="topCont">
          <h3 className="sptitle">{"Busca a tu Paciente"}</h3>
          <p className="spsubtitle">
            {"Escribe el nombre de tu paciente, y seleccionalo para proseguir"}
          </p>
          <PatientSearchCC
            onPatientSelect={(patientData) => {
              setCurrentSessionData({
                ...currentSessionData,
                currentPatientData: patientData.fullData,
                patientIdentification: {
                  names: patientData.fullData.personalInfo.names,
                  middleName: patientData.fullData.personalInfo.middleName,
                  lastName: patientData.fullData.personalInfo.lastName,
                  sex: patientData.fullData.personalInfo.sex,
                  birthDate: patientData.fullData.personalInfo.birthDate,
                  birthPlace:
                    patientData.fullData.personalInfo.birthPlace ?? "",
                  domicile: patientData.fullData.personalInfo.domicile,
                  genre: patientData.fullData.personalInfo.genre,
                  derechohabiencia:
                    patientData.fullData.personalInfo.derechohabiencia,
                  curp: patientData.fullData.personalInfo.curp,
                },
              });
            }}
            onReset={() =>
              setCurrentSessionData({
                ...currentSessionData,
                currentPatientData: undefined,
              })
            }
          />
        </div>

        <MiniPatient PatientInfo={patientData} />

        {patientData && (
          <div style={{ width: "300px", marginTop: "30px" }}>
            <ButtonCC
              type="Phantom"
              width="block"
              text="Continuar"
              onClick={() => {
                setCurrentSessionData({
                  ...currentSessionData,
                  currentStep: 1,
                });
              }}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>,

    // Step #1: qué tipo de documento se va a agregar
    <CardsDisplayCC
      key={"SmallCardsDisplayDocOptions"}
      title="Tipo de Documento"
      subtitle="Escoge el tipo de documento que vas a agregar al expediente"
      itemsList={Object.entries(ClinicalHistorySections).map((entry) => {
        const [key, { DocTitle, DocSubtitle, Icon, SectionType }] = entry as [
          CHSections,
          CHSectionProps,
        ];
        return SectionType.includes("AddDocument")
          ? ({
              title: DocTitle,
              subtitle: DocSubtitle,
              icon: Icon,
              name: key,
              size: "sm",
              onClick: () => {
                setCurrentSessionData({
                  ...currentSessionData,
                  currentStep: 2,
                  docType: key,
                });
              },
            } as CardProps)
          : null;
      })}
    />,

    // Step #2: el formulario del documento elegido
    <div className="NewDocformContainer" key={"NewDocformContainer"}>
      {patientData && (
        <AddNewDocForm
          key={"AddNewDocFormPage"}
          currentSection={currentSessionData.docType}
          PatientInfo={patientData}
        />
      )}
    </div>,
  ];

  return (
    <section className="NewPatientContainer">
      {AddDocumentFlow[currentSessionData.currentStep] ?? AddDocumentFlow[0]}
    </section>
  );
};

export default AddDocumentIndex;
