"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useGlobalContext } from "@/e2e/globalContext";
import {
  Generate_Exchange_File,
  Search_Admin_Patients,
} from "@/e2e/server/FeathersAPI";
import ActionButton from "@/library/Generics/ActionButton";
import LoaderCC from "@/components/Loader-CC";
import { AgeFromBirthdate } from "@/scripts/Generator";

import AdminFilters, {
  AdminFilterState,
  EmptyAdminFilters,
} from "./AdminFilters";
import type { AdminPatientRow, AdminPatientsResponse } from "./adminTypes";

type ExchangeFileBatch = {
  fileContent: string;
  total: number;
  omitted: Array<{ patientId: string; reason: string }>;
};

const PAGE_SIZE = 25;

/** Tope del backend (`MAX_PACIENTES_POR_ARCHIVO` en exchange-file). */
const MAX_EXPORTACION = 500;
/** Tope por petición de admin-console (`MAX_LIMIT`). */
const PASO_EXPORTACION = 100;

const fullName = (row: AdminPatientRow) =>
  [row.names, row.middleName, row.lastName].filter(Boolean).join(" ");

/** Iniciales para el avatar: nombre y primer apellido. */
const initials = (row: AdminPatientRow) =>
  `${row.names?.[0] ?? ""}${row.middleName?.[0] ?? row.lastName?.[0] ?? ""}`.toUpperCase();

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
};

const miles = (n: number) => n.toLocaleString("es-MX");

