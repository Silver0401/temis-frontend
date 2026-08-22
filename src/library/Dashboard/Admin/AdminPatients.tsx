"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useGlobalContext } from "@/e2e/globalContext";
import { Search_Admin_Patients } from "@/e2e/server/FeathersAPI";
import ActionButton from "@/library/Generics/ActionButton";
import LoaderCC from "@/components/Loader-CC";
import { AgeFromBirthdate } from "@/scripts/Generator";

import AdminFilters, {
  AdminFilterState,
  EmptyAdminFilters,
} from "./AdminFilters";
import type { AdminPatientRow, AdminPatientsResponse } from "./adminTypes";

const PAGE_SIZE = 25;

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
        <div className="admin-count">
          <b>{miles(total)}</b>
          <span>resultados</span>
        </div>
      </header>

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
