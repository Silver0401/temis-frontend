"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import CardCC from "@/components/Card-CC";
import LineGraphCC from "@/components/LineGraph-CC";
import OrderCC from "@/components/Order-CC";
import PrescriptionCC from "@/components/Prescription-CC";
import LoaderCC from "@/components/Loader-CC";
import ImgExpanded from "@/styles/stylus/Medical/ImgExpanded";
import { useGlobalContext } from "@/e2e/globalContext";
import { FormatLabsData, FormatSomasData } from "@/scripts/Generator";
import { ClinicalHistorySections } from "./SectionsRegistry";
import { clinicalNoteDate, rowsForNote } from "./noteBuckets";

// Secciones que se muestran como sub-tarjeta dentro de la nota expandida.
type NoteSectionKey = "Somas" | "Labs" | "Drugs" | "Request" | "Imgs";

export interface RecordBundle {
  somas: SomasResponse[];
  labs: LabSomaResponse[];
  drugs: Drugs[];
  imgs: GabinetImgResponse[];
  orders: OrdersResponse[];
}

interface NoteConsultationProps {
  note: MedRecord;
  notes: MedRecord[];
  bundle: RecordBundle;
  loading?: boolean;
  PatientInfo: PatientWithGroup;
  userData?: UserBasedSchema;
}

const ENTRY_LABELS: Record<EntryTypes, string> = {
  ClinicalHistoryInit: "Historia clínica inicial",
  EvolutionNote: "Nota de evolución",
};

/**
 * Sub-tarjeta dentro de la nota expandida. El encabezado abre/cierra en línea;
 * el botón de la esquina la expande a pantalla completa sobre el panel.
 * Conserva el markup y las clases del expediente (`sec-card`/`sec-head`/
 * `sec-body`) para no tocar sus estilos.
 */
