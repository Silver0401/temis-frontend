"use client";

/**
 * Esqueleto del tablero mientras se calculan las estadísticas.
 *
 * La agregación recorre records, drugs, orders, somas y patients, así que tarda
 * lo suficiente para que un spinner suelto parezca que la pantalla no cargó.
 * Este esqueleto repite la geometría real —cifra guía, seis métricas, tres
 * gráficas— para que el contenido aterrice en su sitio y no dé el salto de
 * layout típico de cambiar un loader chico por un tablero completo.
 */
const AdminStatsSkeleton: React.FC = () => (
  <div className="admin-skeleton" aria-busy="true" aria-live="polite">
    <span className="sr-only">Calculando estadísticas…</span>

    <div className="admin-hero admin-sk-hero">
      <div className="admin-hero-main">
        <span className="sk sk-line sk-sm" />
        <span className="sk sk-big" />
        <span className="sk sk-line sk-md" />
      </div>
      <div className="admin-hero-side">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <article key={i}>
            <span className="sk sk-line sk-xs" />
            <span className="sk sk-num" />
            <span className="sk sk-spark" />
          </article>
        ))}
      </div>
    </div>

    <div className="admin-pies">
      {[0, 1].map((i) => (
        <article className="admin-chart" key={i}>
          <span className="sk sk-line sk-sm" />
          <span className="sk sk-line sk-xs" />
          <span className="sk sk-pie" />
        </article>
      ))}
    </div>

    <article className="admin-chart">
      <span className="sk sk-line sk-sm" />
      <span className="sk sk-bars" />
    </article>
  </div>
);

export default AdminStatsSkeleton;
