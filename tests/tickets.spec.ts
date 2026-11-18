import { expect, test } from "@playwright/test";
import { createTicket, login, logout, unique } from "./support/auth";

test.describe("Tickets", () => {
  test("el cliente crea un ticket y lo ve en su listado", async ({ page }) => {
    await login(page, "client");

    const subject = unique("No carga el informe");
    await createTicket(page, { subject, priority: "HIGH" });

    await expect(page.getByText(/OPS-\d{4}/)).toBeVisible();
    await expect(page.getByText("En progreso", { exact: false })).toHaveCount(0);

    await page.getByRole("link", { name: "← Volver a tickets" }).click();
    await expect(page.getByRole("link", { name: subject })).toBeVisible();
  });

  test("un ticket urgente muestra su SLA de 4 horas", async ({ page }) => {
    await login(page, "client");

    await createTicket(page, { subject: unique("Caída total del servicio"), priority: "URGENT" });

    await expect(page.getByText("Urgente")).toBeVisible();
    await expect(page.getByText(/h restantes|de retraso/)).toBeVisible();
  });

  test("el agente cambia el estado y el cambio persiste", async ({ page }) => {
    await login(page, "client");
    const path = await createTicket(page, { subject: unique("Solicitud de acceso"), priority: "MEDIUM" });

    await logout(page);
    await login(page, "agent");
    await page.goto(path);

    await page.getByLabel("Cambiar estado").selectOption("IN_PROGRESS");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(page.getByRole("status")).toHaveText("Estado actualizado.");

    await page.reload();
    await expect(page.getByText("En progreso")).toBeVisible();
  });

  test("el cliente no puede cambiar el estado", async ({ page }) => {
    await login(page, "client");
    await createTicket(page, { subject: unique("Sin permisos de estado") });

    await expect(page.getByLabel("Cambiar estado")).toHaveCount(0);
    await expect(page.getByLabel("Asignar a")).toHaveCount(0);
  });

  test("los filtros reducen el listado por estado", async ({ page }) => {
    await login(page, "agent");
    await page.goto("/tickets?status=CLOSED");

    await expect(page.getByRole("heading", { name: "Tickets" })).toBeVisible();

    const rows = page.locator("tbody tr");
    const count = await rows.count();
    for (let index = 0; index < count; index += 1) {
      await expect(rows.nth(index)).toContainText("Cerrado");
    }
  });

  test("un cliente no accede a un ticket ajeno", async ({ page, browser }) => {
    await login(page, "agent");
    const other = await browser.newContext();
    const otherPage = await other.newPage();

    await page.goto("/tickets?status=CLOSED");
    const firstTicket = page.locator("tbody tr a").first();
    const href = await firstTicket.getAttribute("href");
    expect(href).toBeTruthy();

    await login(otherPage, "client");
    const response = await otherPage.goto(href!);

    expect(response?.status()).toBe(404);
    await other.close();
  });
});
