import React, { useRef } from "react";
import InputCC from "../Input-CC";
import { useMutation } from "@tanstack/react-query";
import { useGlobalContext } from "@/e2e/globalContext";
import { toast } from "sonner";
import {
  Google_Autocomplete,
  Google_Place_Details,
} from "@/e2e/server/FeathersAPI";

// Backend (google-api service) response shapes. The address search lives in the
// backend so the Google key stays secret and ad-blockers can't kill the request
// (it goes to our own domain, not maps.googleapis.com).
interface DomicilioPrediction {
  placeId: string;
  description: string;
}

interface AutocompleteResult {
  action: "autocomplete";
  predictions: DomicilioPrediction[];
}

interface DetailsResult {
  action: "details";
  pais?: LocalizacionEntry;
  estado?: LocalizacionEntry;
  municipio?: LocalizacionEntry;
  localidad?: LocalizacionEntry;
  calle?: string;
  colonia?: string;
  codigoPostal?: string;
  formattedAddress?: string;
}

interface DomicilioSearchCCProps {
  onSelect: (data: LocalizacionItem) => void;
  colorSchema?: colorSchemas;
  onClear?: () => void;
  placeholder?: string;
  currentValue?: string;
  className?: string;
  identifier?: string;
}

const newSessionToken = (): string =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const DomicilioSearchCC: React.FC<DomicilioSearchCCProps> = ({
  onClear,
  identifier,
  className,
  onSelect,
  colorSchema,
  currentValue,
  placeholder,
}) => {
  const { feathersFetchCC } = useGlobalContext();
  const [searchedDomicilios, setSearchedDomicilios] = React.useState<
    DomicilioPrediction[]
  >([]);
  const [selectedDomicilio, setSelectedDomicilio] = React.useState<
    string | undefined
  >(undefined);
  // One Google billing session spans the autocomplete keystrokes + the details
  // call; rotate it after each resolved pick (or clear).
  const sessionTokenRef = useRef<string>(newSessionToken());

  const search_mutation = useMutation({
    mutationFn: async (query: string) => {
      const req = await Google_Autocomplete(query, sessionTokenRef.current);
      return feathersFetchCC<AutocompleteResult>(req);
    },
    onSuccess(data) {
      if (data.type === "success" && data.data?.action === "autocomplete") {
        if (data.data.predictions.length === 0) {
          toast.error(
            "No se encontraron direcciones. Intenta con otra búsqueda",
          );
          return;
        }
        setSearchedDomicilios(data.data.predictions);
      } else {
        toast.error("Error al buscar la dirección");
      }
    },
  });

  const details_mutation = useMutation({
    mutationFn: async (placeId: string) => {
      const req = await Google_Place_Details(placeId, sessionTokenRef.current);
      return feathersFetchCC<DetailsResult>(req);
    },
    onSuccess(data) {
      if (data.type === "success" && data.data?.action === "details") {
        const d = data.data;
        onSelect({
          pais: d.pais,
          estado: d.estado,
          municipio: d.municipio,
          localidad: d.localidad,
          calle: d.calle,
          colonia: d.colonia,
          codigoPostal: d.codigoPostal,
        });
        // Fresh billing session for the next search.
        sessionTokenRef.current = newSessionToken();
      } else {
        toast.error("No se pudieron obtener los datos de la dirección");
      }
    },
  });

  return (
    <div
      className={`GeneralSearchCCContainer ${className ? className : ""}`}
      key={identifier}
    >
      <div className="SearchInputContainer">
        {search_mutation.isPending || details_mutation.isPending ? (
          <InputCC
            identifier="loaderInput"
            currentValue="Buscando direcciones ..."
            styles={{ container: { width: "100%" } }}
            colorSchema="night"
            type="text"
            loading
          />
        ) : (
          <InputCC
            identifier={`${identifier || "DomicilioSearch"}-search`}
            currentValue={
              currentValue
                ? currentValue
                : selectedDomicilio
                  ? selectedDomicilio
                  : undefined
            }
            type={search_mutation.isIdle ? "text" : "select"}
            options={searchedDomicilios.map((item) => `${item.description}`)}
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
                      setSelectedDomicilio(undefined);
                      setSearchedDomicilios([]);
                      search_mutation.reset();
                      details_mutation.reset();
                      sessionTokenRef.current = newSessionToken();
                      onClear && onClear();
                    },
                  }
                : undefined
            }
            debouncer
            placeholder={
              search_mutation.isIdle
                ? placeholder || "Busca tu domicilio"
                : "Selecciona una dirección"
            }
            styles={{ container: { width: "100%" } }}
            colorSchema={colorSchema ? colorSchema : "day"}
            onChange={(text) => {
              if (search_mutation.isIdle) {
                text.length > 0 && search_mutation.mutate(text);
              } else {
                const found = searchedDomicilios.find(
                  (item) => item.description === text,
                );
                if (found) {
                  setSelectedDomicilio(found.description);
                  details_mutation.mutate(found.placeId);
                }
              }
            }}
          />
        )}
      </div>

      {/* Carries the resolved address into FormData so FormCC's `required`
          check can see it (the search input posts under a separate name). */}
      <input
        type="hidden"
        name={identifier}
        value={selectedDomicilio || currentValue || ""}
        readOnly
      />
    </div>
  );
};

export default DomicilioSearchCC;
