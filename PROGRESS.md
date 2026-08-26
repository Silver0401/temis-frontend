# Progreso

## 2026-08-26 - Auditoria y optimizacion movil TEMIS

- Se revisaron las 19 rutas solicitadas para 360, 390, 430 y 768 px.
- Se corrigieron anchos fijos, grids, scroll interno, targets tactiles, zoom iOS, modales, drawers, `100vh` y recursos sin limite de ancho.
- Se eliminaron todas las declaraciones `backdrop-filter` de `src/styles/stylus/**` por la restriccion de rendimiento de TEMIS.
- Se recompilo `src/styles/css/Index.css` desde `src/styles/stylus/Index.styl`; resultado de 355835 bytes.
- `npx tsc --noEmit` y la compilacion de Stylus pasan.
- Los cambios que necesitan TSX quedaron documentados por ruta en `AUDITORIA-MOVIL.md`.

## 2026-07-23 - Alta externa de paciente por QR / link

- Se releyo el estado de frontend y backend; no habia implementacion previa del flujo QR.
- Se localizo el selector de identificacion en `src/app/dashboard/newPatient/page.tsx`: las tarjetas actuales son `Con INE`, `Con CURP` y `Manual`.
- Se confirmo el modelo global `PatientIdentification` en `globalsCC.d.ts` y el armado manual en el step 5 del flujo.
- Se confirmo que el alta externa no debe entrar a `Synthesize_New_Patient`: solo crea el documento de paciente y lo relaciona con el medico.
- Siguiente: completar el endpoint publico acotado en backend y luego agregar las dos tarjetas, la vista QR/link y la pagina externa.
