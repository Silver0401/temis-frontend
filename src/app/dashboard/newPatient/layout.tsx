"use client";

import ButtonCC from "@/components/Button-CC";
import { DashboardStatesObject } from "@/library/Dashboard/DashboardRegistry";
import { usePathname, useRouter } from "next/navigation";
import { useContext } from "react";
import { DashboardContext } from "@/e2e/dashboardContext";

export default function NewPatientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentSessionData, setCurrentSessionData, setShowPatient } =
    useContext(DashboardContext);

  // El botón de regreso se renderiza siempre EXCEPTO en la vista inicial de
  // "nuevo paciente" (paso 0 de la ruta base): ahí no hay a dónde volver y el
  // reset dejaba la vista en blanco.
  const hideReturn =
    pathname === `${DashboardStatesObject["New Patient"].Route}` &&
    (currentSessionData.toBeAdded === "init" ||
      currentSessionData.currentStep === 0);

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
            if (pathname === `${DashboardStatesObject["New Patient"].Route}`) {
              setCurrentSessionData({
                ...currentSessionData,
                currentStep:
                  currentSessionData.toBeAdded === "document"
                    ? currentSessionData.currentStep - 1
                    : [1, 2, 3, 5].includes(currentSessionData.currentStep)
                      ? 0
                      : currentSessionData.currentStep - 1,
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
                clip-rule="evenodd"
              />
            </svg>
          }
        />
      </div>
      {currentSessionData.currentPatientData && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "30px",
            zIndex: 10,
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
                  clip-rule="evenodd"
                />
              </svg>
            }
          />
        </div>
      )}
      {children}
    </>
  );
}
