import { test, expect } from "./fixtures";

test("empty state: form is shown, no results yet", async ({ page }) => {
  await page.goto("/rozlozeni");
  await expect(page.getByRole("heading", { name: "Rozložení statistik" })).toBeVisible();
  await expect(page.locator("#team1")).toBeVisible();
  await expect(page.locator("#team2")).toBeVisible();
  await expect(page.locator(".dist-block")).toHaveCount(0);
});

test("one team selected renders a single column of distributions", async ({ page }) => {
  await page.goto("/rozlozeni?team1=2727:262&count1=15");
  await expect(page.getByRole("heading", { name: "Sparta Praha" })).toBeVisible();
  await expect(page.locator(".compare-col:has(.dist-block)")).toHaveCount(1);

  for (const label of [
    "Rohy — 1. poločas",
    "Rohy — 2. poločas",
    "Góly — 1. poločas",
    "Žluté karty — 1. poločas",
    "Fauly celkem",
    "Ofsajdy soupeře",
    "Centry celkem",
    "Střely na branku",
    "Gól v prvních 15 minutách",
  ]) {
    await expect(page.locator(".dist-title", { hasText: label })).toBeVisible();
  }

  // every bucket row's percentage bar should be a plausible 0-100% width
  const fills = page.locator(".dist-fill");
  const count = await fills.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const width = await fills.nth(i).evaluate((el) => parseFloat((el as HTMLElement).style.width));
    expect(width).toBeGreaterThanOrEqual(0);
    expect(width).toBeLessThanOrEqual(100);
  }
});

test("two teams selected render side by side, each with its own venue filter", async ({ page }) => {
  await page.goto("/rozlozeni?team1=2727:262&count1=10&venue1=home&team2=3269:262&count2=10&venue2=away");
  await expect(page.getByRole("heading", { name: "Sparta Praha" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Baník Ostrava" })).toBeVisible();
  await expect(page.locator(".compare-col:has(.dist-block)")).toHaveCount(2);

  await expect(page.getByText("jen domácí zápasy", { exact: false })).toBeVisible();
  await expect(page.getByText("jen venkovní zápasy", { exact: false })).toBeVisible();
});

test("requesting more matches than available shows the availability note per side", async ({ page }) => {
  await page.goto("/rozlozeni?team1=2727:262&count1=500");
  await expect(page.getByText("K dispozici", { exact: false })).toBeVisible();
});
