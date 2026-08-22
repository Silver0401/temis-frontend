# Diagnóstico y Estrategia de Testing — CronosMD Frontend

**Fecha:** 2026-07-20  
**Fase:** 1 — Diagnóstico (no implementación)

---

## 1. Inventario de Testing

### Frontend (`/Users/ismaelmc/Documents/cronos/frontend/cronos-frontend`)

| Herramienta | Estado | Archivos Clave |
|-------------|--------|----------------|
| **Playwright** | ✅ Configurado | `playwright.config.ts`, `tests/e2e/` |
| **Scripts npm** | ✅ Existentes | `e2e`, `e2e:ui`, `e2e:record`, `e2e:report` |
| **Tests E2E** | ✅ 6 specs | `auth.spec.ts`, `full-flow.spec.ts`, `smoke.spec.ts`, `my-patients.spec.ts`, `patient-validation.spec.ts` |
| **Helpers** | ✅ Completos | `api.ts`, `env.ts`, `giis.ts`, `patients.ts`, `pages/` |
| **Fixtures** | ✅ Con auth por worker | `fixtures.ts` (1 usuario/worker) |
| **Resultados** | ❌ Fallidos | `test-results/` con traces y screenshots |
| **Vitest/Jest** | ❌ No instalado | — |
| **Testing Library** | ❌ No instalado | — |
| **Cypress** | ❌ No instalado | — |

**Total tests:** 25 tests en 5 spec files

### Backend (`/Users/ismaelmc/Documents/cronos/backend/cronos-backend`)

| Herramienta | Estado | Archivos Clave |
|-------------|--------|----------------|
| **Mocha** | ✅ Configurado | `test/`, `test/tsconfig.json` |
| **Scripts npm** | ✅ `test`, `test:giis` | — |
| **Tests de servicio** | ✅ 32+ tests | `test/services/*.test.ts` |
| **Tests de app** | ✅ 2 tests | `app.test.ts`, `client.test.ts` |
| **Playwright** | ❌ No instalado | — |
| **Vitest/Jest** | ❌ No instalado | — |

---

## 2. Diagnóstico: ¿Por qué Playwright NO funcionó?

### Error Capturado

```
TypeError: fetch failed
    at request (tests/e2e/helpers/api.ts:22:15)
    at authenticate (tests/e2e/helpers/api.ts:44:28)
    at ensureTestUser (tests/e2e/helpers/api.ts:97:19)
[cause]: AggregateError
```

### Causa Raíz

**El backend NO está corriendo en `http://localhost:3030` durante la ejecución de E2E.**

Los tests de Playwright intentan:
1. Provisionar usuarios E2E vía `POST /users` en el backend
2. Autenticar vía `POST /authentication`
3. Verificar datos guardados vía `GET /patients`

**Pero el backend no está levantado** → `fetch()` falla con `AggregateError` ( conexión rechazada).

### Configuración Actual

```ts
// playwright.config.ts
webServer: {
  command: "npm run dev",  // ← Solo levanta Next.js :3000
  url: "http://localhost:3000",
  timeout: 180000,
}

// tests/e2e/helpers/env.ts
export const E2E_BACKEND_URL = "http://localhost:3030"  // ← Backend NO se levanta
```

### Problemas Secundarios Identificados

1. **Dependencia del backend real:** Los tests E2E no son autocontenidos — requieren:
   - MongoDB conectado (`mongodb+srv://...`)
   - Backend Feathers corriendo
   - Env `ENV_TYPE=development` para bypass de validación de identidad

2. **Auth frágil:** El fixture `fixtures.ts` usa `ensureTestUser()` que:
   - Crea usuarios nuevos en cada corrida (si no hay cache)
   - Depende de que el backend acepte registros sin validación estricta
   - Tiene retry logic (8 intentos) que enmascara problemas de timing

3. **Selectores de prueba:** Algunos tests usan `getByTestId("input-logMail")` — si el frontend cambia los `data-testid`, los tests rompen.

4. **Paralelismo:** 2 workers × 1 usuario/worker está bien, pero bajo carga alta (IA + flujos largos) hay timeouts de 150s que apenas alcanzan.

---

## 3. Mapeo del Flujo de Registro

