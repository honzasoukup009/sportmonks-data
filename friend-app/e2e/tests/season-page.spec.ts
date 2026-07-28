import { test, expect } from "./fixtures";

test("shows all five league chips and the current league's table", async ({ page }) => {
  await page.goto("/league");
  await expect(page.getByRole("heading", { name: "Sezóny" })).toBeVisible();

  for (const league of ["Chance Liga", "Premier League", "Bundesliga", "Serie A", "La Liga"]) {
    await expect(page.getByRole("link", { name: league })).toBeVisible();
  }

  await expect(page.getByRole("heading", { name: "Tabulka" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nejlepší střelci" })).toBeVisible();
});

test("switching the league chip changes which league's table is shown", async ({ page }) => {
  await page.goto("/league?league=262"); // Chance Liga
  await page.getByRole("link", { name: "Bundesliga" }).click();
  await expect(page).toHaveURL(/league=82/);
  await expect(page.getByText("Bundesliga.", { exact: false })).toBeVisible();
});

test("league table's leading team links to its team page, and standings zones are marked", async ({ page }) => {
  await page.goto("/league?league=262");
  const firstRow = page.locator("table tbody tr").first();
  await expect(firstRow).toHaveClass(/zone-top/);
  const teamLink = firstRow.locator("a").first();
  await teamLink.click();
  await expect(page).toHaveURL(/\/team\/\d+/);
});
