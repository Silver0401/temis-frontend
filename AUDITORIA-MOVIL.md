# Auditoria movil de TEMIS

Fecha: 2026-08-26

## Alcance y criterio

- Revision estatica de las rutas solicitadas para 360 px, 390 px, 430 px y 768 px.
- Cambios limitados a `src/styles/stylus/**` y al CSS compilado `src/styles/css/Index.css`.
- Se reutilizaron los breakpoints existentes, principalmente `800px`.
- Se verificaron overflow horizontal, grids, tipografia, objetivos tactiles, modales, elementos fijos, zoom de inputs e imagenes.
- No se editaron archivos TSX. Los pendientes que requieren markup o configuracion del componente se indican expresamente.

## Correcciones transversales

- **Corregido:** inputs, selects y textareas usan al menos 16 px en movil; `InputCC` tambien lo fija en sus variantes (`src/styles/stylus/Components/InputCC.styl:10`, `src/styles/stylus/Generics/Generic.styl:40`).
- **Corregido:** modal con maximo de viewport, scroll interno y cierre de 44 x 44 px (`src/styles/stylus/Components/ModalCC.styl:1`).
- **Corregido:** proteccion global para imagenes, video, canvas y SVG (`src/styles/stylus/Generics/Generic.styl:34`).
- **Corregido:** tarjetas, dropdowns, camara, firma, ordenes y recetas ya no fuerzan anchos o targets tactiles incompatibles (`src/styles/stylus/Components/CardCC.styl:202`, `DropdownCC.styl:2`, `CameraCC.styl:81`, `SignaturePadCC.styl:36`, `OrderCC.styl:1`, `PrescriptionCC.styl:1`).
- **Corregido:** se eliminaron todas las declaraciones `backdrop-filter` de Stylus; no se reintrodujo blur.

## `/` (`src/app/page.tsx`)

- **Encontrado:** esta ruta no renderiza la landing comercial; renderiza login/registro y noticias (`src/app/page.tsx:14`).
- **Corregido:** el contenedor de cuenta deja de medir 800 px fijos, usa alto dinamico y scroll vertical (`src/styles/stylus/Account/Account.styl:538`).
- **Corregido:** inputs y acciones compartidas cumplen tamano movil (`src/styles/stylus/Components/InputCC.styl:10`, `ModalCC.styl:1`).
- **Pendiente TSX:** si `/` debe ser la landing, hace falta cambiar el arbol renderizado; no puede resolverse con Stylus (`src/app/page.tsx:14-23`).

## `/dashboard` (`src/app/dashboard/page.tsx`)

- **Encontrado:** barra superior sin reflow, botones de 32/40 px y modal con margen excesivo (`src/styles/stylus/Dashboard/MyPatients.styl:25`, `:126`, `:618`).
- **Corregido:** barra en grid de dos filas, buscador a ancho completo, textos truncados, targets de 44 px y margen movil reducido (`src/styles/stylus/Dashboard/MyPatients.styl:621`).
- **Corregido:** shell usa `width: 100%`, `100dvh` y no genera overflow por `100vw` (`src/styles/stylus/Dashboard/Dashboard.styl:3`).
- **Pendiente TSX:** alturas y opacidades inline de estados de lista siguen controladas desde el componente (`src/app/dashboard/page.tsx:587-597`, `:652-658`, `:744-749`).

## `/account` (`src/app/account/page.tsx`)

- **Encontrado:** wrapper movil fijo a 800 px y botones de perfil menores a 44 px (`src/styles/stylus/Account/Account.styl:538`, `:590`).
- **Corregido:** alto dinamico con scroll, perfil en una columna y acciones de 44 px (`src/styles/stylus/Account/Account.styl:538-609`).
- **Sin pendiente estructural movil** identificado.

## `/dashboard/myTeam`

- **Encontrado:** card con tres columnas apretadas, metadata horizontal y modal ancho en telefono (`src/styles/stylus/Dashboard/MedicalTeam.styl:84`, `:127`, `:154`).
- **Corregido:** cards y metricas colapsan a una columna; estado, metadata, modal y acciones hacen reflow (`src/styles/stylus/Dashboard/MedicalTeam.styl:219`).
- **Corregido:** input de asignacion usa 16 px (`src/styles/stylus/Dashboard/MedicalTeam.styl:176`).
- **Sin cambios TSX de esta sesion:** `src/library/Dashboard/MedicalTeam.tsx` pertenece al trabajo paralelo.

## `/dashboard/newPatient`

