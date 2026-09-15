import type { SuiveReport } from "@/e2e/server/FeathersAPI";

const csvCell = (value: unknown) => {
  const text = String(value ?? "");
  const safe = /^[=+@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

export const downloadSuiveCsv = (report: SuiveReport) => {
  const columns: Array<[string, keyof SuiveReport["casos"][number]]> = [
    ["Paciente", "nombrePaciente"],
    ["Fecha de consulta", "fechaConsulta"],
    ["Edad", "edad"],
    ["Sexo", "sexo"],
    ["CIE capturado", "cieCapturado"],
    ["Clave EPI", "epiClave"],
    ["Diagnóstico SUIVE", "diagnosticoSuive"],
    ["Grupo", "grupo"],
    ["Notificación inmediata", "notificacionInmediata"],
    ["Estudio epidemiológico", "estudioEpidemiologico"],
    ["Estudio de brote", "estudioBrote"],
  ];
  const csv = [
    columns.map(([label]) => csvCell(label)).join(","),
    ...report.casos.map((caso) =>
      columns
        .map(([, key]) => {
          const value = caso[key];
          return csvCell(typeof value === "boolean" ? (value ? "Sí" : "No") : value);
        })
        .join(","),
    ),
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `suive-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
