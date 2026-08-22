import React, { useEffect, useState } from "react";
import InputCC from "../Input-CC";
import { useQuery } from "@tanstack/react-query";
import { useGlobalContext } from "@/e2e/globalContext";
import { Get_Afiliaciones } from "@/e2e/server/FeathersAPI";

interface AfiliacionesSearchCCProps {
  onSelect: (data: Afiliacion[]) => void;
  colorSchema?: colorSchemas;
  onClear?: () => void;
  // Pre-checked afiliaciones (e.g. restoring a saved selection).
  initialSelected?: Afiliacion[];
  className?: string;
  identifier?: string;
  title?: string;
}

// Options that mean "no afiliación / unknown". Picking one is exclusive:
// it clears every other option and blocks the rest of the checkboxes.
const EXCLUSIVE_PATTERNS = [
  "NINGUN",
  "IGNORA",
  "DESCONOCE",
  "NO APLICA",
  "ESPECIFICADO",
];

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

const isExclusiveDescripcion = (descripcion: string) => {
  const norm = normalize(descripcion);
  return EXCLUSIVE_PATTERNS.some((p) => norm.includes(p));
};

const AfiliacionesSearchCC: React.FC<AfiliacionesSearchCCProps> = ({
  onClear,
  identifier,
  className,
  onSelect,
  colorSchema,
  initialSelected,
  title,
}) => {
  const { feathersFetchCC } = useGlobalContext();
  // Source of truth for the group: the checked afiliaciones.
  const [selected, setSelected] = useState<Afiliacion[]>(initialSelected ?? []);
  const schema = colorSchema ?? "day";

  const { data, isLoading } = useQuery({
    queryKey: ["catalogo-afiliaciones"],
    queryFn: async () => {
      const req = await Get_Afiliaciones();
      return feathersFetchCC<AfiliacionesResponse[]>(req);
    },
  });

  useEffect(() => {
    onSelect(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const afiliaciones =
    data?.type === "success"
      ? data.data.filter((item) => item.VIGENTE === 1)
      : [];

  const isChecked = (catalogKey: number) =>
    selected.some((a) => a.catalogKey === catalogKey);

  const hasExclusive = selected.some((a) => isExclusiveDescripcion(a.descripcion));
  const hasNormal = selected.some((a) => !isExclusiveDescripcion(a.descripcion));

  // Disable everything except the picked exclusive option; and block exclusive
  // options while a normal afiliación is selected.
  const isDisabled = (item: AfiliacionesResponse) => {
    const exclusive = isExclusiveDescripcion(item["DESCRIPCIÓN CORTA"]);
    if (hasExclusive) return !isChecked(item.CATALOG_KEY);
    if (hasNormal) return exclusive;
    return false;
  };

  const toggle = (item: AfiliacionesResponse, checked: boolean) => {
    const exclusive = isExclusiveDescripcion(item["DESCRIPCIÓN CORTA"]);
    setSelected((prev) => {
      if (checked) {
        if (prev.some((a) => a.catalogKey === item.CATALOG_KEY)) return prev;
        const entry = {
          catalogKey: item.CATALOG_KEY,
          descripcion: item["DESCRIPCIÓN CORTA"],
        };
        // Exclusive pick wins outright: it becomes the only selection.
        if (exclusive) return [entry];
        // Normal pick drops any exclusive option, then adds itself.
        const cleaned = prev.filter(
          (a) => !isExclusiveDescripcion(a.descripcion),
        );
        return [...cleaned, entry];
      }
      return prev.filter((a) => a.catalogKey !== item.CATALOG_KEY);
    });
  };

  return (
    <div
      className={`AfiliacionesCheckGroup AfiliacionesCheckGroup-Schema-${schema} ${
        className ? className : ""
      }`}
      key={identifier}
    >
      {title ? <h4 className="AfiliacionesCheckGroupTitle">{title}</h4> : null}

      {isLoading ? (
        <InputCC
          identifier="loaderInput"
          currentValue="Cargando Afiliaciones ..."
          styles={{ container: { width: "100%" } }}
          colorSchema="night"
          type="text"
          loading
        />
      ) : (
        <ul className="AfiliacionesCheckGroupList">
          {afiliaciones.length === 0 ? (
            <li className="AfiliacionesCheckGroupEmpty">
              No hay afiliaciones para mostrar.
            </li>
          ) : (
            afiliaciones.map((item) => (
              <li className="AfiliacionesCheckGroupItem" key={item.CATALOG_KEY}>
                <InputCC
                  // key includes checked state so external resets (Limpiar)
                  // remount the uncontrolled checkbox in sync.
                  key={`afiliacion-${item.CATALOG_KEY}-${isChecked(
                    item.CATALOG_KEY,
                  )}`}
                  type="checkbox"
                  identifier={`afiliacion-${item.CATALOG_KEY}`}
                  label={item["DESCRIPCIÓN CORTA"]}
                  colorSchema={schema}
                  disabled={isDisabled(item)}
                  initialValue={
                    isChecked(item.CATALOG_KEY) ? "checked" : undefined
                  }
                  onChange={(value) => toggle(item, value === "checked")}
                />
              </li>
            ))
          )}
        </ul>
      )}

      {selected.length > 0 ? (
        <button
          type="button"
          className="AfiliacionesCheckGroupClear"
          onClick={() => {
            setSelected([]);
            onClear && onClear();
          }}
        >
          Limpiar selección
        </button>
      ) : null}

      {/* Carries the selection into FormData so FormCC's `required` check can
          see it (the checkbox group itself never posts a value). */}
      <input
        type="hidden"
        name={identifier}
        value={
          selected.length > 0
            ? selected.map((a) => a.descripcion).join(", ")
            : ""
        }
        readOnly
      />
    </div>
  );
};

export default AfiliacionesSearchCC;
