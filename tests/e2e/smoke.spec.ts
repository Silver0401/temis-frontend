import { expect, test, type Page } from "@playwright/test";

const ignoredMessage = (message: string) =>
  /favicon/i.test(message) ||
  /net::ERR_(CONNECTION_REFUSED|FAILED|INTERNET_DISCONNECTED|NAME_NOT_RESOLVED)/i.test(
    message,
  ) ||
  /ECONNREFUSED|Failed to fetch|Network Error|socket hang up/i.test(message);

const watchErrors = (page: Page) => {
  const errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (!ignoredMessage(text)) errors.push(text);
  });

  page.on("pageerror", (error) => {
    const text = error.message;
    if (!ignoredMessage(text)) errors.push(text);
  });

  return () => expect(errors).toEqual([]);
};

test("home loads and navigates to account", async ({ page }) => {
  const assertNoErrors = watchErrors(page);

  await page.goto("/");
  await page.waitForURL("**/home", { timeout: 12000 });

  await expect(page).toHaveTitle(/Cronos/i);
  await expect(page.getByRole("heading", { name: /el cuerpo es/i })).toBeVisible();
  await expect(page.getByText(/el expediente/i).first()).toBeVisible();

  await Promise.all([
    page.waitForURL("**/account", { timeout: 120000 }),
    page.getByRole("button", { name: /iniciar sesión/i }).click(),
  ]);
  await expect(page).toHaveURL(/\/account$/);

  assertNoErrors();
});

test("account renders the login form", async ({ page }) => {
  const assertNoErrors = watchErrors(page);

  await page.goto("/account");

  await expect(page.getByRole("heading", { name: /inicia tu sesión/i })).toBeVisible();
  await expect(page.getByTestId("input-logMail")).toBeVisible();
  await expect(page.getByTestId("input-logPass")).toBeVisible();
  await expect(page.getByRole("button", { name: /enviar/i })).toBeVisible();

  assertNoErrors();
});

test("demo loads and renders a visible canvas", async ({ page }) => {
  const assertNoErrors = watchErrors(page);

  await page.goto("/demo");
  await expect(
    page.getByRole("heading", { name: /demo interactivo de cronos/i }),
  ).toBeVisible();

  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box?.width).toBeGreaterThan(0);
  expect(box?.height).toBeGreaterThan(0);

  assertNoErrors();
});
