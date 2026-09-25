"use client";

import ButtonCC from "@/components/Button-CC";
import { DashboardStatesObject } from "@/library/Dashboard/DashboardRegistry";
import { usePathname, useRouter } from "next/navigation";
import { useContext } from "react";
import { DashboardContext } from "@/e2e/dashboardContext";
import IconsCC from "@/assets/icons/IconsCC";
import { GlobalContext } from "@/e2e/globalContext";
import { GlobalModalDefault } from "@/scripts/Constants";

/**
 * Layout del flujo de documento. Es gemelo del de `newPatient` pero con su
 * propia navegación: aquí los pasos son 0 buscar paciente · 1 tipo de documento
 * · 2 formulario, y no hay ramas del flujo de paciente que atender.
 */
export default function AddDocumentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentSessionData,
    setCurrentSessionData,
    setShowPatient,
    ResetSessionData,
  } = useContext(DashboardContext);
  const { setGlobalModal } = useContext(GlobalContext);

  // Confirmación antes de tirar el flujo en curso.
  const OpenPatientModalReset = () => {
    const CloseAndDoAction = () => {
      setGlobalModal(GlobalModalDefault);
      ResetSessionData({ withRouter: true });
    };

    setGlobalModal({
      Component: (
        <div className="genericModalInfo">
          <h3>{"Reiniciar"}</h3>
          <p>
            {
              "¿Estás seguro que quieres reiniciar el flujo de agregar documento? Se perderán los datos actuales"
            }
          </p>
          <ButtonCC
            type="Phantom"
            text="Reiniciar Flujo"
            onClick={CloseAndDoAction}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            }
          />
        </div>
      ),
      Settings: {
        size: "small",
        animation: "popUp",
        identifier: "ResetDocumentCurrentSessionData",
      },
    });
  };

  // La raíz del flujo es /dashboard/addDocument. Sus subrutas (si las hubiera)
  // se manejan con el back del navegador.
  const enRaiz = pathname === DashboardStatesObject["Add Document"].Route;
  // En el paso 0 no hay a dónde regresar dentro del flujo: el botón se oculta
  // en vez de dejar un click que no hace nada visible.
  const hideReturn = enRaiz && currentSessionData.currentStep === 0;

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "30px",
          zIndex: 10,
          visibility: hideReturn ? "hidden" : "visible",
        }}
      >
        <ButtonCC
          type="Phantom"
          onClick={() => {
            if (currentSessionData.currentRecord) {
              setCurrentSessionData({
                ...currentSessionData,
                currentRecord: undefined,
              });
            } else if (enRaiz) {
              setCurrentSessionData({
                ...currentSessionData,
                currentStep: currentSessionData.currentStep - 1,
              });
            } else {
              router.back();
            }
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
                d="M9.53 2.47a.75.75 0 0 1 0 1.06L4.81 8.25H15a6.75 6.75 0 0 1 0 13.5h-3a.75.75 0 0 1 0-1.5h3a5.25 5.25 0 1 0 0-10.5H4.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
      </div>

      {/* Atajo al expediente del paciente elegido, igual que en el alta. */}
      {currentSessionData.currentPatientData && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "30px",
            zIndex: 10,
            height: "100px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
            alignItems: "center",
            visibility: hideReturn ? "hidden" : "visible",
          }}
        >
          <ButtonCC
            type="Phantom"
            onClick={() => {
              setShowPatient(currentSessionData.currentPatientData);
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
                  d="M4.5 3.75a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3h-15Zm4.125 3a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm-3.873 8.703a4.126 4.126 0 0 1 7.746 0 .75.75 0 0 1-.351.92 7.47 7.47 0 0 1-3.522.877 7.47 7.47 0 0 1-3.522-.877.75.75 0 0 1-.351-.92ZM15 8.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15ZM14.25 12a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H15a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15Z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />

          <ButtonCC
            type="Phantom"
            onClick={OpenPatientModalReset}
            icon={IconsCC.Trash}
          />
        </div>
      )}
      {children}
    </>
  );
}
