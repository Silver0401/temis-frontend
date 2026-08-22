"use client";

import React, { useId } from "react";

interface fancyLoaderProps {
  text?: string;
  bg?: "normal" | "translucid";
}

/**
 * FancyLoader — pantalla de carga de marca Temis.
 *
 * Animación: reloj de arena (logo LP-16). La arena superior se vacía hacia el
 * cuello, la inferior se acumula desde la base, un hilo cae por el centro y al
 * terminar el reloj gira 180° para reiniciar el ciclo de forma fluida.
 *
 * Toda la animación es CSS (ver Loaders.styl). Los colores usan los tokens
 * theme-aware --hub-cyan / --hub-glow definidos por SchemaSwitch.
 */
const FancyLoader: React.FC<fancyLoaderProps> = ({ text, bg }) => {
  // Id único por instancia: evita colisiones de <linearGradient> si hay varios loaders.
  const uid = useId();
  const gradId = `hgGrad-${uid}`;
  const grad = `url(#${gradId})`;

  return (
    <div className="FancyLoader" id={`${bg ? bg : "normal"}Bg`}>
      <div className="logoContainer">
        <svg className="hgMark" viewBox="0 0 100 100" aria-label="Temis" role="img">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--hub-cyan)" />
              <stop offset="1" stopColor="var(--hub-glow)" />
            </linearGradient>
            {/* Clip al contorno: la arena nunca se sale del vidrio. */}
            <clipPath id={`${gradId}-clip`}>
              <path d="M33 20 L67 20 L50 50 L67 80 L33 80 L50 50 Z" />
            </clipPath>
          </defs>

          {/* Grupo que gira 180° al final del ciclo (flip del reloj). */}
          <g className="hgFlip">
            {/* Arena: recortada al contorno del reloj. */}
            <g clipPath={`url(#${gradId}-clip)`}>
              {/* Arena superior — se vacía hacia el cuello. */}
              <path className="hgSandTop" d="M33 20 L67 20 L50 50 Z" fill="var(--hub-cyan)" />
              {/* Arena inferior — se acumula desde la base. */}
              <path className="hgSandBottom" d="M50 50 L67 80 L33 80 Z" fill="var(--hub-cyan)" />
            </g>

            {/* Hilo de arena cayendo por el cuello. */}
            <line
              className="hgStream"
              x1="50"
              y1="50"
              x2="50"
              y2="72"
              stroke="var(--hub-cyan)"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Tapas superior e inferior. */}
            <line x1="28" y1="15" x2="72" y2="15" stroke={grad} strokeWidth="7" strokeLinecap="round" />
            <line x1="28" y1="85" x2="72" y2="85" stroke={grad} strokeWidth="7" strokeLinecap="round" />
            {/* Contorno del reloj de arena. */}
            <path
              d="M33 20 L67 20 L50 50 L67 80 L33 80 L50 50 Z"
              fill="none"
              stroke={grad}
              strokeWidth="4.5"
              strokeLinejoin="round"
            />
          </g>
        </svg>

        {text && <p className="logoTitle">{text}</p>}
      </div>
    </div>
  );
};

export default FancyLoader;
