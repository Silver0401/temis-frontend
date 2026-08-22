"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useGlobalContext } from "@/e2e/globalContext";
import { Get_Admin_Agendas } from "@/e2e/server/FeathersAPI";
import LoaderCC from "@/components/Loader-CC";

import AdminFilters, {
  AdminFilterState,
  EmptyAdminFilters,
  currentMonth,
  monthRange,
} from "./AdminFilters";
import { seriesColor } from "./adminPalette";
import type { AdminAgendasResponse, AdminAppointment } from "./adminTypes";

const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const filtrosIniciales = (): AdminFilterState => {
  const mes = currentMonth();
  return { ...EmptyAdminFilters, month: mes, ...monthRange(mes) };
};

const hora = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "--:--"
    : date.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
};

/** Clave "aaaa-mm-dd" local, para agrupar citas por día sin cruzar zonas. */
const claveDia = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

/**
 * Rejilla del mes, siempre semanas completas de lunes a domingo. Los días
 * fuera del mes se pintan atenuados en vez de dejar huecos.
 */
const construirRejilla = (year: number, month: number) => {
  const primero = new Date(year, month - 1, 1);
  // getDay() da 0 el domingo; aquí la semana arranca en lunes.
  const desplazamiento = (primero.getDay() + 6) % 7;
  const inicio = new Date(year, month - 1, 1 - desplazamiento);

  return Array.from({ length: 42 }, (_, i) => {
    const fecha = new Date(
      inicio.getFullYear(),
      inicio.getMonth(),
      inicio.getDate() + i,
    );
    return { fecha, delMes: fecha.getMonth() === month - 1 };
  });
};

