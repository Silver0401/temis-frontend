"use client";

import { useEffect, useState } from "react";
import LogoCC from "@/components/Logo-CC";

const STORAGE_KEY = "cronos-route-loader";
const SQUARES = 13;

const getActiveState = () => {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(STORAGE_KEY) === "1";
};

const syncEventName = "cronos-route-loader-change";

export const setRouteTransitionLoader = (active: boolean) => {
  if (typeof window === "undefined") return;

  if (active) {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
  } else {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }

  window.dispatchEvent(new Event(syncEventName));
};

const RouteTransitionLoader: React.FC = () => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => setActive(getActiveState());
    sync();
    window.addEventListener(syncEventName, sync);
    return () => window.removeEventListener(syncEventName, sync);
  }, []);

  if (!active) return null;

  // Puente: continúa el frame final del intro (cuadros llenos + logo) mientras
  // el dashboard monta y verifica sesión. No reanima desde 0 → no hay corte.
  // El logo aparece instantáneo (monta ya con data-visible) sin re-transicionar.
  return (
    <div className="IntroLoader IntroLoader--persistent">
      <div className="IntroLoader__content" data-hidden={true}>
        <span className="IntroLoader__counter">100%</span>
        <div className="IntroLoader__squares">
          {Array.from({ length: SQUARES }, (_, i) => (
            <div key={i} className="IntroLoader__square" data-lit={true} />
          ))}
        </div>
        <p className="IntroLoader__label">SINCRONIZANDO SESIÓN</p>
      </div>

      <div className="IntroLoader__logo" data-visible={true}>
        <LogoCC />
      </div>
    </div>
  );
};

export default RouteTransitionLoader;
