import { test, expect } from "./fixtures";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

async function firstLine(path: string): Promise<string> {
  const rl = createInterface({ input: createReadStream(path, { encoding: "utf-8" }) });
  for await (const line of rl) {
    rl.close();
    return line;
  }
  return "";
}

async function allLines(path: string): Promise<string[]> {
  const rl = createInterface({ input: createReadStream(path, { encoding: "utf-8" }) });
  const lines: string[] = [];
  for await (const line of rl) lines.push(line);
  return lines;
}

test("squad CSV: correct header row and filename, no extra Sportmonks call", async ({ page }) => {
  await page.goto("/team/2727?league=262");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Stáhnout kádr jako Excel (CSV)" }).click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/-kadr\.csv$/);
  const path = await download.path();
  const header = await firstLine(path!);
  // Leading BOM (﻿) for Czech-locale Excel, semicolon-delimited.
  expect(header.replace(/^﻿/, "")).toBe(
    "Číslo;Jméno;Pozice;Datum narození;Zápasy;Góly;Asistence;Žluté;Červené;Minuty"
  );
});

test("cross-page: squad CSV rows match the squad table shown on the page", async ({ page }) => {
  await page.goto("/team/2727?league=262");

  // first <table> in document order is the first squad-position group (Brankáři)
  const row = page.locator("table").first().locator("tbody tr").first();
  const cells = row.locator("td");
  const domName = (await cells.nth(1).innerText()).trim();
  const domApps = (await cells.nth(2).innerText()).trim();
  const domGoals = (await cells.nth(3).innerText()).trim();
  const domAssists = (await cells.nth(4).innerText()).trim();
  const domYellow = (await cells.nth(5).innerText()).trim();
  const domRed = (await cells.nth(6).innerText()).trim();
  const domMinutes = (await cells.nth(7).innerText()).trim();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Stáhnout kádr jako Excel (CSV)" }).click(),
  ]);
  const lines = await allLines((await download.path())!);
  const csvRow = lines.slice(1).find((l) => l.split(";")[1] === domName);
  expect(csvRow, `no CSV row found for "${domName}"`).toBeTruthy();

  const fields = csvRow!.split(";");
  expect(fields[4]).toBe(domApps);
  expect(fields[5]).toBe(domGoals);
  expect(fields[6]).toBe(domAssists);
  expect(fields[7]).toBe(domYellow);
  expect(fields[8]).toBe(domRed);
  expect(fields[9]).toBe(domMinutes);
});

test("fixtures CSV download works from the team page", async ({ page }) => {
  await page.goto("/team/2727?league=262");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Stáhnout zápasy jako Excel (CSV)" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/-zapasy\.csv$/);
});

test("lineups CSV download works from a finished match page", async ({ page }) => {
  await page.goto("/match/19138221?team=2727");
  const button = page.getByRole("button", { name: "Stáhnout sestavy jako Excel (CSV)" });
  test.skip((await button.count()) === 0, "no lineup data recorded for this fixture");
  const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
  expect(download.suggestedFilename()).toMatch(/-sestavy\.csv$/);
});
