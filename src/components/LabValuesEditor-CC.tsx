"use client";

import React, { useState } from "react";
import ButtonCC from "./Button-CC";
import IconsCC from "@/assets/icons/IconsCC";
import { LabCatalog, LabCatalogByFullName } from "@/scripts/LabCatalog";

export interface LabValueRow {
  fullName: string;
  abreviation: string;
  unit: string;
  value: string;
}

interface LabValuesEditorProps {
  values: LabValueRow[];
  onChange: (values: LabValueRow[]) => void;
  colorSchema?: colorSchemas;
}

const EmptyRow: LabValueRow = {
  fullName: "",
  abreviation: "",
  unit: "",
  value: "",
};

/**
 * Captura de resultados de laboratorio, un renglón por parámetro.
 *
 * Sustituye al textarea que se mandaba a un modelo de lenguaje para que lo
 * "organizara": el médico elige el estudio del catálogo (que ya trae abreviación
 * y unidad) o escribe uno propio, y sólo teclea el valor.
 */
const LabValuesEditorCC: React.FC<LabValuesEditorProps> = ({
  values,
  onChange,
  colorSchema,
}) => {
  const [rows, setRows] = useState<LabValueRow[]>(
    values.length ? values : [{ ...EmptyRow }],
  );

  const push = (next: LabValueRow[]) => {
    setRows(next);
    onChange(next.filter((r) => r.fullName.trim() && r.value.trim()));
  };

  const patchRow = (index: number, patch: Partial<LabValueRow>) =>
    push(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const pickCatalogEntry = (index: number, fullName: string) => {
    const entry = LabCatalogByFullName[fullName];
    patchRow(index, {
      fullName,
      abreviation: entry ? entry.abbreviation : rows[index].abreviation,
      unit: entry ? entry.unit : rows[index].unit,
    });
  };

  return (
    <div className={`LabValuesEditorCC ${colorSchema ?? ""}`}>
      <datalist id="LabCatalogOptions">
        {LabCatalog.map((entry) => (
          <option key={entry.key} value={entry.fullName}>
            {entry.name} ({entry.abbreviation})
          </option>
        ))}
      </datalist>

      {rows.map((row, index) => (
        <div className="labValueRow" key={index}>
          <input
            className="labValueName"
            list="LabCatalogOptions"
            placeholder="Estudio"
            value={row.fullName}
            onChange={(e) => pickCatalogEntry(index, e.target.value)}
          />
          <input
            className="labValueAbbr"
            placeholder="Abrev."
            value={row.abreviation}
            onChange={(e) => patchRow(index, { abreviation: e.target.value })}
          />
          <input
            className="labValueValue"
            placeholder="Valor"
            value={row.value}
            onChange={(e) => patchRow(index, { value: e.target.value })}
          />
          <input
            className="labValueUnit"
            placeholder="Unidad"
            value={row.unit}
            onChange={(e) => patchRow(index, { unit: e.target.value })}
          />
          <button
            type="button"
            className="labValueRemove"
            aria-label="Quitar resultado"
            disabled={rows.length === 1}
            onClick={() => push(rows.filter((_, i) => i !== index))}
          >
            {IconsCC.Trash}
          </button>
        </div>
      ))}

      <ButtonCC
        type="Phantom"
        text="Agregar resultado"
        classname="AddLabRowButton"
        icon={IconsCC.Check}
        onClick={() => push([...rows, { ...EmptyRow }])}
      />
    </div>
  );
};

export default LabValuesEditorCC;
