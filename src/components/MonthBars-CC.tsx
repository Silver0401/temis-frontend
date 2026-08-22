"use client";

import { useState } from "react";

const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

/**
 * Consultas por mes del año, con el mes seleccionado resaltado.
 *
 * Es una gráfica de énfasis, no categórica: un solo tono para el mes que
 * importa y gris para el resto. Doce colores distintos no dirían nada — el
 * lector solo tiene que ubicar un mes contra los demás.
 */
const MonthBarsCC: React.FC<{
  /** Doce valores, de enero a diciembre. */
  data: Array<{ month: number; count: number }>;
  /** Mes a resaltar, 1-12. */
  highlight?: number;
}> = ({ data, highlight }) => {
  const [activo, setActivo] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="MonthBarsCC">
      <div className="month-bars-plot">
        {data.map((d) => {
          const esActual = d.month === highlight;
          const altura = (d.count / max) * 100;
          return (
            <div
              key={d.month}
              className="month-bar"
              data-current={esActual}
              onMouseEnter={() => setActivo(d.month)}
              onMouseLeave={() => setActivo(null)}
            >
              {/* Todos los valores visibles: son doce números, no hay ruido
                  que ahorrar, y obligar al hover esconde la mitad del dato. */}
              <span
                className="month-bar-value"
                data-strong={activo === d.month || esActual}
              >
                {d.count.toLocaleString("es-MX")}
              </span>
              <span
                className="month-bar-fill"
                style={{ height: `${Math.max(altura, d.count > 0 ? 2 : 0)}%` }}
              />
              <span className="month-bar-label">{MESES[d.month - 1]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthBarsCC;
