# Contexto Global — MyBrain

> Al iniciar sesión en este proyecto, leer los siguientes archivos para cargar el contexto completo del usuario y sus skills antes de comenzar cualquier tarea.

**CLAUDE.md principal (vault):**
`/Users/ismaelmc/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/CLAUDE.md`

**Skills activas para este proyecto:**
- `/Users/ismaelmc/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Sistema/Skills/Senior Frontend`
- `/Users/ismaelmc/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Sistema/Skills/Senior FullStack`

**Nota de proyecto en Obsidian:**
`/Users/ismaelmc/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/04-Proyectos/CronosMD/Frontend/CronosFrontend.md`

---

# CronosMD — Frontend

Interfaz clínica de CronosMD. Next.js 14 con App Router, Stylus para estilos y React Three Fiber para el modelo 3D del paciente.

**Repositorio:** `/Users/ismaelmc/Documents/cronos-frontend`
**Nota Obsidian:** `MyBrain/04-Proyectos/CronosMD/Frontend/CronosFrontend.md`

---

## Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** React 18 + TypeScript
- **Estilos:** Stylus → compilado a `src/styles/css/Index.css` (NUNCA editar el CSS directamente)
- **API:** `feathersFetchCC` / `axiosFetchCC` del `GlobalContext` — siempre usar estos, no fetch directo
- **State / Queries:** TanStack Query + React Context
- **3D:** Three.js + React Three Fiber + Drei (`src/assets/models/`)
- **PDF:** `@react-pdf/renderer` (`src/library/PDFlayouts/`)
- **Gráficas:** Nivo, Visx
- **Animaciones:** Framer Motion, Anime.js, Lottie React
- **Calendario:** FullCalendar (`src/library/Dashboard/`)
- **Audio/Video:** RecordRTC

---

## Estructura

