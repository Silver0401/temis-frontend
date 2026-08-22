import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

const BIN = "agent-browser";

// agent-browser persiste la sesión de Chrome entre invocaciones del CLI.
// Cada comando opera sobre la pestaña activa. Los refs (@e1, @e2...) SOLO
// viven dentro de un snapshot concreto: cualquier navegación/render los
// invalida. Por eso cada helpersuelve refs siempre desde un snapshot fresco.

async function run(
  args: string[],
  opts: { timeoutMs?: number } = {},
): Promise<string> {
  const { stdout } = await execFileP(BIN, args, {
    maxBuffer: 16 * 1024 * 1024,
    timeout: opts.timeoutMs ?? 90_000,
  });
  return stdout.toString();
}

export interface Snap {
  raw: string;
}

/** Snapshot interactivo (solo elementos con rol): la forma barata de leer. */
export async function snapInteractive(): Promise<Snap> {
  const raw = await run(["snapshot", "-i", "-c"]);
  return { raw };
}

/** Snapshot filtrado por selector CSS (para buscar form ids concretos). */
export async function snapScoped(selector: string): Promise<Snap> {
  const raw = await run(["snapshot", "-s", selector]);
  return { raw };
}

/** Abre una URL en la pestaña activa (espera load). */
export async function open(url: string): Promise<void> {
  await run(["open", url], { timeoutMs: 120_000 });
}

/** Cierra la pestaña activa (no mata el navegador entre tests). */
export async function close(): Promise<void> {
  try {
    await run(["close"]);
  } catch {
    // ok si no había pestaña
  }
}

/** Cierra todo el navegador (al final de la corrida). */
export async function closeAll(): Promise<void> {
  try {
    await run(["close", "--all"]);
  } catch {
    // ok si no había navegador
  }
}

export async function click(ref: string): Promise<void> {
  await run(["click", ref]);
}

export async function fill(ref: string, value: string): Promise<void> {
  await run(["fill", ref, value]);
}

export async function select(ref: string, value: string): Promise<void> {
  await run(["select", ref, value]);
}

export async function press(key: string): Promise<void> {
  await run(["press", key]);
}

export async function waitLoad(): Promise<void> {
  try {
    await run(["wait", "--load", "networkidle"], { timeoutMs: 120_000 });
  } catch {
    // networkidle a veces nunca llega en apps con sockets; tolerar.
  }
}

export async function waitText(
  text: string,
  opts: { timeoutMs?: number } = {},
): Promise<void> {
  const deadline = Date.now() + (opts.timeoutMs ?? 180_000);
  while (Date.now() < deadline) {
    const s = await snapInteractive();
    if (s.raw.includes(text)) return;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`waitText timeout: "${text}" no apareció`);
}

export async function waitSelector(
  selector: string,
  opts: { timeoutMs?: number } = {},
): Promise<void> {
  const deadline = Date.now() + (opts.timeoutMs ?? 180_000);
  while (Date.now() < deadline) {
    const s = await snapScoped(selector);
    if (s.raw.trim().length > 0 && !s.raw.includes("not found")) return;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`waitSelector timeout: "${selector}" no apareció`);
}

export async function getUrl(): Promise<string> {
  return (await run(["get", "url"])).trim();
}

export async function screenshot(path: string): Promise<void> {
  await run(["screenshot", path]);
}

/**
 * Inyecta un token JWT en localStorage["notAccessToken"] del origen activo
 * (clave de auth del GlobalContext). Se llama DESPUÉS de `open(baseURL)`.
 */
export async function injectToken(baseURL: string, token: string): Promise<void> {
  // agent-browser expone `eval` para JS en la pestaña activa.
  await run([
    "eval",
    `window.localStorage.setItem("notAccessToken", ${JSON.stringify(token)});`,
  ]);
}
