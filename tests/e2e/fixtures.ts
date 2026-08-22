import { test as base } from "@playwright/test";
import { ensureTestUser, storageStateFromToken } from "./helpers/api";
import { E2E_BASE_URL, type E2ECredentials } from "./helpers/env";

/**
 * Test extendido con un usuario médico E2E autenticado por worker.
 *
 * Cada worker de Playwright obtiene su PROPIO usuario (provisionado o
 * reutilizado vía helpers/api.ensureTestUser) y su sesión se construye
 * directamente desde el token (sin pasar por el login de UI). Esto evita
 * que dos workers compartan usuario y choquen con la regla real del
 * backend de máximo 1 conexión "computer" por usuario (src/channels.ts).
 *
 * Specs que necesitan sesión iniciada: importar `test`/`expect` de este
 * archivo en vez de "@playwright/test" — el storageState queda armado
 * automáticamente para cada test.
 */
export const test = base.extend<
  {},
  {
    workerAuth: { creds: E2ECredentials; accessToken: string };
    workerCreds: E2ECredentials;
    workerToken: string;
  }
>({
  // Una sola provisión por worker — workerCreds/workerToken derivan de acá.
  // (Llamar ensureTestUser() por separado en dos fixtures independientes
  // corre ambas invocaciones en paralelo y provisiona 2 usuarios distintos
  // por worker, con una carrera sobre el mismo archivo de credenciales.)
  workerAuth: [
    async ({}, use, workerInfo) => {
      const result = await ensureTestUser(workerInfo.workerIndex);
      await use(result);
    },
    { scope: "worker" },
  ],
  workerCreds: [
    async ({ workerAuth }, use) => {
      await use(workerAuth.creds);
    },
    { scope: "worker" },
  ],
  workerToken: [
    async ({ workerAuth }, use) => {
      await use(workerAuth.accessToken);
    },
    { scope: "worker" },
  ],
  storageState: async ({ workerToken }, use) => {
    await use(storageStateFromToken(E2E_BASE_URL, workerToken));
  },
});

export { expect } from "@playwright/test";
