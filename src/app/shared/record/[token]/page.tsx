"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import FancyLoader from "@/library/Generics/Loaders/FancyLoader";
import ClinicalHistory from "@/library/Records/ClinicalHistory";
import ButtonCC from "@/components/Button-CC";
import { useGlobalContext } from "@/e2e/globalContext";
import { Redeem_Record_Share } from "@/e2e/server/FeathersAPI";

// Página del link para compartir un expediente fuera de las CLUES del médico.
// Flujo: se pide la contraseña del link; con sesión iniciada se canjea directo.
// Sin sesión: por ahora se ofrece iniciar sesión (el canje por NUFI sin sesión
// queda pendiente, ver informe). El backend nunca emite el JWT de sesión completo:
// devuelve SOLO este expediente en lectura.
export default function SharedRecordPage() {
  const { token }: { token: string } = useParams();
  const { getAccessToken, feathersFetchCC } = useGlobalContext();

  const [password, setPassword] = useState("");
  const [patient, setPatient] = useState<PatientWithGroup | undefined>(
    undefined,
  );
  const [bundle, setBundle] = useState<SharedRecordBundle | undefined>(
    undefined,
  );

  const session = getAccessToken();
  const hasSession = Boolean(
    session?.accessToken &&
      session.accessToken !== "none" &&
      !session.jwtExpired,
  );

  const redeem = useMutation({
    mutationFn: async () => {
      const req = await Redeem_Record_Share({
        token,
        password,
        accessToken: hasSession ? session.accessToken : undefined,
      });
      const res = await feathersFetchCC<{
        patient: PatientWithGroup;
        bundle: SharedRecordBundle;
      }>(req);
      return res?.data;
    },
    onSuccess: (result) => {
      setPatient(result?.patient);
      setBundle(result?.bundle);
    },
  });

  if (redeem.isPending) return <FancyLoader />;

  if (patient) {
    return (
      <section className="SharedSection" id="GeneralSection">
        <ClinicalHistory
          PatientInfo={patient}
          sharedBundle={bundle}
          fullScreen
        />
      </section>
    );
  }

  return (
    <section className="SharedSection" id="GeneralSection">
      <div className="needToLogIn">
        <h1>{"Expediente compartido"}</h1>
        <p>{"Ingresa la contraseña que te compartieron para ver este expediente."}</p>

        <input
          type="password"
          placeholder="Contraseña del link"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && password) redeem.mutate();
          }}
        />

        {redeem.isError ? (
          <p className="errorMsg">
            {"No se pudo abrir el expediente. Revisa la contraseña o el link."}
          </p>
        ) : null}

        {hasSession ? (
          <ButtonCC
            text="Ver expediente"
            onClick={() => {
              if (password) redeem.mutate();
            }}
          />
        ) : (
          <>
            <p>
              {"Para verte necesitas validar tu identidad: inicia sesión y vuelve a abrir este link."}
            </p>
            <ButtonCC text="Iniciar sesión" href="/account" />
          </>
        )}
      </div>
    </section>
  );
}
