import { expect, type Download, type Page } from "@playwright/test";
import type { TestPatient } from "../helpers/patients";

/** Page object de "Mis Pacientes" (/dashboard) y del expediente clínico. */
export class MyPatientsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/dashboard");
    await expect(
      this.page.getByText(/mis pacientes/i).first(),
    ).toBeVisible({ timeout: 150000 });
  }

  fullName(p: TestPatient) {
    return `${p.names} ${p.middleName} ${p.lastName}`;
  }

  async search(term: string) {
    const bar = this.page.getByTestId("input-SearchPatientsBar");
    await expect(bar).toBeVisible({ timeout: 60000 });
    await bar.fill(term);
  }

  /** Fila del paciente en la lista. */
  row(p: TestPatient) {
    return this.page
      .locator(".PatientLineDisplay, [class*='atientLine']")
      .filter({ hasText: p.names })
      .first();
  }

  /** Localiza la fila por nombre completo (fallback por nombres). */
  async expectPatientListed(p: TestPatient) {
    const name = this.fullName(p);
    await expect(this.page.getByText(name).first()).toBeVisible({
      timeout: 90000,
    });
  }

  async refresh() {
    await this.page.locator(".refreshPatientsButton").first().click();
  }

  /** Abre el expediente del paciente (overlay ClinicalHistory). */
  async openPatient(p: TestPatient) {
    await this.page.getByText(this.fullName(p)).first().click();
    // El overlay del expediente muestra el nombre del paciente.
    await expect(
      this.page.locator(".ClinicalModelOptionsDropdown").first(),
    ).toBeVisible({ timeout: 90000 });
  }

  /**
   * Dropdown ⋮ → "Sintetizar Documento" → seleccionar consulta → Enviar.
   * Devuelve la descarga (archivo intercambio_<patientId>.txt).
   */
  async sintetizarDocumento(consultaIndex = 1): Promise<Download> {
    const page = this.page;
    await page.locator(".ClinicalModelOptionsDropdown").first().click();
    await page.getByText("Sintetizar Documento", { exact: true }).click();

    const select = page.locator('select[name="recordId"]');
    await expect(select).toBeVisible({ timeout: 30000 });
    await select.selectOption({ index: consultaIndex });

    const downloadPromise = page.waitForEvent("download", { timeout: 120000 });
    await page
      .locator("form")
      .filter({ has: select })
      .getByRole("button", { name: /enviar/i })
      .click();
    const download = await downloadPromise;
    await expect(
      page.getByText(/documento de intercambio sintetizado/i),
    ).toBeVisible({ timeout: 60000 });
    return download;
  }
}

/** Lee el contenido de una descarga de Playwright como string. */
export async function downloadToString(download: Download): Promise<string> {
  const fs = await import("fs");
  const path = await download.path();
  return fs.readFileSync(path, "utf8");
}
