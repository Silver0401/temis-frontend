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
