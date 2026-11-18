import { expect, test } from "@playwright/test";
import { createTicket, login, logout, unique } from "./support/auth";

test.describe("Privacidad de las notas internas", () => {
  test("una nota interna del agente nunca llega al cliente", async ({ page }) => {
    await login(page, "client");
    const path = await createTicket(page, { subject: unique("Incidencia con datos sensibles") });
    await logout(page);

    await login(page, "agent");
    await page.goto(path);

    const note = unique("Nota interna: el cliente tiene un descuadre en la cuenta");
    await page.getByLabel("Añadir comentario").fill(note);
    await page.getByLabel("Nota interna (el cliente no la ve)").check();
    await page.getByRole("button", { name: "Comentar" }).click();

    await expect(page.getByText(note)).toBeVisible();
    await expect(page.getByText("Nota interna", { exact: true })).toBeVisible();
    await logout(page);

    await login(page, "client");
    await page.goto(path);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(note)).toHaveCount(0);
    await expect(page.getByText("Nota interna", { exact: true })).toHaveCount(0);
  });

  test("un comentario público sí lo ve el cliente", async ({ page }) => {
    await login(page, "client");
    const path = await createTicket(page, { subject: unique("Comentario público") });
    await logout(page);

    await login(page, "agent");
    await page.goto(path);

    const message = unique("Estamos revisándolo, te confirmo hoy");
    await page.getByLabel("Añadir comentario").fill(message);
    await page.getByRole("button", { name: "Comentar" }).click();
    await expect(page.getByText(message)).toBeVisible();

    await logout(page);
    await login(page, "client");
    await page.goto(path);

    await expect(page.getByText(message)).toBeVisible();
  });
});
