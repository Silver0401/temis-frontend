import React, { useContext, useMemo, useState } from "react";
import { GlobalContext, useGlobalContext } from "@/e2e/globalContext";
import InputCC from "@/components/Input-CC";
import { useQuery } from "@tanstack/react-query";
import ActionCC from "@/components/Action-CC";
import { Get_Patient_Drugs } from "@/e2e/server/FeathersAPI";
import FancyLoader from "@/library/Generics/Loaders/FancyLoader";
import ButtonCC from "@/components/Button-CC";
import PrescriptionCC from "@/components/Prescription-CC";
import { Verify_Login } from "@/e2e/server/Queries";
import IconsCC from "@/assets/icons/IconsCC";

const DrugsAndSupplements: React.FC<SectionProps> = ({
  PatientInfo,
  onAddNewDoc,
}) => {
  const { feathersFetchCC, getAccessToken } = useGlobalContext();
  const [searchedDrug, setSearchedDrug] = useState<string>("");

  const { isLoading: userLoading, data: userData } = useQuery(
    Verify_Login(getAccessToken()),
  );

  const { isPending, data: drugData } = useQuery({
    queryFn: async () => {
      const req = await Get_Patient_Drugs(PatientInfo._id);
      return feathersFetchCC<Drugs[]>(req);
    },

    refetchOnWindowFocus: false,
    queryKey: [`fetching_patient_drugs_${PatientInfo._id}`],
  });

  const processedDrugs = useMemo((): Drugs[] => {
    const newDrugs: Drugs[] = [];

    drugData?.data.map((prescription) => {
      newDrugs.push({
        ...prescription,
        type: "processed",
      } as Drugs);
    });

    return newDrugs;
  }, [drugData]);

  return (
    <section className="DrugsAndSupplements" id="GraphsSectionContainer">
      {isPending || userLoading ? (
        <FancyLoader bg="translucid" />
      ) : userData ? (
        <div className="GraphsContainer">
          {processedDrugs?.length === 0 ? (
            <div className="NoGraphsContainer">
              <ActionCC
                text="El paciente no tiene medicamentos prescritos"
                button="Agregar"
                onClick={() => onAddNewDoc && onAddNewDoc("Drugs")}
                emptyIcon={IconsCC.DrugPills}
              />
            </div>
          ) : (
            <div className="TopContainer">
              <div className="titleCont">
                <ButtonCC
                  type="Phantom"
                  classname="AddNewGraphDataButton"
                  onClick={() => {
                    onAddNewDoc && onAddNewDoc("Drugs");
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
                        d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                />

                <h2>{"Buscar Fármacos"}</h2>
              </div>

              <InputCC
                type="text"
                identifier="SearchSomasInput"
                onChange={(e) => setSearchedDrug(e)}
              />
            </div>
          )}

          <div className="BottomContainer">
            {processedDrugs?.map((prescription) => {
              return prescription._id === "addNewDrug" ? (
                <div className="LinearAddNewLab" key={prescription._id}>
                  <ActionCC
                    key={prescription._id}
                    text="Receta más medicamentos"
                    button="Recetar"
                    onClick={() => onAddNewDoc && onAddNewDoc("Drugs")}
                    emptyIcon={IconsCC.DrugPills}
                  />
                </div>
              ) : (
                <PrescriptionCC
                  key={prescription._id}
                  drugs={prescription}
                  patientData={PatientInfo}
                  userData={userData?.data.user}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default DrugsAndSupplements;
