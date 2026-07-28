import { test, expect } from "./fixtures";

// Sparta Praha, Chance Liga — an arbitrary but stable, always-populated team.
const TEAM_URL = "/team/2727?league=262";

test("shows team header, season chips, and the season summary heading", async ({ page }) => {
  await page.goto(TEAM_URL);
  await expect(page.getByRole("heading", { name: "Sparta Praha" })).toBeVisible();
  await expect(page.locator("a.chip").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sezóna", exact: false })).toBeVisible();
});

test("season summary and averages tiles render with expected labels", async ({ page }) => {
  await page.goto(TEAM_URL);
  for (const label of ["Zápasy", "V-R-P", "Body", "Skóre"]) {
    await expect(page.locator(".tile-label", { hasText: label }).first()).toBeVisible();
  }
  for (const label of ["Rohy/zápas", "Karty/zápas", "Fauly/zápas", "Karta v 1. poločase", "Gól v 1. poločase"]) {
    await expect(page.locator(".tile-label", { hasText: label })).toBeVisible();
  }
});

test("switching season chips changes the selected season", async ({ page }) => {
  await page.goto(TEAM_URL);
  const chips = page.locator("a.chip");
  const count = await chips.count();
  test.skip(count < 2, "only one season available right now");

  await chips.nth(1).click();
  await expect(chips.nth(1)).toHaveClass(/active/);
});

test("Posledních N zápasů: requesting more matches than exist shows the availability message", async ({ page }) => {
  await page.goto(TEAM_URL + "&count=500");
  await expect(page.getByText("K dispozici", { exact: false })).toBeVisible();
});

test("Posledních N zápasů: venue filter narrows the result and note reflects it", async ({ page }) => {
  await page.goto(TEAM_URL + "&count=10&venue=home");
  await expect(page.getByText("jen domácí zápasy", { exact: false })).toBeVisible();
});

test("Posledních N zápasů links to Rozložení statistik with the team pre-filled", async ({ page }) => {
  await page.goto(TEAM_URL + "&count=10");
  const link = page.getByRole("link", { name: "Zobrazit rozložení statistik" });
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toContain("team1=2727:262");
  expect(href).toContain("count1=10");
});

test("squad table is grouped by position with CSV download available", async ({ page }) => {
  await page.goto(TEAM_URL);
  await expect(page.getByRole("heading", { name: "Kádr" })).toBeVisible();
  await expect(page.getByText("Brankáři")).toBeVisible();
  await expect(page.getByRole("button", { name: "Stáhnout kádr jako Excel (CSV)" })).toBeVisible();
});

test("clicking a match in the season list opens the match page", async ({ page }) => {
  await page.goto(TEAM_URL);
  const matchLink = page.locator(".match-list a.match-card").first();
  await matchLink.click();
  await expect(page).toHaveURL(/\/match\/\d+/);
});
