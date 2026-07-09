const SPORTMONKS_BASE = "https://api.sportmonks.com/v3/football";

const PAGE_STYLE = `
  body { font-family: system-ui, sans-serif; background: #f4f6f8; margin: 0; padding: 1.5rem; color: #1a1a1a; }
  main { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  h1 { font-size: 1.5rem; margin-top: 0; }
  h2 { font-size: 1.2rem; margin-top: 2rem; }
  label { display: block; font-weight: 600; margin: 1rem 0 0.3rem; }
  input[type=text], input[type=password] { width: 100%; box-sizing: border-box; padding: 0.6rem; font-size: 1.1rem; border: 1px solid #ccc; border-radius: 8px; }
  button { margin-top: 1.5rem; width: 100%; padding: 0.8rem; font-size: 1.1rem; font-weight: 600; color: #fff; background: #2563eb; border: none; border-radius: 8px; cursor: pointer; }
  button:hover { background: #1d4ed8; }
  button.secondary { background: #16a34a; margin-top: 1rem; }
  button.secondary:hover { background: #15803d; }
  .error { color: #b91c1c; font-weight: 600; }
  .hint { color: #666; font-size: 0.9rem; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.95rem; }
  th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #eee; }
  th { background: #f4f6f8; }
`;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function htmlPage(body) {
  return `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Soupiska týmu — Sportmonks</title>
<style>${PAGE_STYLE}</style>
</head>
<body><main>${body}</main></body>
</html>`;
}

function htmlResponse(body) {
  return new Response(htmlPage(body), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function renderForm({ error, team } = {}) {
  return `
    <h1>Soupiska a zápasy týmu</h1>
    <form method="POST" action="/">
      <label for="pin">PIN</label>
      <input id="pin" type="password" name="pin" required>
      <label for="team">Název týmu</label>
      <input id="team" type="text" name="team" required placeholder="např. FC Kobenhavn" value="${escapeHtml(team)}">
      <button type="submit">Zobrazit</button>
    </form>
    ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
  `;
}

async function sportmonksGet(path, token) {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${SPORTMONKS_BASE}/${path}${separator}api_token=${encodeURIComponent(token)}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url);
    if (response.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      continue;
    }
    if (!response.ok) {
      throw new Error(`Sportmonks API vrátilo chybu ${response.status}.`);
    }
    return response.json();
  }
  throw new Error("Sportmonks API je teď přetížené, zkus to prosím za chvíli znovu.");
}

async function findTeam(name, token) {
  const payload = await sportmonksGet(`teams/search/${encodeURIComponent(name)}`, token);
  const data = payload.data || [];
  return data[0] || null;
}

async function fetchSquad(teamId, token) {
  const payload = await sportmonksGet(`squads/teams/${teamId}?include=player;position`, token);
  return payload.data || [];
}

async function fetchFixtures(teamId, token) {
  const year = new Date().getUTCFullYear();
  const path = `fixtures/between/${year}-01-01/${year}-12-31/${teamId}?include=participants;scores;statistics.type`;
  const payload = await sportmonksGet(path, token);
  return payload.data || [];
}

function squadRow(entry) {
  return {
    number: entry.jersey_number ?? "",
    name: entry.player?.display_name ?? entry.player?.name ?? "",
    position: entry.position?.name ?? "",
    birthDate: entry.player?.date_of_birth ?? "",
  };
}

// Only the statistic types actually observed on the free-plan leagues; anything
// else is silently skipped rather than guessed at.
const STAT_LABELS = {
  Corners: "Rohy",
  "Ball Possession %": "Držení míče %",
  Yellowcards: "Žluté karty",
  Redcards: "Červené karty",
  Assists: "Asistence",
};

function summarizeStats(fixture, teamId) {
  const stats = fixture.statistics || [];
  const parts = [];
  for (const stat of stats) {
    if (stat.participant_id !== teamId) continue;
    const label = STAT_LABELS[stat.type?.name];
    if (!label) continue;
    const value = stat.data?.value;
    if (value === undefined || value === null) continue;
    parts.push(`${label}: ${value}`);
  }
  return parts.join(", ");
}

function fixtureRow(fixture, teamId) {
  const participants = fixture.participants || [];
  const us = participants.find((p) => p.id === teamId);
  const opponent = participants.find((p) => p.id !== teamId);
  const location = us?.meta?.location;
  const venue = location === "home" ? "Doma" : location === "away" ? "Venku" : "";

  const scores = fixture.scores || [];
  const current = scores.filter((s) => s.description === "CURRENT");
  const homeGoals = current.find((s) => s.score?.participant === "home")?.score?.goals;
  const awayGoals = current.find((s) => s.score?.participant === "away")?.score?.goals;
  const score =
    homeGoals !== undefined && awayGoals !== undefined ? `${homeGoals}:${awayGoals}` : fixture.result_info || "";

  return {
    date: (fixture.starting_at || "").slice(0, 10),
    opponent: opponent?.name || "",
    venue,
    score,
    stats: summarizeStats(fixture, teamId),
  };
}

