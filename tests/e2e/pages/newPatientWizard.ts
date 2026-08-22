import { expect, type Page } from "@playwright/test";
import type { TestPatient } from "../helpers/patients";

/**
 * Page object del wizard de alta de paciente (/dashboard/newPatient).
 *
 * Flujo real: Identificación (Manual) → Datos de Identificación (3 pasos) →
 * Formato → Método "Texto" → historia clínica (síntesis AI) →
 * SavePatientForm (somas obligatorios + Guardar Paciente, AI) →
 * ConfirmMedRecord (editar Dx/CIE/atención) → "Paciente Registrado con Éxito".
 *
 * Las llamadas AI del backend (OpenAI real, sin mock) hacen lentos los pasos
 * de síntesis: los timeouts largos son intencionales.
 */
export class NewPatientWizard {
  constructor(private page: Page) {}

  /** Teclea en un buscador de catálogo y elige la opción del dropdown-select. */
  private async searchAndPick(
    identifier: string,
    term: string,
    option: RegExp,
  ) {
    const input = this.page.getByTestId(`input-${identifier}-search`);
    await expect(input).toBeVisible({ timeout: 20000 });
    await input.fill(term);
    // El buscador tiene debounce y luego cambia a un <select> con resultados.
    const select = this.page.locator(`select[name="${identifier}-search"]`);
    await expect(select).toBeVisible({ timeout: 30000 });
    // El <select> siempre trae un option placeholder value="default"
    // (Input-CC.tsx): excluirlo para no "seleccionar" el placeholder.
    const value = await select
      .locator("option:not([value='default'])")
      .filter({ hasText: option })
      .first()
      .getAttribute("value");
    if (!value) throw new Error(`Sin opción para ${identifier} ~ ${option}`);
    await select.selectOption(value);
  }

  /** Como searchAndPick pero sin filtro de texto: toma el primer resultado
   * real devuelto por la búsqueda (usado para domicilio, cuyo texto de
   * predicción de Google no se puede predecir de antemano). */
  private async searchAndPickFirst(identifier: string, term: string) {
    return this.searchAndPick(identifier, term, /./);
  }

  async start() {
    await this.page.goto("/dashboard/newPatient");
    await expect(this.page.getByText("Identificación").first()).toBeVisible({
      timeout: 150000,
    });
    await this.page.getByText("Manual", { exact: true }).first().click();
  }

  /** Llena los 3 pasos de "Datos de Identificación" y envía. */
  async fillIdentity(p: TestPatient) {
    const page = this.page;
    await expect(page.getByTestId("input-names")).toBeVisible({
      timeout: 30000,
    });

    // Paso 1/3: curp (opcional), nombres y apellidos
    if (p.curp) await page.getByTestId("input-curp").fill(p.curp);
    await page.getByTestId("input-names").fill(p.names);
    await page.getByTestId("input-middleName").fill(p.middleName);
    await page.getByTestId("input-lastName").fill(p.lastName);
    await page.getByRole("button", { name: /continuar/i }).click();

    // Paso 2/3: sexo, género, fecha de nacimiento, país
    await page.locator('select[name="sex"]').selectOption(p.sexLabel);
    await page.locator('select[name="genre"]').selectOption(p.genre);
    await page.getByTestId("input-birthDate").fill(p.birthDateISO);
    await this.searchAndPick("BirthPaisSearch", p.paisSearch, p.paisOption);
    await page.getByRole("button", { name: /continuar/i }).click();

    // Paso 3/3: entidad (si México), derechohabiencia, domicilio
    if (p.esMexico && p.entidadSearch && p.entidadOption) {
      await this.searchAndPick(
        "BirthEntFedSearch",
        p.entidadSearch,
        p.entidadOption,
      );
    }
    await page
      .locator(".AfiliacionesCheckGroupItem", {
        hasText: new RegExp(`^\\s*${p.derechohabiencia}\\s*$`, "i"),
      })
      .locator("input")
      .first()
      .click();
    await this.searchAndPickFirst("DomicilioSearch", p.domicilioSearch);
    await page.getByRole("button", { name: /enviar/i }).click();
  }

