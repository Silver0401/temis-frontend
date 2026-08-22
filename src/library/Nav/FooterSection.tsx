import Link from "next/link";
import LogoCC from "@/components/Logo-CC";

// Temis es un sistema gubernamental: el pie sólo conserva los avisos legales.
// Las columnas de producto y empresa se fueron con la landing.
const footerCols = [
  {
    heading: "Legal",
    links: [
      { label: "Privacidad", href: "/legal/privacidad" },
      { label: "Términos de uso", href: "/legal/terminos" },
      { label: "NOM-024-SSA3", href: "/legal/nom-024" },
    ],
  },
];

export default function FooterSection() {
  return (
    <footer className="lp-footer">
      <p className="lp-foot-word" aria-hidden>
        TEMIS
      </p>

      <div className="lp-wrap">
        <div className="lp-foot-main">
          {/* Brand */}
          <div>
            <Link href="/" className="lp-foot-logo">
              <div className="lp-foot-logo-icon">
                <LogoCC />
              </div>
              Temis
            </Link>
            <p className="lp-foot-brand-desc">
              Expediente clínico electrónico institucional, conforme a la
              NOM-024-SSA3.
            </p>
          </div>

          {/* Link columns */}
          {footerCols.map((col) => (
            <div key={col.heading}>
              <h5 className="lp-foot-col-h">{col.heading}</h5>
              <ul className="lp-foot-links">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="lp-foot-bottom">
          <span className="lp-foot-copy">
            © 2026 Temis · Todos los derechos reservados
          </span>
          <div className="lp-foot-certs">
            <span className="lp-foot-cert">NOM-024</span>
            <span className="lp-foot-cert">Cifrado AES-256</span>
            <span className="lp-foot-cert">Respaldos periódicos</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
