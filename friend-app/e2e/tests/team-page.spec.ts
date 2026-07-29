import { test, expect } from "./fixtures";
import { fetchRealTeamName } from "./oracle";

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

test("internal consistency: V-R-P, Zápasy, and Body tiles agree with each other", async ({ page }) => {
  await page.goto(TEAM_URL);
  const played = Number(await page.locator(".tile-value").nth(0).innerText());
  const vrp = (await page.locator(".tile-value").nth(1).innerText()).split("-").map(Number);
  const points = Number(await page.locator(".tile-value").nth(2).innerText());
  const [wins, draws, losses] = vrp;

  expect(wins + draws + losses).toBe(played);
  expect(points).toBe(wins * 3 + draws);
});

test("cross-page: a match's score matches between the team page's match card and the match page itself", async ({ page }) => {
  await page.goto(TEAM_URL);
  // the em dash "—" (not the en dash "–" used on the result badge) marks an unplayed match's score label
  const playedCard = page.locator(".match-list a.match-card").filter({ hasNotText: "—" }).first();
  test.skip((await playedCard.count()) === 0, "no finished match in the current window");

  const cardScore = await playedCard.locator(".mono").nth(1).innerText();
  await playedCard.click();
  await expect(page).toHaveURL(/\/match\/\d+/);
  await expect(page.locator(".score-big")).toHaveText(cardScore);
});

// Bayer 04 Leverkusen / Bundesliga, not Sparta / Chance Liga, on purpose:
// Chance Liga splits into a championship/relegation round after the regular
// season, and the Sezóny table intentionally shows only the regular-season
// stage (see mainTableStage() in worker.js) while the team page's tiles
// count every match all season — so for Chance Liga those two numbers are
// *both* correct but not comparable. Bundesliga has no such split.
test("cross-page: a team's record matches between its team page and the Sezóny standings for the same season", async ({ page }) => {
  await page.goto("/team/3321?league=82");
  // the default-selected season is the most recently *finished* one (see worker.js), so this is stable
  const seasonHref = await page.locator("a.chip.active").first().getAttribute("href");
  const seasonId = seasonHref?.match(/season=(\d+)/)?.[1];
  test.skip(!seasonId, "no finished season chip available right now");

  const played = await page.locator(".tile-value").nth(0).innerText();
  const vrp = await page.locator(".tile-value").nth(1).innerText();
  const points = await page.locator(".tile-value").nth(2).innerText();

  await page.goto(`/league/${seasonId}?league=82`);
  const row = page.locator("table tbody tr", { hasText: "Bayer 04 Leverkusen" }).first();
  const cells = row.locator("td");
  const standingsPlayed = await cells.nth(2).innerText();
  const standingsVrp = `${await cells.nth(3).innerText()}-${await cells.nth(4).innerText()}-${await cells.nth(5).innerText()}`;
  const standingsPoints = await cells.nth(7).innerText();

  expect(played).toBe(standingsPlayed);
  expect(vrp).toBe(standingsVrp);
  expect(points).toBe(standingsPoints);
});

test("oracle: team name matches Sportmonks directly", async ({ page }) => {
  await page.goto(TEAM_URL);
  const shown = await page.getByRole("heading", { name: "Sparta Praha" }).innerText();
  const real = await fetchRealTeamName(2727);
  expect(shown.trim()).toBe(real);
});