### Flujo Principal: Alta de Paciente + Consulta

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (Next.js 14 App Router)                                │
│                                                                 │
│ 1. /dashboard/newPatient/page.tsx                               │
│    - Wizard de 5 pasos:                                         │
│      a) Identidad (nombre, CURP, fecha nac, sexo, género)       │
│      b) Historia Clínica (textarea AI)                          │
│      c) Somatometrías (peso, talla, PA, FC, FR, temp, SpO2)     │
│      d) Diagnósticos (CIE-10 search)                            │
│      e) Confirmación                                            │
│                                                                 │
│ 2. SavePatientForm.tsx (componente central)                     │
│    - useMutation(Synthesize_New_Patient) → Feathers             │
│    - useMutation(Save_Somatometrias_Custom) → Feathers          │
│    - useMutation(Save_Drugs) → Feathers                         │
│    - useMutation(Create_Patient_Orders) → Feathers              │
│                                                                 │
│ 3. feathersFetchCC() (GlobalContext)                            │
│    - Inyecta Authorization: Bearer {JWT}                        │
│    - Maneja toasts de loading/success/error                     │
│    - Registra logs (opcional)                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND (FeathersJS 5 + Koa)                                    │
│                                                                 │
│ Servicio: records                                               │
│   POST /records?synthesize=true                                 │
│   → RecordsService.create()                                     │
│   → Crea documento en colección "records"                       │
│   → Dispara hooks:                                             │
│      - record-router (enruta a sección correcta)               │
│      - patient-diagnoser (extrae diagnósticos)                 │
│                                                                 │
│ Servicio: patients                                              │
│   POST /patients                                                │
│   → PatientsService.create()                                    │
│   → Colección "patients"                                        │
│   → Hook: update-user-patients (vincula médico-paciente)        │
│   → Hook: duplicate-analyzer (detecta duplicados por CURP)      │
│                                                                 │
│ Servicio: somas                                                 │
│   POST /somas                                                   │
│   → Colección "somas"                                           │
│   → Hook: format_somas (normaliza valores)                      │
│                                                                 │
│ Servicio: drugs                                                 │
│   POST /drugs                                                   │
│   → Colección "drugs"                                           │
│                                                                 │
│ Servicio: agenda                                                │
│   POST /agenda                                                  │
│   → Colección "agenda" (citas médicas)                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ MONGODB (Atlas)                                                 │
│                                                                 │
│ Colecciones principales:                                        │
│   - patients: { _id, personalInfo, localizacion, clues, ... }   │
│   - records:  { _id, patientId, sections[], ClinicalHistory }   │
│   - somas:    { _id, patientId, recordId, peso, talla, ... }    │
│   - drugs:    { _id, patientId, recordId, drugs[] }             │
│   - orders:   { _id, patientId, recordId, orders[] }            │
│   - agenda:   { _id, patientId, doctorId, date, ... }           │
│                                                                 │
│ Índices clave:                                                  │
│   - patients: { _id: 1, clues: 1 }                              │
│   - records:  { patientId: 1, _id: -1 }                         │
│   - somas:    { patientId: 1, recordId: 1 }                     │
└─────────────────────────────────────────────────────────────────┘
```

### Puntos de Validación Críticos

| Input | Validación Frontend | Validación Backend | Colección |
|-------|---------------------|-------------------|-----------|
| CURP | Longitud 18, formato válido | `curpPaciente` hook | `patients.personalInfo.curp` |
| Nombre | 2-50 chars, solo letras | — | `patients.personalInfo.names` |
| Fecha nac | ≤ hoy, edad ≤ 120 | — | `patients.personalInfo.birthDate` |
| Peso | Numérico, 1-500 kg | `format_somas` | `somas.peso` |
| Talla | Numérico, 0.1-3.0 m | `format_somas` | `somas.talla` |
| CIE-10 | Catálogo 4 chars | — | `records.sections.differentialDiagnosis` |
| CLUES | Hereda del médico | `scope-by-clues` | `patients.clues[]` |

---

## 4. Estrategias de Testing Viables

### Opción A: Arreglar Playwright E2E (End-to-End Real)

**Qué implica:**
- Levantar backend + MongoDB durante E2E
- Configurar `webServer` múltiple o script wrapper
- Asegurar que `E2E_BACKEND_URL` sea alcanzable

**Pros:**
- ✅ Prueba el flujo **real completo** (input → API → DB → UI)
- ✅ Detecta regresiones visuales y de integración
- ✅ Ya está ~80% implementado (solo falta infraestructura)

**Contras:**
- ❌ **Lento:** 15-25 min por corrida completa (25 tests)
- ❌ **Frágil:** Depende de MongoDB Atlas, red, timing de IA
- ❌ **Complejo:** Requiere backend corriendo en CI/local
- ❌ **Costoso:** Cada test toca DB real (limpieza necesaria)

**Tiempo estimado de fix:** 4-6 horas

---

### Opción B: Tests de Integración API/Servicio (Backend)

**Qué implica:**
- Extender Mocha existente en backend
- Tests que llaman servicios Feathers **directamente** (sin HTTP)
- Usan MongoDB real (o MemoryDB para aislamiento)

**Ejemplo:**
```ts
// test/services/records/patient-registration.test.ts
describe('Patient Registration', () => {
  let app: Application, service: RecordsService;

  before(async () => {
    app = await createTestApp();  // Levanta Feathers sin HTTP
    service = app.service('records');
  });

  after(async () => {
    await app.teardown();
  });

  it('creates patient record from clinical history', async () => {
    const record = await service.create({
      ClinicalHistory: 'Paciente masculino de 45 años con DM2...',
      patientIdentification: { /* ... */ }
    });

    assert.ok(record._id);
    assert.equal(record.sections[0].type, 'ClinicalHistory');
  });
});
```

**Pros:**
- ✅ **Rápidos:** 50-100 ms por test (sin navegador, sin red)
- ✅ **Estables:** Sin dependencias de UI/timing/IA
- ✅ **Aislados:** Cada test puede limpiar su propia data
- ✅ **Cobertura:** Validan lógica de negocio real (hooks, schemas)
- ✅ **Ya existe:** Infraestructura Mocha lista

**Contras:**
- ❌ No prueba la UI (solo API → DB)
- ❌ Requiere escribir tests nuevos (no hay migración automática)

**ROI:** **ALTO** — Mejor bang-for-buck para "que el registro guarde bien"

**Tiempo estimado:** 2-3 horas para 10-15 tests críticos

---

### Opción C: Tests de Componente con Vitest + Testing Library

**Qué implica:**
- Instalar Vitest + React Testing Library
- Tests unitarios de componentes de formulario
- Mock de `feathersFetchCC` y `useMutation`

**Ejemplo:**
```ts
// src/library/BaseForms/SavePatientForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SavePatientForm from './SavePatientForm'