export default function AdminPatients() {
  const { feathersFetchCC } = useGlobalContext();
  const [draft, setDraft] = useState<AdminFilterState>(EmptyAdminFilters);
  const [applied, setApplied] = useState<AdminFilterState>(EmptyAdminFilters);
  const [page, setPage] = useState(0);
  /**
   * Periodo del archivo de intercambio.
   *
   * Es propio del archivo y no de la búsqueda: el filtro "Registro" se retiró
   * de esta vista por inservible, así que `applied.from`/`applied.to` ya no
   * pueden llenarse. Sin este control, el archivo tomaría siempre la primera
   * consulta histórica de cada paciente mientras el texto prometía un periodo.
   * Vacío significa, y ahora sí dice, "sin acotar".
   */
  const [exportRange, setExportRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });

  const patients = useQuery({
    queryKey: ["admin-patients", applied, page],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await feathersFetchCC<AdminPatientsResponse>(
        await Search_Admin_Patients({
          ...applied,
          $limit: PAGE_SIZE,
          $skip: page * PAGE_SIZE,
        }),
      );
      if (response.type === "error") throw new Error("admin-patients-error");
      return response.data;
    },
  });

  const rows = patients.data?.rows ?? [];
  /**
   * Archivo de intercambio de todos los pacientes que hay en pantalla.
   *
   * El backend arma el `.txt` completo y aquí solo se vuelca a un Blob: así el
   * formato del renglón vive en un único lugar y no hay que replicar la
   * especificación GIIS en el cliente.
   */
  const hayPeriodo = Boolean(exportRange.from || exportRange.to);

  const exchange_file_mutation = useMutation({
    mutationFn: async () => {
      // Se recorre la búsqueda completa, no la página. `rows` son 25 registros;
      // exportar eso con una etiqueta que dice "resultados" entregaría un
      // archivo incompleto que parece correcto. admin-console tope 100 por
      // petición, así que se pagina hasta el límite del backend.
      const patientIds: string[] = [];
      for (let skip = 0; skip < MAX_EXPORTACION; skip += PASO_EXPORTACION) {
        const pagina = await feathersFetchCC<AdminPatientsResponse>(
          await Search_Admin_Patients({
            ...applied,
            $limit: PASO_EXPORTACION,
            $skip: skip,
          }),
        );
        if (pagina.type === "error") throw new Error("admin-patients-error");
        patientIds.push(...pagina.data.rows.map((row) => row._id));
        if (
          pagina.data.rows.length < PASO_EXPORTACION ||
          patientIds.length >= pagina.data.total
        ) {
          break;
        }
      }

      if (!patientIds.length) throw new Error("sin-pacientes");

      const response = await feathersFetchCC<ExchangeFileBatch>(
        await Generate_Exchange_File(patientIds.slice(0, MAX_EXPORTACION), {
          from: exportRange.from,
          to: exportRange.to,
        }),
      );
      if (response.type === "error") throw new Error("exchange-file-error");
      return response.data;
    },
    onSuccess: (data) => {
      if (!data.total) {
        toast.error(
          hayPeriodo
            ? "Ningún paciente de la lista tiene consultas en el periodo"
            : "Ningún paciente de la lista tiene consultas registradas",
        );
        return;
      }

      const blob = new Blob([data.fileContent], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `intercambio-${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(url);

      // Los omitidos se avisan, no se esconden: un archivo con menos renglones
      // de los esperados debe notarse antes de entregarlo.
      if (data.omitted.length) {
        toast.warning(
          `${data.total} pacientes en el archivo · ${data.omitted.length} sin consultas${
            hayPeriodo ? " en el periodo" : " registradas"
          }`,
        );
      } else {
        toast.success(`Archivo generado con ${data.total} pacientes`);
      }
    },
    onError: () => toast.error("No se pudo generar el archivo de intercambio"),
  });


  const total = patients.data?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  // Chips de lo que está filtrando ahora mismo, para no tener que releer la barra.
  const chips: Array<{
    key: keyof AdminFilterState;
    label: string;
    value: string;
  }> = [];
  if (applied.q) chips.push({ key: "q", label: "texto", value: applied.q });
  if (applied.clues)
    chips.push({
      key: "clues",
      label: "CLUES",
      value: applied.clues.split(" - ")[0],
    });
  if (applied.sex)
    chips.push({ key: "sex", label: "sexo", value: applied.sex });
  if (applied.doctorId)
    chips.push({ key: "doctorId", label: "médico", value: "seleccionado" });
  const quitarChip = (key: keyof AdminFilterState) => {
    const limpio: AdminFilterState = { ...applied, [key]: "" };
    setDraft(limpio);
    setApplied(limpio);
    setPage(0);
  };

  return (
    <section className="AdminSectionContainer AdminSearchView">
      <header className="admin-head">
        <div>
          <p className="eyebrow">Administración de plataforma</p>
          <h1>Pacientes</h1>
          <div className="admin-sub">
            Búsqueda en todos los establecimientos
          </div>
        </div>
        <div className="admin-head-actions">
          <div className="admin-export">
            <span className="admin-export-label">
              Periodo del archivo de intercambio
            </span>
            <div className="admin-export-row">
              <input
                type="date"
                aria-label="Desde"
                value={exportRange.from}
                onChange={(event) =>
                  setExportRange((prev) => ({
                    ...prev,
                    from: event.target.value,
                  }))
                }
              />
              <input
                type="date"
                aria-label="Hasta"
                value={exportRange.to}
                onChange={(event) =>
                  setExportRange((prev) => ({ ...prev, to: event.target.value }))
                }
              />
              <ActionButton
                variant="primary"
                disabled={!total || exchange_file_mutation.isPending}
                onClick={() => exchange_file_mutation.mutate()}
              >
                {exchange_file_mutation.isPending
                  ? "Generando…"
                  : `Generar archivo (${miles(Math.min(total, MAX_EXPORTACION))})`}
              </ActionButton>
            </div>
            <small className="admin-export-hint">
              {hayPeriodo
                ? "Primera consulta de cada paciente dentro del periodo."
                : "Sin periodo: se toma la primera consulta registrada de cada paciente."}
              {total > MAX_EXPORTACION
                ? ` Se exportarán los primeros ${miles(MAX_EXPORTACION)} de ${miles(total)}.`
                : ""}
            </small>
          </div>
          <div className="admin-count">
            <b>{miles(total)}</b>
            <span>resultados</span>
          </div>
        </div>
      </header>

      {exchange_file_mutation.isPending ? (
        <div className="admin-exchange-progress" aria-live="polite">
          <span className="admin-exchange-bar" />
          Generando el archivo de intercambio de los {miles(
            Math.min(total, MAX_EXPORTACION),
          )}{" "}
          pacientes de la búsqueda… cada uno se resuelve por separado, puede
          tardar.
        </div>
      ) : null}

      <AdminFilters
        value={draft}
        onChange={setDraft}
        onApply={(value) => {
          setPage(0);
          setApplied(value);
        }}
        showDateRange={false}
      />

      {chips.length ? (
        <div className="admin-chips">
          {chips.map((chip) => (
            <button
              type="button"
              className="admin-chip"
              key={chip.key}
              onClick={() => quitarChip(chip.key)}
            >
              <i>{chip.label}</i>
              <b>{chip.value}</b>
              <span aria-hidden="true">✕</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="admin-results">
        <div className="admin-results-head">
          <span>Paciente</span>
          <span>CURP</span>
          <span>Sexo</span>
          <span>Registro</span>
          <span>Establecimiento</span>
          <span>Médico</span>
        </div>

        <div className="admin-results-body">
          {patients.isPending ? (
            <LoaderCC schema="night" />
          ) : patients.isError ? (
            <p className="admin-empty">No se pudo completar la búsqueda.</p>
          ) : !rows.length ? (
            <p className="admin-empty">
              Ningún paciente coincide con los filtros.
            </p>
          ) : (
            rows.map((row) => (
              <div className="admin-row" key={row._id}>
                <div className="admin-who">
                  <span
                    className="admin-avatar"
                    data-sex={row.sex === "Femenino" ? "f" : "m"}
                  >
                    {initials(row)}
                  </span>
                  <span className="admin-who-name">
                    <b title={fullName(row)}>{fullName(row)}</b>
                    <i>{AgeFromBirthdate(row.birthDate ?? "")}</i>
                  </span>
                </div>
                <span className="admin-mono">{row.curp || "—"}</span>
                <span className="admin-soft">{row.sex || "—"}</span>
                <span className="admin-mono">
                  {formatDate(row.registeredAt)}
                </span>
                <span className="admin-clues" title={row.clues.join(", ")}>
                  {row.clues.join(", ") || "—"}
                </span>
                <span className="admin-soft">
                  {row.doctorName ?? "Sin asignar"}
                </span>
              </div>
            ))
          )}
        </div>

        {total > PAGE_SIZE ? (
          <div className="admin-pager">
            <span>
              Mostrando {page * PAGE_SIZE + 1}–
              {Math.min((page + 1) * PAGE_SIZE, total)} de {miles(total)}
            </span>
            <div className="admin-pager-nav">
              <ActionButton
                size="compact"
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                ‹
              </ActionButton>
              <span>
                Página {page + 1} de {lastPage + 1}
              </span>
              <ActionButton
                size="compact"
                disabled={page >= lastPage}
                onClick={() =>
                  setPage((current) => Math.min(lastPage, current + 1))
                }
              >
                ›
              </ActionButton>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
