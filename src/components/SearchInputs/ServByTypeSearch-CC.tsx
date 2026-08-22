import React, { useEffect } from "react";
import InputCC from "../Input-CC";
import { useQuery } from "@tanstack/react-query";
import { useGlobalContext } from "@/e2e/globalContext";
import { Get_ServByType } from "@/e2e/server/FeathersAPI";

interface ServByTypeSearchCCProps {
  onSelect: (data: string) => void;
  colorSchema?: colorSchemas;
  onClear?: () => void;
  currentValue?: string;
  className?: string;
  identifier?: string;
  placeholder?: string;
}

const ServByTypeSearchCC: React.FC<ServByTypeSearchCCProps> = ({
  onClear,
  identifier,
  className,
  onSelect,
  colorSchema,
  currentValue,
  placeholder,
}) => {
  const { feathersFetchCC } = useGlobalContext();
  const [selectedServ, setSelectedServ] = React.useState<string | undefined>(
    undefined,
  );

  const { data, isLoading } = useQuery({
    queryKey: ["catalogo-serv-by-type"],
    queryFn: async () => {
      const req = await Get_ServByType();
      return feathersFetchCC<ServByTypeResponse[]>(req);
    },
  });

  useEffect(() => {
    if (selectedServ && selectedServ.length > 0 && selectedServ !== "default") {
      onSelect(selectedServ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServ]);

  const options =
    data?.type === "success"
      ? data.data.map((item) => `${item.CATALOG_KEY} - ${item.DESCRIPCION}`)
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
            currentValue="Cargando Servicios ..."
            styles={{ container: { width: "100%" } }}
            colorSchema="night"
            type="text"
            loading
          />
        ) : (
          <InputCC
            identifier={`${identifier || "ServByTypeSearch"}-search`}
            currentValue={
              currentValue
                ? currentValue
                : selectedServ
                  ? selectedServ
                  : undefined
            }
            type="select"
            options={options}
            iconCustoms={
              selectedServ
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
                      setSelectedServ(undefined);
                      onClear && onClear();
                    },
                  }
                : undefined
            }
            placeholder={placeholder || "Selecciona un Servicio"}
            styles={{ container: { width: "100%" } }}
            colorSchema={colorSchema ? colorSchema : "day"}
            onChange={(text) => {
              setSelectedServ(text);
            }}
          />
        )}
      </div>

      {/* Carries the selection into FormData so FormCC's `required` check
          can see it (the search input posts under a separate name). */}
      <input
        type="hidden"
        name={identifier}
        value={currentValue || selectedServ || ""}
        readOnly
      />
    </div>
  );
};

export default ServByTypeSearchCC;
