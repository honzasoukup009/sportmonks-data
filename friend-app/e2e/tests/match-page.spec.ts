import { test, expect } from "./fixtures";

// Sparta Praha 2:1 Pardubice, 2024-07-19 — a finished match, values verified
// live against Sportmonks on 2026-07-29 (see REQUIREMENTS.md). Finished
// matches don't change, so these are exact-value assertions, not just
// "a number rendered somewhere".
const GOLDEN_FIXTURE_URL = "/match/19138221?team=2727";

function statRow(page: import("@playwright/test").Page, label: string) {
  return page.locator(".stat-row", { hasText: label });
}

test("finished match: score, half-time, and status", async ({ page }) => {
  await page.goto(GOLDEN_FIXTURE_URL);
  await expect(page.getByRole("heading", { name: "Zápas", exact: true })).toBeVisible();
  await expect(page.locator(".score-big")).toHaveText("2:1");
  await expect(page.locator(".status-pill")).toContainText("1:1");
  await expect(page.locator(".status-pill")).toContainText("Konec");
});

test("finished match: key statistics match Sportmonks exactly", async ({ page }) => {
  await page.goto(GOLDEN_FIXTURE_URL);
  const cases: [string, string, string][] = [
    ["Rohy", "4", "4"],
    ["Fauly", "10", "10"],
    ["Žluté karty", "2", "2"],
    ["Střely", "11", "1"],
    ["Střely na branku", "5", "1"],
  ];
  for (const [label, home, away] of cases) {
    const row = statRow(page, label).locator(".mono");
    await expect(row.first()).toHaveText(home);
    await expect(row.last()).toHaveText(away);
  }
});

test("finished match: lineups, timeline, and head-to-head sections are present", async ({ page }) => {
  await page.goto(GOLDEN_FIXTURE_URL);
  await expect(page.getByRole("heading", { name: "Statistiky podle poločasu" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Průběh zápasu" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sestavy" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vzájemné zápasy" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Zpět na tým" })).toBeVisible();
});

test("finished match: no prediction section (Odhad pro tento zápas)", async ({ page }) => {
  await page.goto(GOLDEN_FIXTURE_URL);
  await expect(page.getByRole("heading", { name: "Odhad pro tento zápas" })).toHaveCount(0);
});

// Sparta Praha vs Teplice, 2026-08-15 — confirmed unplayed live on 2026-07-29.
// Unlike the golden fixture above, this ID *will* go stale once the match is
// played; pick a fresh upcoming Sparta fixture (team page → current season →
// an unplayed match) when this test starts failing for that reason.
const UPCOMING_FIXTURE_URL = "/match/19725083?team=2727";

test("upcoming match: no score yet, and the prediction section explains its two models", async ({ page }) => {
  await page.goto(UPCOMING_FIXTURE_URL);
  await expect(page.locator(".score-big")).toHaveText("—");
  await expect(page.locator(".status-pill")).toHaveText("Zápas se ještě neodehrál");
  await expect(page.getByRole("heading", { name: "Statistiky podle poločasu" })).toHaveCount(0);

  const prediction = page.getByRole("heading", { name: "Odhad pro tento zápas" });
  test.skip(await prediction.count() === 0, "prediction needs both teams to have finished-season data");
  await expect(prediction).toBeVisible();
  await expect(page.getByText("Za celý zápas (0–90+ minut)")).toBeVisible();
  await expect(page.getByText("Jiná otázka: padne karta v 1. poločase?")).toBeVisible();
});