  /** Igual que fillIdentity pero sin enviar (para tests de validación). */
  async fillIdentityUntilStep(p: Partial<TestPatient>, step: 1 | 2 | 3) {
    const page = this.page;
    await expect(page.getByTestId("input-names")).toBeVisible({
      timeout: 30000,
    });
    if (p.curp) await page.getByTestId("input-curp").fill(p.curp);
    if (p.names) await page.getByTestId("input-names").fill(p.names);
    if (p.middleName)
      await page.getByTestId("input-middleName").fill(p.middleName);
    if (p.lastName) await page.getByTestId("input-lastName").fill(p.lastName);
    if (step === 1) return;
    await page.getByRole("button", { name: /continuar/i }).click();

    if (p.sexLabel)
      await page.locator('select[name="sex"]').selectOption(p.sexLabel);
    if (p.genre)
      await page.locator('select[name="genre"]').selectOption(p.genre);
    if (p.birthDateISO)
      await page.getByTestId("input-birthDate").fill(p.birthDateISO);
    if (p.paisSearch && p.paisOption)
      await this.searchAndPick("BirthPaisSearch", p.paisSearch, p.paisOption);
    if (step === 2) return;
    await page.getByRole("button", { name: /continuar/i }).click();

    if (p.esMexico && p.entidadSearch && p.entidadOption)
      await this.searchAndPick(
        "BirthEntFedSearch",
        p.entidadSearch,
        p.entidadOption,
      );
    if (p.derechohabiencia)
      await page
        .locator(".AfiliacionesCheckGroupItem", {
          hasText: new RegExp(`^\\s*${p.derechohabiencia}\\s*$`, "i"),
        })
        .locator("input")
        .first()
        .click();
    if (p.domicilioSearch)
      await this.searchAndPickFirst("DomicilioSearch", p.domicilioSearch);
  }

  async submitIdentity() {
    await this.page.getByRole("button", { name: /enviar/i }).click();
  }

  /** Tras la identidad: formato → método "Texto" → historia → síntesis AI. */
  async captureHistoria(historia: string) {
    const page = this.page;
    // Paso "Formato de la Informacion"
    await expect(
      page.getByText(/formato de la informaci/i).first(),
    ).toBeVisible({ timeout: 60000 });
    await page.getByText("Historia Clínica Completa").first().click();
    // Paso "Método de Agregación"
    await expect(page.getByText(/m[eé]todo de agregaci/i).first()).toBeVisible({
      timeout: 30000,
    });
    await page.getByText("Texto", { exact: true }).first().click();
    // /newPatient/textTranscriber
    await page.waitForURL("**/textTranscriber", { timeout: 60000 });
    const area = page.locator('textarea[name="TxtTsrbrInput"]');
    await expect(area).toBeVisible({ timeout: 60000 });
    await area.fill(historia);
    await page.getByRole("button", { name: /enviar/i }).click();
    // Síntesis AI (OpenAI real): esperar el editor de historia resultante.
    await expect(
      page.getByRole("button", { name: /guardar paciente/i }),
    ).toBeVisible({ timeout: 240000 });
  }

  /** Abre el modal de Somatometrías y agrega un registro. */
  async addSomas(somas: TestPatient["somas"]) {
    const page = this.page;
    await page.getByRole("button", { name: /somatometr/i }).click();
    // SomasForm: método "Texto"
    await expect(
      page.getByText("Agregar Somatométricos").first(),
    ).toBeVisible({ timeout: 30000 });
    await page.getByText("Texto", { exact: true }).first().click();

    await expect(page.getByTestId("input-somasTalla")).toBeVisible({
      timeout: 30000,
    });
    await page.getByTestId("input-somasTalla").fill(somas.talla);
    await page.getByTestId("input-somasPeso").fill(somas.peso);
    await page.getByTestId("input-somasCircAbd").fill(somas.circAbd);
    await page.getByTestId("input-somasFC").fill(somas.fc);
    await page.getByTestId("input-somasFR").fill(somas.fr);
    await page.getByTestId("input-somasSpO2").fill(somas.spo2);
    await page.getByTestId("input-somasSistolica").fill(somas.sistolica);
    await page.getByTestId("input-somasDiastolica").fill(somas.diastolica);
    await page.getByTestId("input-somasTemp").fill(somas.temp);
    // IMC se autocalcula con talla+peso; si el onChange del form no corrió,
    // lo forzamos con un valor coherente.
    const imc = page.getByTestId("input-somasIMC");
    if (!(await imc.inputValue())) {
      const val = (
        parseFloat(somas.peso) / Math.pow(parseFloat(somas.talla) / 100, 2)
      ).toFixed(1);
      await imc.fill(val);
    }
    await page.getByTestId("input-somasDxName").fill("Somatometria inicial");
    await page.getByTestId("input-somasDate").fill("2026-07-15");
    await page.getByRole("button", { name: /agregar/i }).click();
    // El modal cierra y muestra toast de confirmación.
    await expect(page.getByTestId("input-somasTalla")).toBeHidden({
      timeout: 30000,
    });
  }

