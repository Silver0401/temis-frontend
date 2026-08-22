// Helpers to render/parse the multi-value `derechohabiencia` (Afiliacion[]).
// Tolerant of legacy records that stored it as a single string.

export const formatAfiliaciones = (
  d: Afiliacion[] | string | undefined | null,
): string => {
  if (!d) return "";
  if (typeof d === "string") return d;
  return d
    .map((a) => a.descripcion)
    .filter(Boolean)
    .join(", ");
};

// Wraps a free-text value (e.g. AI-extracted) into Afiliacion[] entries with
// catalogKey 0 (not from the GIIS catalog). Splits on commas.
export const stringToAfiliaciones = (
  value: string | undefined | null,
): Afiliacion[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((descripcion) => ({ catalogKey: 0, descripcion }));
};
