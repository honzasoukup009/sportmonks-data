import { test, expect } from "./fixtures";
import { fetchRealScore, fetchRealParticipants, fetchRealFixtureStat } from "./oracle";

// Sparta Praha 2:1 Pardubice, 2024-07-19 — a finished match, values verified
// live against Sportmonks on 2026-07-29 (see REQUIREMENTS.md). Finished
// matches don't change, so these are exact-value assertions, not just
// "a number rendered somewhere".
const GOLDEN_FIXTURE_ID = 19138221;
const GOLDEN_FIXTURE_URL = `/match/${GOLDEN_FIXTURE_ID}?team=2727`;

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

test("cross-page: whole-match yellow card total equals the sum of both halves", async ({ page }) => {
  await page.goto(GOLDEN_FIXTURE_URL);
  const totalRow = statRow(page, "Žluté karty").locator(".mono");
  const totalHome = await totalRow.first().innerText();
  const totalAway = await totalRow.last().innerText();

  const halfRow = page.locator("table", { hasText: "1. poločas" }).locator("tbody tr", { hasText: "Žluté karty" });
  const halfCells = halfRow.locator("td.mono");
  const h1Home = await halfCells.nth(0).innerText();
  const h1Away = await halfCells.nth(1).innerText();
  const h2Home = await halfCells.nth(2).innerText();
  const h2Away = await halfCells.nth(3).innerText();
  test.skip([h1Home, h1Away, h2Home, h2Away].includes("-"), "no half-scoped card data recorded for this fixture");

  expect(Number(h1Home) + Number(h2Home)).toBe(Number(totalHome));
  expect(Number(h1Away) + Number(h2Away)).toBe(Number(totalAway));
});

test("oracle: finished match score and key stats match Sportmonks directly", async ({ page }) => {
  const { homeId, awayId } = await fetchRealParticipants(GOLDEN_FIXTURE_ID);
  const realScore = await fetchRealScore(GOLDEN_FIXTURE_ID);
  expect(realScore.played).toBe(true);

  await page.goto(GOLDEN_FIXTURE_URL);
  await expect(page.locator(".score-big")).toHaveText(realScore.full!);

  const cases: [string, string][] = [
    ["Rohy", "Corners"],
    ["Fauly", "Fouls"],
    ["Žluté karty", "Yellowcards"],
    ["Střely", "Shots Total"],
    ["Střely na branku", "Shots On Target"],
  ];
  for (const [label, typeName] of cases) {
    const [realHome, realAway] = await Promise.all([
      fetchRealFixtureStat(GOLDEN_FIXTURE_ID, homeId, typeName),
      fetchRealFixtureStat(GOLDEN_FIXTURE_ID, awayId, typeName),
    ]);
    const row = statRow(page, label).locator(".mono");
    await expect(row.first()).toHaveText(String(realHome));
    await expect(row.last()).toHaveText(String(realAway));
  }
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
