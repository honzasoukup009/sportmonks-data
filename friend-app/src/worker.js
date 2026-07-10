const SPORTMONKS_BASE = "https://api.sportmonks.com/v3/football";

// Leagues offered in the dropdown. Both IDs confirmed live: Danish Superliga
// (271) from a fixture lookup, Scottish Premiership (501, country_id 1161)
// via /leagues/search/Premiership — id 513 in that same search is the
// end-of-season Play-Offs mini-competition, not the league itself.
const LEAGUES = [
  { id: 271, label: "Dánská Superliga" },
  { id: 501, label: "Skotská Premiership" },
];

const PAGE_STYLE = `
  body { font-family: system-ui, sans-serif; background: #f4f6f8; margin: 0; padding: 1.5rem; color: #1a1a1a; }
  main { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  h1 { font-size: 1.5rem; margin-top: 0; }
  h2 { font-size: 1.2rem; margin-top: 2rem; }
  label { display: block; font-weight: 600; margin: 1rem 0 0.3rem; }
  input[type=text], input[type=password], select { width: 100%; box-sizing: border-box; padding: 0.6rem; font-size: 1.1rem; border: 1px solid #ccc; border-radius: 8px; }
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

function renderPinForm({ error } = {}) {
  return `
    <h1>Soupiska a zápasy týmu</h1>
    <form method="POST" action="/">
      <label for="pin">PIN</label>
      <input id="pin" type="password" name="pin" required autofocus>
      <button type="submit">Pokračovat</button>
    </form>
    ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
  `;
}

function renderTeamOptions(leagueGroups) {
  return leagueGroups
    .map(
      (group) => `<optgroup label="${escapeHtml(group.label)}">
        ${group.teams.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("")}
      </optgroup>`
    )
    .join("");
}

function renderTeamForm({ pin, leagueGroups, error } = {}) {
  const hasTeams = leagueGroups.some((g) => g.teams.length > 0);
  return `
    <h1>Vyber tým</h1>
    ${
      hasTeams
        ? `<form method="POST" action="/">
            <input type="hidden" name="pin" value="${escapeHtml(pin)}">
            <label for="team_id">Tým</label>
            <select id="team_id" name="team_id" required>
              <option value="">-- vyber tým --</option>
              ${renderTeamOptions(leagueGroups)}
            </select>
            <button type="submit">Zobrazit</button>
          </form>`
        : `<form method="POST" action="/">
            <input type="hidden" name="pin" value="${escapeHtml(pin)}">
            <button type="submit">Zkusit znovu načíst seznam týmů</button>
          </form>`
    }
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

async function resolveLeague(config, token) {
  if (config.id) {
    const payload = await sportmonksGet(`leagues/${config.id}?include=currentseason`, token);
    return payload.data || null;
  }
  const payload = await sportmonksGet(`leagues/search/${encodeURIComponent(config.query)}?include=currentseason`, token);
  const data = payload.data || [];
  return data[0] || null;
}

async function fetchSeasonTeams(seasonId, token) {
  const payload = await sportmonksGet(`teams/seasons/${seasonId}`, token);
  return payload.data || [];
}

async function fetchLeagueGroups(token) {
  const groups = [];
  for (const config of LEAGUES) {
    try {
      const league = await resolveLeague(config, token);
      const seasonId = league?.currentseason?.id;
      if (!seasonId) continue;
      const teams = await fetchSeasonTeams(seasonId, token);
      if (!teams.length) continue;
      groups.push({
        label: config.label,
        teams: teams.map((t) => ({ id: t.id, name: t.name })).sort((a, b) => a.name.localeCompare(b.name)),
      });
    } catch {
      // Skip a league that failed to resolve rather than failing the whole page.
    }
  }
  return groups;
}

async function fetchTeam(teamId, token) {
  const payload = await sportmonksGet(`teams/${teamId}`, token);
  return payload.data || null;
}

async function fetchSquad(teamId, token) {
  const payload = await sportmonksGet(`squads/teams/${teamId}?include=player;position`, token);
  return payload.data || [];
}

