import React, { useEffect } from "react";
import InputCC from "../Input-CC";
import { useMutation } from "@tanstack/react-query";
import { useGlobalContext } from "@/e2e/globalContext";
import { toast } from "sonner";
import { Search_Municipios } from "@/e2e/server/FeathersAPI";

interface MunicipiosSearchCCProps {
  onSelect: (data: MunicipiosResponse) => void;
  colorSchema?: colorSchemas;
  onClear?: () => void;
  currentValue?: string;
  className?: string;
  identifier?: string;
  efeKey?: number;
  disabled?: boolean;
  placeholder?: string;
}

const MunicipiosSearchCC: React.FC<MunicipiosSearchCCProps> = ({
  onClear,
  identifier,
  className,
  onSelect,
  colorSchema,
  currentValue,
  disabled,
  efeKey,
  placeholder,
}) => {
  const { feathersFetchCC } = useGlobalContext();
  const [searchedMunicipios, setSearchedMunicipios] = React.useState<
    MunicipiosResponse[]
  >([]);
  const [selectedMunicipio, setSelectedMunicipio] = React.useState<
    MunicipiosResponse | undefined
  >(undefined);

  const search_mutation = useMutation({
    mutationFn: async (query: string) => {
      const req = await Search_Municipios(query, efeKey);
      return feathersFetchCC<MunicipiosResponse[]>(req);
    },
    onSuccess(data) {
      if (data.type === "success") {
        if (data.data.length === 0) {
          toast.error(
            "No se encontraron municipios. Intenta buscando con otro nombre",
          );
          return;
        }
        setSearchedMunicipios(data.data);
      } else {
        toast.error(
          "No se encontraron municipios. Intenta buscando con otro nombre",
        );
      }
    },
  });

  useEffect(() => {
    if (selectedMunicipio) {
      onSelect(selectedMunicipio);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMunicipio]);

  return (
    <div
      className={`GeneralSearchCCContainer ${className ? className : ""}`}
      key={identifier}
    >
      <div className="SearchInputContainer">
        {search_mutation.isPending ? (
          <InputCC
            identifier="loaderInput"
            currentValue="Buscando Municipios ..."
            styles={{ container: { width: "100%" } }}
            colorSchema="night"
            type="text"
            loading
          />
        ) : (
          <InputCC
            identifier={`${identifier || "MunicipiosSearch"}-search`}
            disabled={disabled}
            currentValue={
              currentValue
                ? currentValue
                : selectedMunicipio
                  ? selectedMunicipio.MUNICIPIO
                  : undefined
            }
            type={search_mutation.isIdle ? "text" : "select"}
            options={searchedMunicipios.map((item) => `${item.MUNICIPIO}`)}
            iconCustoms={
              !search_mutation.isIdle
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
                      setSelectedMunicipio(undefined);
                      search_mutation.reset();
                      onClear && onClear();
                    },
                  }
                : undefined
            }
            debouncer
            placeholder={
              search_mutation.isIdle
                ? placeholder || "Municipio"
                : "Selecciona un Municipio"
            }
            styles={{ container: { width: "100%" } }}
            colorSchema={colorSchema ? colorSchema : "day"}
            onChange={(text) => {
              if (search_mutation.isIdle) {
                text.length > 0 && search_mutation.mutate(text);
              } else {
                const found = searchedMunicipios.find(
                  (item) => item.MUNICIPIO === text,
                );
                if (found) setSelectedMunicipio(found);
              }
            }}
          />
        )}
      </div>

      {/* Carries the selection into FormData so FormCC's `required` check
          can see it (the search input posts under a separate name). */}
      <input
        type="hidden"
        name={identifier}
        value={currentValue || selectedMunicipio?.MUNICIPIO || ""}
        readOnly
      />
    </div>
  );
};

export default MunicipiosSearchCC;