```
src/
├── app/                              # Next.js App Router — rutas y páginas
│   ├── page.tsx                      # Home / landing
│   ├── layout.tsx                    # Root layout (providers, fuentes)
│   ├── template.tsx                  # Animación entre rutas
│   ├── account/                      # Login / registro
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── dashboard/                    # Interfaz clínica principal (requiere auth)
│   │   ├── page.tsx                  # Lista de pacientes (My Patients)
│   │   ├── layout.tsx
│   │   ├── template.tsx
│   │   ├── myAgenda/page.tsx         # Agenda / FullCalendar
│   │   └── newPatient/               # Flujo de nuevo paciente / consulta
│   │       ├── page.tsx              # Búsqueda o inicio de consulta
│   │       ├── layout.tsx
│   │       ├── template.tsx
│   │       ├── fileAnalyzer/[fileType]/page.tsx   # OCR / análisis de archivos
│   │       ├── patientRecorder/page.tsx            # Grabación de audio de consulta
│   │       └── textTranscriber/page.tsx            # Transcripción manual
│   ├── mobile/                       # Vistas móvil (cámara y micrófono)
│   │   ├── phoneCamera/[userToken]/page.tsx
│   │   └── phoneMic/[userToken]/page.tsx
│   └── shared/
│       └── ClinicalFile/[patientID]/page.tsx       # Expediente compartible (sin auth)
│
├── components/                       # Componentes reutilizables — sufijo -CC obligatorio
│   # Button-CC, Card-CC, Form-CC, Input-CC, Modal-CC, Dropdown-CC
│   # Tabs-CC, Switch-CC, Loader-CC, Legend-CC, LineGraph-CC
│   # PatientSearch-CC, CieSearch-CC, DrugSearch-CC, AnatomySearch-CC
│   # Microphone-CC, Camera-CC, Order-CC, Prescription-CC
│   # QR-CC, PdfViewer-CC, CardsDisplay-CC, CheckList-CC, MindMap-CC
│   # Action-CC, Model-CC, Lottie-CC
│
├── library/                          # Componentes de feature — organizados por dominio
│   ├── Account/                      # LogRegister, MyProfile, VerifyID, NewsSection
│   ├── BaseForms/                    # SavePatientForm, LabsForm, SomasForm, ImgsForm, ConfirmMedRecord
│   ├── Dashboard/                    # SideNav, DashboardRegistry, ChAITextArea
│   │                                 # OrdersMaker, Prescriber, DfdxIntegrator
│   │                                 # MiniPatient, PatientLineDisplay, AddNewDocForm, Configuration
│   ├── Records/                      # ClinicalHistory, ClinicalModel (vista 3D del paciente)
│   │   ├── SectionsRegistry.tsx      # Registro de secciones del expediente
│   │   └── Sections/                 # DifferentialDiagnosis, Laboratories, DrugsAndSupplements
│   │                                 # Somatometrias, GabinetImgs, RequestStudies
│   │                                 # NutritionalIntervention, HistoryVersions
│   ├── Home/                         # Secciones de landing: Hero, Features, Pricing, etc.
│   ├── ModelCC/                      # CameraRenderer, ModelRenderer (Three.js / R3F)
│   ├── Nav/                          # AI-assistant (asistente flotante)
│   ├── PDFlayouts/                   # OrderPDF, PrescriptionPDF
│   ├── Generics/                     # NotFound, AiLoader, FancyLoader
│   ├── GlobalModalComps/             # QRImgUpload
│   └── Debuggers/                    # MainDebugger (solo desarrollo)
│
├── e2e/                              # Contextos globales y capa de API
│   ├── MainProvider.tsx              # Wrapper de todos los providers (orden importa)
│   ├── globalContext.tsx             # Auth, color schema, feathersFetchCC, axiosFetchCC
│   ├── dashboardContext.tsx          # Estado de consulta activa, paciente en pantalla
│   ├── queryContext.tsx              # TanStack Query client provider
│   └── server/
│       ├── AxiosAPI.ts               # Funciones HTTP con axios (login, endpoints REST)
│       ├── FeathersAPI.ts            # Queries y mutations via Feathers
│       └── Queries.ts               # TanStack Query hooks (useQuery, useMutation)
│
├── assets/
│   ├── models/
│   │   ├── HumanModel.tsx            # Modelo 3D completo del cuerpo (R3F)
│   │   └── IndividualAnatomy.tsx     # Parte anatómica individual seleccionable
│   ├── lotties/                      # ~30 animaciones Lottie (JSON)
│   ├── catalogos/CIE-10-2024.json    # Catálogo de diagnósticos CIE-10
│   ├── icons/IconsCC.tsx             # Iconos personalizados como componentes React
│   ├── logos/                        # Logo de CronosMD
│   └── base64/CronosLogo.ts         # Logo en base64 para PDFs
│
├── scripts/
│   ├── Anatomy.tsx                   # Lógica de selección de anatomía 3D
│   ├── Constants.ts                  # Constantes globales (GlobalModalDefault, DefaultSessionData, etc.)
│   └── Generator.tsx                 # Generadores de datos / utilidades
│
└── styles/
    ├── stylus/                       # ← AQUÍ SE EDITAN LOS ESTILOS
    │   ├── Index.styl                # Entry point de Stylus (importa todo)
    │   ├── Mixins.styl               # Mixins reutilizables
    │   ├── MiniClasses.styl          # Clases utilitarias
    │   ├── Components/               # Estilos de cada componente -CC
    │   ├── Dashboard/                # Estilos de vistas del dashboard
    │   ├── Medical/                  # Estilos de expediente clínico
    │   ├── Home/                     # Estilos de la landing
    │   ├── Account/                  # Estilos de login/registro
    │   ├── Mobile/                   # Estilos de vistas móvil
    │   ├── Shared/                   # Estilos de vistas compartidas
    │   └── Generics/                 # Estilos genéricos (loaders, modales, etc.)
    └── css/Index.css                 # ← OUTPUT compilado (no editar)
```

---

## Reglas de Desarrollo

