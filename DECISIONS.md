# Decisiones de Performance — CronosMD Frontend

**Fecha:** 22 de julio de 2026  
**Autor:** Agente de Diagnóstico  
**Estado:** Fase 1 completada — Diagnóstico pendiente de implementación

---

## Contexto

CronosMD en desarrollo se volvió "insoportablemente lento" con el tiempo. La Mac se traba y la página se arrastra. El problema fue **progresivo**, no repentino.

---

## Hallazgos Rankeados por Impacto

### 🔴 #1 — Materiales de Three.js recreados en cada render (MEMORY LEAK PROGRESIVO)

**Archivos:**
- `src/assets/models/HumanModel.tsx:93-108`
- `src/library/Home/HeroAnatomy.tsx:56-99`

**Problema:**
```tsx
// HumanModel.tsx:93-108 — Material creado inline en cada render
material={
  new THREE.MeshBasicMaterial({
    color: appDaySchema ? "#1b2063" : "#66a0c1",
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    blending: appDaySchema ? THREE.NormalBlending : THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
}
```

**Evidencia:**
- Cada vez que `appDaySchema` cambia o el padre re-renderiza, se instancia un **nuevo material**
- Los materiales anteriores **nunca se liberan** (no hay `dispose()`)
- Se acumulan en memoria GPU → degradación progresiva

**En HeroAnatomy.tsx:**
- Línea 56-99: Usa `useMemo` pero con `appDaySchema` en dependencias
- Cada toggle día/noche recrea los 5 materiales (skin, skinRefl, bone, muscle, organs)

**Impacto estimado:** 60-70% del problema total  
**Costo de fix:** Bajo  
**Riesgo:** Bajo

**Fix propuesto:**
```tsx
// Opción A: useRef para materiales mutables
const materialsRef = useRef<{ skin: THREE.MeshBasicMaterial; ... } | null>(null);
if (!materialsRef.current) {
  materialsRef.current = { /* inicializar */ };
}

// Opción B: useMemo con dependencias estables + dispose en cleanup
const materials = useMemo(() => ({ /* ... */ }), [/* dependencias estables */]);
useEffect(() => () => {
  materials.skin.dispose();
  materials.bone.dispose();
  // ...
}, [materials]);
```

---

### 🔴 #2 — Canvas R3F sin `frameloop="demand"` (RENDER INFINITO A 60FPS)

**Archivos:**
- `src/components/Model-CC.tsx:19`
- `src/library/Home/HeroAnatomy.tsx:253`

**Problema:**
```tsx
<Canvas shadows className={className} key={className} style={style}>
  {/* Sin frameloop="demand" → render loop continuo incluso sin animación */}
</Canvas>
```

**Evidencia:**
- R3F renderiza a 60fps por defecto aunque no haya animación
- `ModelRenderer.tsx:13-29` usa `useFrame` solo para animaciones, pero el Canvas sigue renderizando
- Múltiples Canvas activos (HeroAnatomy + ClinicalHistory) = costo multiplicado

**Impacto estimado:** 20-30% del problema total  
**Costo de fix:** Mínimo (5 min)  
**Riesgo:** Mínimo

**Fix propuesto:**
```tsx
<Canvas frameloop="demand" shadows className={className} style={style}>
  {/* Solo renderiza cuando hay cambios o animaciones activas */}
</Canvas>
```

---

### 🟡 #3 — Context Providers sin memoización (RE-RENDERS EN CASCADA)

**Archivos:**
- `src/e2e/globalContext.tsx:480-517`
- `src/e2e/dashboardContext.tsx:145-185`

**Problema:**
```tsx
// globalContext.tsx:480
return (
  <GlobalContext.Provider value={{
    appDaySchema, setAppDaySchema, feathersFetchCC, axiosFetchCC,
    globalModal, registerLog, demoMode, setDemoMode, setGlobalModal,
  }}>
    {props.children}  // ← Todo re-rendera con cualquier cambio
  </GlobalContext.Provider>
)
```

**Evidencia:**
- Providers no usan `React.memo()`
- Cambios en `appDaySchema` (día/noche) disparan re-render global
- Cambios en `globalModal` disparan re-render global
- Cambios en `currentSessionData` disparan re-render de todo el dashboard

