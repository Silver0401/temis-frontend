import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { makeValidPatient } from "./helpers/patients";
import { NewPatientWizard } from "./pages/newPatientWizard";

/**
 * Flujo 2 (casos inválidos y límite): el formulario "Datos de Identificación"
 * aplica sus reglas reales (src/app/dashboard/newPatient/page.tsx +
 * src/scripts/Generator.tsx) y bloquea el avance.
 *
 * Todos estos casos son client-side: no llegan al backend ni a la IA,
 * por eso son rápidos. Sesión ya autenticada vía ./fixtures (1 usuario
 * por worker, ver tests/e2e/fixtures.ts).
 */

const sigueEnIdentidad = async (page: Page) => {
  // No avanzó al paso "Formato de la Informacion".
  await expect(page.getByText(/formato de la informaci/i)).toHaveCount(0);
  await expect(
    page.getByText("Datos de Identificación").first(),
  ).toBeVisible();
};

/**
 * Envía el form y espera el toast de error en paralelo con el click.
 * El toast (sonner) auto-dismiss puede vencer antes de que un expect()
 * posterior al click empiece a hacer polling — arrancar la espera EN
 * PARALELO con el click evita perderlo.
 */
const submitAndExpectToast = async (
  page: Page,
  wizard: NewPatientWizard,
  toastText: RegExp,
) => {
  await Promise.all([
    expect(page.getByText(toastText).first()).toBeVisible({ timeout: 15000 }),
    wizard.submitIdentity(),
  ]);
};

