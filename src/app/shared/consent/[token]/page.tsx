"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";

import SignaturePadCC from "@/components/SignaturePad-CC";
import { useGlobalContext } from "@/e2e/globalContext";
import { Get_Public_Consent, Sign_Consent } from "@/e2e/server/FeathersAPI";
import FancyLoader from "@/library/Generics/Loaders/FancyLoader";

interface PublicConsent {
  title: string;
  body: string;
  docVersion: string;
  docHash: string;
  doctorName: string;
  patientName?: string;
}

export default function SharedConsentPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { feathersFetchCC } = useGlobalContext();
  const [mode, setMode] = useState<"canvas" | "acceptance">("canvas");
  const [signerName, setSignerName] = useState("");
  const [signed, setSigned] = useState(false);

  const consent = useQuery({
    queryKey: ["public-consent", token],
    enabled: Boolean(token),
    retry: false,
    queryFn: async () => {
      const response = await feathersFetchCC<PublicConsent>(
        await Get_Public_Consent(token),
      );
      if (response.type === "error") throw new Error("invalid-consent");
      return response.data;
    },
  });

  useEffect(() => {
    if (consent.data?.patientName && !signerName) {
      setSignerName(consent.data.patientName);
    }
  }, [consent.data?.patientName, signerName]);

  const signConsent = useMutation({
    mutationFn: async (signatureImage?: string) => {
      const response = await feathersFetchCC<{ status: "signed" }>(
        await Sign_Consent({
          token,
          mode,
          signerName: signerName.trim(),
          ...(signatureImage ? { signatureImage } : {}),
        }),
      );
      if (response.type === "error") throw new Error("signing-failed");
      return response.data;
    },
    onSuccess: () => setSigned(true),
  });

  if (consent.isPending) return <FancyLoader />;

  if (consent.isError || !consent.data) {
    return (
      <main className="SharedConsentPage consentStatePage">
        <section className="consentStateCard">
          <h1>Link inválido o expirado</h1>
          <p>Solicita al profesional de la salud un nuevo enlace.</p>
        </section>
      </main>
    );
  }

  if (signed) {
    return (
      <main className="SharedConsentPage consentStatePage">
        <section className="consentStateCard consentSignedCard">
          <span aria-hidden="true">✓</span>
          <h1>Consentimiento firmado</h1>
          <p>La evidencia quedó registrada en tu expediente clínico.</p>
        </section>
      </main>
    );
  }

  const canSign = signerName.trim().length >= 2 && !signConsent.isPending;

  return (
    <main className="SharedConsentPage">
      <article className="publicConsentDocument">
        <header>
          <p className="consentEyebrow">Temis · Consentimiento informado</p>
          <h1>{consent.data.title}</h1>
          <dl>
            <div>
              <dt>Profesional</dt>
              <dd>{consent.data.doctorName}</dd>
            </div>
            {consent.data.patientName ? (
              <div>
                <dt>Paciente</dt>
                <dd>{consent.data.patientName}</dd>
              </div>
            ) : null}
            <div>
              <dt>Versión</dt>
              <dd>{consent.data.docVersion}</dd>
            </div>
          </dl>
        </header>

        <section className="publicConsentBody">
          {consent.data.body.split("\n\n").map((paragraph, index) => (
            <p
              key={`${index}-${paragraph.slice(0, 20)}`}
              data-heading={
                paragraph === paragraph.toUpperCase() ? "true" : "false"
              }
            >
              {paragraph}
            </p>
          ))}
        </section>

        <footer className="publicConsentEvidence">
          <h2>Firma y aceptación</h2>
          <p>
            Escribe el nombre de quien acepta. La fecha, hora, dirección IP,
            dispositivo y huella del documento se registrarán como evidencia.
          </p>
          <label htmlFor="consentSignerName">Nombre completo</label>
          <input
            id="consentSignerName"
            type="text"
            autoComplete="name"
            maxLength={160}
            value={signerName}
            onChange={(event) => setSignerName(event.target.value)}
          />

          <div
            className="consentModeTabs"
            role="tablist"
            aria-label="Forma de firma"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "canvas"}
              onClick={() => setMode("canvas")}
            >
              Dibujar firma
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "acceptance"}
              onClick={() => setMode("acceptance")}
            >
              Aceptación expresa
            </button>
          </div>

          {mode === "canvas" ? (
            <SignaturePadCC
              disabled={!canSign}
              onConfirm={(signatureImage) => signConsent.mutate(signatureImage)}
            />
          ) : (
            <div className="typedAcceptance">
              <p>
                Al confirmar, declaro que leí el documento, pude formular
                preguntas y acepto voluntariamente sus términos.
              </p>
              <button
                type="button"
                disabled={!canSign}
                onClick={() => signConsent.mutate(undefined)}
              >
                Aceptar y firmar
              </button>
            </div>
          )}

          {signConsent.isError ? (
            <p className="consentSigningError">
              No fue posible registrar la firma. El enlace puede haber expirado
              o ya fue utilizado.
            </p>
          ) : null}

          <p className="consentHash">{`SHA-256 ${consent.data.docHash}`}</p>
        </footer>
      </article>
    </main>
  );
}
