import { test, expect } from "./fixtures";
import { fetchRealStandingRow } from "./oracle";

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

test("internal consistency: every standings row's points equal 3x wins + draws", async ({ page }) => {
  await page.goto("/league?league=262");
  const rows = page.locator("table tbody tr");
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const cells = rows.nth(i).locator("td");
    const won = Number(await cells.nth(3).innerText());
    const draw = Number(await cells.nth(4).innerText());
    const points = Number(await cells.nth(7).innerText());
    expect(points).toBe(won * 3 + draw);
  }
});

test("oracle: the league leader's points match Sportmonks standings directly", async ({ page }) => {
  await page.goto("/league?league=262");
  const seasonHref = await page.locator('a.chip.active[href^="/league/"]').getAttribute("href");
  const seasonId = Number(seasonHref?.match(/^\/league\/(\d+)/)?.[1]);

  const firstRow = page.locator("table tbody tr").first();
  const teamHref = await firstRow.locator("a").first().getAttribute("href");
  const teamId = Number(teamHref?.match(/^\/team\/(\d+)/)?.[1]);
  const bannerPoints = Number((await page.locator(".champion-banner .mono").innerText()).replace(/\D/g, ""));

  const real = await fetchRealStandingRow(seasonId, teamId);
  expect(real).not.toBeNull();
  expect(real!.position).toBe(1);
  expect(real!.points).toBe(bannerPoints);
});
