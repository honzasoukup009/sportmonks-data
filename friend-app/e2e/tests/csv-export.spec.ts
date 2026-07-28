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
