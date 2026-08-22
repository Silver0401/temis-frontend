"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useGlobalContext } from "@/e2e/globalContext";
import { Get_Admin_Stats } from "@/e2e/server/FeathersAPI";
import LoaderCC from "@/components/Loader-CC";
import PieChartCC from "@/components/PieChart-CC";
import MonthBarsCC from "@/components/MonthBars-CC";

import AdminFilters, {
  AdminFilterState,
  EmptyAdminFilters,
  currentMonth,
  monthRange,
} from "./AdminFilters";
import type { AdminStatsResponse } from "./adminTypes";

const NOMBRE_MES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Arranca en el mes en curso: el tablero es la foto de este mes. */
const filtrosIniciales = (): AdminFilterState => {
  const mes = currentMonth();
  return { ...EmptyAdminFilters, month: mes, ...monthRange(mes) };
};

const miles = (n: number) => n.toLocaleString("es-MX");

/** Seis barritas de contexto. Es adorno de apoyo, no una serie que se lea. */
const Spark: React.FC<{ seed: number }> = ({ seed }) => (
  <span className="metric-spark" aria-hidden="true">
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <i key={i} style={{ height: `${30 + ((seed * (i + 3) * 17) % 65)}%` }} />
    ))}
  </span>
);

export default function AdminStats() {
  const { feathersFetchCC } = useGlobalContext();
  const [draft, setDraft] = useState<AdminFilterState>(filtrosIniciales);
  const [applied, setApplied] = useState<AdminFilterState>(filtrosIniciales);

  const stats = useQuery({
    queryKey: ["admin-stats", applied],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await feathersFetchCC<AdminStatsResponse>(
        await Get_Admin_Stats({
          from: applied.from,
          to: applied.to,
          doctorId: applied.doctorId,
          clues: applied.clues,
        }),
      );
      if (response.type === "error") throw new Error("admin-stats-error");
      return response.data;
    },
  });

  const [year, month] = applied.month.split("-").map(Number);
  const etiquetaMes = NOMBRE_MES[(month || 1) - 1];
  const mesPrevio = NOMBRE_MES[((month || 1) + 10) % 12];

  const alcance = [
    applied.clues
      ? applied.clues.split(" - ")[0]
      : "Todos los establecimientos",
    applied.doctorId ? "Un médico" : "Todos los médicos",
  ].join(" · ");

  const previo = stats.data?.previousMonthConsultas ?? null;
  const actual = stats.data?.totals.consultas ?? 0;
  const delta =
    previo !== null && previo > 0
      ? Math.round(((actual - previo) / previo) * 100)
      : null;

  return (
    <section className="AdminSectionContainer AdminDashboard">
      <header className="admin-head">
        <div>
          <p className="eyebrow">Administración de plataforma</p>
          <h1>Panorama de {etiquetaMes}</h1>
          <div className="admin-sub">{alcance}</div>
        </div>
        <div className="admin-live">
          <span className="admin-dot" />
          Mes en curso, detectado automáticamente
        </div>
      </header>

      <AdminFilters
        value={draft}
        onChange={setDraft}
        onApply={setApplied}
        showSearch={false}
        showSex={false}
        showMonth
      />

      {stats.isPending ? (
        <LoaderCC schema="night" />
      ) : stats.isError || !stats.data ? (
        <p className="admin-empty">No se pudieron calcular las estadísticas.</p>
      ) : (
        <>
          <div className="admin-hero">
            <div className="admin-hero-main">
              <div className="label">Consultas en {etiquetaMes}</div>
              <div className="big">{miles(actual)}</div>
              <div className="delta">
                {delta !== null ? (
                  <>
                    <i data-up={delta >= 0}>
                      {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
                    </i>{" "}
                    contra {mesPrevio} ({miles(previo ?? 0)})
                  </>
                ) : (
                  <>Sin consultas en {mesPrevio} para comparar</>
                )}
              </div>
            </div>

            <div className="admin-hero-side">
              <article>
                <div className="k">Consultas</div>
                <div className="v">{miles(actual)}</div>
                <Spark seed={1} />
              </article>
              <article>
                <div className="k">Pacientes</div>
                <div className="v">{miles(stats.data.totals.pacientes)}</div>
                <Spark seed={2} />
              </article>
              <article>
                <div className="k">Recetas</div>
                <div className="v">{miles(stats.data.totals.recetas)}</div>
                <Spark seed={5} />
              </article>
              <article>
                <div className="k">Medicamentos</div>
                <div className="v">
                  {miles(stats.data.totals.farmacosRecetados)}
                </div>
                <Spark seed={4} />
              </article>
              <article>
                <div className="k">Solicitudes</div>
                <div className="v">{miles(stats.data.totals.solicitudes)}</div>
                <Spark seed={3} />
              </article>
              <article>
                <div className="k">Somatometrías</div>
                <div className="v">
                  {miles(stats.data.totals.somatometrias)}
                </div>
                <Spark seed={7} />
              </article>
            </div>
          </div>

          <div className="admin-pies">
            <article className="admin-chart">
              <h2>Fármacos recetados</h2>
              <p className="admin-chart-sub">
                {miles(stats.data.totals.farmacosRecetados)} medicamentos en{" "}
                {miles(stats.data.totals.recetas)} recetas
              </p>
              <PieChartCC
                data={stats.data.drugs.map((row) => ({
                  label: row.name,
                  value: row.count,
                }))}
              />
            </article>

            <article className="admin-chart">
              <h2>Diagnósticos CIE-10</h2>
              <p className="admin-chart-sub">
                {stats.data.diagnoses.length} claves distintas en el mes
              </p>
              <PieChartCC
                data={stats.data.diagnoses.map((row) => ({
                  label: row.name,
                  hint: row.cie,
                  value: row.count,
                }))}
              />
            </article>
          </div>

          <article className="admin-chart admin-year">
            <div className="admin-year-head">
              <div>
                <h2>Consultas por mes</h2>
                <p className="admin-chart-sub">
                  El mes seleccionado va resaltado, el resto es contexto
                </p>
              </div>
              <div className="admin-year-total">
                <b>
                  {miles(
                    stats.data.months.reduce((suma, m) => suma + m.count, 0),
                  )}
                </b>
                <span>consultas en {year || stats.data.anio}</span>
              </div>
            </div>
            <MonthBarsCC data={stats.data.months} highlight={month} />
          </article>
        </>
      )}
    </section>
  );
}
