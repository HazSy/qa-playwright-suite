# QA · Suite E2E y accesibilidad

Pruebas de extremo a extremo con **Playwright 1.57** y auditoría **WCAG 2.1 AA** con **axe-core** sobre dos objetivos reales:

1. **[OpsDesk](../opsdesk)** — la app de facturación de tickets del portfolio (flujos de autenticación, creación de tickets, permisos y privacidad de notas internas).
2. **[hazsy.github.io](https://hazsy.github.io)** — el portfolio público, como *smoke test* de despliegue y puerta de accesibilidad.

[![E2E](https://github.com/HazSy/qa-playwright-suite/actions/workflows/e2e.yml/badge.svg)](https://github.com/HazSy/qa-playwright-suite/actions/workflows/e2e.yml)
![Playwright](https://img.shields.io/badge/Playwright-1.57-2EAD33?logo=playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tests](https://img.shields.io/badge/tests-23%20passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Por qué existe

Un *happy path* verde no demuestra gran cosa. Esta suite prueba lo que suele romperse:

- **Aislamiento entre usuarios**: un cliente que abre la URL de un ticket ajeno recibe **404**, no 403 (no se confirma que exista).
- **Fuga de información**: una nota interna escrita por un agente **no aparece** al entrar como cliente. Es el mismo flujo, tres sesiones distintas.
- **Permisos en la interfaz**: al cliente no se le renderizan los controles de estado ni de asignación; y aunque los forzara, la Server Action los rechaza.
- **Accesibilidad**: `axe-core` sobre login, panel, listado y formulario, con umbral en violaciones `serious`/`critical`.

## Resultado de la auditoría

La suite encontró **dos problemas reales** en sitios ya publicados y se corrigieron en el repositorio correspondiente:

| Hallazgo | Dónde | Corrección |
| :--- | :--- | :--- |
| `color-contrast` 3.66:1 en botones primarios | OpsDesk | `teal-600` → `teal-700` (4.9:1 con texto blanco) |
| `color-contrast` 3.55:1 y 3.68:1 en acentos y texto tenue | Portfolio | `--acento` y `--texto-tenue` oscurecidos hasta superar 4.5:1 |
| `label-content-name-mismatch` en el logotipo | Portfolio | Se eliminó el `aria-label` redundante: el texto visible ya nombra el enlace |

Eso es exactamente lo que se espera de un perfil de QA: no solo escribir tests, sino **traducir el fallo a una corrección**.

## Estructura

```text
tests/
├─ support/auth.ts        Login por interfaz, logout y creación de tickets (helpers)
├─ auth.spec.ts           7 tests · sesión, errores genéricos, política de contraseñas
├─ tickets.spec.ts        6 tests · creación, SLA, cambio de estado, filtros, 404 ajeno
├─ internal-notes.spec.ts 2 tests · privacidad de notas internas vs comentario público
├─ a11y.spec.ts           4 tests · WCAG 2.1 AA con axe en cuatro pantallas
└─ portfolio.spec.ts      4 tests · smoke test, enlaces, accesibilidad y teclado
```

## Ejecutar

```bash
npm ci
npm run install:browsers

# 1) Contra OpsDesk local (debe estar arrancado en :3000)
npm run test:e2e

# 2) Contra el portfolio público
npm run test:portfolio

# 3) Todo, con informe HTML
npm test && npm run report
```

Variables de entorno:

| Variable | Para qué |
| :--- | :--- |
| `BASE_URL` | URL de OpsDesk (por defecto `http://localhost:3000`) |
| `PORTFOLIO_URL` | URL del portfolio (por defecto `https://hazsy.github.io`) |
| `E2E_AUTOSTART=1` | Playwright arranca OpsDesk desde `../opsdesk` |
| `CI=1` | 2 reintentos, 2 workers, reporter `github` |

### Preparar OpsDesk

```bash
cd ../opsdesk
npm ci && npm run setup && npm run build && npm start
```

Las cuentas de demo (`admin@`, `agente@`, `cliente@opsdesk.dev` con `OpsDesk2026!`) vienen del seed.

## Decisiones

1. **Selectores por rol y etiqueta**, no por clase CSS: `getByRole("button", { name: "Entrar" })`, `getByLabel("Asunto")`. Si cambia el diseño, los tests siguen valiendo; si cambia el significado para el usuario, fallan — que es justo lo que se quiere.
2. **Datos únicos por ejecución** (`unique()` con timestamp) para poder correr en paralelo sin limpiar la base de datos.
3. **Sesiones reales, no cookies inyectadas**: cada test recorre el formulario de login. Cuesta ~1 s más y prueba el flujo completo, incluida la cookie `httpOnly` y el `proxy` de Next.
4. **Pruebas de tres roles en el mismo test** para verificar que el dato no se filtra entre sesiones, que es el fallo que de verdad duele.
5. **Trazas, vídeo y captura solo al fallar**: el informe pesa poco y el diagnóstico sigue siendo suficiente.

## CI

`e2e` levanta OpsDesk desde su repositorio (checkout cruzado), siembra la base de datos y ejecuta la suite en Chromium; `portfolio` audita el sitio publicado. Los informes HTML se publican como artefacto durante 14 días.

## Hoja de ruta

- [ ] Matriz multi-navegador (Firefox y WebKit) en nightly.
- [ ] `@axe-core/playwright` sobre las páginas de detalle con datos.
- [ ] Tests de regresión visual con `toHaveScreenshot`.
- [ ] Contract testing del `billing-api` con su OpenAPI.

## Licencia

MIT © Óscar López Pellicer
