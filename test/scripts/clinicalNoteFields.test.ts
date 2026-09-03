import assert from "node:assert/strict";
import test from "node:test";
import {
  EVOLUTION_NOTE_FIELDS,
  parseClinicalNote,
  serializeClinicalNote,
} from "../../src/scripts/clinicalNoteFields.ts";

test("serializa y recupera los cuatro campos sin cambiar el contrato string", () => {
  const values = ["Alerta", "Dolor de 2 días", "Migraña", "Analgésico"];
  const note = serializeClinicalNote(EVOLUTION_NOTE_FIELDS, values);

  assert.equal(
    note,
    "Habitus:\nAlerta\nPEEA:\nDolor de 2 días\nDiagnóstico:\nMigraña\nTratamiento:\nAnalgésico",
  );
  assert.deepEqual(parseClinicalNote(note, EVOLUTION_NOTE_FIELDS), values);
});

test("coloca una nota legacy completa en Habitus", () => {
  assert.deepEqual(parseClinicalNote("Texto libre anterior", EVOLUTION_NOTE_FIELDS), [
    "Texto libre anterior",
    "",
    "",
    "",
  ]);
});