function renderResults(teamName, squad, fixtures) {
  const squadTableRows = squad
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.number)}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${escapeHtml(row.position)}</td>
        <td>${escapeHtml(row.birthDate)}</td>
      </tr>`
    )
    .join("");

  const fixturesTableRows = fixtures
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.date)}</td>
        <td>${escapeHtml(row.opponent)}</td>
        <td>${escapeHtml(row.venue)}</td>
        <td>${escapeHtml(row.score)}</td>
        <td>${escapeHtml(row.stats)}</td>
      </tr>`
    )
    .join("");

  return `
    <h1>${escapeHtml(teamName)}</h1>

    <h2>Soupiska</h2>
    <table>
      <thead><tr><th>Číslo</th><th>Jméno</th><th>Pozice</th><th>Datum narození</th></tr></thead>
      <tbody>${squadTableRows}</tbody>
    </table>
    <form method="POST" action="/download.csv">
      <input type="hidden" name="kind" value="squad">
      <input type="hidden" name="team" value="${escapeHtml(teamName)}">
      <input type="hidden" name="rows" value='${escapeHtml(JSON.stringify(squad))}'>
      <button type="submit" class="secondary">Stáhnout soupisku jako Excel (CSV)</button>
    </form>

    <h2>Zápasy — ${new Date().getUTCFullYear()}</h2>
    ${
      fixtures.length
        ? `<table>
            <thead><tr><th>Datum</th><th>Soupeř</th><th>Doma/Venku</th><th>Výsledek</th><th>Statistiky</th></tr></thead>
            <tbody>${fixturesTableRows}</tbody>
          </table>
          <p class="hint">Statistiky se zobrazují jen u odehraných zápasů a jen pokud je Sportmonks pro danou soutěž eviduje.</p>
          <form method="POST" action="/download.csv">
            <input type="hidden" name="kind" value="fixtures">
            <input type="hidden" name="team" value="${escapeHtml(teamName)}">
            <input type="hidden" name="rows" value='${escapeHtml(JSON.stringify(fixtures))}'>
            <button type="submit" class="secondary">Stáhnout zápasy jako Excel (CSV)</button>
          </form>`
        : `<p class="hint">Pro tento tým letos nejsou žádné zápasy v evidenci.</p>`
    }

    <form method="GET" action="/">
      <button type="submit">Hledat jiný tým</button>
    </form>
  `;
}

function escapeCsvValue(value) {
  const str = String(value ?? "");
  return /[;"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

const CSV_SCHEMAS = {
  squad: {
    header: ["Číslo", "Jméno", "Pozice", "Datum narození"],
    toRow: (r) => [r.number, r.name, r.position, r.birthDate],
    filenameSuffix: "soupiska",
  },
  fixtures: {
    header: ["Datum", "Soupeř", "Doma/Venku", "Výsledek", "Statistiky"],
    toRow: (r) => [r.date, r.opponent, r.venue, r.score, r.stats],
    filenameSuffix: "zapasy",
  },
};

function buildCsv(kind, rows) {
  const schema = CSV_SCHEMAS[kind] || CSV_SCHEMAS.squad;
  const lines = [schema.header, ...rows.map(schema.toRow)].map((line) => line.map(escapeCsvValue).join(";"));
  // Leading BOM + semicolon delimiter so Czech-locale Excel opens it correctly by default.
  return "﻿" + lines.join("\r\n");
}

async function handleSearch(request, env) {
  const form = await request.formData();
  const pin = (form.get("pin") || "").toString();
  const team = (form.get("team") || "").toString().trim();

  if (pin !== env.ACCESS_PIN) {
    return htmlResponse(renderForm({ error: "Nesprávný PIN.", team }));
  }
  if (!team) {
    return htmlResponse(renderForm({ error: "Zadej název týmu.", team }));
  }

  try {
    const foundTeam = await findTeam(team, env.SPORTMONKS_API_TOKEN);
    if (!foundTeam) {
      return htmlResponse(
        renderForm({ error: `Tým "${team}" se nepodařilo najít. Zkus jiný název nebo jen jeho část.`, team })
      );
    }
    const squadData = await fetchSquad(foundTeam.id, env.SPORTMONKS_API_TOKEN);
    const fixturesData = await fetchFixtures(foundTeam.id, env.SPORTMONKS_API_TOKEN);

    const squad = squadData.map(squadRow);
    const fixtures = fixturesData
      .slice()
      .sort((a, b) => (a.starting_at < b.starting_at ? 1 : -1))
      .map((f) => fixtureRow(f, foundTeam.id));

    return htmlResponse(renderResults(foundTeam.name, squad, fixtures));
  } catch (err) {
    return htmlResponse(renderForm({ error: err.message, team }));
  }
}

async function handleDownload(request) {
  const form = await request.formData();
  const kind = (form.get("kind") || "squad").toString();
  const team = (form.get("team") || "tym").toString();
  let rows = [];
  try {
    rows = JSON.parse((form.get("rows") || "[]").toString());
  } catch {
    rows = [];
  }

  const schema = CSV_SCHEMAS[kind] || CSV_SCHEMAS.squad;
  const csv = buildCsv(kind, rows);
  const safeName = team.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 60) || "tym";
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${safeName}-${schema.filenameSuffix}.csv"`,
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
      return htmlResponse(renderForm());
    }
    if (url.pathname === "/" && request.method === "POST") {
      return handleSearch(request, env);
    }
    if (url.pathname === "/download.csv" && request.method === "POST") {
      return handleDownload(request);
    }
    return new Response("Not found", { status: 404 });
  },
};
