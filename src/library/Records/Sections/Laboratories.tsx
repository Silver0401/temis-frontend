import React, { useContext, useMemo, useState } from "react";
import LineGraphCC from "@/components/LineGraph-CC";
import { GlobalContext, useGlobalContext } from "@/e2e/globalContext";
import InputCC from "@/components/Input-CC";
import { useMutation, useQuery } from "@tanstack/react-query";
import ActionCC from "@/components/Action-CC";
import {
  Get_Patient_Laboratories,
  Modify_Laboratories,
} from "@/e2e/server/FeathersAPI";
import FancyLoader from "@/library/Generics/Loaders/FancyLoader";
import ButtonCC from "@/components/Button-CC";
import ModalCC from "@/components/Modal-CC";
import LoaderCC from "@/components/Loader-CC";
import { FormatLabsData } from "@/scripts/Generator";
import { toast } from "sonner";
import IconsCC from "@/assets/icons/IconsCC";

const Laboratories: React.FC<SectionProps> = ({ PatientInfo, onAddNewDoc }) => {
  const { feathersFetchCC, appDaySchema } = useGlobalContext();
  const [searchedLab, setSearchedLab] = useState<string>("");
  const [labModalOpen, setLabModalOpen] = useState<boolean>(false);
  const [pointSeleced, setPointSelected] = useState<PointProps | undefined>(
    undefined,
  );

  const { isPending, isRefetching, refetch, data } = useQuery({
    queryFn: async () => {
      const req = await Get_Patient_Laboratories(PatientInfo._id);
      return feathersFetchCC<LabSomaResponse[]>(req);
    },

    refetchOnWindowFocus: false,
    queryKey: [`fetching_patient_laboratories_${PatientInfo._id}`],
  });

  const filteredLabs = useMemo((): Array<Record<string, LabSomaEntry>> => {
    const loweredSearchedLab = searchedLab.toLowerCase();
    const FormatedLabsData = FormatLabsData(data?.data ? data?.data : []);

    const sorted = FormatedLabsData.sort((labData1, labData2) => {
      const key1 = labData1[0];
      const value1 = labData1[1];
      const key2 = labData2[0];
      const value2 = labData2[1];

      // @ts-ignore
      const fullWord1 = `${value1.name} ${key1}`.toLowerCase();
      // @ts-ignore
      const fullWord2 = `${value2.name} ${key2}`.toLowerCase();

      if (
        fullWord1.includes(loweredSearchedLab) &&
        !fullWord2.includes(loweredSearchedLab)
      ) {
        return -1;
      } else if (
        !fullWord1.includes(loweredSearchedLab) &&
        fullWord2.includes(loweredSearchedLab)
      ) {
        return 1;
      } else {
        return 0;
      }
    });

    if (data && data?.data.length > 1) {
      // @ts-ignore
      sorted.push(["addNewData", { list: [], name: "" }]);
    }

    return sorted;
  }, [data, searchedLab]);

  const modify_laboratory_parameter = useMutation({
    mutationFn: async (moddedLabData: LabSomaResponse) => {
      const toastID = toast.loading("Eliminando lab ...");
      const req = await Modify_Laboratories(moddedLabData._id, moddedLabData);
      const feath = await feathersFetchCC(req);
      toast.dismiss(toastID);
      return feath;
    },
    onSuccess: (data) => {
      if (data.type === "success") {
        refetch();
        setLabModalOpen(false);
      }
    },
  });

  const HandleModifyLab = () => {
    if (pointSeleced) {
      let foundLabFiltered: LabSomaResponse | undefined = undefined;

      // Filtra el Laboratorio exacto y Quítalo
      data?.data.map((lab) => {
        if (lab.dateTaken === pointSeleced.xValue) {
          lab.values.map((labParameters) => {
            if (
              parseFloat(labParameters.value) === pointSeleced.yValue &&
              labParameters.abreviation === pointSeleced.Abbr &&
              labParameters.fullName === pointSeleced.Name
            ) {
              foundLabFiltered = {
                ...lab,
                values: lab.values.filter(
                  (l) => l.value !== labParameters.value,
                ),
              };
            }
          });
        }
      });

      if (foundLabFiltered) {
        modify_laboratory_parameter.mutate(foundLabFiltered);
      } else {
        toast.error("No se encontró el laboratorio a modificar");
      }
    }
  };

  return (
    <section className="Laboratories" id="GraphsSectionContainer">
      {isPending || isRefetching ? (
        <FancyLoader bg="translucid" />
      ) : (
        <div className="GraphsContainer">
          {filteredLabs.length === 0 ? (
            <div className="NoGraphsContainer">
              <ActionCC
                text="El paciente no tiene resultados de laboratorio guardados"
                button="Agregar"
                onClick={() => onAddNewDoc && onAddNewDoc("Labs")}
                emptyIcon={IconsCC.LabTubes}
              />
            </div>
          ) : (
            <div className="TopContainer">
              <div className="titleCont">
                <ButtonCC
                  type="Phantom"
                  classname="AddNewGraphDataButton"
                  onClick={() => {
                    onAddNewDoc && onAddNewDoc("Labs");
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

                <h2>{"Buscar Labs"}</h2>
              </div>

              <InputCC
                type="text"
                identifier="SearchDataInput"
                debouncer
                onChange={(e) => setSearchedLab(e)}
              />
            </div>
          )}

          <div className="BottomContainer">
            {filteredLabs.map((labDataEntry) => {
              const [key, value] = labDataEntry as unknown as [
                key: string,
                value: LabSomaEntry,
              ];

              return key === "addNewData" ? (
                <div className="LinearAddNewData" key={key}>
                  <ActionCC
                    text="Agregar más laboratorios"
                    button="Agregar"
                    onClick={() => onAddNewDoc && onAddNewDoc("Labs")}
                    emptyIcon={IconsCC.LabTubes}
                  />
                </div>
              ) : (
                <LineGraphCC
                  key={key}
                  title={key}
                  subtitle={value.name}
                  theme={appDaySchema ? "day" : "night"}
                  data={value.list}
                  onPointClick={(PointProps) => {
                    setPointSelected(PointProps);
                    setLabModalOpen(true);
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      <ModalCC
        size={"small"}
        identifier="LabsMiniEditModal"
        animation="popUp"
        onModalClose={() => {
          // if (eventIDToDelete) {
          //   setEventIDToDelete(undefined);
          // }
        }}
        useStates={{
          setState: setLabModalOpen,
          state: labModalOpen,
        }}
      >
        {modify_laboratory_parameter.isPending ? (
          <LoaderCC schema="night" />
        ) : (
          <div className="GraphModalWrapper">
            <h3 className="titleCal">{"Borrar Lab"}</h3>
            <p className="subtitleCal">{`Estas seguro que quieres borrar el lab de ${pointSeleced?.Abbr}, con el valor de: ${pointSeleced?.yValue}`}</p>
            <ButtonCC
              type="Solid" size="lg"
              onClick={() => HandleModifyLab()}
              text="Borrar Lab "
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            />
          </div>
        )}
      </ModalCC>
    </section>
  );
};

export default Laboratories;
