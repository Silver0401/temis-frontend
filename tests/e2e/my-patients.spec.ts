import { expect, test } from "./fixtures";

/**
 * Flujo 4 (superficie): "Mis Pacientes" carga con sesión válida y su
 * buscador filtra la lista client-side. Sesión ya autenticada vía
 * ./fixtures (1 usuario por worker).
 */

test.describe("Mis Pacientes", () => {
  test("el dashboard autenticado muestra la sección y su buscador", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/mis pacientes/i).first()).toBeVisible({
      timeout: 150000,
    });
    await expect(page.getByTestId("input-SearchPatientsBar")).toBeVisible({
      timeout: 60000,
    });
    await expect(page.locator(".refreshPatientsButton").first()).toBeVisible();
  });

  test("buscar un nombre inexistente no deja filas con ese texto", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const bar = page.getByTestId("input-SearchPatientsBar");
    await expect(bar).toBeVisible({ timeout: 150000 });
    await bar.fill("ZzInexistenteQqx");
    await page.waitForTimeout(1500);
    // getByText no matchea valores de <input>: 0 = ninguna fila con ese texto.
    await expect(page.getByText("ZzInexistenteQqx")).toHaveCount(0);
  });
});