**Impacto estimado:** 15-25% del problema total  
**Costo de fix:** Bajo (30 min)  
**Riesgo:** Bajo (requiere testing de interacciones)

**Fix propuesto:**
```tsx
// Opción A: Memoizar el provider
export const GlobalContextProvider = React.memo(({ children, debugger }) => {
  // ...
}, (prev, next) => prev.debugger === next.debugger);

// Opción B: Split de contexts (más invasivo)
// - AuthContext (token, login/logout)
// - SchemaContext (appDaySchema)
// - ModalContext (globalModal)
```

---

### 🟡 #4 — Feathers Client: Posible acumulación de listeners de socket

**Archivo:**
- `src/e2e/client/feathersClient.ts:10-22`
- `src/e2e/globalContext.tsx:104`

**Problema potencial:**
```tsx
// feathersClient.ts:14-17
const api = feathers();
const restClient = rest(process.env.NEXT_PUBLIC_NOT_BACKEND_URL!);
api.configure(restClient.fetch(window.fetch.bind(window)));
```

**Evidencia:**
- package.json incluye `@feathersjs/socketio-client` (línea 22)
- No se encontró uso explícito de sockets en el código analizado
- Si hay sockets, no hay cleanup de listeners en unmount

**Impacto estimado:** 5-10% (solo si hay sockets activos)  
**Costo de fix:** Medio (1 hr)  
**Riesgo:** Medio (puede afectar real-time)

**Fix propuesto:**
```tsx
// Investigar si hay servicios usando socketio
// Si sí, agregar cleanup en useEffect del provider
useEffect(() => {
  const api = getFeathersClient();
  return () => {
    api?.io?.close(); // o api.io.removeAllListeners()
  };
}, []);
```

---

### 🟡 #5 — useFrame con cálculos pesados (HeroAnatomy)

**Archivo:**
- `src/library/Home/HeroAnatomy.tsx:102-174`

**Problema:**
```tsx
useFrame((state, delta) => {
  // Cálculos en cada frame:
  // - smoothstep para 5 materiales
  // - Bucle for sobre PHASE_AT (3 iteraciones)
  // - Múltiples asignaciones de posición/rotación/escala
  // - state.camera.lookAt() en cada frame
  smoothPRef.current += (progressRef.current - smoothPRef.current) * Math.min(1, delta * 6);
  // ... 70 líneas de lógica
})
```

**Impacto estimado:** 5-10% (solo en Home/Landing)  
**Costo de fix:** Medio (2 hrs)  
**Riesgo:** Bajo

**Fix propuesto:**
```tsx
// Extraer cálculos fuera del frame loop cuando sea posible
// Usar renderPriority para bajar prioridad
useFrame(({ clock }, delta) => {
  // Solo actualizar si hay cambio en progressRef
  if (Math.abs(progressRef.current - smoothPRef.current) > 0.001) {
    // ... cálculos
  }
}, -1); // Prioridad baja
```

---

## Fixes Prioritarios (Quick Wins)

| Fix | Archivo | Tiempo | Impacto | Riesgo |
|-----|---------|--------|---------|--------|
| 1. `frameloop="demand"` | `Model-CC.tsx`, `HeroAnatomy.tsx` | 5 min | Alto | Mínimo |
| 2. Memoizar materiales + dispose | `HumanModel.tsx`, `HeroAnatomy.tsx` | 30 min | Alto | Bajo |
| 3. `React.memo()` en providers | `globalContext.tsx`, `dashboardContext.tsx` | 30 min | Medio | Bajo |

**Impacto total estimado:** 70-80% de recuperación de performance

---

## Pendientes de Investigación

- [ ] Verificar si hay sockets de Feathers activos y listeners acumulados
- [ ] Revisar componentes de listas (FullCalendar, PatientList) por virtualización
- [ ] Analizar backend: queries Mongo sin índices, populate excesivo
- [ ] Medir bundle size y HMR en desarrollo (Next.js Fast Refresh)

---

## Notas de Implementación

**NUNCA hacer:**
- Editar `src/styles/css/Index.css` directamente
- Usar `style={{}}` inline en componentes
- Commit/push sin aprobación explícita

