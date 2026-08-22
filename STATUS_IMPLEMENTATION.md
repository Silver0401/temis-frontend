# Status — Performance Debug CronosMD

**Última actualización:** 22 de julio de 2026  
**Fase actual:** FASE 2 COMPLETADA ✅  
**Estado:** Implementación completada — listo para testing

---

## Avance del Diagnóstico

### ✅ Completado
- [x] Mapeo de arquitectura de providers (MainProvider → GlobalContext → DashboardContext)
- [x] Revisión de componentes R3F (HumanModel, HeroAnatomy, ModelCC, CameraRenderer)
- [x] Análisis de configuración de TanStack Query
- [x] Revisión de cliente Feathers y capa de API
- [x] Identificación de patrones de re-render y memory leaks
- [x] Documentación en DECISIONS.md
- [x] Implementación de fixes prioritarios

### ✅ Fixes Implementados

| # | Fix | Archivo(s) | Estado |
|---|-----|------------|--------|
| 1 | `frameloop="demand"` en Canvas | `Model-CC.tsx:19`, `HeroAnatomy.tsx:253` | ✅ Completado |
| 2 | Memoizar materiales + dispose | `HumanModel.tsx:20-33, 81-89, 221-227` | ✅ Completado |
| 3 | Memoizar materiales + dispose | `HeroAnatomy.tsx:53-104, 177-185` | ✅ Completado |
| 4 | `React.memo()` en providers | `globalContext.tsx:80-512` | ✅ Completado |
| 5 | `React.memo()` en providers | `dashboardContext.tsx:54-186` | ✅ Completado |

---

## Cambios Realizados

### 1. Canvas con `frameloop="demand"`

**Antes:**
```tsx
<Canvas shadows className={className} key={className} style={style}>
```

**Después:**
```tsx
<Canvas frameloop="demand" shadows className={className} key={className} style={style}>
```

**Impacto:** El Canvas solo renderiza cuando hay animaciones activas o cambios explícitos. En reposo, FPS caen a ~0.

---

### 2. HumanModel — Materiales memoizados con useRef

**Antes:**
```tsx
material={
  new THREE.MeshBasicMaterial({ /* ... */ })  // Nuevo en cada render
}
```

**Después:**
```tsx
const skinMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
if (!skinMaterialRef.current) {
  skinMaterialRef.current = new THREE.MeshBasicMaterial({ /* ... */ });
} else {
  // Actualiza propiedades sin crear nuevo objeto
  skinMaterialRef.current.color.set(appDaySchema ? "#1b2063" : "#66a0c1");
  skinMaterialRef.current.blending = appDaySchema ? THREE.NormalBlending : THREE.AdditiveBlending;
}

// Cleanup al desmontar
useEffect(() => {
  return () => {
    if (skinMaterialRef.current) {
      skinMaterialRef.current.dispose();
    }
  };
}, []);
```

**Impacto:** Un solo material por instancia, se reutiliza y actualiza. Cleanup garantiza liberación de GPU.

---

### 3. HeroAnatomy — Materiales memoizados con useRef

**Antes:**
```tsx
const materials = useMemo(() => { /* ... */ }, [appDaySchema]);
// Se recreaba con cada cambio de appDaySchema
```

**Después:**
```tsx
const materialsRef = useRef<{ ... } | null>(null);
if (!materialsRef.current) {
  materialsRef.current = { /* inicializar 5 materiales */ };
} else {
  // Actualiza solo propiedades cambiantes (color, blending)
  const m = materialsRef.current;
  m.skin.color.set(appDaySchema ? "#1b2063" : "#66a0c1");
  m.skin.blending = appDaySchema ? THREE.NormalBlending : THREE.AdditiveBlending;
  // ...
}

// Cleanup al desmontar
useEffect(() => {
  return () => {
    materialsRef.current.skin.dispose();
    materialsRef.current.skinRefl.dispose();
    materialsRef.current.bone.dispose();
    materialsRef.current.muscle.dispose();
    materialsRef.current.organs.dispose();
  };
}, []);
```

**Impacto:** 5 materiales inicializados una vez, actualizados in-place. Cleanup completo.

---

### 4. GlobalContextProvider con React.memo()

**Antes:**
```tsx
export const GlobalContextProvider: React.FC<PropsWithChildren<{ debugger: boolean }>> = (props) => {
  // ...
};
```

**Después:**
```tsx
export const GlobalContextProvider = React.memo(({
  children,
  debugger: debuggerMode
}: PropsWithChildren<{ debugger: boolean }>) => {
  // ...
}, (prev, next) => prev.debugger === next.debugger);
```

**Impacto:** Solo re-renderiza si cambia explícitamente el prop `debugger`. Los estados internos no disparan re-renders del provider en sí.

---

### 5. DashboardContextProvider con React.memo()

**Antes:**
```tsx
export const DashboardContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // ...
};
```

**Después:**
```tsx
export const DashboardContextProvider = React.memo(({
  children,
}: PropsWithChildren) => {
  // ...
});
```

**Impacto:** Similar a GlobalContextProvider — evita re-renders innecesarios del provider.

---

## Pruebas Recomendadas

1. **Test de memoria GPU:**
   - Abrir Chrome DevTools → Performance tab
   - Toggle día/noche 10+ veces
   - Verificar que no haya creep de memoria

2. **Test de FPS:**
   - Chrome DevTools → Rendering tab → Show FPS meter
   - En reposo: debería mostrar ~0 FPS (canvas idle)
   - Con animación: debería subir solo durante la animación

3. **Test de re-renders:**
   - React DevTools → Profiler
   - Grabar interacción (toggle schema, abrir modal)
   - Verificar que solo componentes afectados se re-rendericen

4. **Test de uso prolongado:**
   - Dejar la página abierta 30+ min
   - Interactuar normalmente
   - Verificar que no haya degradación

---

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `src/components/Model-CC.tsx` | `frameloop="demand"` en Canvas |
| `src/library/Home/HeroAnatomy.tsx` | `frameloop="demand"`, materiales con useRef + dispose |
| `src/assets/models/HumanModel.tsx` | Materiales con useRef + dispose |
| `src/e2e/globalContext.tsx` | `React.memo()` en provider |
| `src/e2e/dashboardContext.tsx` | `React.memo()` en provider |

---

## Pendientes / Investigación Futura

- [ ] Verificar si hay sockets de Feathers activos y listeners acumulados
- [ ] Virtualización de listas largas (FullCalendar, PatientList)
- [ ] Backend: queries Mongo sin índices
- [ ] HMR / Fast Refresh degradation en desarrollo

---

**Siguiente paso:** Testing en el dev server para validar mejora de performance.