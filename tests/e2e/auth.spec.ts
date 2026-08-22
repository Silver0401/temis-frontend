import { expect, test } from "@playwright/test";
import { ensureTestUser, storageStateFromToken } from "./helpers/api";
import { E2E_BASE_URL } from "./helpers/env";

/**
 * Flujo 1: Login.
 *
 * Los 3 primeros casos necesitan una sesión LIMPIA (formulario de login
 * visible) — por eso este archivo NO usa el fixture de ./fixtures.ts
 * (que arranca ya autenticado). Cada worker usa su propio usuario E2E
 * (helpers/api.ensureTestUser) para no chocar con el límite real del
 * backend de 1 sesión "computer" por usuario (src/channels.ts).
 */

test.describe("Login", () => {
  test("login válido llega al dashboard con confirmación", async ({
    page,
  }) => {
    const { creds } = await ensureTestUser(test.info().workerIndex);
    await page.goto("/account");
    await expect(page.getByTestId("input-logMail")).toBeVisible({
      timeout: 90000,
    });
    await page.getByTestId("input-logMail").fill(creds.email);
    await page.getByTestId("input-logPass").fill(creds.password);
    await page.getByTestId("input-logPrivacyAccepted").click();
    await page.getByRole("button", { name: /enviar/i }).click();

    // Toast (sonner, auto-dismiss 4000ms) puede desaparecer antes de
    // aserta bajo carga con workers en paralelo — el redirect a /dashboard
    // es la evidencia primaria y determinista de éxito.
    await page.waitForURL("**/dashboard", { timeout: 150000 });
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("login con contraseña incorrecta no navega", async ({ page }) => {
    const { creds } = await ensureTestUser(test.info().workerIndex);
    await page.goto("/account");
    await expect(page.getByTestId("input-logMail")).toBeVisible({
      timeout: 90000,
    });
    await page.getByTestId("input-logMail").fill(creds.email);
    await page.getByTestId("input-logPass").fill("Contraseña-Incorrecta-123!");
    await page.getByTestId("input-logPrivacyAccepted").click();
    await page.getByRole("button", { name: /enviar/i }).click();

    // Sin redirect: seguimos en /account con el formulario visible.
    await page.waitForTimeout(6000);
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByTestId("input-logMail")).toBeVisible();
  });

  test("no permite enviar sin aceptar la política de privacidad", async ({
    page,
  }) => {
    const { creds } = await ensureTestUser(test.info().workerIndex);
    await page.goto("/account");
    await expect(page.getByTestId("input-logMail")).toBeVisible({
      timeout: 90000,
    });
    await page.getByTestId("input-logMail").fill(creds.email);
    await page.getByTestId("input-logPass").fill(creds.password);
    // Checkbox requerido logPrivacyAccepted sin marcar.
    await page.getByRole("button", { name: /enviar/i }).click();

    await page.waitForTimeout(4000);
    await expect(page).toHaveURL(/\/account$/);
  });

  test("la sesión guardada entra directo al dashboard", async ({
    browser,
  }) => {
    const { accessToken } = await ensureTestUser(test.info().workerIndex);
    const context = await browser.newContext({
      storageState: storageStateFromToken(E2E_BASE_URL, accessToken),
    });
    const page = await context.newPage();
    await page.goto("/dashboard");
    await expect(page.getByText(/mis pacientes/i).first()).toBeVisible({
      timeout: 150000,
    });
    await context.close();
  });
});
