import fs from "fs";
import {
  AUTH_DIR,
  credentialsPathForWorker,
  E2E_BACKEND_URL,
  E2E_CLUES,
  type E2ECredentials,
} from "./env";

/**
 * Helpers de API contra el backend (Feathers REST).
 * Se usan para provisión del usuario de prueba, verificación de estado
 * guardado (campo por campo) y limpieza de datos E2E.
 */

async function request<T = any>(
  method: string,
  route: string,
  body?: unknown,
  accessToken?: string,
): Promise<{ status: number; data: T }> {
  const res = await fetch(`${E2E_BACKEND_URL}${route}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data: any = undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

export async function authenticate(
  email: string,
  password: string,
): Promise<string | null> {
  const { status, data } = await request<{ accessToken: string }>(
    "POST",
    "/authentication",
    { strategy: "local", email, password },
  );
  return status === 201 ? data.accessToken : null;
}

function randomHex(bytes: number): string {
  return [...crypto.getRandomValues(new Uint8Array(bytes))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Garantiza que exista un usuario médico E2E utilizable para el worker dado
 * y devuelve credenciales + token. Un usuario POR WORKER (no compartido):
 * el backend permite solo 1 conexión socket "computer" por usuario
 * (src/channels.ts), así que workers en paralelo autenticados como el mismo
 * usuario chocarían con esa regla real del negocio.
 *
 * Orden de resolución por worker:
 * 1. E2E_EMAIL/E2E_PASSWORD del entorno (fuerza un único usuario — solo
 *    tiene sentido corriendo con 1 worker).
 * 2. Credenciales persistidas en tests/e2e/.auth/credentials.worker<N>.json.
 * 3. Provisión de un usuario nuevo vía POST /users (requiere backend con
 *    ENV_TYPE=development, donde checkUserIdentity usa el bypass de pruebas).
 */
export async function ensureTestUser(workerIndex = 0): Promise<{
  creds: E2ECredentials;
  accessToken: string;
}> {
  // 1. Entorno
  if (process.env.E2E_EMAIL && process.env.E2E_PASSWORD) {
    const creds: E2ECredentials = {
      email: process.env.E2E_EMAIL,
      password: process.env.E2E_PASSWORD,
      clues: [E2E_CLUES],
      name: "E2E Tester Cronos",
    };
    const token = await authenticate(creds.email, creds.password);
    if (!token)
      throw new Error("E2E_EMAIL/E2E_PASSWORD no autentican contra el backend");
    return { creds, accessToken: token };
  }

  const credentialsPath = credentialsPathForWorker(workerIndex);

  // 2. Archivo persistido de este worker
  if (fs.existsSync(credentialsPath)) {
    const creds: E2ECredentials = JSON.parse(
      fs.readFileSync(credentialsPath, "utf8"),
    );
    const token = await authenticate(creds.email, creds.password);
    if (token) return { creds, accessToken: token };
    // Credenciales viejas inválidas (p.ej. otra base de datos) — reprovisionar.
  }

  // 3. Provisión
  const creds: E2ECredentials = {
    email: `e2e.worker${workerIndex}.${randomHex(4)}@cronos.test`,
    password: `E2e!${randomHex(8)}`,
    clues: [E2E_CLUES],
    name: `E2E Tester Cronos W${workerIndex}`,
  };
  const { status, data } = await request("POST", "/users", {
    email: creds.email,
    password: creds.password,
    name: creds.name,
    // Clave exacta del catálogo TIPO_PERSONAL (GIIS campo 7) del backend.
    professionType: "MÉDICA(O) GENERAL",
    clues: creds.clues,
    medicalLicenses: [
      { id: "12345678", profession: "Medicina General", registrationYear: "2020" },
    ],
    UID: { type: "test", frontImg: "test", reverseImg: "test", faceImg: "test" },
  });
  if (status !== 201)
    throw new Error(
      `No se pudo provisionar usuario E2E worker${workerIndex} (status ${status}): ${JSON.stringify(data).slice(0, 300)}`,
    );
  creds.userId = data._id;
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(credentialsPath, JSON.stringify(creds, null, 2));

  // Bajo carga alta (varios workers provisionando en paralelo mientras otros
  // corren flujos con IA) el login inmediato tras crear puede fallar de forma
  // transitoria — reintenta con backoff antes de darlo por error real.
  let token: string | null = null;
  for (let attempt = 0; attempt < 8 && !token; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 * attempt));
    token = await authenticate(creds.email, creds.password);
  }
  if (!token)
    throw new Error(`Usuario E2E worker${workerIndex} creado pero el login local falló`);
  return { creds, accessToken: token };
}

/** Construye un storageState de Playwright directamente desde un token,
 * sin pasar por el login de UI (más rápido y evita duplicar la carga
 * del wizard de login en cada worker). */
export function storageStateFromToken(baseURL: string, accessToken: string) {
  return {
    cookies: [],
    origins: [
      {
        origin: baseURL,
        localStorage: [{ name: "notAccessToken", value: accessToken }],
      },
    ],
  };
}

/** Busca pacientes del usuario autenticado (scoped por CLUES en el backend). */
export async function findPatients(accessToken: string, query = "") {
  return request("GET", `/patients${query}`, undefined, accessToken);
}

export async function getPatient(accessToken: string, id: string) {
  return request("GET", `/patients/${id}`, undefined, accessToken);
}

export async function deletePatient(accessToken: string, id: string) {
  return request("DELETE", `/patients/${id}`, undefined, accessToken);
}
