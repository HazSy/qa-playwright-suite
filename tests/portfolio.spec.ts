import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PORTFOLIO = process.env.PORTFOLIO_URL ?? "https://hazsy.github.io";

/**
 * Auditoría del sitio público. Este proyecto no necesita OpsDesk en marcha:
 * sirve como smoke test de despliegue y como puerta de accesibilidad.
 */
test.describe("Portfolio público", () => {
  test("el sitio responde y muestra el nombre", async ({ page }) => {
    const response = await page.goto(PORTFOLIO, { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Óscar|HazSy|portfolio/i);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("los enlaces internos no llevan a 404", async ({ page, request }) => {
    await page.goto(PORTFOLIO, { waitUntil: "domcontentloaded" });

    const hrefs = await page.locator('a[href^="/"], a[href^="' + PORTFOLIO + '"]').evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).href),
    );

    const unique = [...new Set(hrefs)].slice(0, 10);
    for (const href of unique) {
      const response = await request.get(href);
      expect(response.status(), `Enlace roto: ${href}`).toBeLessThan(400);
    }
  });

  test("sin violaciones de accesibilidad graves", async ({ page }) => {
    await page.goto(PORTFOLIO, { waitUntil: "networkidle" });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const serious = results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );

    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test("se puede navegar con el teclado hasta el contenido principal", async ({ page }) => {
    await page.goto(PORTFOLIO, { waitUntil: "domcontentloaded" });

    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).not.toBe("BODY");
  });
});
