# STATUS — Cronos Frontend (Worker OpenCode)

## Snapshot TEMIS - 2026-08-26

- Auditoria movil completa para las 19 rutas solicitadas en 360, 390, 430 y 768 px.
- Correcciones aplicadas solo en Stylus y CSS compilado; detalle por ruta en `AUDITORIA-MOVIL.md`.
- Stylus y TypeScript pasan. CSS compilado: 355835 bytes.
- Pendientes que requieren TSX documentados, sin editarlos.
- Trabajo paralelo detectado en `globalsCC.d.ts`, `src/app/dashboard/myTeam/page.tsx`, `src/app/dashboard/newPatient/page.tsx`, `src/e2e/server/FeathersAPI.ts`, `src/library/BaseForms/SavePatientForm.tsx`, `src/library/Dashboard/DashboardRegistry.tsx`, `src/library/Dashboard/MedicalTeam.tsx`, `src/library/Dashboard/TeamInvitations.tsx` y `src/library/Dashboard/useTutors.ts`; no pertenece a esta auditoria y no se revirtio.

Última actualización: 2026-07-23

## Rama y repo
- Repo: `/Users/ismaelmc/Documents/cronos/frontend/cronos-frontend`
- Rama: `dev` (NO cambiar)
- Cambios sin commitear ya presentes en `dev` (dados por HECHOS, no re-trabajados).

## Tareas asignadas
- [x] **Tarea 1 — Verificar interfaces por rol** → veredicto por rol abajo.
- [/] **Tarea 2 — Infra de pruebas del flujo de registro + formularios condicionales** → en curso.

## Tarea 1 — Veredicto por rol (verificado en código)

Roles definidos en `globalsCC.d.ts:595`: `UserRole = "medico" | "enfermeria" | "admin"` (3 roles).

Entry point: `src/app/dashboard/layout.tsx:38` → `<DashboardByRole user={data.data.user}>`.

`DashboardByRole` (`src/library/Dashboard/DashboardByRole.tsx`) ramifica:
- `role === "medico"` → renderiza `children` (el dashboard completo real: rutas, SideNav, etc.). **COMPLETO**.
- cualquier otro → `<RoleDashboardPlaceholder role={role} />` (`src/library/Dashboard/RoleDashboardPlaceholder.tsx`), que muestra `<h2>Dashboard {RoleLabels}</h2>` + `<p>En construcción.</p>`. **PLACEHOLDER — NO hay interfaz real.**

| Rol      | Veredicto  | Interfaz renderizada                                                    | Archivos                                            |
|----------|------------|-------------------------------------------------------------------------|-----------------------------------------------------|
| medico   | COMPLETO   | Dashboard real: rutas hijas (`/dashboard/*`), SideNav, ClinicalHistory. | `DashboardByRole.tsx:18`, layout completo.          |
| enfermería| PARCIAL    | Placeholder "En construcción" — sin SideNav, sin rutas, sin features.   | `RoleDashboardPlaceholder.tsx:12-17`               |
| admin    | PARCIAL    | Placeholder "En construcción" — sin SideNav, sin features.              | `RoleDashboardPlaceholder.tsx:12-17`               |

**Falta para enfermería/admin:** definir features por rol, construir layouts reales (con/sin SideNav según permisos), cablear rutas permitidas. Ranuras existentes: `resolveUserRole` ya normaliza el rol (`userRole.ts:3-5`), `RoleLabels` ya tiene etiquetas (`userRole.ts:7-10`). Es puramente trabajo de diseño/lógica pendiente; la arquitectura de ramificación ya está lista.

Nota: `medico` es el default para usuarios legacy sin `role` (`userRole.ts:5`), por lo que las cuentas existentes NO pierden acceso.

## Tarea 2 — Formularios condicionales identificados

Dispatcher: `src/library/BaseForms/ConfirmMedRecord.tsx` (líneas 611-645 según `consultationType`).

| consultationType | Form disparado (ConfirmMedRecord.tsx) | Archivo del form                                           | identifier FormCC        |
|------------------|---------------------------------------|-------------------------------------------------------------|--------------------------|
| `embarazo`       | `GynecologyVariablesForm` (l.614)     | `src/library/BaseForms/GynecologyVariablesForm.tsx`        | `GynecologyVariablesForm`|
| `pediatria`      | `PediatricsVariablesForm` (l.622)     | `src/library/BaseForms/PediatricsVariablesForm.tsx`        | `PediatricsVariablesForm`|
| `geriatria`      | `GeriatricsVariablesForm` (l.630)     | `src/library/BaseForms/GeriatricsVariablesForm.tsx`        | `GeriatricsVariablesForm`|
| `general`        | ninguno (null, l.638)                 | —                                                           | —                        |

`consultationType` se asigna en `currentSessionData.currentRecord` desde el backend (`SavePatientForm.tsx:398` con `Save_Evo_Note`; `:695` con `Synthesize_New_Patient`). La inferencia corre en el backend (`cronos-backend/src/hooks/records/consult-type-detection.ts`) vía OpenAI `gpt-4o-2024-08-06` con prioridad **embarazo > pediatria (edad <18) > geriatria (edad ≥60) > general**, usando tanto el texto de la historia como `birthDate`/`sex` de la `patientIdentification`. Los 3 `*VariablesForm` son reales y completos (no placeholders): ginecología (4 pasos, 14 vars), pediatría (4 pasos, 11 vars), geriatría (2 pasos, 8 vars).

## Restos de Playwright detectados (marcar para retirar)
- `playwright.config.ts`
- `tests/e2e/` (specs, fixtures, helpers, pages)
- `"@playwright/test"` en `devDependencies` (`package.json`)
- Scripts npm `e2e`, `e2e:ui`, `e2e:record`, `e2e:report` (`package.json`)
- Directorio `.next-e2e/` (generado por Next.js para tests E2E de Playwright; en `git status` como no rastreado)
- `.next-e2e` referenciado en `tsconfig.json` (`include`)

Acción adoptada (según instrucción del usuario): **marcar** los restos. NO los borro — se reutilizan los helpers `tests/e2e/helpers/patients.ts` y `tests/e2e/helpers/api.ts` desde la nueva infra de Agent Browser (son agnósticos a Playwright salvo `patients.ts` que no tiene imports de Playwright y `storageStateFromToken` que sí se omite). La nueva infra se añade SIN tocar lo existente.

## Próximos pasos
- [/] Alta externa de paciente por QR/link: investigacion completada; backend en implementacion.
- [ ] Agregar tarjetas `QR / Link` y `Agenda` junto a INE/CURP/Manual.
- [ ] Implementar vista para compartir QR/link y pagina externa sin login.
- Montar infra de tests con Agent Browser (`tests/agent-browser/`): runner en TS/Node, set de pacientes dummy (mínimo: embarazada, geriátrico, pediátrico, control general).
- Correr contra `npm run dev` (localhost:3000 con backend en :3030) y reportar PASA/FALLA por caso.