const NoteSection: React.FC<{
  section: NoteSectionKey;
  count: number;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  children: React.ReactNode;
}> = ({ section, count, fullscreen, onToggleFullscreen, children }) => {
  const meta = ClinicalHistorySections[section];
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  // En pantalla completa el cuerpo siempre se ve: expandir y quedar vacío
  // sería un callejón sin salida.
  const bodyVisible = open || fullscreen;

  return (
    <article
      className={`sec-card bento-lg note-section ${open ? "is-open" : ""} ${
        fullscreen ? "is-fullscreen" : ""
      }`}
    >
      <div className="sec-head note-section-head">
        <button
          type="button"
          className="note-section-toggle"
          aria-expanded={bodyVisible}
          onClick={() => setOpen((v) => !v)}
        >
          <div className="sec-ic">{meta.Icon}</div>
          <div className="sec-tt">
            <div className="t">{meta.CHSubtitle}</div>
            <div className="s">Solo esta consulta</div>
          </div>
          <span className="sec-count mono">{count}</span>
        </button>
        <ExpandButton fullscreen={fullscreen} onClick={onToggleFullscreen} />
      </div>

      <AnimatePresence initial={false}>
        {bodyVisible ? (
          <motion.div
            className="sec-body"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.24, ease: "easeOut" }}
          >
            <div className="ParcialDxDisplay">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
};

/** Botón de expandir/contraer a pantalla completa del panel izquierdo. */
const ExpandButton: React.FC<{ fullscreen: boolean; onClick: () => void }> = ({
  fullscreen,
  onClick,
}) => (
  <button
    type="button"
    className="sec-exp"
    title={fullscreen ? "Contraer" : "Expandir"}
    aria-label={fullscreen ? "Contraer" : "Expandir"}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
  >
    <svg className="i-expand" viewBox="0 0 24 24">
      <path d="M8 3H4v4M16 3h4v4M8 21H4v-4M16 21h4v-4" />
    </svg>
    <svg className="i-compress" viewBox="0 0 24 24">
      <path d="M4 8h4V4M20 8h-4V4M4 16h4v4M20 16h-4v4" />
    </svg>
  </button>
);

const RecordGraphs: React.FC<{
  section: "Labs" | "Somas";
  rows: LabSomaResponse[] | SomasResponse[];
  appDaySchema: boolean;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}> = ({ section, rows, appDaySchema, fullscreen, onToggleFullscreen }) => {
  // Las dos secciones se grafican igual, pero se guardan distinto: labs es un
  // arreglo abierto de parámetros y somas un objeto de claves fijas.
  const formatted =
    section === "Somas"
      ? FormatSomasData(rows as SomasResponse[])
      : FormatLabsData(rows as LabSomaResponse[]);
  return (
    <NoteSection
      section={section}
      count={rows.length}
      fullscreen={fullscreen}
      onToggleFullscreen={onToggleFullscreen}
    >
      {formatted.map((entry) => {
        const [key, value] = entry as unknown as [string, LabSomaEntry];
        return (
          <LineGraphCC
            key={key}
            title={key}
            subtitle={value.name}
            theme={appDaySchema ? "day" : "night"}
            data={value.list}
            onPointClick={() => {}}
          />
        );
      })}
    </NoteSection>
  );
};

const NoteConsultation: React.FC<NoteConsultationProps> = ({
  note,
  notes,
  bundle,
  loading,
  PatientInfo,
  userData,
}) => {
  const { appDaySchema, setGlobalModal } = useGlobalContext();
  // Solo una tarjeta a pantalla completa a la vez sobre el panel izquierdo.
  const [fullscreenKey, setFullscreenKey] = useState<string | null>(null);
  const toggleFullscreen = (key: string) =>
    setFullscreenKey((current) => (current === key ? null : key));

  // Salida garantizada aunque el botón de contraer quede tapado por algo.
  useEffect(() => {
    if (!fullscreenKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreenKey(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreenKey]);

  const noteSomas = rowsForNote(bundle.somas, note._id, notes);
  const noteLabs = rowsForNote(bundle.labs, note._id, notes);
  const noteDrugs = rowsForNote(bundle.drugs, note._id, notes);
  const noteImgs = rowsForNote(bundle.imgs, note._id, notes);
  const noteOrders = rowsForNote(bundle.orders, note._id, notes);

  const text = note.ClinicalHistory?.trim() ?? "";
  const entryText = note.Entry?.text?.trim() ?? "";
  // El texto va en un textarea de solo lectura para conservar exactamente los
  // espacios y los saltos de línea que escribió el médico.
  const noteText = [text, entryText !== text ? entryText : ""]
    .filter(Boolean)
    .join("\n\n");

  const openImg = (imgData: GabinetImgResponse) =>
    setGlobalModal({
      Settings: {
        size: "imgFullScreen",
        identifier: "CHImgGlobal",
        animation: "popUp",
      },
      Component: <ImgExpanded {...imgData} />,
    });

  const noteFullscreen = fullscreenKey === "note";

  return (
    <div className="note-detail-body">
      <article
        className={`sec-card bento-full note-copy-card ${
          noteFullscreen ? "is-fullscreen" : ""
        }`}
      >
        <div className="sec-head">
          <div className="sec-ic">{ClinicalHistorySections.CCH.Icon}</div>
          <div className="sec-tt">
            <div className="t">{ENTRY_LABELS[note.Entry.type]}</div>
            <div className="s">
              {clinicalNoteDate(note)} ·{" "}
              {note.Temporality === "PrimeraVez"
                ? "Primera vez"
                : "Consulta subsecuente"}
            </div>
          </div>
          <ExpandButton
            fullscreen={noteFullscreen}
            onClick={() => toggleFullscreen("note")}
          />
        </div>
        <div className="sec-body note-copy">
          {noteText ? (
            <textarea
              className="note-copy-text"
              value={noteText}
              readOnly
              spellCheck={false}
              aria-label="Contenido de la nota"
            />
          ) : (
            <p className="empty-card">Esta nota no tiene contenido.</p>
          )}
        </div>
      </article>

      {loading ? (
        <article className="sec-card bento-full note-loading">
          <LoaderCC />
        </article>
      ) : (
        <>
          {/* Cada tarjeta se renderiza solo si la consulta tiene ese dato. */}
          {noteSomas.length ? (
            <RecordGraphs
              section="Somas"
              rows={noteSomas}
              appDaySchema={appDaySchema}
              fullscreen={fullscreenKey === "Somas"}
              onToggleFullscreen={() => toggleFullscreen("Somas")}
            />
          ) : null}

          {noteLabs.length ? (
            <RecordGraphs
              section="Labs"
              rows={noteLabs}
              appDaySchema={appDaySchema}
              fullscreen={fullscreenKey === "Labs"}
              onToggleFullscreen={() => toggleFullscreen("Labs")}
            />
          ) : null}

          {noteDrugs.length && userData ? (
            <NoteSection
              section="Drugs"
              count={noteDrugs.length}
              fullscreen={fullscreenKey === "Drugs"}
              onToggleFullscreen={() => toggleFullscreen("Drugs")}
            >
              {noteDrugs.map((prescription) => (
                <PrescriptionCC
                  key={prescription._id}
                  drugs={
                    {
                      ...prescription,
                      type: "processed",
                    } as Extract<Drugs, { type: "processed" }>
                  }
                  patientData={PatientInfo}
                  userData={userData}
                />
              ))}
            </NoteSection>
          ) : null}

          {noteOrders.length && userData ? (
            <NoteSection
              section="Request"
              count={noteOrders.length}
              fullscreen={fullscreenKey === "Request"}
              onToggleFullscreen={() => toggleFullscreen("Request")}
            >
              {noteOrders.map((order) => (
                <OrderCC
                  key={order._id}
                  orders={order}
                  patientData={PatientInfo}
                  userData={userData}
                />
              ))}
            </NoteSection>
          ) : null}

          {noteImgs.length ? (
            <NoteSection
              section="Imgs"
              count={noteImgs.length}
              fullscreen={fullscreenKey === "Imgs"}
              onToggleFullscreen={() => toggleFullscreen("Imgs")}
            >
              {noteImgs.map((image) => (
                <CardCC
                  key={image._id}
                  size="sm"
                  name={image.Name}
                  title={image.Name}
                  subtitle="Haz click para Ver"
                  onClick={() => openImg(image)}
                />
              ))}
            </NoteSection>
          ) : null}
        </>
      )}
    </div>
  );
};

export default NoteConsultation;
