"use client";

import LogRegisterSection from "@/library/Account/LogRegister";
import NewsSection from "@/library/Account/NewsSection";
import SessionRedirect from "@/components/SessionRedirect";
import RouteTransitionClear from "@/components/RouteTransitionClear";

/**
 * Portada de Temis: acceso y registro, nada más. Al ser un sistema
 * gubernamental no hay landing comercial, así que `/` es directamente el
 * formulario, con el mismo layout de dos columnas de `/account`.
 * `SessionRedirect` saca de aquí a quien ya trae sesión.
 */
export default function RootPage() {
  return (
    <section className="AccountSection" id="GeneralSection">
      <RouteTransitionClear />
      <SessionRedirect />
      <div className="innerAccountContainer">
        <LogRegisterSection />
        <NewsSection />
      </div>
    </section>
  );
}