**Convenciones:**
- Stylus: `src/styles/stylus/` → cada componente tiene su `.styl`
- Componentes: sufijo `-CC` obligatorios
- API: usar siempre `feathersFetchCC` / `axiosFetchCC` del GlobalContext

---

## Referencias

- [R3F Performance](https://docs.pmnd.rs/react-three-fiber/advanced/performance)
- [Three.js Memory Management](https://threejs.org/docs/#manual/en/introduction/How-to-dispose-of-objects)
- [React Context Performance](https://react.dev/reference/react/useContext#avoiding-re-renders)

---

## 2026-07-23 - Alta externa por QR / link

- La tarjeta `QR / Link` generara una URL publica con el `_id` del medico autenticado; `Agenda` sera solo visual en este alcance.
- La pagina publica recolectara exclusivamente identificacion del paciente y llamara al servicio publico de alta; no usara login, IA ni historia clinica.
- La pagina publica vivira fuera de `/dashboard` para no heredar el guard de autenticacion.

## 2026-08-24 — Versionador interactivo en pre-commit

`scripts/bump-version.js` (heredado del fork de Cronos) ya estaba en el repo pero **nunca se activó**: el hook vive en `.git/hooks/pre-commit`, que git no versiona. Se instaló el hook en este repo y se cambió el encabezado de "Versionamiento CronosMD" a "Versionamiento Temis".

Ahora cada `git commit` pregunta el tipo de cambio y sube `package.json` en el nivel correspondiente (`MAJOR.SYSTEM.FEATURE.PATCH`), dejando el `package.json` ya en stage:

- `[1]` Small Feature — bug fix, diseño → 4º dígito
- `[2]` Big Feature — componente nuevo → 3º
- `[3]` System Feature — sistema completo → 2º
- `[4]` Mayor Reworkout — cambio total de flujo → 1º
- `[0]` Omitir — commitea sin tocar la versión

**Importante:** el hook no se clona. En cada máquina/clon nuevo hay que correr una vez:

```bash
bash scripts/install-version-hook.sh
```

## 2026-08-24 — Rediseño de MyProfile según mockup de cuenta

### Segunda pasada (mismo día) — copia fiel del mockup

La primera versión conservaba la estructura de dos paneles con scroll independiente y tipografía chica; no se parecía lo suficiente. Se rehizo copiando los valores del mockup uno a uno:

- **Scroll único con panel sticky.** `.ProfileSection` es ahora el contenedor que scrollea y `.ProfileLayout` es un grid `300px minmax(0, 1fr)` con `align-items: start`; `.ProfileLeftPanel` va `position: sticky`. Antes cada panel scrolleaba por su cuenta, que es lo que se sentía distinto.
- **Tipografía del mockup.** `h1` pasó de `clamp(22px, 2.6vw, 30px)` a `clamp(2.2rem, 5vw, 4.6rem)` con `line-height: .92` y `letter-spacing: -.055em`. Títulos de card en mayúsculas con `letter-spacing: .08em`.
- **Detalle del panel de identidad:** cover de 102px con las iniciales gigantes de fondo (`content: attr(data-initials)`), avatar de 92px montado sobre el cover con `margin-top: -48px` y borde de 6px del color de superficie, marca de verificado con borde de 4px, stats con separadores arriba/abajo y divisor central en vez de cajas.
- **Campos en caja.** `.ProfileField` ahora es una caja con borde, fondo y `text-overflow: ellipsis`, como en el mockup. Cédulas en grid `110px 1fr auto`; filas de trabajo con etiqueta arriba y valor abajo; verificación en grid `1fr 74px`.
- **Botones propios** (`.ProfileLogout`, `.ProfileModalBtn`) en vez de `ButtonCC`, para poder replicar el tratamiento del mockup.

**Tintes translúcidos con `color-mix`.** El mockup usa `rgba()` literales sobre colores fijos; Temis voltea sus tokens según el esquema, así que los tintes se hacen con `color-mix(in srgb, var(--token) N%, transparent)`. Ya se usaba en el repo, así que no introduce nada nuevo.

**Gotcha de Stylus:** `in` es un operador de Stylus, así que `color-mix(in srgb, …)` revienta el parser con `illegal unary "in"`. Hay que envolver el valor completo en `unquote("…")`.

Se aplicó a `src/library/Account/MyProfile.tsx` y al bloque `.ProfileSection` de `src/styles/stylus/Account/Account.styl` el diseño del mockup `MyBrain/04-Proyectos/CronosMD/Branding y Marketing/mockup-cuenta-medico.html`.

**Qué se portó:** encabezado de página (eyebrow + título + chip de ID), panel de identidad con cover en degradado, avatar con marca de verificado, badge de profesión, stats, cards numeradas 01/02/03 con `card-head`, filas etiqueta/valor para Lugar de trabajo y Verificación de identidad, grid inferior de dos columnas y modal de confirmación al cerrar sesión (reusa `ModalCC`).

**Qué NO se portó, y por qué:**

- **Paleta del mockup (cyan `#18d7ff` / azul `#4b6bff`, Arial Black).** Se mapeó a los tokens de Temis (`--lp-accent`, `--lp-glass-*`, `--lp-text-*`, `--font` Audiowide). Copiarla tal cual habría dejado el perfil con identidad de CronosMD.
- **`backdrop-filter: blur()`** del `.glass` del mockup. Está prohibido en Temis por costo en hardware modesto (ver nota en `globals.css` y la entrada previa de este archivo). Los fondos glass quedan sólidos con `--lp-glass-bg*`.
- **Sección "Perfil público"** (bridge con URL, botón copiar y miniatura del sitio). Temis no tiene servicio `public-profiles` ni ruta de perfil público; es funcionalidad exclusiva de CronosMD.
- **Vista "Configuración y datos"** (formulario editable, nav de secciones, guardado). Decisión del usuario: solo rediseño visual. Por lo mismo se omitió el botón `⚙ Configuración y datos` del encabezado, para no dejar un control muerto.
- **`app-shell` / `app-rail` / topbar / breadcrumbs.** Temis ya tiene su propia navegación; no son parte de MyProfile.

**Implementado directamente por Claude, no por Codex:** el contexto (mockup, componente y hoja de estilos) ya estaba cargado y el cambio se limita a dos archivos; delegarlo habría obligado a re-derivar todo.

**Verificación:** `npx stylus src/styles/stylus --out src/styles/css/Index.css` compila sin error y `npx tsc --noEmit` pasa limpio. No se verificó visualmente — pendiente de que el usuario levante `npm run local`. Nota: `npm run local` ya corre `stylus -w`, así que en dev recompila solo; `src/styles/css/Index.css` está versionado y quedó recompilado en este cambio.

**Detalles de compatibilidad resueltos durante la implementación:**

- **Móvil ≤800px.** `.innerAccountContainer` está fijo en `height: 800px` en ese breakpoint. Al pasar los paneles a `overflow: visible` para el layout en columna, el contenido quedaba recortado sin nada que lo scrolleara. Se le dio `overflow-y: auto` a `.ProfileSection` misma en el media query.
- **Esquema día/noche.** `ThemeSync` voltea `--white` (y con él `--lp-text-1`), `--lp-glass-bg*`, `--lp-accent` y `--bg`, así que los tokens usados son seguros en ambos modos. Las iniciales del avatar se dejaron en `var(--bg)` —como estaban antes— porque `var(--secondary)` no contrasta contra el degradado en modo noche.
- **Fondo del modal.** `ModalCC` sin prop `schema` cae en `.Schema-day`, que pinta `var(--lp-bg-mid-inverse)`; esa variable solo la define `SchemaSwitch-CC`, que no corre en `/account`. Se le puso fondo propio a `.ProfileLogoutModal` con `var(--lp-bg-mid)`, que sí está en `globals.css` y sí voltea con el tema.
- **Ojo al compilar Stylus a mano.** `npx stylus src/styles/stylus --out src/styles/css/Index.css` (los mismos args del script `stylus`) compila cada `.styl` por separado y se pisan entre sí: deja un `Index.css` de 220 bytes. Para un build de una sola pasada hay que apuntar al archivo raíz: `npx stylus src/styles/stylus/Index.styl --out src/styles/css/Index.css`. En dev no se nota porque `-w` recompila en cada cambio.
