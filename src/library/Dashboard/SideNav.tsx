"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
import LogoCC from "@/components/Logo-CC";
import Link from "next/link";
import SchemaSwitchCC from "@/components/SchemaSwitch-CC";
import { usePathname } from "next/navigation";
import { DashboardStatesObject } from "./DashboardRegistry";
import { useDashboardSections } from "./DashboardSectionsContext";
import { DashboardContext } from "@/e2e/dashboardContext";
import IconsCC from "@/assets/icons/IconsCC";

// Estados que viven en la sección "Acciones" del SideNav (entradas de flujo).
const ACTION_STATES: DashboardStates[] = ["New Patient", "Add Document"];

// Estados que existen en el registro pero no se ofrecen en la navegación.
// Add Document y Consents se retiraron del menú a petición del usuario; sus
// rutas siguen vivas.
const HIDDEN_STATES: DashboardStates[] = ["Add Document", "Consents"];

const FAB_SIZE = 56; // px — diámetro de la bolita flotante
const DRAG_THRESHOLD = 4; // px — movimiento mínimo para distinguir drag de tap
const FAB_POS_KEY = "cronosSideNavFabPos";

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const SideNav = () => {
  const pathname = usePathname();
  // 'expanded' = sidebar ancha con labels · 'collapsed' = solo iconos (desktop)
  const [navMode, setNavMode] = useState<"expanded" | "collapsed">("expanded");

  // ── Mobile: SideNav vive como bolita flotante (FAB) arrastrable ──
  const [isMobile, setIsMobile] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 800px)").matches,
  );
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [fabPos, setFabPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  const { dashboardState, goToDashboardPage, setDashboardState } =
    useContext(DashboardContext);
  const allowedSections = useDashboardSections();

  // Una sección se ofrece si el rol la tiene y no está retirada del menú.
  const isVisible = (key: DashboardStates) =>
    allowedSections.includes(key) && !HIDDEN_STATES.includes(key);

  const visibleEntries = Object.entries(DashboardStatesObject).filter(([key]) =>
    isVisible(key as DashboardStates),
  ) as Array<[DashboardStates, DashboardSectionProps]>;
  const generalEntries = visibleEntries.filter(
    ([key]) => !ACTION_STATES.includes(key),
  );
  const actionEntries = visibleEntries.filter(([key]) =>
    ACTION_STATES.includes(key),
  );

  const toggleNav = () =>
    setNavMode((m) => (m === "expanded" ? "collapsed" : "expanded"));

  // ── Detectar viewport mobile ──
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 800px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // ── Cargar posición guardada de la bolita ──
  useEffect(() => {
    const saved =
      typeof window !== "undefined" && window.localStorage.getItem(FAB_POS_KEY);
    if (saved) {
      try {
        setFabPos(JSON.parse(saved));
      } catch {
        /* posición corrupta — se reinicia abajo */
      }
    }
  }, []);

  // ── Posición default de la bolita (esquina inferior izquierda) ──
  useEffect(() => {
    if (isMobile && fabPos === null) {
      setFabPos({ x: 16, y: window.innerHeight - FAB_SIZE - 20 });
    }
  }, [isMobile, fabPos]);

  // ── Drag de la bolita (pointer events: mouse + touch) ──
  const onFabPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: fabPos?.x ?? 0,
      origY: fabPos?.y ?? 0,
      moved: false,
    };
  };

  const onFabPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)
      d.moved = true;
    if (d.moved) {
      setFabPos({
        x: clamp(d.origX + dx, 6, window.innerWidth - FAB_SIZE - 6),
        y: clamp(d.origY + dy, 6, window.innerHeight - FAB_SIZE - 6),
      });
    }
  };

  const onFabPointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    if (!d.moved) {
      // tap puro → expandir panel
      setMobileOpen(true);
    } else if (fabPos) {
      // fin de arrastre → persistir posición
      window.localStorage.setItem(FAB_POS_KEY, JSON.stringify(fabPos));
    }
  };

  const RenderSiderButton = ({
    identifier,
    route,
    svg,
    label,
    count,
  }: {
    identifier: DashboardStates;
    route: string;
    svg: React.ReactElement;
    label: string;
    count?: string;
  }) => {
    return (
      <Link
        key={identifier}
        className={`sbItem ${identifier === dashboardState ? "selected" : ""}`}
        href={route}
        onClick={() => {
          if (isMobile) setMobileOpen(false);
          setTimeout(() => {
            goToDashboardPage(identifier);
          }, 100);
        }}
      >
        <span className="sbIcon">{svg}</span>
        <span className="sbLabel">{label}</span>
        {count ? <span className="sbCount">{count}</span> : null}
      </Link>
    );
  };

  // --------- On Render SideNav Update it depending on the URL path ---------
  useEffect(() => {
    if (pathname) {
      Object.entries(DashboardStatesObject).map((entry) => {
        const [key, value] = entry as [
          key: DashboardStates,
          value: DashboardSectionProps,
        ];

        if (!allowedSections.includes(key)) return;

        if (value.Route === pathname) {
          goToDashboardPage(key);
        } else {
          // Sub-rutas de las acciones (p.ej. /dashboard/newPatient/patientRecorder
          // o /dashboard/addDocument/...) mantienen marcada su entrada de acción.
          if (ACTION_STATES.includes(key)) {
            if (pathname === value.Route) {
              goToDashboardPage(key);
            } else if (pathname.includes(value.Route)) {
              setDashboardState(key);
            }
          }
        }
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, allowedSections]);

  // ── Contenido del nav (reutilizado por desktop y por el panel mobile) ──
  const navInner = (
    <nav className="SideNav">
      <div className="sbShine" />

      {/* Brand — click colapsa/expande (desktop) */}
      <div className="sbBrand" onClick={isMobile ? undefined : toggleNav}>
        <LogoCC />
      </div>

      {generalEntries.length ? (
        <>
          <span className="sbSectionLabel">General</span>
          <div className="ulWrapper">
            <ul>
              {generalEntries.map(([key, value]) =>
                RenderSiderButton({
                  identifier: key,
                  route: value.Route,
                  svg: value.Icon,
                  label: value.Title,
                }),
              )}
            </ul>
          </div>
        </>
      ) : null}

      {actionEntries.length ? (
        <>
          <span className="sbSectionLabel">Acciones</span>
          <div className="ulWrapper">
            <ul>
              {actionEntries.map(([key, value]) =>
                RenderSiderButton({
                  identifier: key,
                  route: value.Route,
                  svg: value.Icon,
                  label: value.Title,
                }),
              )}
            </ul>
          </div>
        </>
      ) : null}

      <div className="sbSpacer" />

      <span className="sbSectionLabel">Preferencias</span>
      <div className="sbFoot">
        <Link
          className="sbItem"
          href="/account"
          onClick={() => {
            if (isMobile) setMobileOpen(false);
          }}
        >
          <span className="sbIcon">{IconsCC.Face}</span>
          <span className="sbLabel">Perfil</span>
        </Link>

        <div className="sbThemeRow">
          <span className="sbThemeLabel">Tema</span>
          <SchemaSwitchCC />
        </div>
      </div>
    </nav>
  );

  // ════════════ MOBILE ════════════
  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div
            className="SideNavMobileBackdrop"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div
          className={`SideNavContainer is-mobile ${
            mobileOpen ? "mobile-open" : "mobile-fab"
          }`}
          style={
            !mobileOpen && fabPos
              ? { left: fabPos.x, top: fabPos.y }
              : undefined
          }
        >
          {mobileOpen ? (
            navInner
          ) : (
            <button
              type="button"
              className="sbFab"
              aria-label="Abrir menú"
              onPointerDown={onFabPointerDown}
              onPointerMove={onFabPointerMove}
              onPointerUp={onFabPointerUp}
            >
              <LogoCC />
            </button>
          )}
        </div>
      </>
    );
  }

  // ════════════ DESKTOP ════════════
  return (
    <div
      className="SideNavContainer"
      id={`nav-${navMode}`}
      onMouseEnter={() => setNavMode("expanded")}
      onMouseLeave={() => setNavMode("collapsed")}
    >
      {navInner}
    </div>
  );
};

export default SideNav;
