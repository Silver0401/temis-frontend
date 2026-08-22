import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { AgeFromBirthdate, MongoDbIdDateRetriever } from "@/scripts/Generator";
import DropdownCC from "@/components/Dropdown-CC";

interface PatientLineDisplayProps {
  patient: Patient;
  searchedWord: string | undefined;
  onClick: () => void;
  onAddPatientToGroup: () => void;
  onRemovePatientFromGroup?: () => void;
}

const PatientLineDisplay: React.FC<PatientLineDisplayProps> = ({
  onClick,
  patient,
  searchedWord,
  onAddPatientToGroup,
  onRemovePatientFromGroup,
}) => {
  const PatientName = `${patient.personalInfo.names} ${patient.personalInfo.middleName} ${patient.personalInfo.lastName}`;
  const PatientBirthdate = patient.personalInfo.birthDate;
  const PatientSex = patient.personalInfo.sex;
  const sexKey = PatientSex === "Femenino" ? "f" : "m";
  const sexLabel = patient.personalInfo.genre || PatientSex;
  const [patientSearched, setPatientSearched] = useState<boolean>(false);

  useEffect(() => {
    if (searchedWord) {
      const loweredSearchedWord = searchedWord.toLowerCase();
      const patientDxs = patient.records[0].Diagnosis.map((p) => p.Name)
        .join(" ")
        .toLowerCase();
      if (
        (patient.LUID.toLowerCase().includes(loweredSearchedWord) ||
          patientDxs.includes(loweredSearchedWord)) &&
        loweredSearchedWord.length >= 2
      ) {
        setPatientSearched(true);
        // PatientSearched = true;
      } else {
        setPatientSearched(false);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedWord]);

  return (
    <motion.div
      key={patient._id}
      className={`LinearDisplay`}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 40, mass: 1 }}
    >
      <span className={`px-bar ${sexKey}`} />
      <div
        onClick={() => {
          onClick();
        }}
        className="innerBox"
      >
        <div className={`px-photo ${sexKey}`}>
          <svg className="face" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12.75a5.25 5.25 0 1 0 0-10.5 5.25 5.25 0 0 0 0 10.5Zm0 1.5c-5.18 0-9.25 2.7-9.25 6.25V22h18.5v-1.5c0-3.55-4.07-6.25-9.25-6.25Z" />
          </svg>
          <span className="px-cam">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 3 7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9Zm3 5.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
            </svg>
          </span>
        </div>

        <div className="px-info">
          <p
            className={`Name ${patientSearched ? "SelectedName" : ""}`}
            id="LinearP"
          >
            {PatientName}
          </p>
          <p className="px-sub">
            <span className={`px-sex-dot ${sexKey}`} />
            {`${AgeFromBirthdate(PatientBirthdate)} años · ${sexLabel}`}
          </p>
        </div>
      </div>

      <DropdownCC
        style="White"
        classname="PatientLineDotsDropdown"
        itemsList={[
          {
            text: "Agregar a Folder",
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path
                  fillRule="evenodd"
                  d="M19.5 21a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-5.379a.75.75 0 0 1-.53-.22L11.47 3.66A2.25 2.25 0 0 0 9.879 3H4.5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h15Zm-6.75-10.5a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25v2.25a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V10.5Z"
                  clipRule="evenodd"
                />
              </svg>
            ),
            action: () => onAddPatientToGroup(),
          },
          onRemovePatientFromGroup
            ? {
                text: "Eliminar de Folder",
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.515 10.674a1.875 1.875 0 0 0 0 2.652L8.89 19.7c.352.351.829.549 1.326.549H19.5a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3h-9.284c-.497 0-.974.198-1.326.55l-6.375 6.374ZM12.53 9.22a.75.75 0 1 0-1.06 1.06L13.19 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 1 0 1.06-1.06L15.31 12l1.72-1.72a.75.75 0 1 0-1.06-1.06l-1.72 1.72-1.72-1.72Z"
                      clipRule="evenodd"
                    />
                  </svg>
                ),
                action: () => onRemovePatientFromGroup(),
              }
            : null,
        ]}
      />
    </motion.div>
  );
};

export default PatientLineDisplay;
