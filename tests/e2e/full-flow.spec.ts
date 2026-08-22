import { authenticate, ensureTestUser, findPatients } from "./helpers/api";
import { expect, test } from "./fixtures";
import {
  expectedBirthDate,
  expectedCluesField,
  GENERO_CODE,
  GIIS_FIELD_COUNT,
  parseGiisLine,
  SEXO_CODE,
} from "./helpers/giis";
import { validPatientVariants } from "./helpers/patients";
import { MyPatientsPage, downloadToString } from "./pages/myPatients";
import { NewPatientWizard } from "./pages/newPatientWizard";

/**
 * Flujo completo por paciente:
 * crear (wizard con síntesis AI) → confirmación → aparece en "Mis Pacientes" →
 * "Sintetizar Documento" → archivo de intercambio verificado campo por campo
 * contra lo guardado en el backend.
 *
 * Cada variante es un paciente distinto (nombres únicos por corrida).
 * Sesión ya autenticada vía ./fixtures (1 usuario por worker).
 */

for (const { label, patient } of validPatientVariants()) {
  test(`flujo completo: ${label}`, async ({ page }) => {
    // Síntesis AI real (OpenAI) en 2 pasos → timeout amplio.
    test.setTimeout(15 * 60 * 1000);

    const wizard = new NewPatientWizard(page);
    const lista = new MyPatientsPage(page);

    await test.step("crear paciente (wizard manual + historia)", async () => {
      await wizard.start();
      await wizard.fillIdentity(patient);
      await wizard.captureHistoria(patient.historiaClinica);
      await wizard.addSomas(patient.somas);
      await wizard.guardarPaciente();
      await wizard.confirmarRecord(patient);
    });

    await test.step("confirmación de creación", async () => {
      await wizard.esperarConfirmacion();
    });

    let saved: any;
    let workerClues: string[];
    await test.step("verificar persistencia vía API", async () => {
      const { creds } = await ensureTestUser(test.info().workerIndex);
      workerClues = creds.clues;
      const token = (await authenticate(creds.email, creds.password))!;
      expect(token).toBeTruthy();
      const res = await findPatients(token, "");
      const items: any[] = Array.isArray(res.data)
        ? res.data
        : (res.data?.data ?? res.data?.patientsList ?? []);
      saved = items.find(
        (pt) =>
          pt?.personalInfo?.names === patient.names &&
          pt?.personalInfo?.middleName === patient.middleName,
      );
      expect(
        saved,
        `paciente ${patient.names} no encontrado vía API`,
      ).toBeTruthy();
      // Lo guardado corresponde a lo capturado.
      expect(saved.personalInfo.lastName).toBe(patient.lastName);
      expect(saved.personalInfo.sex).toBe(patient.sex);
      expect(saved.personalInfo.genre).toBe(patient.genre);
      // Aislamiento: hereda la CLUES del médico E2E.
      const savedClues = Array.isArray(saved.clues)
        ? saved.clues
        : [saved.clues];
      expect(savedClues).toContain(workerClues[0]);
    });

    await test.step("aparece en Mis Pacientes", async () => {
      await lista.goto();
      await lista.search(patient.names);
      await lista.expectPatientListed(patient);
    });

    await test.step("archivo de intercambio campo por campo", async () => {
      await lista.openPatient(patient);
      const download = await lista.sintetizarDocumento();
      expect(download.suggestedFilename()).toMatch(/^intercambio_.*\.txt$/);

      const contenido = (await downloadToString(download)).trim();
      const giis = parseGiisLine(contenido);

      // Estructura: 106 campos exactos.
      expect(giis.fields.length).toBe(GIIS_FIELD_COUNT);

      // Campo 1: CLUES del médico (últimos 4 del primer segmento).
      expect(giis.get("clues")).toBe(expectedCluesField(workerClues[0]));

      // Campos 9-13: identidad del paciente tal como se guardó.
      expect(giis.get("curpPaciente")).toBe(saved.personalInfo.curp);
      expect(giis.get("nombrePaciente")).toBe(patient.names);
      expect(giis.get("primerApellidoPaciente")).toBe(patient.middleName);
      expect(giis.get("segundoApellidoPaciente")).toBe(patient.lastName);
      expect(giis.get("fechaNacimiento")).toBe(
        expectedBirthDate(saved.personalInfo.birthDate),
      );
      expect(giis.get("fechaNacimiento")).toBe(patient.birthDateDisplay);

      // Campos 14-15: localización de nacimiento guardada.
      const paisKey = saved.localizacion?.nacimiento?.pais?.catalogKey ?? 142;
      const entidadKey =
        saved.localizacion?.nacimiento?.estado?.catalogKey ?? -1;
      expect(giis.get("paisNacPaciente")).toBe(String(paisKey));
      expect(giis.get("entidadNacimiento")).toBe(String(entidadKey));

      // Campos 16-17 y 22: sexo y género mapeados.
      expect(giis.get("sexoCURP")).toBe(String(SEXO_CODE[patient.sex]));
      expect(giis.get("sexoBiologico")).toBe(String(SEXO_CODE[patient.sex]));
      expect(giis.get("genero")).toBe(String(GENERO_CODE[patient.genre] ?? 0));

      // Campo 23: derechohabiencia primaria guardada.
      const derecho = saved.personalInfo.derechohabiencia?.[0]?.catalogKey;
      expect(giis.get("derechohabiencia")).toBe(String(derecho));

      // Campos 26-35: somatometría — comparación numérica contra lo capturado.
      const numeric = (s: string) => parseFloat(s);
      expect(numeric(giis.get("peso"))).toBeCloseTo(
        numeric(patient.somas.peso),
        1,
      );
      expect(numeric(giis.get("talla"))).toBeCloseTo(
        numeric(patient.somas.talla),
        1,
      );
      expect(numeric(giis.get("sistolica"))).toBeCloseTo(
        numeric(patient.somas.sistolica),
        1,
      );
      expect(numeric(giis.get("diastolica"))).toBeCloseTo(
        numeric(patient.somas.diastolica),
        1,
      );
      expect(numeric(giis.get("frecuenciaCardiaca"))).toBeCloseTo(
        numeric(patient.somas.fc),
        1,
      );
      expect(numeric(giis.get("frecuenciaRespiratoria"))).toBeCloseTo(
        numeric(patient.somas.fr),
        1,
      );
      expect(numeric(giis.get("temperatura"))).toBeCloseTo(
        numeric(patient.somas.temp),
        1,
      );
      expect(numeric(giis.get("saturacionOxigeno"))).toBeCloseTo(
        numeric(patient.somas.spo2),
        1,
      );

      // Campos 24 y 40/42: consulta de hoy, primera vez.
      const hoy = new Date();
      const dd = String(hoy.getDate()).padStart(2, "0");
      const mm = String(hoy.getMonth() + 1).padStart(2, "0");
      expect(giis.get("fechaConsulta")).toBe(
        `${dd}/${mm}/${hoy.getFullYear()}`,
      );
      expect(giis.get("primeraVezAnio")).toBe("1");
      expect(giis.get("relacionTemporal")).toBe("0"); // Primera Vez

      // Campos 43-44: diagnóstico principal con CIE válido de 4 chars.
      expect(giis.get("cie1")).toMatch(/^[A-Z]\d{2}[0-9X]$/);
      expect(giis.get("confirmacionDx1")).toBe("0");
    });
  });
}
