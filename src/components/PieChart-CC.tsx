"use client";

import { useMemo, useState } from "react";
import { Group } from "@visx/group";
import { Pie } from "@visx/shape";

import {
  ADMIN_SERIES,
  ADMIN_OTHER,
} from "@/library/Dashboard/Admin/adminPalette";

export interface PieDatum {
  label: string;
  /** Texto secundario del tooltip y la leyenda (ej. la clave CIE). */
  hint?: string;
  value: number;
}

/** Un pastel deja de leerse pasando de seis gajos. */
const MAX_GAJOS = 6;

/** Agrupa la cola en "Otros" en vez de inventar colores. */
export const foldIntoOther = (
  rows: PieDatum[],
  max: number = MAX_GAJOS,
): PieDatum[] => {
  if (rows.length <= max) return rows;
  const cabeza = rows.slice(0, max - 1);
  const cola = rows.slice(max - 1);
  return [
    ...cabeza,
    {
      label: "Otros",
      hint: `${cola.length} más`,
      value: cola.reduce((total, row) => total + row.value, 0),
    },
  ];
};

const PieChartCC: React.FC<{
  data: PieDatum[];
  size?: number;
}> = ({ data, size = 188 }) => {
  const [activo, setActivo] = useState<string | null>(null);

  const rows = useMemo(() => foldIntoOther(data), [data]);
  const total = useMemo(
    () => rows.reduce((suma, row) => suma + row.value, 0),
    [rows],
  );

  if (!total) return <p className="admin-empty">Sin datos en el periodo.</p>;

  const radio = size / 2;
  const porcentaje = (valor: number) => ((valor / total) * 100).toFixed(1);
  const colorDe = (label: string) => {
    const index = rows.findIndex((row) => row.label === label);
    return label === "Otros"
      ? ADMIN_OTHER
      : ADMIN_SERIES[index % ADMIN_SERIES.length];
  };

  const activoRow = rows.find((row) => row.label === activo);

  return (
    <div className="PieChartCC">
      <div className="pie-donut">
        <svg width={size} height={size} role="img">
          <Group top={radio} left={radio}>
            <Pie
              data={rows}
              pieValue={(row) => row.value}
              outerRadius={radio - 2}
              // Anillo en vez de disco: deja sitio al total y evita comparar
              // ángulos con vértice común, que es lo que peor se lee de un pastel.
              innerRadius={radio * 0.58}
              padAngle={0.012}
            >
              {(pie) =>
                pie.arcs.map((arc) => {
                  const { label } = arc.data;
                  const atenuado = activo !== null && activo !== label;
                  return (
                    <g key={label}>
                      <path
                        d={pie.path(arc) ?? undefined}
                        fill={colorDe(label)}
                        opacity={atenuado ? 0.35 : 1}
                        onMouseEnter={() => setActivo(label)}
                        onMouseLeave={() => setActivo(null)}
                      />
                    </g>
                  );
                })
              }
            </Pie>
          </Group>
        </svg>

        {/* El total (o el porcentaje del gajo activo) va en HTML, no en <text>:
            así hereda tipografía y tokens de color como el resto de la app. */}
        <div className="pie-center">
          <b>{activoRow ? `${porcentaje(activoRow.value)}%` : total}</b>
          <span>{activoRow ? activoRow.label : "total"}</span>
        </div>

        {activoRow ? (
          <div className="pie-tip">
            <b>
              {activoRow.hint ? `${activoRow.hint} · ` : ""}
              {activoRow.label}
            </b>
            <span>
              {activoRow.value} · {porcentaje(activoRow.value)}%
            </span>
          </div>
        ) : null}
      </div>

      {/* La leyenda lleva el valor y el porcentaje: la identidad nunca depende
          solo del color, y en claro estos tonos no alcanzan 3:1 contra el fondo. */}
      <ul className="pie-legend">
        {rows.map((row) => (
          <li
            key={row.label}
            data-muted={activo !== null && activo !== row.label}
            onMouseEnter={() => setActivo(row.label)}
            onMouseLeave={() => setActivo(null)}
          >
            <span
              className="pie-swatch"
              style={{ background: colorDe(row.label) }}
            />
            <span className="pie-legend-label" title={row.hint ?? row.label}>
              {row.label}
            </span>
            <strong>{row.value}</strong>
            <em>{porcentaje(row.value)}%</em>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PieChartCC;