- **Encontrado:** preview de paciente fijo a 500 px con hijos de 200/300 px (`src/styles/stylus/Dashboard/Dashboard.styl:114-172`).
- **Corregido:** preview a ancho completo y columnas apiladas bajo 800 px (`src/styles/stylus/Dashboard/Dashboard.styl:489`).
- **Corregido:** cards y formularios compartidos eliminan min-width movil (`src/styles/stylus/Components/CardCC.styl:202`, `src/styles/stylus/MiniClasses.styl:5`).
- **Pendiente TSX:** wrapper inline de 300 px en el flujo de documento (`src/app/dashboard/newPatient/page.tsx:396`) y botones flotantes inline del layout (`src/app/dashboard/newPatient/layout.tsx:30-37`, `:73-80`) deben migrarse a clases para control movil completo.

## `/dashboard/newPatient/clinicalRecord`

- **Encontrado:** stack de 700 px mas rail lateral desbordaba incluso a 768 px (`src/styles/stylus/Dashboard/SavePatient.styl:1-18`, `:202`).
- **Corregido:** stack vertical, toolbar horizontal con wrap y textarea con alto dinamico (`src/styles/stylus/Dashboard/SavePatient.styl:320`).
- **Corregido:** paneles del expediente y visor PDF se apilan (`src/styles/stylus/Medical/ClinicalHistory.styl:1125`, `src/styles/stylus/Components/PdfViewerCC.styl:22`).
- **Pendiente TSX:** espaciados inline de modales y padding fullscreen no pueden normalizarse del todo desde Stylus (`src/library/BaseForms/SavePatientForm.tsx:474-483`, `:513-525`; `src/library/Records/ClinicalHistory.tsx:232-234`).

## `/dashboard/consents`

- **Encontrado:** grid de dos columnas, cabecera horizontal y controles de 40/42 px (`src/styles/stylus/Dashboard/Consents.styl:13`, `:37`, `:63`, `:81`).
- **Corregido:** grid y cabecera apilados, filas reacomodadas y controles de 44 px (`src/styles/stylus/Dashboard/Consents.styl:159`).
- **Sin pendiente estructural movil** identificado.

## `/dashboard/myAgenda`

- **Encontrado:** toolbar y toggle no envolvian; acciones de cita medían 22-26 px (`src/styles/stylus/Dashboard/Dashboard.styl:203-265`, `:339`, `:432`; `src/styles/stylus/Generics/Calendar.styl:19`).
- **Corregido:** toolbar vertical, titulo con `clamp()`, targets de 44 px, layout apilado y scroll de la vista (`src/styles/stylus/Generics/Calendar.styl:142`, `src/styles/stylus/Dashboard/Dashboard.styl:489`).
- **Pendiente TSX:** una toolbar movil reducida o cambio automatico a vista lista requiere configurar FullCalendar (`src/app/dashboard/myAgenda/page.tsx:342`, `:375`).

## `/dashboard/addDocument`

- **Encontrado:** formulario interno fijo a 500 px (`src/styles/stylus/Medical/AddNewDocForm.styl:9`).
- **Corregido:** formulario a `width: 100%`, con maximo desktop y padding movil (`src/styles/stylus/Medical/AddNewDocForm.styl:28`).
- **Pendiente TSX:** la ruta reexporta la pagina pero no hereda el layout de `newPatient`; para incluir sus controles de regreso se necesita un layout propio (`src/app/dashboard/addDocument/page.tsx:1`, `src/app/dashboard/newPatient/layout.tsx:27-103`).

## `/dashboard/admin/patients`

- **Encontrado:** filtros menores a 44 px/16 px, tabla minima de 760 px y acciones densas (`src/styles/stylus/Dashboard/Admin.styl:107-205`, `:976-990`).
- **Corregido:** filtros accesibles, acciones con wrap y scroll horizontal propio de resultados (`src/styles/stylus/Dashboard/Admin.styl:134`, `:193`, `:967`).
- **Pendiente TSX:** convertir la tabla de 760 px en cards con etiquetas por campo requiere markup alternativo; se conserva el scroll horizontal contenido (`src/styles/stylus/Dashboard/Admin.styl:976-990`).

## `/dashboard/admin/agendas`

- **Encontrado:** calendario de siete columnas y sidebar de 330 px demasiado densos (`src/styles/stylus/Dashboard/Admin.styl:754-805`).
- **Corregido:** sidebar apilado, gaps/padding reducidos y celdas adaptadas en movil (`src/styles/stylus/Dashboard/Admin.styl:958`, `:967`).
- **Pendiente TSX:** abreviar contenido o sustituir el mes por lista necesita una representacion alternativa; colores y alturas de eventos tambien siguen inline (`src/library/Dashboard/Admin/AdminAgendas.tsx:204-231`, `:258-265`).

## `/dashboard/admin/stats`

