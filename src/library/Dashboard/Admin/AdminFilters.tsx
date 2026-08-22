"use client";

import EstablecimientosSearchCC from "@/components/SearchInputs/EstablecimientosSearch-CC";
import ActionButton from "@/library/Generics/ActionButton";

import { useAdminDoctors } from "./useAdminDoctors";

export type AdminFilterState = {
  q: string;
  sex: string;
  /** Solo en modo mes: "aaaa-mm". `from`/`to` se derivan de él. */
  month: string;
  from: string;
  to: string;
  doctorId: string;
  clues: string;
};

export const EmptyAdminFilters: AdminFilterState = {
  q: "",
  sex: "",
  month: "",
  from: "",
  to: "",
  doctorId: "",
  clues: "",
};

/** Primer y último día del mes de un valor "aaaa-mm". */
export const monthRange = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber) return { from: "", to: "" };
  const ultimo = new Date(year, monthNumber, 0).getDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(ultimo).padStart(2, "0")}`,
  };
};

/** El mes en curso, en formato "aaaa-mm". */
export const currentMonth = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
};

const MESES_CORTOS = [
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

/** Desplaza un "aaaa-mm" en N meses, cruzando el año cuando toca. */
export const shiftMonth = (month: string, delta: number) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const fecha = new Date(year, monthNumber - 1 + delta, 1);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
};

/** Los cuatro meses visibles: dos antes, el elegido y el siguiente. */
const monthWindow = (month: string) =>
  [-2, -1, 0, 1].map((delta) => shiftMonth(month, delta));

/**
 * Barra de filtros compartida por Pacientes, Estadísticas y Agendas.
 * `showSearch` apaga el campo de nombre/CURP donde no aplica y `showMonth`
 * cambia el par de fechas por un selector de mes, que es como se lee el tablero.
 */
const AdminFilters: React.FC<{
  value: AdminFilterState;
  onChange: (value: AdminFilterState) => void;
  onApply: (value: AdminFilterState) => void;
  showSearch?: boolean;
  showSex?: boolean;
  showMonth?: boolean;
  /** Etiqueta del conmutador de meses ("Mes", "Registro"…). */
  monthLabel?: string;
  searchPlaceholder?: string;
}> = ({
  value,
  onChange,
  onApply,
  showSearch = true,
  showSex = true,
  showMonth = false,
  monthLabel,
  searchPlaceholder = "Nombre o CURP",
}) => {
  const doctors = useAdminDoctors();
  const set = (patch: Partial<AdminFilterState>) =>
    onChange({ ...value, ...patch });

  // Cambiar de mes aplica al instante: es navegación, no un filtro que se
  // redacta y luego se confirma.
  const aplicarMes = (month: string) => {
    const nuevo = { ...value, month, ...monthRange(month) };
    onChange(nuevo);
    onApply(nuevo);
  };

  return (
    <form
      className="admin-filters"
      onSubmit={(event) => {
        event.preventDefault();
        onApply(value);
      }}
    >
      {showSearch ? (
        <div className="admin-search-row">
          <label className="admin-filter admin-filter-main">
            <span>Buscar</span>
            <div className="admin-search-box">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M11 2a9 9 0 105.6 16.1l4.2 4.2 1.4-1.4-4.2-4.2A9 9 0 0011 2zm0 2a7 7 0 110 14 7 7 0 010-14z" />
              </svg>
              <input
                type="search"
                value={value.q}
                placeholder={searchPlaceholder}
                onChange={(event) => set({ q: event.target.value })}
              />
            </div>
          </label>
          <ActionButton
            type="submit"
            variant="primary"
            className="admin-search-btn"
          >
            Buscar
          </ActionButton>
        </div>
      ) : null}

      {showMonth ? (
        <div className="admin-filter admin-filter-months">
          <span>{monthLabel ?? "Mes"}</span>
          {/* Conmutador y no `input type=month`: el control nativo se ve como un
              formulario de banco y aquí solo hay que saltar entre meses vecinos. */}
          <div className="month-switch">
            <button
              type="button"
              className="month-step"
              aria-label="Mes anterior"
              onClick={() => aplicarMes(shiftMonth(value.month, -1))}
            >
              ‹
            </button>
            {monthWindow(value.month).map((mes) => (
              <button
                type="button"
                key={mes}
                data-on={mes === value.month}
                onClick={() => aplicarMes(mes)}
              >
                {MESES_CORTOS[Number(mes.split("-")[1]) - 1]}
              </button>
            ))}
            <button
              type="button"
              className="month-step"
              aria-label="Mes siguiente"
              onClick={() => aplicarMes(shiftMonth(value.month, 1))}
            >
              ›
            </button>
          </div>
        </div>
      ) : (
        <>
          <label className="admin-filter">
            <span>Desde</span>
            <input
              type="date"
              value={value.from}
              onChange={(event) => set({ from: event.target.value })}
            />
          </label>

          <label className="admin-filter">
            <span>Hasta</span>
            <input
              type="date"
              value={value.to}
              onChange={(event) => set({ to: event.target.value })}
            />
          </label>
        </>
      )}

      {showSex ? (
        <label className="admin-filter">
          <span>Sexo</span>
          <select
            value={value.sex}
            onChange={(event) => set({ sex: event.target.value })}
          >
            <option value="">Todos</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Intersexual">Intersexual</option>
          </select>
        </label>
      ) : null}

      <label className="admin-filter">
        <span>Médico</span>
        <select
          value={value.doctorId}
          onChange={(event) => set({ doctorId: event.target.value })}
        >
          <option value="">Todos</option>
          {(doctors.data ?? []).map((doctor) => (
            <option key={doctor._id} value={doctor._id}>
              {doctor.name}
            </option>
          ))}
        </select>
      </label>

      <div className="admin-filter admin-filter-clues">
        <span>Establecimiento (CLUES)</span>
        <EstablecimientosSearchCC
          identifier="AdminCluesFilter"
          placeholder="Clave o nombre de la unidad"
          currentValue={value.clues}
          onSelect={(clues) => set({ clues })}
          onClear={() => set({ clues: "" })}
        />
      </div>

      <div className="admin-filter-actions">
        {showSearch ? null : (
          <ActionButton type="submit" variant="primary">
            Aplicar
          </ActionButton>
        )}
        <ActionButton
          onClick={() => {
            // En modo mes, limpiar devuelve al mes en curso: dejarlo en blanco
            // consultaría el histórico completo, que no es lo que el tablero es.
            const mes = currentMonth();
            const reset = showMonth
              ? { ...EmptyAdminFilters, month: mes, ...monthRange(mes) }
              : EmptyAdminFilters;
            onChange(reset);
            onApply(reset);
          }}
        >
          Limpiar
        </ActionButton>
      </div>
    </form>
  );
};

export default AdminFilters;
