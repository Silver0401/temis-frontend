import path from "path";

/**
 * Configuración de entorno de la suite E2E.
 * Todo es sobreescribible por variables de entorno para mantener la suite
 * reutilizable (local aislado, dev compartido, CI).
 */
export const E2E_BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
export const E2E_BACKEND_URL =
  process.env.E2E_BACKEND_URL || "http://localhost:3030";

export const AUTH_DIR = path.join(__dirname, "..", ".auth");

/**
 * El backend limita a 1 conexión socket tipo "computer" por usuario
 * (src/channels.ts en cronos-backend). Workers de Playwright en paralelo
 * que compartieran un solo usuario E2E chocarían con esa regla real
 * ("Error: computer device already connected"), tirando el guard de auth.
 * Por eso cada worker tiene su propio usuario, cacheado en su propio archivo.
 */
export function credentialsPathForWorker(workerIndex: number): string {
  return path.join(AUTH_DIR, `credentials.worker${workerIndex}.json`);
}

/** CLUES sintética del usuario E2E: aísla sus pacientes de datos reales de dev. */
export const E2E_CLUES = process.env.E2E_CLUES || "E2ECLUES0001";

export interface E2ECredentials {
  email: string;
  password: string;
  clues: string[];
  name: string;
  userId?: string;
}
