# Extractor de formatos XLSX

Genera `scripts/temis-form-inputs.json` para revisión manual. No modifica los
libros fuente ni conecta el resultado con la aplicación.

```bash
python3 -m pip install openpyxl
python3 scripts/extract_xlsx_forms.py
```

Para indicar otros archivos o salida:

```bash
python3 scripts/extract_xlsx_forms.py archivo1.xlsx archivo2.xlsx --output salida.json
```

Cada input conserva hoja, coordenadas, evidencia y confianza. `required: null`
significa que el libro no marca obligatoriedad. Si un archivo contiene listas
de validación, el script resuelve tanto opciones inline como rangos y nombres
definidos; los dos formatos recibidos no incluyen validaciones de datos.
