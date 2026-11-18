import { expect, type Page } from "@playwright/test";

export const PASSWORD = "OpsDesk2026!";

export const USERS = {
  admin: { email: "admin@opsdesk.dev", name: "Óscar" },
  agent: { email: "agente@opsdesk.dev", name: "Lucía" },
  client: { email: "cliente@opsdesk.dev", name: "Marta" },
} as const;

export type Role = keyof typeof USERS;

/** Inicia sesión por la interfaz y espera a estar en el panel. */
export async function login(page: Page, role: Role): Promise<void> {
  const user = USERS[role];

  await page.goto("/login");
  await page.getByLabel("Correo").fill(user.email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(user.name);
}

export async function logout(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/login/);
}

/** Crea un ticket como el usuario con la sesión abierta y devuelve su URL. */
export async function createTicket(
  page: Page,
  options: { subject: string; priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" },
): Promise<string> {
  await page.goto("/tickets/new");

  await page.getByLabel("Asunto").fill(options.subject);
  await page
    .getByLabel("Descripción")
    .fill("Ticket generado por la suite E2E. Describe un problema reproducible con suficiente contexto.");
  await page.getByLabel("Prioridad").selectOption(options.priority ?? "MEDIUM");
  await page.getByRole("button", { name: "Crear ticket" }).click();

  await expect(page).toHaveURL(/\/tickets\/[a-z0-9]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(options.subject);

  return new URL(page.url()).pathname;
}

/** Texto único por ejecución para no chocar con datos previos. */
export function unique(prefix: string): string {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
