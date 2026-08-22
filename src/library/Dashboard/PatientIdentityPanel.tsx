import React, { useMemo, useState } from "react";
import { formatAfiliaciones } from "@/scripts/afiliaciones";
import { AgeTextFromBirthdate } from "@/scripts/Generator";

interface PatientIdentityPanelProps {
  identification: PatientIdentification;
}

type IdRow = { label: string; value: string };

const resolveDomicile = (id: PatientIdentification): string => {
  if (id.domicilioLocalizacion) {
    return [
      id.domicilioLocalizacion.calle,
      id.domicilioLocalizacion.colonia,
      id.domicilioLocalizacion.localidad?.nombre,
      id.domicilioLocalizacion.municipio?.nombre,
      id.domicilioLocalizacion.estado?.nombre,
      id.domicilioLocalizacion.pais?.nombre,
    ]
      .filter(Boolean)
      .join(", ");
  }
  return id.domicile ?? "";
};

const getInitials = (id: PatientIdentification): string => {
  const first = id.names?.trim()?.[0] ?? "";
  const last = (id.lastName || id.middleName)?.trim()?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "P";
};

// GIIS-B015-04-11 campos 18-19: etiquetas humanas para los valores del catálogo.
// -1 (se desconoce) se trata como "sin dato" para que la fila desaparezca sola.
const SI_NO_LABELS: Record<number, string> = {
  0: "No",
  1: "Sí",
  2: "No responde",
  3: "No sabe",
};

// GIIS campo 20: condición migratoria
const MIGRANTE_LABELS: Record<number, string> = {
  0: "No",
  1: "Nacional",
  2: "Internacional",
  3: "Retornado",
};

const labelFor = (
  value: number | undefined,
  labels: Record<number, string>,
): string => (value === undefined || value === -1 ? "" : (labels[value] ?? ""));

// GIIS campo 21: solo se muestra cuando hay migración internacional; no se
// cuenta con el nombre del país en PatientIdentification, solo su catalogKey.
const paisProcedenciaLabel = (id: PatientIdentification): string => {
  if (id.migrante !== 2 || id.paisProcedencia === undefined) return "";
  return `Clave de catálogo ${id.paisProcedencia}`;
};

const PatientIdentityPanel: React.FC<PatientIdentityPanelProps> = ({
  identification: id,
}) => {
  const [open, setOpen] = useState(false);

  const fullName =
    [id.names, id.middleName, id.lastName]
      .map((s) => s?.trim())
      .filter(Boolean)
      .join(" ") || "Paciente sin nombre";

  const rows = useMemo((): IdRow[] => {
    const sexLabel = id.sex;
    const candidates: IdRow[] = [
      { label: "Sexo", value: sexLabel },
      // Edad exacta (años, meses y días) calculada de la fecha de nacimiento.
      { label: "Edad", value: AgeTextFromBirthdate(id.birthDate ?? "") },
      { label: "Fecha de nacimiento", value: id.birthDate ?? "" },
      { label: "Lugar de nacimiento", value: id.birthPlace ?? "" },
      { label: "Domicilio", value: resolveDomicile(id) },
      { label: "Género", value: id.genre ?? "" },
      {
        label: "Derechohabiencia",
        value: formatAfiliaciones(id.derechohabiencia),
      },
      { label: "Teléfono", value: id.tel ?? "" },
      { label: "Estado civil", value: id.estadoCivil ?? "" },
      { label: "Ocupación", value: id.ocupacion ?? "" },
      { label: "Escolaridad", value: id.escolaridad ?? "" },
      {
        label: "¿Se autodenomina afromexicano?",
        value: labelFor(id.seAutodenominaAfromexicano, SI_NO_LABELS),
      },
      {
        label: "¿Se considera indígena?",
        value: labelFor(id.seConsideraIndigena, SI_NO_LABELS),
      },
      {
        label: "Condición migratoria",
        value: labelFor(id.migrante, MIGRANTE_LABELS),
      },
      { label: "País de procedencia", value: paisProcedenciaLabel(id) },
    ];
    return candidates.filter((r) => r.value.trim().length > 0);
  }, [id]);

  return (
    <aside
      className="PatientIdPanel"
      data-open={open}
      aria-label="Datos de identificación del paciente"
    >
      <button
        type="button"
        className="PatientIdPanel__head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="PatientIdPanel__avatar" data-sex={id.sex}>
          {getInitials(id)}
        </div>
        <div className="PatientIdPanel__ident">
          <h3 className="PatientIdPanel__name">{fullName}</h3>
          {id.curp ? (
            <span className="PatientIdPanel__curp">{id.curp}</span>
          ) : null}
        </div>
        <svg
          className="PatientIdPanel__chevron"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>

      <div className="PatientIdPanel__drawer">
        <dl className="PatientIdPanel__grid">
          {rows.map((row) => (
            <div className="PatientIdPanel__row" key={row.label}>
              <dt className="PatientIdPanel__label">{row.label}</dt>
              <dd className="PatientIdPanel__value">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
};

export default PatientIdentityPanel;