const mockFeathersFetch = vi.fn().mockResolvedValue({ data: { _id: '123' } })

test('acepta nombre válido de 2-50 caracteres', async () => {
  render(<SavePatientForm />, {
    wrappers: [MockGlobalContext({ feathersFetchCC: mockFeathersFetch })]
  })

  fireEvent.change(screen.getByLabelText('Nombre'), {
    target: { value: 'Juan' }
  })

  expect(screen.getByText('Continuar')).toBeEnabled()
})
```

**Pros:**
- ✅ **Rápidísimos:** <10 ms por test
- ✅ **Aislados:** Sin DB, sin red, sin backend
- ✅ **Feedback inmediato:** Detecta errores de UX/validación temprano

**Contras:**
- ❌ **No prueba integración real:** Mocks pueden mentir
- ❌ **Requiere instalar:** Vitest, Testing Library, config
- ❌ **Mantenimiento:** Tests se rompen con cambios de UI
- ❌ **No valida persistencia:** Solo frontend

**ROI:** MEDIO — Bueno para validaciones de formulario, pero no garantiza que se guarde bien

**Tiempo estimado:** 4-5 horas (setup + 5-8 tests)

---

## 5. Recomendación

### Estrategia Ganadora: **Opción B (Tests de Integración Backend)** + **Opción A (E2E arreglado mínimo)**

**Fase 1 (esta semana):** Tests de integración backend
- 10-15 tests que cubran el flujo crítico:
  1. `POST /patients` → valida persistencia de identidad
  2. `POST /records?synthesize=true` → valida síntesis AI + secciones
  3. `POST /somas` → valida normalización de valores
  4. `POST /drugs` → valida lista de medicamentos
  5. `GET /patients/:id` → valida que se recuperen datos completos
  6. Validaciones de CURP, edad, duplicados
  7. Aislamiento por CLUES

**Por qué:**
- ✅ Da confianza de que **los datos se guardan bien** (objetivo principal)
- ✅ Corre en <2 min completo
- ✅ No depende de UI frágil
- ✅ Se puede correr en CI sin complicaciones

**Fase 2 (próxima semana):** Playwright E2E mínimo (smoke)
- Arreglar infraestructura para levantar backend
- Reducir a 3-5 tests **smoke** críticos:
  1. Login válido → dashboard
  2. Alta manual de paciente → aparece en lista
  3. Confirmación visual de datos guardados

**Por qué:**
- ✅ Mantiene red de seguridad E2E
- ✅ Menos mantenimiento (pocos tests, solo flujo happy-path)
- ✅ Detecta regresiones visuales graves

---

## 6. Próximos Pasos (Fase 2)

1. **Crear directorio de tests de integración:**
   ```
   backend/test/integration/
   ├── patient-registration.test.ts
   ├── record-synthesis.test.ts
   ├── somas-validation.test.ts
   └── clues-isolation.test.ts
   ```

2. **Agregar script helper para test app:**
   ```ts
   // test/helpers/test-app.ts
   export async function createTestApp() {
     // Levanta Feathers sin HTTP, con DB de test
   }
   ```

3. **Escribir 10-15 tests críticos** (priorizar validaciones de input → persistencia)

4. **Arreglar playwright.config.ts** para levantar backend (solo smoke tests)

---

## 7. Resumen Ejecutivo

**¿Por qué falló Playwright?**
El backend no estaba corriendo durante los tests E2E. La config de `webServer` solo levanta Next.js, pero los tests necesitan `http://localhost:3030` (Feathers) para provisionar usuarios y verificar datos. Resultado: `TypeError: fetch failed` en todos los tests que llaman a la API.

**Estrategia recomendada:**
Tests de **integración backend (Mocha)** primero — dan el mejor ROI para validar que "el registro guarda bien". Son rápidos (<2 min), estables (sin UI), y prueban la lógica real de persistencia. Playwright E2E déjalo como **smoke mínimo** (3-5 tests) para regresiones visuales graves, una vez que se arregle la infraestructura.