import { test, expect } from "@playwright/test";

// Uses the plain Playwright `test`, not ../fixtures.ts — these specs are
// about the login flow itself, so they can't start already logged in.

test("PIN form is shown, no session yet", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#pin")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pokračovat" })).toBeVisible();
});

test("wrong PIN is rejected and no cookie is set", async ({ page }) => {
  await page.goto("/");
  await page.locator("#pin").fill("0000"); // deliberately not the real PIN
  await page.getByRole("button", { name: "Pokračovat" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Nesprávný PIN.")).toBeVisible();
  const cookies = await page.context().cookies();
  expect(cookies.find((c) => c.name === "session")).toBeUndefined();
});

test("protected pages redirect to / without a session", async ({ page }) => {
  for (const path of ["/team", "/league", "/rozlozeni", "/help"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/$/);
  }
});

test("correct PIN logs in and lands on the team picker", async ({ page }) => {
  const pin = process.env.LIGASTAT_PIN;
  if (!pin) throw new Error("LIGASTAT_PIN is not set — copy e2e/.env.example to e2e/.env and fill it in.");
  await page.goto("/");
  await page.locator("#pin").fill(pin);
  await page.getByRole("button", { name: "Pokračovat" }).click();
  await page.waitForURL("**/team");
  await expect(page.getByRole("heading", { name: "Vyber tým" })).toBeVisible();
});
