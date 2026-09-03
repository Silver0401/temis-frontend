# Progreso

## 2026-09-03 - Tarea 5: extractor de formatos XLSX

- `scripts/extract_xlsx_forms.py` lee validaciones, catálogos referenciados, celdas, merges y opciones impresas; acepta rutas y salida por CLI.
- `scripts/temis-form-inputs.json` contiene 631 campos del expediente clínico y 25 del aviso al Ministerio Público, agrupados por libro, hoja y sección.
- Los dos XLSX recibidos tienen cero `dataValidation`, cero nombres definidos y cero controles nativos; por eso no hay inputs `select` respaldados por validaciones. Las opciones visibles se conservan como `radio` o `checkbox` con coordenadas y evidencia.
- `CONSTANCIA MÉDICA_2025.docx` y `NOTA REFERENCIA - CONTRAREFERENCIA 2025.numbers` quedan pendientes de extractores específicos o conversión; no bloquearon los XLSX.

## 2026-09-03 - Tarea 4: diagnósticos primero, segundo y tercero

- `MultiCieSearch-CC.tsx` muestra el siguiente número a capturar, etiqueta cada diagnóstico por posición y bloquea una cuarta selección.
- El orden visual sigue siendo el orden de `diagnosisCatalog`, que el backend persiste como `Diagnosis[]` y el archivo GIIS consume en sus primeras tres posiciones.

## 2026-09-03 - Tarea 3: historia clínica en notas de primera vez

- `ConfirmMedRecord.tsx` normaliza y envía `Temporality`; antes el selector se mostraba pero su valor no entraba en `recordData`.
- Se corrigió el valor inicial backend `PrimeraVez` para mostrarlo como `Primera Vez`.

## 2026-09-03 - Tarea 2: nota de evolución en cuatro campos

- `ClinicalTextArea` admite un modo de campos etiquetados y `SavePatientForm` lo activa con Habitus, PEEA, Diagnóstico y Tratamiento.
- `clinicalNoteFields.ts` concatena los valores en un solo texto antes del submit; no cambia el payload ni el schema.
- Se agregó una prueba de serialización y compatibilidad legacy.

## 2026-09-03 - Tarea 1: expediente clínico desde admin

- `AdminPatients.tsx` conecta cada fila con `DashboardContext.setShowPatient`.
- `adminTypes.ts` declara el paciente completo que acompaña a cada resultado.
- Se reutiliza el `ClinicalHistory` global del dashboard; no se creó una vista ni una navegación paralela.

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