### Estilos
- Todo en Stylus: `src/styles/stylus/`
- Cada componente y sección tiene su propio `.styl` — **nunca usar `style={{}}` inline en TSX**
- El watch corre con `npm run stylus` (incluido en `npm run dev`)
- **Nunca** editar `src/styles/css/Index.css` directamente
- Correspondencia obligatoria entre archivos de componente y su `.styl`:
  - `src/components/Input-CC.tsx` → `src/styles/stylus/Components/InputCC.styl`
  - `src/components/Button-CC.tsx` → `src/styles/stylus/Components/ButtonCC.styl`
  - `src/components/Form-CC.tsx` → `src/styles/stylus/Components/FormCC.styl`
  - `src/components/Modal-CC.tsx` → `src/styles/stylus/Components/ModalCC.styl`
  - *(mismo patrón para todos los `-CC`)*
  - `src/library/Account/*.tsx` → `src/styles/stylus/Account/*.styl`
  - `src/library/Dashboard/*.tsx` → `src/styles/stylus/Dashboard/*.styl`
  - `src/library/Records/*.tsx` → `src/styles/stylus/Medical/*.styl`
  - `src/library/Home/*.tsx` → `src/styles/stylus/Home/*.styl`
- Para estados dinámicos (activo/inactivo, niveles) usar `data-*` attributes en el TSX y seleccionarlos desde el `.styl` con `[data-x="y"]`
- **Antes de hardcodear un color**, revisar `src/app/globals.css` — si ya existe una variable con un color similar (`--red`, `--green`, `--yellow`, `--primary`, `--tertiary`, etc.), usar esa variable. Solo se puede hardcodear si no hay ningún equivalente en la paleta
- **Al agregar o modificar variables CSS globales**, hacerlo obligatoriamente en **dos lugares**:
  1. `src/app/globals.css` — valor inicial / modo noche (default)
  2. `src/library/Home/Nav.tsx` — en ambos bloques del `useEffect` de `appDaySchema`: el bloque `if (appDaySchema)` (día) y el bloque `else` (noche). Nav.tsx es donde se sobreescriben las variables dinámicamente al cambiar el schema
- Existe la convención `--[color]-inverted` (ej: `--red-inverted`, `--green-inverted`, `--yellow-inverted`) para usar cuando el fondo del componente es distinto al schema general — por ejemplo, un componente con fondo claro dentro de un schema oscuro. Usar `--red` cuando el color es para el schema estándar; usar `--red-inverted` cuando el componente tiene fondo invertido

### Componentes
- Componentes reutilizables llevan sufijo `-CC` (ej: `Button-CC.tsx`)
- Viven en `src/components/`
- Componentes de feature complejos van en `src/library/[dominio]/`
- **Cada componente tiene su archivo `.styl` correspondiente** — cualquier cambio visual se hace ahí, no con `style={{}}` inline

### API Calls
- **Feathers services** → `feathersFetchCC({ service, method, data, query, ... })` del `GlobalContext`
- **REST / auth** → `axiosFetchCC({ route, method, data, ... })` del `GlobalContext`
- Ambas funciones manejan: auth header automático, toasts de loading/success/error, y registro de logs
- Nunca hacer `fetch()` directo ni instanciar axios manualmente en componentes
- Las queries de TanStack Query se definen en `src/e2e/server/Queries.ts`

### Contextos
- `GlobalContext` — disponible en toda la app: auth token, color schema día/noche, feathersFetchCC, axiosFetchCC, globalModal
- `DashboardContext` — solo dentro de `/dashboard/`: paciente activo (`showPatient`), datos de sesión de consulta (`currentSessionData`), estado del dashboard (`dashboardState`)
- `QueryContext` — TanStack Query client

### Color Schema
- `appDaySchema: boolean` en `GlobalContext` — cambia automáticamente según la hora (día: `true` de 5am a 6pm)
- Usar este estado para clases condicionales en Stylus

---

## Scripts

```bash
npm run dev    # Next.js + watch Stylus + QR local (.env.dev)
npm run prod   # Next.js + watch Stylus + QR (.env.prod)
npm run local  # Next.js + watch Stylus + QR (.env.local)
npm run build  # Build de producción
npm run stylus # Solo el watch de Stylus
```

## Variables de Entorno

- `.env.dev` / `.env.prod` / `.env.local`
- `NEXT_PUBLIC_NOT_BACKEND_URL` — URL del backend Cronos