test.describe("Validaciones del alta manual de paciente", () => {
  test("nombre de 1 carácter es rechazado (mínimo 2)", async ({ page }) => {
    const wizard = new NewPatientWizard(page);
    const p = makeValidPatient({ names: "A" });
    await wizard.start();
    await wizard.fillIdentityUntilStep(p, 3);
    await submitAndExpectToast(page, wizard, /mínimo 2 caracteres/i);
    await sigueEnIdentidad(page);
  });

  test("nombre con dígitos es rechazado (solo letras)", async ({ page }) => {
    const wizard = new NewPatientWizard(page);
    const p = makeValidPatient();
    p.names = "Juan123";
    await wizard.start();
    await wizard.fillIdentityUntilStep(p, 3);
    await submitAndExpectToast(page, wizard, /solo letras/i);
    await sigueEnIdentidad(page);
  });

  test("apellido con especiales consecutivos es rechazado", async ({
    page,
  }) => {
    const wizard = new NewPatientWizard(page);
    const p = makeValidPatient();
    p.middleName = "Perez--Lopez";
    await wizard.start();
    await wizard.fillIdentityUntilStep(p, 3);
    await submitAndExpectToast(
      page,
      wizard,
      /dos caracteres especiales consecutivos/i,
    );
    await sigueEnIdentidad(page);
  });

  test("nombre de 51 caracteres es rechazado (máximo 50)", async ({
    page,
  }) => {
    const wizard = new NewPatientWizard(page);
    const p = makeValidPatient();
    p.names = "A".repeat(51);
    await wizard.start();
    await wizard.fillIdentityUntilStep(p, 3);
    await submitAndExpectToast(page, wizard, /máximo 50 caracteres/i);
    await sigueEnIdentidad(page);
  });

  test("apellido paterno vacío es rechazado", async ({ page }) => {
    const wizard = new NewPatientWizard(page);
    const p = makeValidPatient();
    const sinApellido = { ...p, middleName: undefined } as any;
    await wizard.start();
    await wizard.fillIdentityUntilStep(sinApellido, 3);
    await submitAndExpectToast(page, wizard, /"Apellido Paterno" esta vacío/i);
    await sigueEnIdentidad(page);
  });

  test("fecha de nacimiento futura es rechazada", async ({ page }) => {
    const wizard = new NewPatientWizard(page);
    const p = makeValidPatient();
    const next = new Date();
    next.setFullYear(next.getFullYear() + 1);
    p.birthDateISO = next.toISOString().slice(0, 10);
    await wizard.start();
    await wizard.fillIdentityUntilStep(p, 3);
    await submitAndExpectToast(page, wizard, /la fecha no puede ser futura/i);
    await sigueEnIdentidad(page);
  });

  test("edad mayor a 120 años es rechazada", async ({ page }) => {
    const wizard = new NewPatientWizard(page);
    const p = makeValidPatient();
    p.birthDateISO = "1890-01-01";
    await wizard.start();
    await wizard.fillIdentityUntilStep(p, 3);
    await submitAndExpectToast(
      page,
      wizard,
      /la edad no puede ser mayor a 120 años/i,
    );
    await sigueEnIdentidad(page);
  });

  test("CURP de 17 caracteres es rechazada (longitud 18)", async ({
    page,
  }) => {
    const wizard = new NewPatientWizard(page);
    const p = makeValidPatient();
    p.curp = "GOMC900515HNLNZR0"; // 17 chars
    await wizard.start();
    await wizard.fillIdentityUntilStep(p, 3);
    await submitAndExpectToast(page, wizard, /mínimo 18 caracteres/i);
    await sigueEnIdentidad(page);
  });

  test("CURP inconsistente con los datos es rechazada", async ({ page }) => {
    const wizard = new NewPatientWizard(page);
    const p = makeValidPatient();
    // 18 chars con estructura pero que no corresponde al nombre/fecha/sexo.
    p.curp = "AAAA000101HDFXXX09";
    await wizard.start();
    await wizard.fillIdentityUntilStep(p, 3);
    await wizard.submitIdentity();
    // ValidateCURP produce toasts de error específicos y no avanza.
    await page.waitForTimeout(3000);
    await sigueEnIdentidad(page);
  });

  test("sin país de nacimiento es rechazado", async ({ page }) => {
    const wizard = new NewPatientWizard(page);
    const p = makeValidPatient();
    const sinPais = {
      ...p,
      paisSearch: undefined,
      paisOption: undefined,
      esMexico: false,
    } as any;
    await wizard.start();
    await wizard.fillIdentityUntilStep(sinPais, 3);
    await Promise.all([
      expect(
        page
          .getByText(/país de nacimiento/i)
          .filter({ hasText: /selecciona|vacío/i })
          .first(),
      ).toBeVisible({ timeout: 15000 }),
      wizard.submitIdentity(),
    ]);
    await sigueEnIdentidad(page);
  });

  test("sin derechohabiencia es rechazado", async ({ page }) => {
    const wizard = new NewPatientWizard(page);
    const p = makeValidPatient();
    const sinDerecho = { ...p, derechohabiencia: undefined } as any;
    await wizard.start();
    await wizard.fillIdentityUntilStep(sinDerecho, 3);
    await submitAndExpectToast(page, wizard, /"Derechohabiencia" esta vacío/i);
    await sigueEnIdentidad(page);
  });

  test("sin sexo biológico es rechazado", async ({ page }) => {
    const wizard = new NewPatientWizard(page);
    const p = makeValidPatient();
    const sinSexo = { ...p, sexLabel: undefined } as any;
    await wizard.start();
    await wizard.fillIdentityUntilStep(sinSexo, 3);
    await submitAndExpectToast(page, wizard, /"Sexo Biológico" esta vacío/i);
    await sigueEnIdentidad(page);
  });

  test("nombre con acentos y Ñ es aceptado en el paso de identidad", async ({
    page,
  }) => {
    // Caso límite VÁLIDO: el regex permite acentos, Ñ y ciertos especiales.
    const wizard = new NewPatientWizard(page);
    const p = makeValidPatient();
    p.names = `Ñoño Andrés${p.names.slice(-4)}`;
    await wizard.start();
    await wizard.fillIdentityUntilStep(p, 3);
    await wizard.submitIdentity();
    // Avanza al paso de formato: la identidad fue aceptada.
    await expect(
      page.getByText(/formato de la informaci/i).first(),
    ).toBeVisible({ timeout: 30000 });
  });
});