  /** "Guardar Paciente" → síntesis AI del record → ConfirmMedRecord visible. */
  async guardarPaciente() {
    const page = this.page;
    await page.getByRole("button", { name: /guardar paciente/i }).click();
    await expect(
      page.getByText(/diagn[oó]sticos y atenci[oó]n/i).first(),
    ).toBeVisible({ timeout: 300000 });
  }

  /**
   * ConfirmMedRecord: fija valores deterministas (CIE válido de 4 chars,
   * servicio, temporalidad) y navega los pasos dinámicos hasta enviar.
   * Devuelve el CIE forzado del diagnóstico principal.
   */
  async confirmarRecord(p: TestPatient, opts?: { cie?: string }) {
    const page = this.page;
    const cie = opts?.cie ?? "J029";

    await page
      .locator('select[name="ServiceAreaSelect"] option')
      .first()
      .waitFor({ timeout: 60000 });
    // Primera opción real del catálogo de servicios.
    const servOption = page
      .locator('select[name="ServiceAreaSelect"] option')
      .nth(1);
    await servOption.waitFor({ timeout: 60000 });
    const servValue = await servOption.getAttribute("value");
    await page
      .locator('select[name="ServiceAreaSelect"]')
      .selectOption(servValue!);
    await page
      .locator('select[name="TemporalitySelect"]')
      .selectOption("Primera Vez");
    await page.locator('select[name="FirstTimeYearSelect"]').selectOption("Si");

    // Pasos dinámicos: uno por diagnóstico + el paso final.
    // Recorremos con "Continuar" arreglando cada Dx visible.
    for (let guard = 0; guard < 8; guard++) {
      // Arregla los Dx visibles en el paso actual.
      const dxNames = page.locator(
        '[data-testid^="input-"][data-testid$="Name"]:visible',
      );
      const count = await dxNames.count();
      for (let i = 0; i < count; i++) {
        const el = dxNames.nth(i);
        const testid = (await el.getAttribute("data-testid"))!;
        if (!(await el.inputValue()))
          await el.fill("Faringitis aguda");
        const dxId = testid.replace(/^input-/, "").replace(/Name$/, "");
        // CIE: buscador de catálogo CIE-10.
        const cieInput = page.getByTestId(`input-${dxId}Cie-search`);
        if (await cieInput.isVisible().catch(() => false)) {
          await cieInput.fill("faringitis aguda");
          const select = page.locator(`select[name="${dxId}Cie-search"]`);
          if (await select.isVisible({ timeout: 20000 }).catch(() => false)) {
            const opt = select
              .locator("option")
              .filter({ hasText: /J02/i })
              .first();
            const value = await opt.getAttribute("value").catch(() => null);
            if (value) await select.selectOption(value);
            else
              await select.selectOption({ index: 1 });
          }
        }
        const confirmation = page.locator(
          `select[name="${dxId}Confirmation"]`,
        );
        if (await confirmation.isVisible().catch(() => false))
          await confirmation.selectOption("No");
      }

      const enviar = page.getByRole("button", { name: /^enviar$/i });
      if (await enviar.isVisible().catch(() => false)) break;
      await page.getByRole("button", { name: /continuar/i }).click();
    }

    // Último paso: país/entidad/domicilio de nuevo.
    await this.searchAndPick("BirthPaisSearch", p.paisSearch, p.paisOption);
    if (p.esMexico && p.entidadSearch && p.entidadOption)
      await this.searchAndPick(
        "BirthEntFedSearch",
        p.entidadSearch,
        p.entidadOption,
      );
    await this.searchAndPickFirst("DomicilioSearch", p.domicilioSearch);

    await page.getByRole("button", { name: /^enviar$/i }).click();
    return cie;
  }

  /** Espera confirmación final y redirect al dashboard. */
  async esperarConfirmacion() {
    await expect(
      this.page.getByText(/paciente registrado con éxito/i),
    ).toBeVisible({ timeout: 240000 });
    await this.page.waitForURL("**/dashboard", { timeout: 120000 });
  }
}
