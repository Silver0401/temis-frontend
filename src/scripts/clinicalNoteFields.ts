export const EVOLUTION_NOTE_FIELDS = [
  "Habitus",
  "PEEA",
  "Diagnóstico",
  "Tratamiento",
] as const;

export const serializeClinicalNote = (
  fields: readonly string[],
  values: readonly string[],
) => fields.map((field, index) => `${field}:\n${values[index] ?? ""}`).join("\n");

export const parseClinicalNote = (value: string, fields: readonly string[]) => {
  const markers = fields.map((field, index) =>
    index === 0 ? `${field}:\n` : `\n${field}:\n`,
  );
  const positions: number[] = [];
  let cursor = 0;

  for (const [index, marker] of markers.entries()) {
    const position = value.indexOf(marker, cursor);
    if (position < 0 || (index === 0 && position !== 0)) {
      return [value, ...fields.slice(1).map(() => "")];
    }
    positions.push(position);
    cursor = position + marker.length;
  }

  return markers.map((marker, index) => {
    const start = positions[index] + marker.length;
    const end = positions[index + 1] ?? value.length;
    return value.slice(start, end);
  });
};
