import React, { useEffect } from "react";
import InputCC from "../Input-CC";
import { useMutation } from "@tanstack/react-query";
import { useGlobalContext } from "@/e2e/globalContext";
import { toast } from "sonner";
import { Search_Establecimientos } from "@/e2e/server/FeathersAPI";

interface EstablecimientosSearchCCProps {
  onSelect: (data: string) => void;
  colorSchema?: colorSchemas;
  onClear?: () => void;
  currentValue?: string;
  className?: string;
  identifier?: string;
  placeholder?: string;
}

const EstablecimientosSearchCC: React.FC<EstablecimientosSearchCCProps> = ({
  onClear,
  identifier,
  className,
  onSelect,
  colorSchema,
  currentValue,
  placeholder,
}) => {
  const { feathersFetchCC } = useGlobalContext();
  const [searchedEstablecimientos, setSearchedEstablecimientos] =
    React.useState<EstablecimientosResponse[]>([]);
  const [selectedEstablecimiento, setSelectedEstablecimiento] = React.useState<
    string | undefined
  >(undefined);

  const search_mutation = useMutation({
    mutationFn: async (query: string) => {
      const req = await Search_Establecimientos(query);
      return feathersFetchCC<EstablecimientosResponse[]>(req);
    },
    onSuccess(data) {
      if (data.type === "success") {
        if (data.data.length === 0) {
          toast.error(
            "No se encontraron establecimientos. Intenta buscando con otro nombre o CLUES",
          );
          return;
        }
        setSearchedEstablecimientos(data.data);
      } else {
        toast.error(
          "No se encontraron establecimientos. Intenta buscando con otro nombre",
        );
      }
    },
  });

  useEffect(() => {
    if (
      selectedEstablecimiento &&
      selectedEstablecimiento.length > 0 &&
      selectedEstablecimiento !== "default"
    ) {
      onSelect(selectedEstablecimiento);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEstablecimiento]);

  return (
    <div
      className={`GeneralSearchCCContainer ${className ? className : ""}`}
      key={identifier}
    >
      <div className="SearchInputContainer">
        {search_mutation.isPending ? (
          <InputCC
            identifier="loaderInput"
            currentValue="Buscando Establecimientos ..."
            styles={{ container: { width: "100%" } }}
            colorSchema="night"
            type="text"
            loading
          />
        ) : (
          <InputCC
            identifier={`${identifier || "EstablecimientosSearch"}-search`}
            currentValue={
              currentValue
                ? currentValue
                : selectedEstablecimiento
                  ? selectedEstablecimiento
                  : undefined
            }
            type={search_mutation.isIdle ? "text" : "select"}
            options={searchedEstablecimientos.map(
              (item) => `${item.clues} - ${item.nombre_unidad}`,
            )}
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
                      setSelectedEstablecimiento(undefined);
                      search_mutation.reset();
                      onClear && onClear();
                    },
                  }
                : undefined
            }
            debouncer
            placeholder={
              search_mutation.isIdle
                ? placeholder || "Nombre o CLUES del establecimiento"
                : "Selecciona un Establecimiento"
            }
            styles={{ container: { width: "100%" } }}
            colorSchema={colorSchema ? colorSchema : "day"}
            onChange={(text) => {
              if (search_mutation.isIdle) {
                text.length > 0 && search_mutation.mutate(text);
              } else {
                setSelectedEstablecimiento(text);
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
        value={currentValue || selectedEstablecimiento || ""}
        readOnly
      />
    </div>
  );
};

export default EstablecimientosSearchCC;
