import React, { useEffect } from "react";
import InputCC from "../Input-CC";
import { useMutation } from "@tanstack/react-query";
import { useGlobalContext } from "@/e2e/globalContext";
import { toast } from "sonner";
import { Search_EntFed } from "@/e2e/server/FeathersAPI";

interface EntFedSearchCCProps {
  onSelect: (data: EntFedResponse) => void;
  colorSchema?: colorSchemas;
  onClear?: () => void;
  currentValue?: string;
  className?: string;
  identifier?: string;
  disabled?: boolean;
  placeholder?: string;
}

const EntFedSearchCC: React.FC<EntFedSearchCCProps> = ({
  onClear,
  identifier,
  className,
  onSelect,
  colorSchema,
  disabled,
  currentValue,
  placeholder,
}) => {
  const { feathersFetchCC } = useGlobalContext();
  const [searchedEntFeds, setSearchedEntFeds] = React.useState<
    EntFedResponse[]
  >([]);
  const [selectedEntFed, setSelectedEntFed] = React.useState<
    EntFedResponse | undefined
  >(undefined);

  const search_mutation = useMutation({
    mutationFn: async (query: string) => {
      const req = await Search_EntFed(query);
      return feathersFetchCC<EntFedResponse[]>(req);
    },
    onSuccess(data) {
      if (data.type === "success") {
        if (data.data.length === 0) {
          toast.error(
            "No se encontraron entidades federativas. Intenta con otro nombre",
          );
          return;
        }
        setSearchedEntFeds(data.data);
      } else {
        toast.error(
          "No se encontraron entidades federativas. Intenta con otro nombre",
        );
      }
    },
  });

  useEffect(() => {
    if (selectedEntFed) {
      onSelect(selectedEntFed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntFed]);

  return (
    <div
      className={`GeneralSearchCCContainer ${className ? className : ""}`}
      key={identifier}
    >
      <div className="SearchInputContainer">
        {search_mutation.isPending ? (
          <InputCC
            identifier="loaderInput"
            currentValue="Buscando Entidades Federativas ..."
            styles={{ container: { width: "100%" } }}
            colorSchema="night"
            type="text"
            loading
          />
        ) : (
          <InputCC
            identifier={`${identifier || "EntFedSearch"}-search`}
            disabled={disabled}
            currentValue={
              currentValue
                ? currentValue
                : selectedEntFed
                  ? selectedEntFed.ENTIDAD_FEDERATIVA
                  : undefined
            }
            type={search_mutation.isIdle ? "text" : "select"}
            options={searchedEntFeds.map(
              (item) => `${item.ENTIDAD_FEDERATIVA}`,
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
                      setSelectedEntFed(undefined);
                      search_mutation.reset();
                      onClear && onClear();
                    },
                  }
                : undefined
            }
            debouncer
            placeholder={
              search_mutation.isIdle
                ? placeholder || "Entidad Federativa"
                : "Selecciona una Entidad Federativa"
            }
            styles={{ container: { width: "100%" } }}
            colorSchema={colorSchema ? colorSchema : "day"}
            onChange={(text) => {
              if (search_mutation.isIdle) {
                text.length > 0 && search_mutation.mutate(text);
              } else {
                const found = searchedEntFeds.find(
                  (item) => item.ENTIDAD_FEDERATIVA === text,
                );
                if (found) setSelectedEntFed(found);
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
        value={currentValue || selectedEntFed?.ENTIDAD_FEDERATIVA || ""}
        readOnly
      />
    </div>
  );
};

export default EntFedSearchCC;