async function fetchFixtures(teamId, token) {
  const year = new Date().getUTCFullYear();
  const path = `fixtures/between/${year}-01-01/${year}-12-31/${teamId}?include=participants;scores;statistics.type;events.type`;
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

function scoreAt(scores, description) {
  const entries = scores.filter((s) => s.description === description);
  const home = entries.find((s) => s.score?.participant === "home")?.score?.goals;
  const away = entries.find((s) => s.score?.participant === "away")?.score?.goals;
  return home !== undefined && away !== undefined ? `${home}:${away}` : "";
}

function formatMinute(event) {
  const extra = event.extra_minute ? `+${event.extra_minute}` : "";
  return `${event.minute}${extra}'`;
}

function summarizeGoals(fixture, teamNames) {
  const events = fixture.events || [];
  return events
    .filter((e) => e.type?.name === "Goal" || e.type?.name === "Penalty")
    .sort((a, b) => Number(a.minute) - Number(b.minute))
    .map((e) => `${formatMinute(e)} ${e.player_name || "?"} (${teamNames[e.participant_id] || ""})`)
    .join(", ");
}

const CARD_LABELS = {
  Yellowcard: "žlutá",
  Redcard: "červená",
  "Yellow/Red card": "2. žlutá",
};

function summarizeCards(fixture, teamNames) {
  const events = fixture.events || [];
  return events
    .filter((e) => CARD_LABELS[e.type?.name])
    .sort((a, b) => Number(a.minute) - Number(b.minute))
    .map((e) => `${formatMinute(e)} ${e.player_name || "?"} (${CARD_LABELS[e.type.name]}, ${teamNames[e.participant_id] || ""})`)
    .join(", ");
}

function fixtureRow(fixture, teamId) {
  const participants = fixture.participants || [];
  const us = participants.find((p) => p.id === teamId);
  const opponent = participants.find((p) => p.id !== teamId);
  const location = us?.meta?.location;
  const venue = location === "home" ? "Doma" : location === "away" ? "Venku" : "";

  const teamNames = {};
  for (const p of participants) teamNames[p.id] = p.name;

  const scores = fixture.scores || [];
  const fullTime = scoreAt(scores, "CURRENT");
  const halfTime = scoreAt(scores, "1ST_HALF");
  const score = fullTime
    ? halfTime
      ? `${fullTime} (poločas ${halfTime})`
      : fullTime
    : fixture.result_info || "";

  return {
    date: (fixture.starting_at || "").slice(0, 10),
    opponent: opponent?.name || "",
    venue,
    score,
    goals: summarizeGoals(fixture, teamNames),
    cards: summarizeCards(fixture, teamNames),
    stats: summarizeStats(fixture, teamId),
  };
}

function renderResults(teamName, squad, fixtures, pin) {
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
        <td>${escapeHtml(row.goals)}</td>
        <td>${escapeHtml(row.cards)}</td>
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
        ? `<div style="overflow-x: auto;">
          <table>
            <thead><tr><th>Datum</th><th>Soupeř</th><th>Doma/Venku</th><th>Výsledek</th><th>Góly</th><th>Karty</th><th>Statistiky</th></tr></thead>
            <tbody>${fixturesTableRows}</tbody>
          </table>
          </div>
          <p class="hint">Góly, karty a statistiky se zobrazují jen u odehraných zápasů a jen pokud je Sportmonks pro danou soutěž eviduje.</p>
          <form method="POST" action="/download.csv">
            <input type="hidden" name="kind" value="fixtures">
            <input type="hidden" name="team" value="${escapeHtml(teamName)}">
            <input type="hidden" name="rows" value='${escapeHtml(JSON.stringify(fixtures))}'>
            <button type="submit" class="secondary">Stáhnout zápasy jako Excel (CSV)</button>
          </form>`
        : `<p class="hint">Pro tento tým letos nejsou žádné zápasy v evidenci.</p>`
    }

    <form method="POST" action="/">
      <input type="hidden" name="pin" value="${escapeHtml(pin)}">
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
    header: ["Datum", "Soupeř", "Doma/Venku", "Výsledek", "Góly", "Karty", "Statistiky"],
    toRow: (r) => [r.date, r.opponent, r.venue, r.score, r.goals, r.cards, r.stats],
    filenameSuffix: "zapasy",
  },
};

function buildCsv(kind, rows) {
  const schema = CSV_SCHEMAS[kind] || CSV_SCHEMAS.squad;
  const lines = [schema.header, ...rows.map(schema.toRow)].map((line) => line.map(escapeCsvValue).join(";"));
  // Leading BOM + semicolon delimiter so Czech-locale Excel opens it correctly by default.
  return "﻿" + lines.join("\r\n");
}

