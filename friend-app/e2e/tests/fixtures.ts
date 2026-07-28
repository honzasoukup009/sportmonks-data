import { test as base, expect } from "@playwright/test";

// Every spec needs a logged-in session — this overrides the built-in `page`
// fixture so tests just import `test` from here and start already past the
// PIN screen. Read-only: fills the PIN and submits, nothing else.
export const test = base.extend({
  page: async ({ page }, use) => {
    const pin = process.env.LIGASTAT_PIN;
    if (!pin) {
      throw new Error("LIGASTAT_PIN is not set — copy e2e/.env.example to e2e/.env and fill it in.");
    }
    await page.goto("/");
    await page.locator("#pin").fill(pin);
    await page.getByRole("button", { name: "Pokračovat" }).click();
    await page.waitForURL("**/team");
    await use(page);
  },
});

export { expect };
