import FooterSection from "@/library/Nav/FooterSection";
import RevealObserver from "@/library/Nav/RevealObserver";

export const metadata = {
  title: "NOM-024-SSA3 · Temis",
  description: "Cumplimiento de la NOM-024-SSA3 en la plataforma Temis.",
};

export default function Nom024Page() {
  return (
    <>
      <RevealObserver />
      <main className="lp-institutional lp-legal">
        <div className="lp-wrap">

          <div className="lp-inst-hero lp-rv">
            <p className="lp-section-tag">Legal</p>
            <h1 className="lp-inst-title">NOM-024-SSA3</h1>
            <p className="lp-inst-sub">
              Temis cumple con la Norma Oficial Mexicana NOM-024-SSA3-2012
              para sistemas de información de registro electrónico para la salud.
            </p>
          </div>

          <div className="lp-legal-body lp-rv lp-rv-d1">
            {/* El texto completo será agregado por el usuario */}
            <p className="lp-inst-body lp-legal-placeholder">
              Contenido pendiente — la documentación de cumplimiento será agregada próximamente.
            </p>
          </div>

        </div>
      </main>
      <FooterSection />
    </>
  );
}
