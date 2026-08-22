import React, { useContext, useMemo, useState } from "react";
import LineGraphCC from "@/components/LineGraph-CC";
import { GlobalContext, useGlobalContext } from "@/e2e/globalContext";
import InputCC from "@/components/Input-CC";
import { useQuery } from "@tanstack/react-query";
import ActionCC from "@/components/Action-CC";
import { Get_Patient_Somatometrias } from "@/e2e/server/FeathersAPI";
import { FormatSomasData } from "@/scripts/Generator";
import FancyLoader from "@/library/Generics/Loaders/FancyLoader";
import ButtonCC from "@/components/Button-CC";
import IconsCC from "@/assets/icons/IconsCC";

const Somatometrias: React.FC<SectionProps> = ({
  PatientInfo,
  onAddNewDoc,
}) => {
  const { feathersFetchCC, appDaySchema } = useGlobalContext();
  const [searchedSoma, setSearchedSoma] = useState<string>("");

  const { isPending, data } = useQuery({
    queryFn: async () => {
      const req = await Get_Patient_Somatometrias(PatientInfo._id);
      return feathersFetchCC<SomasResponse[]>(req);
    },

    refetchOnWindowFocus: false,
    queryKey: [`fetching_patient_somatometrias_${PatientInfo._id}`],
  });

  const filteredSomas = useMemo((): Array<Record<string, LabSomaEntry>> => {
    const buscado = searchedSoma.trim().toLowerCase();

    // Las series ya vienen armadas del catálogo: los somas guardan números con
    // clave fija, no un arreglo con el nombre y la unidad repetidos en cada
    // medición. Aquí solo se ordena por coincidencia con la búsqueda.
    const series = FormatSomasData(data?.data);

    const sorted = [...series].sort((serie1, serie2) => {
      const [clave1, valor1] = Object.entries(serie1)[0];
      const [clave2, valor2] = Object.entries(serie2)[0];
      const texto1 = `${valor1.name} ${clave1}`.toLowerCase();
      const texto2 = `${valor2.name} ${clave2}`.toLowerCase();

      const coincide1 = texto1.includes(buscado);
      const coincide2 = texto2.includes(buscado);
      if (coincide1 && !coincide2) return -1;
      if (!coincide1 && coincide2) return 1;
      return 0;
    });

    if (data && data.data.length > 1) {
      // @ts-ignore — marcador de la tarjeta "agregar" al final de la lista.
      sorted.push(["addNewData", { list: [], name: "" }]);
    }

    return sorted;
  }, [data, searchedSoma]);

  return (
    <section className="Somatometrias" id="GraphsSectionContainer">
      {isPending ? (
        <FancyLoader bg="translucid" />
      ) : (
        <div className="GraphsContainer">
          {filteredSomas.length === 0 ? (
            <div className="NoGraphsContainer">
              <ActionCC
                text="El paciente no tiene somatometrías guardadas"
                button="Agregar"
                onClick={() => onAddNewDoc && onAddNewDoc("Somas")}
                emptyIcon={IconsCC.VitalSigns}
              />
            </div>
          ) : (
            <div className="TopContainer">
              <div className="titleCont">
                <ButtonCC
                  type="Phantom"
                  classname="AddNewGraphDataButton"
                  onClick={() => {
                    onAddNewDoc && onAddNewDoc("Somas");
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

                <h2>{"Buscar Somas"}</h2>
              </div>

              <InputCC
                type="text"
                identifier="SearchDataInput"
                debouncer
                onChange={(e) => setSearchedSoma(e)}
              />
            </div>
          )}

          <div className="BottomContainer">
            {filteredSomas.map((labDataEntry) => {
              const [key, value] = labDataEntry as unknown as [
                key: string,
                value: LabSomaEntry,
              ];

              return key === "addNewData" ? (
                <div className="LinearAddNewData" key={key}>
                  <ActionCC
                    text="Agregar más somatometrias"
                    button="Agregar"
                    onClick={() => onAddNewDoc && onAddNewDoc("Somas")}
                    emptyIcon={IconsCC.VitalSigns}
                  />
                </div>
              ) : (
                <LineGraphCC
                  key={key}
                  title={key}
                  subtitle={value.name}
                  theme={appDaySchema ? "day" : "night"}
                  data={value.list}
                  onPointClick={() => {}}
                />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default Somatometrias;
