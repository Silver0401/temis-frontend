"use client";

import { useQuery } from "@tanstack/react-query";
import { pdf } from "@react-pdf/renderer";

import { useGlobalContext } from "@/e2e/globalContext";
import { Get_Consents } from "@/e2e/server/FeathersAPI";
import ConsentPDF, {
  type ConsentRecord,
} from "@/library/PDFlayouts/ConsentPDF";

const safeFileName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const Consents: React.FC<SectionProps> = ({ PatientInfo }) => {
  const { feathersFetchCC } = useGlobalContext();
  const patientId = PatientInfo?._id;

  const list = useQuery({
    queryKey: ["patient-consents", patientId],
    enabled: Boolean(patientId),
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await feathersFetchCC<ConsentRecord[]>(
        await Get_Consents(patientId),
      );
      if (response.type === "error") throw new Error("patient-consents-error");
      return response.data;
    },
  });

  const download = async (consent: ConsentRecord) => {
    const blob = await pdf(<ConsentPDF consent={consent} />).toBlob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFileName(consent.title)}-${consent.docHash.slice(0, 8)}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="PatientConsents">
      <header>
        <div>
          <p>Expediente clínico</p>
          <h2>Consentimientos informados</h2>
        </div>
        <span>{`${list.data?.length ?? 0} documentos`}</span>
      </header>

      {list.isPending ? <p>Cargando consentimientos…</p> : null}
      {list.isError ? (
        <p className="patientConsentsError">
          No fue posible consultar los consentimientos.
        </p>
      ) : null}
      {!list.isPending && !list.data?.length ? (
        <p>Este paciente aún no tiene consentimientos asociados.</p>
      ) : null}

      <div className="patientConsentList">
        {list.data?.map((consent) => (
          <article key={consent.token} data-status={consent.status}>
            <div className="patientConsentSummary">
              <div>
                <h3>{consent.title}</h3>
                <p>{`Versión ${consent.docVersion}`}</p>
              </div>
              <span>
                {consent.status === "signed" ? "Firmado" : "Pendiente"}
              </span>
            </div>

            <dl>
              <div>
                <dt>Emitido</dt>
                <dd>{new Date(consent.createdAt).toLocaleString("es-MX")}</dd>
              </div>
              {consent.signedAt ? (
                <div>
                  <dt>Firmado</dt>
                  <dd>{new Date(consent.signedAt).toLocaleString("es-MX")}</dd>
                </div>
              ) : null}
              {consent.signerName ? (
                <div>
                  <dt>Firmante</dt>
                  <dd>{consent.signerName}</dd>
                </div>
              ) : null}
              {consent.signerIp ? (
                <div>
                  <dt>IP</dt>
                  <dd>{consent.signerIp}</dd>
                </div>
              ) : null}
            </dl>

            {consent.signatureImage ? (
              <div className="patientConsentSignature">
                <p>Firma capturada</p>
                <img
                  src={consent.signatureImage}
                  alt={`Firma de ${consent.signerName}`}
                />
              </div>
            ) : consent.status === "signed" ? (
              <p className="patientConsentAcceptance">
                Aceptación expresa registrada mediante link individual.
              </p>
            ) : null}

            <details>
              <summary>Ver documento y hash</summary>
              <div className="patientConsentBody">
                {consent.body.split("\n\n").map((paragraph, index) => (
                  <p key={`${index}-${paragraph.slice(0, 18)}`}>{paragraph}</p>
                ))}
              </div>
              <code>{consent.docHash}</code>
            </details>

            {consent.status === "signed" ? (
              <button type="button" onClick={() => download(consent)}>
                Descargar PDF firmado
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
};

export default Consents;
