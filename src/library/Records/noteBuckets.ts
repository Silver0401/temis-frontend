// Reparto de los documentos del expediente (labs, somas, fármacos, imágenes,
// solicitudes) entre las notas de evolución del paciente.
//
// Cada documento debería traer `recordId` apuntando a la nota en la que se
// capturó, pero los documentos guardados antes de que el frontend empezara a
// mandarlo llegan sin él. En vez de esconderlos, se adoptan: se cuelgan de la
// nota más reciente que sea anterior o igual a su propia fecha de creación
// (la que se deduce del ObjectId), y si no hay ninguna, de la más antigua.

/** Fecha de creación embebida en un ObjectId de Mongo, en milisegundos. */
export const objectIdTimestamp = (id?: string): number => {
  if (!id || !/^[a-f\d]{24}$/i.test(id)) return 0;
  return Number.parseInt(id.slice(0, 8), 16) * 1000;
};

/** Notas de la más reciente a la más antigua. */
export const sortClinicalNotes = (records: MedRecord[] = []): MedRecord[] =>
  records
    .map((record, index) => ({ record, index }))
    .sort(
      (a, b) =>
        objectIdTimestamp(b.record._id) - objectIdTimestamp(a.record._id) ||
        b.index - a.index,
    )
    .map(({ record }) => record);

/** Fecha legible de una nota. */
export const clinicalNoteDate = (record: MedRecord): string => {
  const timestamp = objectIdTimestamp(record._id);
  return timestamp
    ? new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(timestamp)
    : "Fecha no disponible";
};

type WithIds = { _id?: string; recordId?: string };

/**
 * Devuelve los documentos que pertenecen a `noteId`, incluidos los huérfanos
 * (sin `recordId`) que caen en su ventana temporal.
 *
 * `notes` debe venir ordenado de la más reciente a la más antigua.
 */
export const rowsForNote = <T extends WithIds>(
  rows: T[] | undefined,
  noteId: string,
  notes: MedRecord[],
): T[] => {
  if (!rows?.length || !noteId) return [];

  const oldestNoteId = notes[notes.length - 1]?._id;

  return rows.filter((row) => {
    if (row.recordId) return row.recordId === noteId;

    // Huérfano: se adopta por cercanía temporal.
    const rowTime = objectIdTimestamp(row._id);
    const owner =
      notes.find((note) => objectIdTimestamp(note._id) <= rowTime)?._id ??
      oldestNoteId;

    return owner === noteId;
  });
};
