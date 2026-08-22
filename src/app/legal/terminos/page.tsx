import FooterSection from "@/library/Nav/FooterSection";
import RevealObserver from "@/library/Nav/RevealObserver";

export const metadata = {
  title: "Términos de Uso · Temis",
  description: "Términos y condiciones de uso de la plataforma Temis.",
};

export default function TerminosPage() {
  return (
    <>
      <RevealObserver />
      <main className="lp-institutional lp-legal">
        <div className="lp-wrap">

          <div className="lp-inst-hero lp-rv">
            <p className="lp-section-tag">Legal</p>
            <h1 className="lp-inst-title">Términos de Uso</h1>
            <p className="lp-inst-sub">
              Última actualización: junio 2026
            </p>
          </div>

          <div className="lp-legal-body lp-rv lp-rv-d1">
            {/* El texto completo será agregado por el usuario */}
            <p className="lp-inst-body lp-legal-placeholder">
              Contenido pendiente — los términos de uso serán agregados próximamente.
            </p>
          </div>

        </div>
      </main>
      <FooterSection />
    </>
  );
}
