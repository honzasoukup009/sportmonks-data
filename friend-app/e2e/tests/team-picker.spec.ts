import { test, expect } from "./fixtures";
import { fetchRealTeamName } from "./oracle";

test("shows all five leagues, each with a grid of clickable teams", async ({ page }) => {
  await page.goto("/team");
  await expect(page.getByRole("heading", { name: "Vyber tým" })).toBeVisible();

  for (const league of ["Chance Liga", "Premier League", "Bundesliga", "Serie A", "La Liga"]) {
    await expect(page.getByRole("heading", { name: league })).toBeVisible();
  }

  const teamLinks = page.locator("a.team-card");
  expect(await teamLinks.count()).toBeGreaterThan(50); // 5 leagues × ~16-20 teams each
});

test("each team tile shows a crest or fallback badge, and links to its team page", async ({ page }) => {
  await page.goto("/team");
  const firstTeam = page.locator("a.team-card").first();
  await expect(firstTeam.locator("img, div.badge")).toBeVisible();

  const href = await firstTeam.getAttribute("href");
  expect(href).toMatch(/^\/team\/\d+\?league=\d+$/);

  await firstTeam.click();
  await expect(page).toHaveURL(/\/team\/\d+/);
});

test("brand link in the sidebar returns to the team picker", async ({ page }) => {
  await page.goto("/help");
  await page.getByRole("link", { name: "LIGASTAT" }).click();
  await expect(page).toHaveURL(/\/team$/);
});

test("oracle: a team tile's name matches Sportmonks directly", async ({ page }) => {
  await page.goto("/team");
  const firstTeam = page.locator("a.team-card").first();
  const shownName = (await firstTeam.locator(".name").innerText()).trim();
  const href = await firstTeam.getAttribute("href");
  const teamId = Number(href?.match(/^\/team\/(\d+)/)?.[1]);

  const realName = await fetchRealTeamName(teamId);
  expect(shownName).toBe(realName);
});
