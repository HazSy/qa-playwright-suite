import { expect, test } from "@playwright/test";
import { login, logout, USERS } from "./support/auth";

test.describe("Autenticación", () => {
  test("un visitante sin sesión va al login", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
    await expect(page.getByRole("heading", { name: "Entrar en OpsDesk" })).toBeVisible();
  });

  test("credenciales incorrectas muestran un error sin revelar si el correo existe", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo").fill("nadie@opsdesk.dev");
    await page.getByLabel("Contraseña").fill("contraseña-incorrecta");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();

    const alert = page.locator("p[role=\"alert\"]");
    await expect(alert).toBeVisible();
    await expect(alert).toHaveText("Correo o contraseña incorrectos.");
    await expect(page).toHaveURL(/\/login/);
  });

  test("el cliente entra en su panel", async ({ page }) => {
    await login(page, "client");

    await expect(page.getByText("Este es el estado de tus solicitudes.")).toBeVisible();
  });

  test("el agente ve la cola del equipo y el tiempo medio", async ({ page }) => {
    await login(page, "agent");

    await expect(page.getByText("Así está la cola ahora mismo.")).toBeVisible();
    await expect(page.getByText("Cola priorizada")).toBeVisible();
  });

  test("cerrar sesión devuelve al login y bloquea el panel", async ({ page }) => {
    await login(page, "client");
    await logout(page);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("el registro valida la política de contraseñas", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("Nombre").fill("Prueba E2E");
    await page.getByLabel("Correo").fill(`e2e-${Date.now()}@opsdesk.dev`);
    await page.getByLabel("Contraseña", { exact: true }).fill("corta");
    await page.getByLabel("Repite la contraseña").fill("corta");
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    await expect(page.locator("p[role=\"alert\"]")).toContainText("12 caracteres");
    await expect(page).toHaveURL(/\/register/);
  });

  test("la sesión identifica al usuario correcto", async ({ page }) => {
    await login(page, "admin");

    await expect(page.getByText("Administrador")).toBeVisible();
    await expect(page.getByText(USERS.admin.email)).toHaveCount(0);
  });
});
