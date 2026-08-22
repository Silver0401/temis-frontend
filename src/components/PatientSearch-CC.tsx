import React, { useContext, useEffect } from "react";
import InputCC from "./Input-CC";
import { useMutation } from "@tanstack/react-query";
import { Search_One_Patient } from "@/e2e/server/FeathersAPI";
import { GlobalContext, useGlobalContext } from "@/e2e/globalContext";
import { toast } from "sonner";

interface PatientData {
  idAndName: string;
  fullData: Patient;
}
interface PatientSearchCCProps {
  onPatientSelect: (data: PatientData) => void;
  onReset?: () => void;
  colorSchema?: colorSchemas;
}

const PatientSearchCC: React.FC<PatientSearchCCProps> = ({
  onPatientSelect,
  colorSchema,
  onReset,
}) => {
  const { feathersFetchCC } = useGlobalContext();
  const [searchedPatients, setSearchedPatients] = React.useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = React.useState<
    string | undefined
  >(undefined);

  const search_one_patient_mutation = useMutation({
    mutationFn: async (fullName: string) => {
      setSelectedPatient("default");
      const req = await Search_One_Patient(fullName);
      return feathersFetchCC<{ patientsList: Patient[] }>(req);
    },
    mutationKey: ["patient_search_cc"],
    onSuccess(data) {
      if (data.type === "success") {
        setSearchedPatients(data.data.patientsList);
      } else {
        toast.error(
          "No se encontraron pacientes. Puedes intentar con nombreos y apellidos",
        );
      }
    },
  });

  const InputReset = () => {
    setSelectedPatient(undefined);
    search_one_patient_mutation.reset();
    onReset && onReset();
  };

  useEffect(() => {
    if (
      selectedPatient &&
      selectedPatient?.length > 0 &&
      selectedPatient !== "default"
    ) {
      onPatientSelect({
        idAndName: selectedPatient,
        fullData: searchedPatients.filter(
          (patientData) =>
            patientData._id == selectedPatient.split("|")[1].trim(),
        )[0],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatient]);

  return (
    <div className="GeneralSearchCCContainer">
      <div className="SearchInputContainer">
        {search_one_patient_mutation.isPending ? (
          <InputCC
            identifier="loaderInput"
            currentValue="Buscando Pacientes ..."
            styles={{ container: { width: "100%" } }}
            colorSchema="night"
            type="text"
            loading
          />
        ) : (
          <InputCC
            identifier="PatientSearchInput"
            currentValue={selectedPatient ? selectedPatient : undefined}
            type={search_one_patient_mutation.isIdle ? "text" : "select"}
            options={searchedPatients.map(
              (patient) =>
                `${patient.personalInfo.names} ${patient.personalInfo.middleName} ${patient.personalInfo.lastName} | ${patient._id}`,
            )}
            iconCustoms={
              !search_one_patient_mutation.isIdle
                ? {
                    icon: (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="size-6"
                        style={{ width: "80%", height: "80%" }}
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ),
                    onClick: InputReset,
                  }
                : undefined
            }
            debouncer
            placeholder={
              search_one_patient_mutation.isIdle
                ? "Busca un Paciente"
                : "Selecciona un Paciente"
            }
            styles={{ container: { width: "100%" } }}
            colorSchema={colorSchema ? colorSchema : "day"}
            onChange={(text) => {
              if (search_one_patient_mutation.isIdle) {
                text.length > 0 && search_one_patient_mutation.mutate(text);
              } else {
                setSelectedPatient(text);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PatientSearchCC;
