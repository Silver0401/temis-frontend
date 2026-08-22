"use client";

import React, { useId } from "react";

interface LogoCCProps {
  /** Clase extra para el contenedor — el consumidor define ancho/tamaño/color del slot. */
  className?: string;
  /** Etiqueta accesible. */
  title?: string;
}

/**
 * Logo de marca Temis — reutilizable y responsivo al ancho de su contenedor.
 *
 * Concepto LP-16: símbolo «Reloj de Arena» (variante A · Outline Clásico) +
 * wordmark CRONOS con «MD» en superíndice (gradiente de marca cian→azul).
 *
 * El contenedor declara `container-type: inline-size` (ver LogoCC.styl):
 *   · ancho amplio   → icono + CRONOS + MD
 *   · ancho medio    → icono + CRONOS
 *   · ancho mínimo   → solo icono (ej. SideNav colapsada)
 *
 * El color del texto se hereda del slot (`currentColor`); el gradiente del símbolo
 * usa los tokens theme-aware `--hub-cyan` / `--hub-glow` (definidos por SchemaSwitch).
 */
const LogoCC: React.FC<LogoCCProps> = ({ className = "", title = "Temis" }) => {
  // Id único por instancia: evita colisiones de <linearGradient> si hay varios logos.
  const uid = useId();
  const gradId = `cronosLogoGrad-${uid}`;
  const grad = `url(#${gradId})`;

  return (
    <span
      className={`CronosLogo ${className}`.trim()}
      role="img"
      aria-label={title}
    >
      <svg className="clMark" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--hub-cyan)" />
            <stop offset="1" stopColor="var(--hub-glow)" />
          </linearGradient>
        </defs>
        {/* Tapas superior e inferior */}
        <line
          x1="28"
          y1="15"
          x2="72"
          y2="15"
          stroke={grad}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <line
          x1="28"
          y1="85"
          x2="72"
          y2="85"
          stroke={grad}
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Contorno del reloj de arena */}
        <path
          d="M33 20 L67 20 L50 50 L67 80 L33 80 L50 50 Z"
          fill="none"
          stroke={grad}
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        {/* Arena acumulada + hilo cayendo */}
        <path d="M40 80 L60 80 L50 67 Z" fill="var(--hub-cyan)" />
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="63"
          stroke="var(--hub-cyan)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      <div className="clWord">
        <h4 className="clName">TEMIS</h4>
        <h6 className="clMd">MD</h6>
      </div>
    </span>
  );
};

export default LogoCC;
