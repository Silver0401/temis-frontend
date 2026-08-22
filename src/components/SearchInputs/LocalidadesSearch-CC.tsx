import React, { useEffect } from "react";
import InputCC from "../Input-CC";
import { useMutation } from "@tanstack/react-query";
import { useGlobalContext } from "@/e2e/globalContext";
import { toast } from "sonner";
import { Search_Localidades } from "@/e2e/server/FeathersAPI";

interface LocalidadesSearchCCProps {
  onSelect: (data: LocalidadesResponse) => void;
  colorSchema?: colorSchemas;
  onClear?: () => void;
  currentValue?: string;
  className?: string;
  identifier?: string;
  efeKey?: number;
  munKey?: number;
  disabled?: boolean;
  placeholder?: string;
}

const LocalidadesSearchCC: React.FC<LocalidadesSearchCCProps> = ({
  onClear,
  identifier,
  className,
  onSelect,
  colorSchema,
  currentValue,
  disabled,
  efeKey,
  munKey,
  placeholder,
}) => {
  const { feathersFetchCC } = useGlobalContext();
  const [searchedLocalidades, setSearchedLocalidades] = React.useState<
    LocalidadesResponse[]
  >([]);
  const [selectedLocalidad, setSelectedLocalidad] = React.useState<
    LocalidadesResponse | undefined
  >(undefined);

  const search_mutation = useMutation({
    mutationFn: async (query: string) => {
      const req = await Search_Localidades(query, efeKey, munKey);
      return feathersFetchCC<LocalidadesResponse[]>(req);
    },
    onSuccess(data) {
      if (data.type === "success") {
        if (data.data.length === 0) {
          toast.error(
            "No se encontraron localidades. Intenta buscando con otro nombre",
          );
          return;
        }
        setSearchedLocalidades(data.data);
      } else {
        toast.error(
          "No se encontraron localidades. Intenta buscando con otro nombre",
        );
      }
    },
  });

  useEffect(() => {
    if (selectedLocalidad) {
      onSelect(selectedLocalidad);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocalidad]);

  return (
    <div
      className={`GeneralSearchCCContainer ${className ? className : ""}`}
      key={identifier}
    >
      <div className="SearchInputContainer">
        {search_mutation.isPending ? (
          <InputCC
            identifier="loaderInput"
            currentValue="Buscando Localidades ..."
            styles={{ container: { width: "100%" } }}
            colorSchema="night"
            type="text"
            loading
          />
        ) : (
          <InputCC
            identifier={`${identifier || "LocalidadesSearch"}-search`}
            disabled={disabled}
            currentValue={
              currentValue
                ? currentValue
                : selectedLocalidad
                  ? selectedLocalidad.LOCALIDAD
                  : undefined
            }
            type={search_mutation.isIdle ? "text" : "select"}
            options={searchedLocalidades.map((item) => `${item.LOCALIDAD}`)}
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
                      setSelectedLocalidad(undefined);
                      search_mutation.reset();
                      onClear && onClear();
                    },
                  }
                : undefined
            }
            debouncer
            placeholder={
              search_mutation.isIdle
                ? placeholder || "Localidad"
                : "Selecciona una Localidad"
            }
            styles={{ container: { width: "100%" } }}
            colorSchema={colorSchema ? colorSchema : "day"}
            onChange={(text) => {
              if (search_mutation.isIdle) {
                text.length > 0 && search_mutation.mutate(text);
              } else {
                const found = searchedLocalidades.find(
                  (item) => item.LOCALIDAD === text,
                );
                if (found) setSelectedLocalidad(found);
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
        value={currentValue || selectedLocalidad?.LOCALIDAD || ""}
        readOnly
      />
    </div>
  );
};

export default LocalidadesSearchCC;