// Step 1: PIN only. On success, loads the team dropdown (this is the first
// point any Sportmonks call happens, so an unauthenticated visitor can't
// burn API quota just by loading the page).
async function handlePinStep(form, env) {
  const pin = (form.get("pin") || "").toString();
  if (pin !== env.ACCESS_PIN) {
    return htmlResponse(renderPinForm({ error: "Nesprávný PIN." }));
  }

  try {
    const leagueGroups = await fetchLeagueGroups(env.SPORTMONKS_API_TOKEN);
    return htmlResponse(renderTeamForm({ pin, leagueGroups }));
  } catch (err) {
    return htmlResponse(renderTeamForm({ pin, leagueGroups: [], error: err.message }));
  }
}

// Step 2: PIN + chosen team_id. Fetches team name, squad, and fixtures.
async function handleTeamStep(form, env) {
  const pin = (form.get("pin") || "").toString();
  const teamId = Number(form.get("team_id"));

  if (pin !== env.ACCESS_PIN) {
    return htmlResponse(renderPinForm({ error: "Nesprávný PIN." }));
  }
  if (!teamId) {
    const leagueGroups = await fetchLeagueGroups(env.SPORTMONKS_API_TOKEN).catch(() => []);
    return htmlResponse(renderTeamForm({ pin, leagueGroups, error: "Vyber prosím tým ze seznamu." }));
  }

  try {
    const team = await fetchTeam(teamId, env.SPORTMONKS_API_TOKEN);
    const squadData = await fetchSquad(teamId, env.SPORTMONKS_API_TOKEN);
    const fixturesData = await fetchFixtures(teamId, env.SPORTMONKS_API_TOKEN);

    const squad = squadData.map(squadRow);
    const fixtures = fixturesData
      .slice()
      .sort((a, b) => (a.starting_at < b.starting_at ? 1 : -1))
      .map((f) => fixtureRow(f, teamId));

    return htmlResponse(renderResults(team?.name || "Tým", squad, fixtures, pin));
  } catch (err) {
    const leagueGroups = await fetchLeagueGroups(env.SPORTMONKS_API_TOKEN).catch(() => []);
    return htmlResponse(renderTeamForm({ pin, leagueGroups, error: err.message }));
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

// Temporary diagnostic route: (1) finds a well-known Czech club via the
// already-confirmed teams/search endpoint to read off its country_id, and
// (2) tries a few plausible names for the Czech top flight via leagues/search
// (Sportmonks tends to store bare sponsor names, not "Czech X" — Denmark is
// just "Superliga", Scotland is just "Premiership"). Cross-reference the
// country_id to find the right one. Remove once confirmed and hardcoded.
async function handleDebug(request, env) {
  const url = new URL(request.url);
  if (url.searchParams.get("pin") !== env.ACCESS_PIN) {
    return new Response("Neplatný PIN.", { status: 403 });
  }
  const token = env.SPORTMONKS_API_TOKEN;
  const results = {};

  try {
    const payload = await sportmonksGet(`teams/search/${encodeURIComponent("Sparta Praha")}`, token);
    results.teamSample = (payload.data || []).map((t) => ({ id: t.id, name: t.name, country_id: t.country_id }));
  } catch (err) {
    results.teamSampleError = err.message;
  }

  results.leagueMatches = {};
  for (const query of ["Chance Liga", "Fortuna Liga", "Czech Liga", "1. Liga", "Liga"]) {
    try {
      const payload = await sportmonksGet(`leagues/search/${encodeURIComponent(query)}`, token);
      results.leagueMatches[query] = (payload.data || []).map((l) => ({
        id: l.id,
        name: l.name,
        country_id: l.country_id,
        sub_type: l.sub_type,
      }));
    } catch (err) {
      results.leagueMatches[query] = { error: err.message };
    }
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
      return htmlResponse(renderPinForm());
    }
    if (url.pathname === "/" && request.method === "POST") {
      const form = await request.formData();
      return form.get("team_id") ? handleTeamStep(form, env) : handlePinStep(form, env);
    }
    if (url.pathname === "/download.csv" && request.method === "POST") {
      return handleDownload(request);
    }
    if (url.pathname === "/debug" && request.method === "GET") {
      return handleDebug(request, env);
    }
    return new Response("Not found", { status: 404 });
  },
};
