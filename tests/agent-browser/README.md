# Test infra — Agent Browser (no Playwright)

> Suite dedicada a verificar el flujo principal (registro de paciente +
> formularios condicionales por `consultationType`) usando **agent-browser**
> (CLI Rust/CDP) en vez de Playwright, según lo pedido por el usuario.
>
> Reusa helpers agnósticos existentes en `tests/e2e/helpers/` (`patients.ts`
> base, `api.ts` y `env.ts` para provisión de usuario E2E + token JWT).
> NO usa `fixtures.ts` (ese depende de Playwright `storageState`); el
> token se inyecta directo en `localStorage` del navegador vía Agent Browser.

## Por qué Agent Browser
- El proyecto **prohíbe Playwright** (restos detectados; ver `STATUS.md`).
- `agent-browser` ya está instalado (`/opt/homebrew/bin/agent-browser`) y
  expone un CLI de automatización que corre en una shell, ideal para un
  worker de OpenCode. No resize el bundle de tests ni mata el dev server.

## Cómo correr
```bash
# 1) Asegurar backend en :3030 (cronos-backend, dev) y frontend en :3000:
npm run dev   # desde cronos-frontend; usa .env.dev

# 2) Desde cronos-frontend, sin tocar `dev` PID:
npx tsx tests/agent-browser/run.ts
#   (ejecuta los casos definidos en `patients.ts`, PASA/FALLA por caso)
```

`run.ts` lanza `agent-browser` por child_process, inyecta el token JWT en
`localStorage` del navegador una vez, recorre cada caso dummy, y al final
imprime una tabla resumen (caso · consultationType esperado · formulario
detectado · PASA/FALLA). La salida queda en `tests/agent-browser/last-run.json`.

## Archivos
- `patients.ts` — set de casos dummy (embarazada, geriátrico, pediátrico,
  control general). Cada caso define identidad + nota de evolución que
  dispara una rama condicional distinta con el clasificador del backend.
- `agent.ts` — wrapper delgado sobre el CLI `agent-browser` (open/snapshot/
  fill/click/wait/screenshot + localStorage injection). Sin estado global,
  una sola sesión por corrida.
- `run.ts` — orquestador: autentica por API, inyecta token, recorre cada
  paciente dummy, valida la presencia del formulario condicional esperado.
- `README.md` — este archivo.
