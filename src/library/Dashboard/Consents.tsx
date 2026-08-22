"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import PatientSearchCC from "@/components/PatientSearch-CC";
import QRCC from "@/components/QR-CC";
import { useGlobalContext } from "@/e2e/globalContext";
import { Create_Consent, Get_Consents } from "@/e2e/server/FeathersAPI";
import type { ConsentRecord } from "@/library/PDFlayouts/ConsentPDF";

const TEMPLATES = [
  { id: "privacy-notice-mx", title: "Aviso de privacidad" },
  {
    id: "generic-medical-consent",
    title: "Procedimiento o tratamiento médico",
  },
  {
    id: "telemedicine-consent",
    title: "Telemedicina y uso de datos clínicos",
  },
] as const;

interface SelectedPatient {
  idAndName: string;
  fullData: Patient;
}

const patientName = (patient?: Patient) =>
  patient
    ? [
        patient.personalInfo.names,
        patient.personalInfo.middleName,
        patient.personalInfo.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim()
    : undefined;

const Consents = () => {
  const { feathersFetchCC, appDaySchema } = useGlobalContext();
  const [templateId, setTemplateId] = useState<string>(TEMPLATES[0].id);
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient>();
  const [origin, setOrigin] = useState("");
  const [selectedToken, setSelectedToken] = useState<string>();

  useEffect(() => setOrigin(window.location.origin), []);

  const list = useQuery({
    queryKey: ["consents"],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await feathersFetchCC<ConsentRecord[]>(
        await Get_Consents(),
      );
      if (response.type === "error") throw new Error("consents-list-error");
      return response.data;
    },
  });

  const createConsent = useMutation({
    mutationFn: async () => {
      const patient = selectedPatient?.fullData;
      const response = await feathersFetchCC<ConsentRecord>(
        await Create_Consent({
          templateId,
          ...(patient
            ? { patientId: patient._id, patientName: patientName(patient) }
            : {}),
        }),
      );
      if (response.type === "error") throw new Error("consent-create-error");
      return response.data;
    },
    onSuccess: (created) => {
      setSelectedToken(created.token);
      list.refetch();
    },
  });

  const rows = list.data ?? [];
  const selectedForQr = useMemo(
    () => rows.find((row) => row.token === selectedToken) ?? rows[0],
    [rows, selectedToken],
  );
  const linkFor = (token: string) => `${origin}/shared/consent/${token}`;

  return (
    <section className="DashboardConsents">
      <div className="consentsScroll">
        <header className="consentsTitle">
          <div>
            <p>Documentación clínica</p>
            <h1>Consentimientos</h1>
          </div>
          <span>{`${rows.length} emitidos`}</span>
        </header>

        <div className="consentsGrid">
          <div className="consentComposer consentPanel">
            <h2>Emitir nuevo link</h2>
            <label htmlFor="consentTemplate">Plantilla</label>
            <select
              id="consentTemplate"
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
            >
              {TEMPLATES.map((template) => (
                <option value={template.id} key={template.id}>
                  {template.title}
                </option>
              ))}
            </select>

            <label>Paciente (opcional)</label>
            <PatientSearchCC
              colorSchema={appDaySchema ? "day" : "night"}
              onPatientSelect={setSelectedPatient}
              onReset={() => setSelectedPatient(undefined)}
            />

            {selectedPatient ? (
              <p className="selectedConsentPatient">
                {patientName(selectedPatient.fullData)}
              </p>
            ) : null}

            <button
              type="button"
              className="createConsentButton"
              disabled={createConsent.isPending}
              onClick={() => createConsent.mutate()}
            >
              {createConsent.isPending ? "Creando…" : "Crear consentimiento"}
            </button>
            {createConsent.isError ? (
              <p className="consentsError">
                No fue posible crear el consentimiento.
              </p>
            ) : null}
          </div>

          <div className="consentQrPanel consentPanel">
            {selectedForQr && origin ? (
              <>
                <QRCC
                  title="Link para firma"
                  subtitle="Vigencia de 72 horas"
                  value={linkFor(selectedForQr.token)}
                  size="sm"
                  colorSchema={appDaySchema ? "day" : "night"}
                />
                <a
                  href={linkFor(selectedForQr.token)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {linkFor(selectedForQr.token)}
                </a>
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard.writeText(linkFor(selectedForQr.token))
                  }
                >
                  Copiar link
                </button>
              </>
            ) : (
              <p>El link y su código QR aparecerán aquí.</p>
            )}
          </div>
        </div>

        <div className="consentPanel consentListPanel">
          <h2>Consentimientos emitidos</h2>
          {list.isPending ? <p>Cargando…</p> : null}
          {list.isError ? (
            <p className="consentsError">
              No fue posible consultar los consentimientos.
            </p>
          ) : null}
          {!list.isPending && rows.length === 0 ? (
            <p>Aún no has emitido consentimientos.</p>
          ) : null}
          <div className="consentRows">
            {rows.map((consent) => {
              const expired =
                consent.status === "pending" && consent.expiresAt < Date.now();
              const status =
                consent.status === "signed"
                  ? "signed"
                  : expired
                    ? "expired"
                    : "pending";
              return (
                <article key={consent.token} data-status={status}>
                  <div>
                    <h3>{consent.title}</h3>
                    <p>{consent.patientName || "Sin paciente asociado"}</p>
                    <small>
                      {new Date(consent.createdAt).toLocaleString("es-MX")}
                    </small>
                  </div>
                  <span className="consentStatus">
                    {status === "signed"
                      ? "Firmado"
                      : status === "expired"
                        ? "Expirado"
                        : "Pendiente"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedToken(consent.token)}
                  >
                    Ver link y QR
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Consents;