- **Encontrado:** graficas con minimo de 360 px, hero y metricas densas, barras de 12 columnas (`src/styles/stylus/Dashboard/Admin.styl:316-435`, `:588`).
- **Corregido:** minimo limitado al ancho disponible, hero de una columna, padding/gaps menores y tooltip contenido (`src/styles/stylus/Dashboard/Admin.styl:433`, `:967`).
- **Pendiente TSX:** las alturas de sparkline siguen inline, aunque no producen overflow (`src/library/Dashboard/Admin/AdminStats.tsx:45-49`).

## `/shared/ClinicalFile/[patientID]`

- **Encontrado:** vista minima sin restricciones de ancho ni espaciado (`src/styles/stylus/Shared/SharedRecord.styl:1`).
- **Corregido:** estado centrado, ancho maximo, padding, alto dinamico y controles accesibles (`src/styles/stylus/Shared/SharedRecord.styl:1-26`).
- **Pendiente TSX funcional:** la ruta esta retirada y solo muestra aviso; restaurar expediente requiere cambiar el componente (`src/app/shared/ClinicalFile/[patientID]/page.tsx:3-19`).

## `/shared/record/[token]`

- **Encontrado:** pantalla de acceso sin estilos de input movil y expediente con secciones legacy de 350/500 px (`src/styles/stylus/Shared/SharedRecord.styl:1`; `src/styles/stylus/Medical/ClinicalHistory.styl:741-817`, `:1020-1117`).
- **Corregido:** acceso contenido; carrusel, nutricion y drawer se adaptan al viewport (`src/styles/stylus/Shared/SharedRecord.styl:1-26`, `src/styles/stylus/Medical/ClinicalHistory.styl:1125`).
- **Pendiente TSX:** controles explicitos anterior/siguiente para sustituir zonas laterales del carrusel mejorarian la operacion tactil; hoy solo se redimensionaron las zonas (`src/styles/stylus/Medical/ClinicalHistory.styl:805-817`).

## `/shared/consent/[token]`

- **Encontrado:** metadata de 92 px + contenido y tabs dobles quedaban estrechos a 360 px (`src/styles/stylus/Shared/Consent.styl:25-32`, `:100`).
- **Corregido:** metadata y tabs a una columna; firma y acciones mantienen targets de 44 px (`src/styles/stylus/Shared/Consent.styl:191`, `src/styles/stylus/Components/SignaturePadCC.styl:36`).
- **Pendiente TSX semantico:** la pagina usa un `<main>` dentro del `<main>` global (`src/app/shared/consent/[token]/page.tsx:68`, `:92`).

## `/legal/terminos`

- **Encontrado:** contenido legal comparte shell responsive, pero podia mantener demasiado offset superior y palabras largas (`src/styles/stylus/Generics/Institutional.styl:5`, `:145`).
- **Corregido:** offset movil menor y `overflow-wrap` en cuerpo legal (`src/styles/stylus/Generics/Institutional.styl:216`).
- **Pendiente TSX de contenido:** el texto sigue siendo placeholder (`src/app/legal/terminos/page.tsx:24-28`).

## `/legal/privacidad`

- **Corregido:** tipografia ya usaba `clamp()` y el cuerpo ahora corta palabras largas sin overflow (`src/styles/stylus/Generics/Institutional.styl:14-31`, `:216`).
- **Pendiente TSX semantico:** existe un `<main>` anidado dentro del shell global (`src/app/legal/privacidad/page.tsx:62`).

## `/legal/nom-024`

- **Corregido:** mismo hardening de layout y texto que las otras rutas legales (`src/styles/stylus/Generics/Institutional.styl:216`).
- **Pendiente TSX de contenido:** el contenido NOM-024 es placeholder (`src/app/legal/nom-024/page.tsx:25-29`).

## `/mobile/phoneCamera/[userToken]`

- **Encontrado:** wrapper heredaba 90 vh, no contemplaba safe areas y controles de camara eran 40 px (`src/app/globals.css:241-248`, `src/styles/stylus/Components/CameraCC.styl:81-99`).
- **Corregido:** override a `100dvh`, scroll vertical, safe areas y controles de 44 px (`src/styles/stylus/Mobile/CameraAnim.styl:1-43`, `src/styles/stylus/Components/CameraCC.styl:81-110`).
- **Pendiente TSX:** el callback de socket conserva el token inicial si cambia la ruta sin remount (`src/app/mobile/phoneCamera/[userToken]/page.tsx:22-48`); no es un arreglo de estilos.

## Verificacion

- `npx stylus src/styles/stylus/Index.styl --out src/styles/css/Index.css`: pasa.
- `src/styles/css/Index.css`: 355835 bytes, tamano normal.
- `npx tsc --noEmit`: pasa sin salida.
- No se realizo prueba visual automatizada con navegador; la verificacion fue estatica, de compilacion y de tipos.
