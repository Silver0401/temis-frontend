import React, { useEffect } from "react";
import InputCC from "../Input-CC";
import { useQuery } from "@tanstack/react-query";
import { useGlobalContext } from "@/e2e/globalContext";
import { Get_PersonalType } from "@/e2e/server/FeathersAPI";

interface PersonalTypeSearchCCProps {
  onSelect: (data: string) => void;
  colorSchema?: colorSchemas;
  onClear?: () => void;
  currentValue?: string;
  className?: string;
  identifier?: string;
  placeholder?: string;
}

const PersonalTypeSearchCC: React.FC<PersonalTypeSearchCCProps> = ({
  onClear,
  identifier,
  className,
  onSelect,
  colorSchema,
  currentValue,
  placeholder,
}) => {
  const { feathersFetchCC } = useGlobalContext();
  const [selectedPersonalType, setSelectedPersonalType] = React.useState<
    string | undefined
  >(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ["catalogo-personal-type"],
    queryFn: async () => {
      const req = await Get_PersonalType();
      return feathersFetchCC<PersonelTypeResponse[]>(req);
    },
  });

  useEffect(() => {
    if (
      selectedPersonalType &&
      selectedPersonalType.length > 0 &&
      selectedPersonalType !== "default"
    ) {
      onSelect(selectedPersonalType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPersonalType]);

  const options =
    data?.type === "success"
      ? data.data.map((item) => `${item.CATALOG_KEY} - ${item.TIPO_PERSONAL}`)
      : [];

  return (
    <div
      className={`GeneralSearchCCContainer ${className ? className : ""}`}
      key={identifier}
    >
      <div className="SearchInputContainer">
        {isLoading ? (
          <InputCC
            identifier="loaderInput"
            currentValue="Cargando Tipos de Personal ..."
            styles={{ container: { width: "100%" } }}
            colorSchema="night"
            type="text"
            loading
          />
        ) : (
          <InputCC
            identifier={`${identifier || "PersonalTypeSearch"}-search`}
            currentValue={
              currentValue
                ? currentValue
                : selectedPersonalType
                  ? selectedPersonalType
                  : undefined
            }
            type="select"
            options={options}
            iconCustoms={
              selectedPersonalType
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
                      setSelectedPersonalType(undefined);
                      onClear && onClear();
                    },
                  }
                : undefined
            }
            placeholder={placeholder || "Selecciona un Tipo de Personal"}
            styles={{ container: { width: "100%" } }}
            colorSchema={colorSchema ? colorSchema : "day"}
            onChange={(text) => {
              setSelectedPersonalType(text);
            }}
          />
        )}
      </div>

      {/* Carries the selection into FormData so FormCC's `required` check
          can see it (the search input posts under a separate name). */}
      <input
        type="hidden"
        name={identifier}
        value={currentValue || selectedPersonalType || ""}
        readOnly
      />
    </div>
  );
};

export default PersonalTypeSearchCC;