export default function AdminAgendas() {
  const { feathersFetchCC } = useGlobalContext();
  const [draft, setDraft] = useState<AdminFilterState>(filtrosIniciales);
  const [applied, setApplied] = useState<AdminFilterState>(filtrosIniciales);
  const [diaSel, setDiaSel] = useState<string | null>(null);

  const agendas = useQuery({
    queryKey: ["admin-agendas", applied],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await feathersFetchCC<AdminAgendasResponse>(
        await Get_Admin_Agendas({
          doctorId: applied.doctorId,
          clues: applied.clues,
          from: applied.from,
          to: applied.to,
        }),
      );
      if (response.type === "error") throw new Error("admin-agendas-error");
      return response.data;
    },
  });

  const [year, month] = applied.month.split("-").map(Number);
  const rows = useMemo(() => agendas.data?.data ?? [], [agendas.data]);
  const doctors = useMemo(() => agendas.data?.doctors ?? [], [agendas.data]);

  /** Color estable por médico: sigue al dueño, no al orden del resultado. */
  const colorMedico = useMemo(() => {
    const mapa = new Map<string, string>();
    doctors.forEach((doctor, index) =>
      mapa.set(doctor._id, seriesColor(index)),
    );
    return mapa;
  }, [doctors]);

  const porDia = useMemo(() => {
    const mapa = new Map<string, AdminAppointment[]>();
    rows.forEach((cita) => {
      const fecha = new Date(cita.startDate);
      if (Number.isNaN(fecha.getTime())) return;
      const clave = claveDia(fecha);
      mapa.set(clave, [...(mapa.get(clave) ?? []), cita]);
    });
    return mapa;
  }, [rows]);

  const rejilla = useMemo(
    () => construirRejilla(year || new Date().getFullYear(), month || 1),
    [year, month],
  );

  // Sin selección explícita, se muestra el primer día del mes que tenga citas.
  const primerDiaConCitas = rejilla.find(
    (celda) => celda.delMes && porDia.has(claveDia(celda.fecha)),
  );
  const diaActivo =
    diaSel ?? (primerDiaConCitas ? claveDia(primerDiaConCitas.fecha) : null);

  const citasDelDia = diaActivo ? (porDia.get(diaActivo) ?? []) : [];
  const hoy = claveDia(new Date());

  return (
    <section className="AdminSectionContainer AdminSearchView">
      <header className="admin-head">
        <div>
          <p className="eyebrow">Administración de plataforma</p>
          <h1>Agendas</h1>
          <div className="admin-sub">
            {applied.clues
              ? `${applied.clues.split(" - ")[0]} · `
              : "Todos los establecimientos · "}
            {doctors.length} médicos con agenda
          </div>
        </div>
        <div className="admin-count">
          <b>{rows.length}</b>
          <span>citas en {MESES[(month || 1) - 1].toLowerCase()}</span>
        </div>
      </header>

      <AdminFilters
        value={draft}
        onChange={setDraft}
        onApply={(value) => {
          setDiaSel(null);
          setApplied(value);
        }}
        showSearch={false}
        showSex={false}
        showMonth
      />

      {agendas.isPending ? (
        <LoaderCC schema="night" />
      ) : agendas.isError ? (
        <p className="admin-empty">No se pudieron cargar las agendas.</p>
      ) : (
        <div className="admin-agenda-layout">
          <div className="admin-calendar">
            <div className="admin-calendar-head">
              <h2>
                {MESES[(month || 1) - 1]} {year}
              </h2>
            </div>

            <div className="admin-dow">
              {DOW.map((dia) => (
                <span key={dia}>{dia}</span>
              ))}
            </div>

            <div className="admin-cal-grid">
              {rejilla.map(({ fecha, delMes }) => {
                const clave = claveDia(fecha);
                const citas = porDia.get(clave) ?? [];
                return (
                  <button
                    type="button"
                    key={clave}
                    className="admin-day"
                    data-out={!delMes}
                    data-today={clave === hoy}
                    data-sel={clave === diaActivo}
                    onClick={() => setDiaSel(clave)}
                  >
                    <span className="admin-day-n">{fecha.getDate()}</span>
                    {citas.slice(0, 3).map((cita) => (
                      <span
                        key={cita.id}
                        className="admin-ev"
                        style={{
                          background:
                            colorMedico.get(cita.doctorId) ?? seriesColor(0),
                        }}
                        title={`${hora(cita.startDate)} · ${cita.patientName} · ${cita.doctorName}`}
                      >
                        {hora(cita.startDate)} {cita.patientName}
                      </span>
                    ))}
                    {citas.length > 3 ? (
                      <span className="admin-more">
                        +{citas.length - 3} más
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {doctors.length ? (
              <div className="admin-doc-legend">
                {doctors.map((doctor) => (
                  <span key={doctor._id}>
                    <i style={{ background: colorMedico.get(doctor._id) }} />
                    {doctor.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <aside className="admin-agenda-side">
            <div className="admin-side-head">
              <span className="t">
                {diaActivo
                  ? new Date(`${diaActivo}T12:00:00`).toLocaleDateString(
                      "es-MX",
                      { weekday: "long", day: "numeric" },
                    )
                  : "Sin día seleccionado"}
              </span>
              <span className="b">{citasDelDia.length} citas</span>
            </div>

            <div className="admin-appt-list">
              {citasDelDia.length ? (
                citasDelDia
                  .slice()
                  .sort((a, b) => a.startDate.localeCompare(b.startDate))
                  .map((cita) => (
                    <article className="admin-appt" key={cita.id}>
                      <span
                        className="admin-appt-bar"
                        style={{
                          background:
                            colorMedico.get(cita.doctorId) ?? seriesColor(0),
                        }}
                      />
                      <span className="admin-appt-hr">
                        {hora(cita.startDate)}
                      </span>
                      <span className="admin-appt-info">
                        <b>{cita.patientName}</b>
                        <i>{cita.doctorName}</i>
                      </span>
                    </article>
                  ))
              ) : (
                <p className="admin-empty">Sin citas este día</p>
              )}
            </div>

            <p className="admin-readonly">
              Vista de solo lectura — la administración consulta agendas, no las
              modifica.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}
