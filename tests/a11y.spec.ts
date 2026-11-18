import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { login } from "./support/auth";

async function criticalViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  return results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );
}

test.describe("Accesibilidad (WCAG 2.1 AA)", () => {
  test("la pantalla de acceso no tiene violaciones graves", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const violations = await criticalViolations(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test("el panel tras iniciar sesión es accesible", async ({ page }) => {
    await login(page, "agent");

    const violations = await criticalViolations(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test("el listado de tickets es accesible", async ({ page }) => {
    await login(page, "agent");
    await page.goto("/tickets");

    const violations = await criticalViolations(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test("el formulario de alta es navegable solo con teclado", async ({ page }) => {
    await login(page, "client");
    await page.goto("/tickets/new");

    await page.keyboard.press("Tab");
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).not.toBe("BODY");

    const violations = await criticalViolations(page);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
