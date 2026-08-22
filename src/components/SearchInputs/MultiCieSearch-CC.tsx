import React, { useState } from "react";
import InputCC from "../Input-CC";
import { useMutation } from "@tanstack/react-query";
import { useGlobalContext } from "@/e2e/globalContext";
import { toast } from "sonner";
import { Search_CIE_By_Name } from "@/e2e/server/FeathersAPI";

interface MultiCIESearchCCProps {
  /** Diagnósticos ya elegidos. El componente no guarda estado propio de lista. */
  value: CIEResponse[];
  onChange: (diagnoses: CIEResponse[]) => void;
  colorSchema?: colorSchemas;
  className?: string;
  identifier?: string;
  /**
   * Cuántos diagnósticos viajan al archivo de intercambio GIIS. Los que pasen
   * de aquí se conservan en el expediente pero se marcan como no reportables.
   */
  reportableLimit?: number;
}

/**
 * Buscador CIE-10 de selección múltiple.
 *
 * Cada diagnóstico elegido se agrega como pill y el buscador se vacía para el
 * siguiente. Se guarda la entrada COMPLETA del catálogo, no solo clave y
 * nombre: el router de guías usa sus metadatos para decidir qué bloques del
 * formulario aplican.
 */
const MultiCIESearchCC: React.FC<MultiCIESearchCCProps> = ({
  value,
  onChange,
  identifier = "MultiCIESearch",
  className,
  colorSchema,
  reportableLimit = 3,
}) => {
  const { feathersFetchCC } = useGlobalContext();
  const [searchedCIEs, setSearchedCIEs] = useState<CIEResponse[]>([]);
  // Remontar el input es la forma de vaciarlo: InputCC guarda su propio texto.
  const [resetKey, setResetKey] = useState(0);

  const search_mutation = useMutation({
    mutationFn: async (CIENameOrCode: string) => {
      const moddedCIE = CIENameOrCode?.includes(".")
        ? CIENameOrCode?.split(".")[0].trim()
        : CIENameOrCode;
      const req = await Search_CIE_By_Name(moddedCIE);
      return feathersFetchCC<CIEResponse[]>(req);
    },
    onSuccess(data) {
      if (data.type === "success" && data.data.length > 0) {
        setSearchedCIEs(data.data);
      } else {
        toast.error(
          "No se encontraron diagnósticos. Intenta con otro nombre o código",
        );
        search_mutation.reset();
      }
    },
  });

  const clearSearch = () => {
    setSearchedCIEs([]);
    search_mutation.reset();
    setResetKey((key) => key + 1);
  };

  const addDiagnosis = (option: string) => {
    if (!option || option === "default") return;
    const clave = option.split(" - ")[0].trim();
    const found = searchedCIEs.find((cie) => cie.CATALOG_KEY === clave);
    if (!found) return;

    if (value.some((cie) => cie.CATALOG_KEY === found.CATALOG_KEY)) {
      toast.info("Ese diagnóstico ya está en la lista");
    } else {
      onChange([...value, found]);
    }
    clearSearch();
  };

  const removeDiagnosis = (catalogKey: string) =>
    onChange(value.filter((cie) => cie.CATALOG_KEY !== catalogKey));

  return (
    <div
      className={`MultiCIESearchContainer ${className ? className : ""}`}
      key={identifier}
    >
      <div className="SearchInputContainer">
        {search_mutation.isPending ? (
          <InputCC
            identifier="loaderInput"
            currentValue="Buscando Diagnósticos ..."
            styles={{ container: { width: "100%" } }}
            colorSchema={colorSchema ? colorSchema : "day"}
            type="text"
            loading
          />
        ) : (
          <InputCC
            key={resetKey}
            identifier={`${identifier}-search`}
            type={search_mutation.isIdle ? "text" : "select"}
            options={searchedCIEs.map(
              (cie) => `${cie.CATALOG_KEY} - ${cie.NOMBRE}`,
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
                    onClick: clearSearch,
                  }
                : undefined
            }
            debouncer
            placeholder={
              search_mutation.isIdle
                ? "Busca por nombre o código CIE-10"
                : "Selecciona un Diagnóstico"
            }
            styles={{ container: { width: "100%" } }}
            colorSchema={colorSchema ? colorSchema : "day"}
            onChange={(text) => {
              if (search_mutation.isIdle) {
                text.length > 0 && search_mutation.mutate(text);
              } else {
                addDiagnosis(text);
              }
            }}
          />
        )}
      </div>

      {value.length ? (
        <ul className="CIEPillList" aria-label="Diagnósticos seleccionados">
          {value.map((cie, index) => (
            <li
              key={cie.CATALOG_KEY}
              className="CIEPill"
              data-reportable={index < reportableLimit}
              title={
                index < reportableLimit
                  ? cie.NOMBRE
                  : `${cie.NOMBRE} — fuera de los ${reportableLimit} que se reportan a GIIS`
              }
            >
              <strong>{cie.CATALOG_KEY}</strong>
              <span>{cie.NOMBRE}</span>
              <button
                type="button"
                aria-label={`Quitar ${cie.NOMBRE}`}
                onClick={() => removeDiagnosis(cie.CATALOG_KEY)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {value.length > reportableLimit ? (
        <p className="CIEPillNote">
          Solo los primeros {reportableLimit} diagnósticos se reportan a GIIS; el
          resto queda en el expediente.
        </p>
      ) : null}
    </div>
  );
};

export default MultiCIESearchCC;
