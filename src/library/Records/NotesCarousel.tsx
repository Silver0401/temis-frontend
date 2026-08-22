"use client";

import React, { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { clinicalNoteDate } from "./noteBuckets";

const ENTRY_LABELS: Record<EntryTypes, string> = {
  ClinicalHistoryInit: "Historia clínica inicial",
  EvolutionNote: "Nota de evolución",
};

interface NotesCarouselProps {
  notes: MedRecord[];
  selectedNoteId?: string;
  onSelect: (noteId?: string) => void;
}

/**
 * Línea de tiempo de notas de evolución (columna derecha del expediente).
 * Al seleccionar una nota, su contenido se despliega en el panel izquierdo.
 */
const NotesCarousel: React.FC<NotesCarouselProps> = ({
  notes,
  selectedNoteId,
  onSelect,
}) => {
  const selectedRef = useRef<HTMLLIElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [reduceMotion, selectedNoteId]);

  return (
    <section className="data-card notes-view" aria-labelledby="notes-title">
      <header className="data-head note-head">
        <div>
          <h2 className="dt" id="notes-title">
            Línea de tiempo clínica
          </h2>
          <p className="note-total mono">
            {notes.length} {notes.length === 1 ? "consulta" : "consultas"}
          </p>
        </div>
      </header>

      {notes.length === 0 ? (
        <div className="note-empty">
          <p className="empty-card">
            Este paciente todavía no tiene notas clínicas.
          </p>
        </div>
      ) : (
        <ol
          className="notes-timeline"
          data-has-selection={Boolean(selectedNoteId)}
        >
          {notes.map((note, index) => {
            const selected = note._id === selectedNoteId;
            return (
              <li
                className="timeline-entry"
                data-expanded={selected}
                data-muted={Boolean(selectedNoteId && !selected)}
                key={note._id || index}
                ref={selected ? selectedRef : undefined}
              >
                <span className="timeline-dot" aria-hidden="true" />
                <article className="timeline-card">
                  <button
                    type="button"
                    className="timeline-summary"
                    aria-pressed={selected}
                    onClick={() => onSelect(selected ? undefined : note._id)}
                  >
                    <span className="timeline-date mono">
                      {clinicalNoteDate(note)}
                    </span>
                    <span className="timeline-title">
                      {ENTRY_LABELS[note.Entry.type]}
                    </span>
                    <span className="timeline-details">
                      {note.ServiceArea ??
                        (note.Temporality === "PrimeraVez"
                          ? "Primera vez"
                          : "Consulta subsecuente")}
                    </span>
                    <span className="timeline-chevron" aria-hidden="true">
                      ⌄
                    </span>
                  </button>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};

export default NotesCarousel;
