import React, { useEffect } from "react";
import InputCC from "../Input-CC";
import { useMutation } from "@tanstack/react-query";
import { useGlobalContext } from "@/e2e/globalContext";
import { toast } from "sonner";
import {
  Search_Drug_By_Name,
  Search_Drug_By_Rxcui,
} from "@/e2e/server/AxiosAPI";

interface DrugSearchCCProps {
  onDrugSelect: (data: string) => void;
  colorSchema?: colorSchemas;
  onClear?: () => void;
  currentValue?: string;
  className?: string;
}

const DrugSearchCC: React.FC<DrugSearchCCProps> = ({
  onClear,
  className,
  colorSchema,
  onDrugSelect,
  currentValue,
}) => {
  const { axiosFetchCC } = useGlobalContext();
  const [searchedDrugs, setSearchedDrugs] = React.useState<string[]>([]);
  const [selectedDrug, setSelectedDrug] = React.useState<string | undefined>(
    undefined,
  );

  const search_one_Drug_mutation = useMutation({
    mutationFn: async (drugName: string) => {
      let finalDrugName = drugName;
      let req: any = null;
      setSelectedDrug("default");

      if (drugName.includes("~")) {
        finalDrugName = drugName.split("~")[1].trim();
        req = await Search_Drug_By_Rxcui(finalDrugName);
      } else {
        finalDrugName = drugName
          .split(" ")
          .filter((word) => !/\d/.test(word))
          .join(" ");

        req = await Search_Drug_By_Name(finalDrugName);
      }
      // Filter Out Quantitites (To seach only drug Name)

      return axiosFetchCC<RxNormDrugsResponse>(req);
    },
    onSuccess(data, params) {
      // Si se busco un medicamento por RXCUI
      if (params.includes("~")) {
        if (data.type === "success") {
          setSearchedDrugs([
            // @ts-ignore
            `${data.data.properties.name} ~ ${data.data.properties.rxcui}`,
          ]);
        } else {
          toast.error(
            "No se encontraron fármacos. Intenta buscando con otro nombre",
          );
          setSearchedDrugs([]);
        }
      } else {
        // Si se busco un medicamento por Nombre Escrito

        function scoreMatch(item: string, query: string) {
          const itemLower = item.toLowerCase();
          const queryLower = query.toLowerCase();

          // Coincidencia exacta
          if (itemLower === queryLower) return 100;

          // Empieza con el query
          if (itemLower.startsWith(queryLower)) return 90;

          // Contiene el query completo
          if (itemLower.includes(queryLower)) return 70;

          // Coincidencia por palabras individuales
          const queryWords = queryLower.split(/\s+/);
          const itemWords = itemLower.split(/\s+/);

          let wordScore = 0;
          for (const qWord of queryWords) {
            for (const iWord of itemWords) {
              if (iWord === qWord) wordScore += 20;
              else if (iWord.startsWith(qWord)) wordScore += 15;
              else if (iWord.includes(qWord)) wordScore += 10;
            }
          }

          return wordScore;
        }

        function sortByRelevance(medications: string[], query: string) {
          return [...medications].sort((a, b) => {
            return scoreMatch(b, query) - scoreMatch(a, query);
          });
        }

        if (data.type === "success") {
          let FinalDrugsList = [];

          if (!data.data.drugGroup.conceptGroup) {
            toast.error(
              "No se encontraron fármacos. Intenta buscando con otro nombre",
            );
            setSearchedDrugs([]);
            return [];
          }

          // Obtener los Nombres y Dosis del Medicamento
          const GenericDrugNamesListed = data?.data.drugGroup.conceptGroup
            .filter((cg) => cg.tty === "SCD")[0]
            .conceptProperties.map(
              (property) => `${property.name} ~ ${property.rxcui}`,
            );

          // Filtrar ahora si los Resultados por Dosis (si es incluida)
          const splittedDrug = params.split(" ");

          if (splittedDrug.length > 1) {
            const FilteredDrugNames: string[] = [];

            GenericDrugNamesListed.map((name) => {
              const dosageNumber = params
                .split(" ")
                .find((word) => /\d/.test(word));

              const numbersOnly = dosageNumber?.replace(/\D/g, "");

              if (numbersOnly) {
                if (name.toLowerCase().includes(numbersOnly)) {
                  FilteredDrugNames.push(name);
                }
              } else {
                FilteredDrugNames.push(name);
              }
            });
            FinalDrugsList = sortByRelevance(FilteredDrugNames, params);
          } else {
            FinalDrugsList = GenericDrugNamesListed;
          }

          //  Regresar la Lista ya con los Multiples Filtros
          setSearchedDrugs(FinalDrugsList);
        } else {
          toast.error(
            "No se encontraron fármacos. Intenta buscando con otro nombre",
          );
        }
      }
    },
  });

  useEffect(() => {
    if (
      selectedDrug &&
      selectedDrug?.length > 0 &&
      selectedDrug !== "default"
    ) {
      onDrugSelect(selectedDrug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDrug]);

  return (
    <div
      className={`GeneralSearchCCContainer ${className ? className : ""}`}
      key={className}
    >
      <div className="SearchInputContainer">
        {search_one_Drug_mutation.isPending ? (
          <InputCC
            identifier="loaderInput"
            currentValue="Buscando Fármacos ..."
            styles={{ container: { width: "100%" } }}
            colorSchema="night"
            type="text"
            loading
          />
        ) : (
          <InputCC
            identifier="DrugSearchInput"
            label="Buscar Fármacos"
            currentValue={
              currentValue
                ? currentValue
                : selectedDrug
                  ? selectedDrug
                  : undefined
            }
            type={search_one_Drug_mutation.isIdle ? "text" : "select"}
            options={searchedDrugs.map((DrugName) => DrugName)}
            iconCustoms={
              !search_one_Drug_mutation.isIdle
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
                    onClick: () => {
                      setSelectedDrug(undefined);
                      search_one_Drug_mutation.reset();
                      onClear && onClear();
                    },
                  }
                : undefined
            }
            debouncer
            placeholder={
              search_one_Drug_mutation.isIdle
                ? "Busca un Fármaco"
                : "Selecciona un Fármaco"
            }
            styles={{ container: { width: "100%" } }}
            colorSchema={colorSchema ? colorSchema : "day"}
            onChange={(text) => {
              if (search_one_Drug_mutation.isIdle) {
                text.length > 0 && search_one_Drug_mutation.mutate(text);
              } else {
                setSelectedDrug(text);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DrugSearchCC;
