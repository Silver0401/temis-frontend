"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import anime from "animejs";
import { toast } from "sonner";
import ButtonCC from "@/components/Button-CC";
import { useGlobalContext } from "@/e2e/globalContext";
import {
  Create_Record_Share,
  Get_Consents,
  Get_Patient_Drugs,
  Get_Patient_Gabinet_Imgs,
  Get_Patient_Laboratories,
  Get_Patient_Orders,
  Get_Patient_Somatometrias,
} from "@/e2e/server/FeathersAPI";
import { Verify_Login } from "@/e2e/server/Queries";
import { AgeFromBirthdate, AgeTextFromBirthdate } from "@/scripts/Generator";
import { formatAfiliaciones } from "@/scripts/afiliaciones";
import ShareRecordModal from "../GlobalModalComps/ShareRecordModal";
import { type ConsentRecord } from "@/library/PDFlayouts/ConsentPDF";
import { ClinicalHistorySections } from "./SectionsRegistry";
import NotesCarousel from "./NotesCarousel";
import NoteConsultation, { RecordBundle } from "./NoteConsultation";
import { sortClinicalNotes } from "./noteBuckets";

const ClinicalHistory: React.FC<ClinicalHistoryProps> = (props) => {
  const queryClient = useQueryClient();
  const { PatientInfo, setPatientInfo, chRef, sharedBundle } = props;
  const { feathersFetchCC, getAccessToken, setGlobalModal } =
    useGlobalContext();

  const [patientPanelOpen, setPatientPanelOpen] = useState<boolean>(false);
  const [consentsOpen, setConsentsOpen] = useState<boolean>(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>(
    undefined,
  );

  const { data: userData } = useQuery(Verify_Login(getAccessToken()));

  // Notas de evolución, de la más reciente a la más antigua.
  const notes = useMemo(
    () => sortClinicalNotes(PatientInfo?.records),
    [PatientInfo],
  );
  const selectedNote = notes.find((note) => note._id === selectedNoteId);

  // ── Documentos del expediente (a nivel paciente) ───────────────────────────
  // Antes se pedían por diagnóstico seleccionado. Con el modelo 3D fuera nada
  // seleccionaba diagnóstico, así que las queries nunca se habilitaban y el
  // expediente salía vacío aunque hubiera datos guardados.
  const patientId = PatientInfo?._id;
  const enabled = Boolean(patientId) && !sharedBundle;

  const somas = useQuery({
    queryKey: [`ch_somas_${patientId}`],
    enabled,
    refetchOnWindowFocus: false,
    queryFn: async () =>
      (
        await feathersFetchCC<SomasResponse[]>(
          await Get_Patient_Somatometrias(`${patientId}`),
        )
      ).data,
  });
  const labs = useQuery({
    queryKey: [`ch_labs_${patientId}`],
    enabled,
    refetchOnWindowFocus: false,
    queryFn: async () =>
      (
        await feathersFetchCC<LabSomaResponse[]>(
          await Get_Patient_Laboratories(`${patientId}`),
        )
      ).data,
  });
  const drugs = useQuery({
    queryKey: [`ch_drugs_${patientId}`],
    enabled,
    refetchOnWindowFocus: false,
    queryFn: async () =>
      (await feathersFetchCC<Drugs[]>(await Get_Patient_Drugs(`${patientId}`)))
        .data,
  });
  const imgs = useQuery({
    queryKey: [`ch_imgs_${patientId}`],
    enabled,
    refetchOnWindowFocus: false,
    queryFn: async () =>
      (
        await feathersFetchCC<GabinetImgResponse[]>(
          await Get_Patient_Gabinet_Imgs(`${patientId}`),
        )
      ).data,
  });
  const orders = useQuery({
    queryKey: [`ch_orders_${patientId}`],
    enabled,
    refetchOnWindowFocus: false,
    queryFn: async () =>
      (
        await feathersFetchCC<OrdersResponse[]>(
          await Get_Patient_Orders(`${patientId}`),
        )
      ).data,
  });

  // Misma queryKey que `Consents.tsx`: react-query comparte la caché, así que
  // esto no dispara una segunda petición. Solo sirve para saber si hay algo
  // que mostrar antes de montar la tarjeta.
  const consents = useQuery({
    queryKey: ["patient-consents", patientId],
    enabled,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await feathersFetchCC<ConsentRecord[]>(
        await Get_Consents(`${patientId}`),
      );
      if (response.type === "error") throw new Error("patient-consents-error");
      return response.data;
    },
  });

  const bundle = useMemo(
    (): RecordBundle => ({
      somas: sharedBundle?.somas ?? somas.data ?? [],
      labs: sharedBundle?.labs ?? labs.data ?? [],
      drugs: sharedBundle?.drugs ?? drugs.data ?? [],
      imgs: sharedBundle?.imgs ?? imgs.data ?? [],
      orders: sharedBundle?.orders ?? orders.data ?? [],
    }),
    [sharedBundle, somas.data, labs.data, drugs.data, imgs.data, orders.data],
  );

  const bundleLoading =
    !sharedBundle &&
    (somas.isPending ||
      labs.isPending ||
      drugs.isPending ||
      imgs.isPending ||
      orders.isPending);

  // ── Compartir expediente (solo para el médico emisor) ──────────────────────
  const createShare = useMutation({
    mutationFn: async () => {
      if (!PatientInfo?._id) throw new Error("Sin paciente");
      const bytes = new Uint8Array(9);
      crypto.getRandomValues(bytes);
      const password = btoa(String.fromCharCode(...bytes)).replace(
        /[+/=]/g,
        "",
      );
      const req = await Create_Record_Share(`${PatientInfo._id}`, password);
      const res = await feathersFetchCC<{ token: string }>(req);
      return { token: res?.data?.token, password };
    },
    onSuccess: ({ token, password }) => {
      if (!token) {
        toast.error("No se pudo crear el link");
        return;
      }
      setGlobalModal({
        Settings: {
          size: "small",
          identifier: "ShareRecordModal",
          animation: "popUp",
        },
        Component: (
          <ShareRecordModal
            url={`${window.location.origin}/shared/record/${token}`}
            password={password}
          />
        ),
      });
    },
    onError: () => toast.error("No se pudo crear el link"),
  });

  // ── Ficha de identificación ───────────────────────────────────────────────
  const patientFields = useMemo((): Array<[string, string]> => {
    if (!PatientInfo) return [];
    const p = PatientInfo.personalInfo;
    const raw: Array<[string, string | undefined]> = [
      ["Nombre", `${p.names} ${p.middleName} ${p.lastName}`.trim()],
      ["Sexo", p.sex],
      ["Edad", AgeTextFromBirthdate(p.birthDate)],
      ["Nacimiento", p.birthDate],
      ["CURP", p.curp],
      ["Derechohabiencia", formatAfiliaciones(p.derechohabiencia)],
      ["Lugar de nacimiento", p.birthPlace],
      ["Domicilio", p.domicile],
    ];
    return raw.filter(
      (e): e is [string, string] => !!e[1] && `${e[1]}`.trim().length > 0,
    );
  }, [PatientInfo]);

  // ── Apertura / cierre del expediente ──────────────────────────────────────
  useEffect(() => {
    if (PatientInfo) {
      setSelectedNoteId(notes[0]?._id);
      anime({
        targets: `.ClinicalHistoryContainer`,
        duration: 1000,
        translateY: "0%",
        opacity: 1,
        easing: "easeOutQuint",
      });
      return;
    }
    anime({
      targets: `.ClinicalHistoryContainer`,
      duration: 500,
      translateY: "100%",
      opacity: 0,
      easing: "easeInQuint",
    });
    setSelectedNoteId(undefined);
    setConsentsOpen(false);
  }, [PatientInfo, notes]);

  const closeRecord = () => {
    queryClient.refetchQueries({ queryKey: ["fetching_user_patients"] });
    setPatientInfo && setPatientInfo(undefined);
  };

  const consentsMeta = ClinicalHistorySections.Consents;

  return (
    <div
      className="ClinicalHistoryContainer"
      ref={chRef}
      style={props.fullScreen ? { paddingLeft: "0px" } : undefined}
    >
      <div className="GenericContainer">
        {/* ░░ BARRA SUPERIOR PACIENTE ░░ */}
        <div className="ch-top">
          <div className="patient-chip">
            <div className="p-photo">
              <svg className="face" viewBox="0 0 24 24">
                <path d="M12 12.75a5.25 5.25 0 1 0 0-10.5 5.25 5.25 0 0 0 0 10.5Zm0 1.5c-5.18 0-9.25 2.7-9.25 6.25V22h18.5v-1.5c0-3.55-4.07-6.25-9.25-6.25Z" />
              </svg>
            </div>
            <div className="p-meta">
              <div className="pn">
                {PatientInfo
                  ? `${PatientInfo.personalInfo.names} ${PatientInfo.personalInfo.middleName} ${PatientInfo.personalInfo.lastName}`
                  : ""}
              </div>
              <div className="ps">
                <span
                  className="p-sex-dot"
                  data-sex={PatientInfo?.personalInfo.sex}
                />
                {PatientInfo
                  ? `${AgeFromBirthdate(
                      PatientInfo.personalInfo.birthDate,
                    )} años · ${PatientInfo.personalInfo.sex}`
                  : ""}
              </div>
            </div>
          </div>

          <div className="ch-top-spacer" />

          {sharedBundle ? null : (
            <button
              type="button"
              className="pd-toggle"
              onClick={() => createShare.mutate()}
              title="Compartir expediente"
            >
              <span>Compartir</span>
            </button>
          )}

          <button
            type="button"
            className={`pd-toggle ${patientPanelOpen ? "open" : ""}`}
            onClick={() => setPatientPanelOpen((v) => !v)}
            title="Ver identificación del paciente"
          >
            <span>Identificación</span>
            <svg viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 9l6 6 6-6"
              />
            </svg>
          </button>

          <div className="ExitButton">
            <ButtonCC
              type="Phantom"
              classname="ExitCHM"
              onClick={closeRecord}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              }
            />
          </div>
        </div>

        {/* ░░ FICHA DE IDENTIFICACIÓN (desplegable) ░░ */}
        <div className={`patient-details ${patientPanelOpen ? "open" : ""}`}>
          <div className="pd-inner">
            <div className="pd-grid">
              {patientFields.map(([k, v]) => (
                <div className="pd-item" key={k}>
                  <span className="pd-k mono">{k}</span>
                  <span className="pd-v">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ░░ STAGE: nota expandida (izquierda) + línea de tiempo (derecha) ░░ */}
        <main className="stage">
          <section className="data-card note-detail" aria-label="Nota seleccionada">
            <div className="data-head">
              <div className="dt">Nota de evolución</div>
            </div>

            <div className="data-scroll">
              {PatientInfo && selectedNote ? (
                <NoteConsultation
                  key={selectedNote._id}
                  note={selectedNote}
                  notes={notes}
                  bundle={bundle}
                  loading={bundleLoading}
                  PatientInfo={PatientInfo}
                  userData={userData?.data.user}
                />
              ) : (
                <p className="empty-card">
                  Selecciona una nota de la línea de tiempo para verla completa.
                </p>
              )}

              {/* Consentimientos: son del paciente, no de una nota, y la
                  tarjeta solo se monta si hay al menos uno registrado. */}
              {PatientInfo && consents.data?.length ? (
                <article
                  className={`sec-card bento-full note-section ${
                    consentsOpen ? "is-open" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="sec-head note-section-head"
                    aria-expanded={consentsOpen}
                    onClick={() => setConsentsOpen((v) => !v)}
                  >
                    <div className="sec-ic">{consentsMeta.Icon}</div>
                    <div className="sec-tt">
                      <div className="t">{consentsMeta.CHSubtitle}</div>
                      <div className="s">Del paciente</div>
                    </div>
                    <span className="sec-count mono">
                      {consentsMeta.CHAbbreviation}
                    </span>
                  </button>
                  {consentsOpen ? (
                    <div className="sec-body">
                      <consentsMeta.Component PatientInfo={PatientInfo} />
                    </div>
                  ) : null}
                </article>
              ) : null}
            </div>
          </section>

          <NotesCarousel
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelect={setSelectedNoteId}
          />
        </main>
      </div>
    </div>
  );
};

export default ClinicalHistory;
