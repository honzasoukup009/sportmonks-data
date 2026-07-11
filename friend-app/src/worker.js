const SPORTMONKS_BASE = "https://api.sportmonks.com/v3/football";

// Leagues offered in the dropdown, one <select> per league on the team picker.
// IDs confirmed live via /leagues/search/{name} + a leagues/{id}?include=seasons
// data-access check against the actual subscription (Starter/Advanced plan).
const LEAGUES = [
  { id: 262, label: "Chance Liga" },
  { id: 8, label: "Premier League" },
  { id: 82, label: "Bundesliga" },
  { id: 384, label: "Serie A" },
  { id: 564, label: "La Liga" },
];

const PAGE_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  :root {
    --bg:#0A0D12; --surface:#10141C; --surface2:#171C27; --surface3:#1E2531;
    --border:rgba(255,255,255,0.08); --border-strong:rgba(255,255,255,0.16);
    --text:#EAEDF2; --text-dim:#8A93A8; --text-faint:#5B6478;
    --accent:#4C9AFF; --accent2:#FF8A4C; --danger:#FF5C6C; --gold:#F2C94C;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: 'Manrope', sans-serif; }
  a { color: var(--accent); text-decoration: none; }
  h1, h2, h3 { font-family: 'Space Grotesk', sans-serif; margin: 0; }
  .mono { font-family: 'JetBrains Mono', monospace; }
  .app { display: flex; min-height: 100vh; }
  .sidebar { width: 220px; flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--border); padding: 24px 18px; display: flex; flex-direction: column; }
  .brand-name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 20px; }
  .brand-name a { color: inherit; text-decoration: none; }
  .brand-sub { font-size: 11px; color: var(--text-faint); text-transform: uppercase; letter-spacing: .06em; margin-top: 2px; }
  .nav { display: flex; flex-direction: column; gap: 4px; margin-top: 28px; }
  .navlink { display: block; padding: 10px 12px; border-radius: 8px; font-weight: 600; font-size: 14px; color: var(--text-dim); border-left: 3px solid transparent; }
  .navlink.active { color: var(--accent); background: var(--surface3); border-left-color: var(--accent); }
  .navlink.disabled { color: var(--text-faint); cursor: default; }
  .sidebar-footer { margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border); font-size: 11px; color: var(--text-faint); }
  main { flex: 1; padding: 36px 40px; max-width: 1100px; }
  .lead { color: var(--text-dim); font-size: 14px; margin-top: 4px; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px 28px; margin-top: 20px; }
  .card h2 { font-size: 17px; margin-bottom: 14px; }
  form.plain { margin: 0; }
  label { display: block; font-weight: 600; margin: 1rem 0 .3rem; font-size: 14px; }
  input[type=text], input[type=password], select { width: 100%; box-sizing: border-box; padding: .6rem; font-size: 1.05rem; border: 1px solid var(--border-strong); border-radius: 8px; background: var(--surface2); color: var(--text); }
  button, .btn { display: inline-block; margin-top: 1.2rem; padding: .7rem 1.2rem; font-size: 1rem; font-weight: 600; color: #fff; background: var(--accent); border: none; border-radius: 8px; cursor: pointer; text-align: center; }
  button.secondary, .btn.secondary { background: var(--surface3); color: var(--text); border: 1px solid var(--border-strong); }
  .error { color: var(--danger); font-weight: 600; }
  .hint { color: var(--text-faint); font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid var(--border); }
  th { color: var(--text-faint); text-transform: uppercase; font-size: 11px; letter-spacing: .04em; }
  .badge { display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; color: #fff; font-weight: 700; font-family: 'Space Grotesk', sans-serif; flex-shrink: 0; }
  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 12px; margin-top: 16px; }
  .tile { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 14px; }
  .tile-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: .05em; }
  .tile-value { font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 600; margin-top: 4px; }
  .result-badge { width: 24px; height: 24px; border-radius: 50%; color: #0A0D12; font-weight: 700; font-size: 11px; display: flex; align-items: center; justify-content: center; }
  .group-label { display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; margin: 12px 0 6px; }
  .match-list { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
  .match-card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 12px; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; font-size: 11px; text-decoration: none; color: inherit; }
  .match-card:hover { border-color: var(--border-strong); }
  .score-header { display: flex; align-items: center; justify-content: center; gap: 40px; padding: 12px 0; }
  .score-side { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 150px; }
  .score-mid { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .score-big { font-family: 'Space Grotesk', sans-serif; font-size: 38px; font-weight: 700; }
  .status-pill { padding: 3px 10px; border-radius: 999px; background: var(--surface3); color: var(--text-dim); font-size: 11px; font-weight: 600; }
  .stat-row { margin-bottom: 14px; }
  .stat-row .labels { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
  .stat-row .labels .label { color: var(--text-dim); }
  .stat-bar { display: flex; height: 6px; border-radius: 3px; overflow: hidden; background: var(--surface3); }
  .stat-bar .home { background: var(--accent); }
  .stat-bar .away { background: var(--accent2); }
  .timeline-row { display: grid; grid-template-columns: 1fr 52px 1fr; align-items: center; gap: 10px; padding: 4px 0; font-size: 13px; }
  .timeline-row .minute { text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-dim); background: var(--surface2); border-radius: 999px; padding: 3px 0; }
  .timeline-row .home-side { text-align: right; }
  .timeline-row .away-side { text-align: left; }
  .ev-tag { font-weight: 700; font-size: 10px; margin: 0 5px; }
  .lineup-cols { display: flex; flex-direction: column; gap: 24px; }
  .overflow-x { overflow-x: auto; }
  .chip-row { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; }
  .chip { flex-shrink: 0; padding: 8px 16px; border-radius: 999px; border: 1.5px solid var(--border-strong); background: var(--surface2); color: var(--text-dim); font-weight: 600; font-size: 13px; }
  .chip.active { border-color: var(--accent); background: var(--surface3); color: var(--accent); }
  .champion-banner { display: flex; align-items: center; gap: 20px; background: linear-gradient(135deg, hsla(45,90%,55%,0.14), var(--surface)); border: 1px solid var(--border-strong); border-radius: 16px; padding: 20px 28px; margin-top: 20px; }
  .champion-label { font-size: 11px; color: var(--gold); text-transform: uppercase; letter-spacing: .08em; font-weight: 700; }
  .zone-top { border-left: 3px solid var(--accent); }
  .zone-bottom { border-left: 3px solid var(--danger); }
  .scorer-row { display: flex; align-items: center; gap: 10px; background: var(--surface2); border-radius: 12px; padding: 10px 14px; min-width: 200px; }
`;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function shell(activeNav, body) {
  return `
    <div class="app">
      <aside class="sidebar">
        <div>
          <div class="brand-name"><a href="/team">LIGASTAT</a></div>
          <div class="brand-sub">Fotbalová analytika</div>
        </div>
        <nav class="nav">
          <a class="navlink ${activeNav === "team" ? "active" : ""}" href="/team">Tým</a>
          <a class="navlink ${activeNav === "league" ? "active" : ""}" href="/league">Sezóny</a>
        </nav>
        <div class="sidebar-footer">Zdroj dat: Sportmonks API</div>
      </aside>
      <main>${body}</main>
    </div>
  `;
}

function htmlPage(body) {
  return `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ligastat — Sportmonks</title>
<style>${PAGE_STYLE}</style>
</head>
<body>${body}</body>
</html>`;
}

function htmlResponse(body) {
  return new Response(htmlPage(body), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function redirectTo(location, extraHeaders = {}) {
  return new Response(null, { status: 303, headers: { Location: location, ...extraHeaders } });
}

// --- Auth: PIN stored in a cookie after the login form, instead of a hidden
// field on every subsequent form. Lets us use plain <a href> navigation
// between pages while still gating every Sportmonks call behind the PIN.
function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const out = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function sessionCookie(pin) {
  return `session=${encodeURIComponent(pin)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`;
}

function isAuthed(request, env) {
  return parseCookies(request).session === env.ACCESS_PIN;
}

function renderPinPage({ error } = {}) {
  return htmlPage(`
    <div style="max-width:380px;margin:80px auto;padding:0 20px;">
      <h1>Ligastat</h1>
      <p class="lead">Přihlas se PINem, který jsi dostal.</p>
      <form class="plain card" method="POST" action="/">
        <label for="pin">PIN</label>
        <input id="pin" type="password" name="pin" required autofocus>
        <button type="submit">Pokračovat</button>
      </form>
      ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
    </div>
  `);
}

async function sportmonksFetchUrl(url) {
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

// Single request — for single-resource lookups (team by id, league by id, one
// fixture) that never paginate.
async function sportmonksGet(path, token) {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${SPORTMONKS_BASE}/${path}${separator}api_token=${encodeURIComponent(token)}`;
  return sportmonksFetchUrl(url);
}

// Follows pagination.next_page until has_more is false, same as the Python
// client's SportmonksClient.get() — Sportmonks defaults to 25 items per page,
// so anything that can return more than 25 rows (fixtures, standings,
// topscorers...) silently truncates without this.
async function sportmonksGetAll(path, token) {
  const separator = path.includes("?") ? "&" : "?";
  let url = `${SPORTMONKS_BASE}/${path}${separator}api_token=${encodeURIComponent(token)}`;
  const results = [];

  while (url) {
    const payload = await sportmonksFetchUrl(url);
    const data = payload.data;
    results.push(...(Array.isArray(data) ? data : data ? [data] : []));

    const pagination = payload.pagination;
    if (pagination?.has_more && pagination?.next_page) {
      const nextSeparator = pagination.next_page.includes("?") ? "&" : "?";
      url = `${pagination.next_page}${nextSeparator}api_token=${encodeURIComponent(token)}`;
    } else {
      url = null;
    }
  }

  return results;
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
  return sportmonksGetAll(`teams/seasons/${seasonId}`, token);
}

async function fetchLeagueGroups(token) {
  const groups = await Promise.all(
    LEAGUES.map(async (config) => {
      try {
        const league = await resolveLeague(config, token);
        const seasonId = league?.currentseason?.id;
        if (!seasonId) return null;
        const teams = await fetchSeasonTeams(seasonId, token);
        if (!teams.length) return null;
        return {
          id: config.id,
          label: config.label,
          teams: teams.map((t) => ({ id: t.id, name: t.name })).sort((a, b) => a.name.localeCompare(b.name)),
        };
      } catch {
        // Skip a league that failed to resolve rather than failing the whole page.
        return null;
      }
    })
  );
  return groups.filter(Boolean);
}

async function fetchTeam(teamId, token) {
  const payload = await sportmonksGet(`teams/${teamId}?include=venue`, token);
  return payload.data || null;
}

async function fetchSquad(teamId, token) {
  const include = "player.statistics.details.type;position";
  return sportmonksGetAll(`squads/teams/${teamId}?include=${include}`, token);
}

async function fetchFixtures(teamId, startDate, endDate, token) {
  const include =
    "participants;scores;statistics.type;events.type;referees.referee;referees.type;periods.statistics.type";
  const path = `fixtures/between/${startDate}/${endDate}/${teamId}?include=${include}`;
  return sportmonksGetAll(path, token);
}

async function fetchFixtureById(fixtureId, token) {
  const include = [
    "participants",
    "scores",
    "statistics.type",
    "events.type",
    "referees.referee",
    "referees.type",
    "lineups.player",
    "lineups.type",
    "lineups.position",
    "lineups.details.type",
    "formations",
    "league",
    "periods.statistics.type",
  ].join(";");
  const payload = await sportmonksGet(`fixtures/${fixtureId}?include=${include}`, token);
  return payload.data || null;
}

async function fetchHeadToHead(teamA, teamB, token) {
  return sportmonksGetAll(`fixtures/head-to-head/${teamA}/${teamB}?include=participants;scores;league`, token);
}

async function fetchLeagueSeasons(leagueId, token) {
  const payload = await sportmonksGet(`leagues/${leagueId}?include=seasons`, token);
  return payload.data?.seasons || [];
}

async function fetchStandings(seasonId, token) {
  return sportmonksGetAll(`standings/seasons/${seasonId}?include=participant;details.type`, token);
}

async function fetchTopScorers(seasonId, token) {
  return sportmonksGetAll(`topscorers/seasons/${seasonId}?include=player;participant;type`, token);
}

// A season's standings response mixes multiple stages (full table + the
// championship/relegation split groups that come later in the season) in one
// response. The full table is always the stage with the most rows (one per
// team in the league), so we pick that rather than trust stage_id directly.
function mainTableStage(standings) {
  const counts = {};
  for (const row of standings) counts[row.stage_id] = (counts[row.stage_id] || 0) + 1;
  let bestStage = null;
  let bestCount = 0;
  for (const [stage, count] of Object.entries(counts)) {
    if (count > bestCount) {
      bestCount = count;
      bestStage = stage;
    }
  }
  return standings
    .filter((r) => String(r.stage_id) === String(bestStage))
    .sort((a, b) => a.position - b.position);
}

// "Overal Goals Scored" (sic) is Sportmonks' actual field name, not a typo we
// introduced — confirmed live.
const STANDING_DETAIL_KEYS = {
  "Overall Matches Played": "played",
  "Overall Won": "won",
  "Overall Draw": "draw",
  "Overall Lost": "lost",
  "Overal Goals Scored": "gf",
  "Overall Goals Conceded": "ga",
};

function standingRow(row) {
  const details = {};
  for (const d of row.details || []) {
    const key = STANDING_DETAIL_KEYS[d.type?.name];
    if (key) details[key] = d.value;
  }
  return {
    position: row.position,
    teamId: row.participant?.id,
    teamName: row.participant?.name || "",
    shortCode: row.participant?.short_code,
    points: row.points,
    played: details.played ?? "",
    won: details.won ?? "",
    draw: details.draw ?? "",
    lost: details.lost ?? "",
    gf: details.gf ?? "",
    ga: details.ga ?? "",
  };
}

function topScorersList(rows, count = 10) {
  return rows
    .filter((r) => r.type?.name === "Goal Topscorer")
    .sort((a, b) => b.total - a.total)
    .slice(0, count)
    .map((r) => ({
      name: r.player?.display_name || r.player?.name || "",
      team: r.participant?.name || "",
      teamId: r.participant?.id,
      goals: r.total,
    }));
}

// --- Team badge helpers (Sportmonks doesn't give club colors, so we derive a
// stable one from the team id — same idea as the mockup's fake HSL palette).
function teamColor(teamId) {
  const hue = (Number(teamId) * 47) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

function badgeCode(team) {
  if (team?.short_code) return team.short_code;
  return (team?.name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

function badge(team, size = 40) {
  return `<div class="badge" style="width:${size}px;height:${size}px;background:${teamColor(team.id)};font-size:${Math.round(size * 0.34)}px;">${escapeHtml(badgeCode(team))}</div>`;
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

function squadRow(entry) {
  const stats = latestSeasonStats(entry.player);
  return {
    number: entry.jersey_number ?? "",
    name: entry.player?.display_name ?? entry.player?.name ?? "",
    position: entry.position?.name ?? "",
    birthDate: entry.player?.date_of_birth ?? "",
    apps: stats.apps ?? "",
    goals: stats.goals ?? "",
    assists: stats.assists ?? "",
    yellow: stats.yellow ?? "",
    red: stats.red ?? "",
    minutes: stats.minutes ?? "",
  };
}

// Season stats come back as one entry per season the player has played in;
// take the one with the highest season_id (an unstarted/future season simply
// won't have an entry yet, so the max present id is the most recent real one).
const PLAYER_STAT_KEYS = {
  Appearances: "apps",
  Goals: "goals",
  Assists: "assists",
  Yellowcards: "yellow",
  Redcards: "red",
  "Minutes Played": "minutes",
};

function latestSeasonStats(player) {
  const seasons = player?.statistics || [];
  if (!seasons.length) return {};
  const latest = seasons.reduce((a, b) => (b.season_id > a.season_id ? b : a));
  const out = {};
  for (const detail of latest.details || []) {
    const key = PLAYER_STAT_KEYS[detail.type?.name];
    if (!key) continue;
    out[key] = detail.value?.total ?? "";
  }
  return out;
}

const POSITION_GROUPS = [
  { label: "Brankáři", color: "hsl(220,10%,70%)", bg: "hsla(220,10%,70%,0.15)", match: (p) => /goalkeeper/i.test(p) },
  { label: "Obránci", color: "hsl(210,90%,62%)", bg: "hsla(210,90%,62%,0.15)", match: (p) => /defender/i.test(p) },
  { label: "Záložníci", color: "hsl(160,70%,52%)", bg: "hsla(160,70%,52%,0.15)", match: (p) => /midfielder/i.test(p) },
  { label: "Útočníci", color: "hsl(25,90%,62%)", bg: "hsla(25,90%,62%,0.15)", match: (p) => /attacker|forward/i.test(p) },
];

function groupByPosition(rows, positionOf) {
  const groups = POSITION_GROUPS.map((g) => ({ ...g, players: [] }));
  const other = { label: "Ostatní", color: "var(--text-dim)", bg: "var(--surface3)", players: [] };
  for (const row of rows) {
    const pos = positionOf(row) || "";
    const group = groups.find((g) => g.match(pos));
    (group || other).players.push(row);
  }
  return [...groups, other].filter((g) => g.players.length);
}

// Only statistic types confirmed live against the current plan; anything
// else is silently skipped rather than guessed at.
const STAT_LABELS = {
  Corners: "Rohy",
  "Ball Possession %": "Držení míče %",
  Yellowcards: "Žluté karty",
  Redcards: "Červené karty",
  Assists: "Asistence",
  Fouls: "Fauly",
  "Shots Total": "Střely",
  "Shots On Target": "Střely na branku",
  Offsides: "Ofsajdy",
};

// The six types the user asked to see split by half. Corners/Fouls/Offsides
// aren't tracked as individually-timed events (only Goals/Cards are), so a
// half split for those is only possible via Sportmonks' own period-scoped
// statistics — confirmed live via fixtures/{id}?include=periods.statistics.type.
const HALF_STAT_TYPES = {
  Yellowcards: "Žluté karty",
  Redcards: "Červené karty",
  Corners: "Rohy",
  Fouls: "Fauly",
  "Shots On Target": "Střely na branku",
  Offsides: "Ofsajdy",
};

function periodStatValue(fixture, periodDescription, teamId, typeName) {
  const period = (fixture.periods || []).find((p) => p.description === periodDescription);
  if (!period) return null;
  const entry = (period.statistics || []).find((s) => s.participant_id === teamId && s.type?.name === typeName);
  return entry?.data?.value ?? null;
}

function statValue(fixture, teamId, typeName) {
  const stats = fixture.statistics || [];
  const entry = stats.find((s) => s.participant_id === teamId && s.type?.name === typeName);
  return entry?.data?.value ?? null;
}

function summarizeStats(fixture, teamId) {
  const parts = [];
  for (const [typeName, label] of Object.entries(STAT_LABELS)) {
    const value = statValue(fixture, teamId, typeName);
    if (value === null) continue;
    parts.push(`${label}: ${value}`);
  }
  return parts.join(", ");
}

// Per-player match stats confirmed live via lineups.details.type. Sportmonks
// offers dozens more (backward passes, possession lost, error-lead-to-shot...)
// that read as advanced analytics rather than anything a bettor would look
// at — this is the subset relevant to player prop betting markets (goals
// scorers/shots, cards/fouls, assists/creativity, goalkeeper saves).
const PLAYER_MATCH_STAT_TYPES = {
  Rating: "rating",
  "Minutes Played": "minutes",
  Passes: "passes",
  "Shots Total": "shots",
  "Shots On Target": "shotsOnTarget",
  Fouls: "fouls",
  "Total Crosses": "crosses",
  Assists: "assists",
  Saves: "saves",
  "Key Passes": "keyPasses",
  "Big Chances Created": "bigChancesCreated",
  "Big Chances Missed": "bigChancesMissed",
  "Saves Insidebox": "savesInsidebox",
  Tackles: "tackles",
  "Duels Won": "duelsWon",
  "Fouls Drawn": "foulsDrawn",
  "Penalties Committed": "penaltiesCommitted",
  "Penalties Won": "penaltiesWon",
};

function playerMatchStats(entry) {
  const out = {};
  for (const d of entry.details || []) {
    const key = PLAYER_MATCH_STAT_TYPES[d.type?.name];
    if (key) out[key] = d.data?.value;
  }
  return out;
}


function lineupRow(entry, teamName) {
  const stats = playerMatchStats(entry);
  return {
    team: teamName,
    number: entry.jersey_number ?? "",
    name: entry.player_name || "",
    position: entry.position?.name || "",
    role: entry.type?.name === "Lineup" ? "Základní sestava" : "Náhradník",
    rating: stats.rating ?? "",
    minutes: stats.minutes ?? "",
    passes: stats.passes ?? "",
    shots: stats.shots ?? "",
    shotsOnTarget: stats.shotsOnTarget ?? "",
    fouls: stats.fouls ?? "",
    crosses: stats.crosses ?? "",
    assists: stats.assists ?? "",
    saves: stats.saves ?? "",
    keyPasses: stats.keyPasses ?? "",
    bigChancesCreated: stats.bigChancesCreated ?? "",
    bigChancesMissed: stats.bigChancesMissed ?? "",
    savesInsidebox: stats.savesInsidebox ?? "",
    tackles: stats.tackles ?? "",
    duelsWon: stats.duelsWon ?? "",
    foulsDrawn: stats.foulsDrawn ?? "",
    penaltiesCommitted: stats.penaltiesCommitted ?? "",
    penaltiesWon: stats.penaltiesWon ?? "",
  };
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

function mainReferee(fixture) {
  const referees = fixture.referees || [];
  // type_id 6 = "Referee" (the main official), confirmed live — 7/8/9 are
  // assistants and the fourth official, which we don't surface here.
  const main = referees.find((r) => r.type?.name === "Referee" || r.type_id === 6);
  return main?.referee?.name || "";
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

  // Discrete numeric columns (on top of the human-readable "stats" summary
  // string) for anyone who wants to build their own pivot tables/averages in
  // Excel from the CSV export, rather than just reading pre-baked averages.
  const allEvents = fixture.events || [];
  const cardEvents = allEvents.filter((e) => e.type?.name === "Yellowcard" || e.type?.name === "Redcard");
  const goalEvents = allEvents.filter((e) => e.type?.name === "Goal" || e.type?.name === "Penalty");
  const firstCardMinute = cardEvents.length ? Math.min(...cardEvents.map((e) => Number(e.minute))) : "";

  return {
    id: fixture.id,
    date: (fixture.starting_at || "").slice(0, 10),
    opponent: opponent?.name || "",
    opponentId: opponent?.id,
    venue,
    score,
    played: !!fullTime,
    result: classifyResult(fixture, teamId),
    goals: summarizeGoals(fixture, teamNames),
    cards: summarizeCards(fixture, teamNames),
    stats: summarizeStats(fixture, teamId),
    referee: mainReferee(fixture),
    corners: statValue(fixture, teamId, "Corners") ?? "",
    yellow: statValue(fixture, teamId, "Yellowcards") ?? "",
    red: statValue(fixture, teamId, "Redcards") ?? "",
    fouls: statValue(fixture, teamId, "Fouls") ?? "",
    shots: statValue(fixture, teamId, "Shots Total") ?? "",
    shotsOnTarget: statValue(fixture, teamId, "Shots On Target") ?? "",
    offsides: statValue(fixture, teamId, "Offsides") ?? "",
    // Card/goal timing is match-wide (both teams), matching how "total cards/
    // goals by minute X" betting markets are usually framed, not team-only.
    cardBy30: fullTime ? (cardEvents.some((e) => Number(e.minute) <= 30) ? "Ano" : "Ne") : "",
    goalBy30: fullTime ? (goalEvents.some((e) => Number(e.minute) <= 30) ? "Ano" : "Ne") : "",
    firstCardMinute,
    // Per-half split (own team), from Sportmonks' period-scoped statistics.
    cornersH1: periodStatValue(fixture, "1st-half", teamId, "Corners") ?? "",
    cornersH2: periodStatValue(fixture, "2nd-half", teamId, "Corners") ?? "",
    yellowH1: periodStatValue(fixture, "1st-half", teamId, "Yellowcards") ?? "",
    yellowH2: periodStatValue(fixture, "2nd-half", teamId, "Yellowcards") ?? "",
    redH1: periodStatValue(fixture, "1st-half", teamId, "Redcards") ?? "",
    redH2: periodStatValue(fixture, "2nd-half", teamId, "Redcards") ?? "",
    foulsH1: periodStatValue(fixture, "1st-half", teamId, "Fouls") ?? "",
    foulsH2: periodStatValue(fixture, "2nd-half", teamId, "Fouls") ?? "",
    shotsOnTargetH1: periodStatValue(fixture, "1st-half", teamId, "Shots On Target") ?? "",
    shotsOnTargetH2: periodStatValue(fixture, "2nd-half", teamId, "Shots On Target") ?? "",
    offsidesH1: periodStatValue(fixture, "1st-half", teamId, "Offsides") ?? "",
    offsidesH2: periodStatValue(fixture, "2nd-half", teamId, "Offsides") ?? "",
  };
}

// --- Team-level aggregates computed from fixtures we already fetch, so we
// don't need a separate standings/table endpoint just for a team's own record.
function classifyResult(fixture, teamId) {
  const full = scoreAt(fixture.scores || [], "CURRENT");
  if (!full) return null;
  const [homeGoals, awayGoals] = full.split(":").map(Number);
  const us = (fixture.participants || []).find((p) => p.id === teamId);
  const isHome = us?.meta?.location === "home";
  const ours = isHome ? homeGoals : awayGoals;
  const theirs = isHome ? awayGoals : homeGoals;
  if (ours > theirs) return "V";
  if (ours < theirs) return "P";
  return "R";
}

const RESULT_COLOR = { V: "var(--accent)", R: "var(--text-dim)", P: "var(--danger)" };

function teamSummary(fixturesRaw, teamId) {
  let played = 0, wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;
  for (const fixture of fixturesRaw) {
    const result = classifyResult(fixture, teamId);
    if (!result) continue;
    played++;
    if (result === "V") wins++;
    else if (result === "R") draws++;
    else losses++;
    const full = scoreAt(fixture.scores || [], "CURRENT");
    const [h, a] = full.split(":").map(Number);
    const isHome = (fixture.participants || []).find((p) => p.id === teamId)?.meta?.location === "home";
    gf += isHome ? h : a;
    ga += isHome ? a : h;
  }
  return { played, wins, draws, losses, gf, ga, points: wins * 3 + draws };
}

// Per-game averages + timing tendencies from already-fetched fixtureRows —
// useful for statistical betting markets (over/under corners/cards, cards by
// a given minute) rather than just match outcomes.
function teamAverages(fixtureRows) {
  const played = fixtureRows.filter((r) => r.played);
  if (!played.length) return null;

  const n = played.length;
  const sum = (key) => played.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
  const avg = (key) => Math.round((sum(key) / n) * 10) / 10;
  const pct = (key, matchValue) => Math.round((played.filter((r) => r[key] === matchValue).length / n) * 100);

  const firstCardMinutes = played.map((r) => r.firstCardMinute).filter((m) => m !== "" && m !== undefined);
  const firstCardMinuteAvg = firstCardMinutes.length
    ? Math.round(firstCardMinutes.reduce((a, b) => a + b, 0) / firstCardMinutes.length)
    : null;

  return {
    matches: n,
    cornersAvg: avg("corners"),
    cardsAvg: Math.round(((sum("yellow") + sum("red")) / n) * 10) / 10,
    foulsAvg: avg("fouls"),
    shotsAvg: avg("shots"),
    shotsOnTargetAvg: avg("shotsOnTarget"),
    cardBy30Pct: pct("cardBy30", "Ano"),
    goalBy30Pct: pct("goalBy30", "Ano"),
    firstCardMinuteAvg,
  };
}

// --- Simple Poisson-based over/under probability estimate for match totals
// (corners/cards/fouls/shots), used to preview upcoming fixtures. A season
// is ~30 matches — nowhere near enough for anything fancier than a classical
// count distribution, and pretending otherwise would be dishonest. Corners/
// cards/fouls/shots are each team's own output, so a match total is
// approximated as the sum of both teams' season averages (sum of two
// independent Poisson variables is itself Poisson with the summed mean).
function poissonCdf(k, lambda) {
  if (lambda <= 0) return k >= 0 ? 1 : 0;
  // Iterative form (term_i = term_{i-1} * lambda / i) avoids computing raw
  // factorials/powers, which overflow for the k/lambda ranges fouls can reach.
  let term = Math.exp(-lambda);
  let cumulative = term;
  for (let i = 1; i <= k; i++) {
    term *= lambda / i;
    cumulative += term;
  }
  return Math.min(cumulative, 1);
}

// P(X > line) for a X.5 betting line.
function overProbability(line, lambda) {
  const threshold = Math.ceil(line);
  return 1 - poissonCdf(threshold - 1, lambda);
}

// Three X.5 lines bracketing the expected value, so the reader can compare
// against whatever line their sportsbook actually offers.
function thresholdLines(lambda) {
  const base = Math.floor(lambda) + 0.5;
  return [base - 1, base, base + 1].filter((line) => line > 0);
}

// ============================== Views ==============================

function renderTeamPicker({ leagueGroups, error } = {}) {
  const groups = (leagueGroups || []).filter((g) => g.teams.length > 0);

  const pickerCards = groups
    .map(
      (group) => `
        <div class="card">
          <h2>${escapeHtml(group.label)}</h2>
          <form class="plain" method="POST" action="/team">
            <input type="hidden" name="league_id" value="${group.id}">
            <select name="team_id" required>
              <option value="">-- vyber tým --</option>
              ${group.teams.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("")}
            </select>
            <button type="submit">Zobrazit</button>
          </form>
        </div>`
    )
    .join("");

  const body = `
    <h1>Vyber tým</h1>
    <p class="lead">Zobrazíš profil týmu, letošní zápasy a statistiky.</p>
    ${
      groups.length
        ? pickerCards
        : `<div class="card">
            <form class="plain" method="GET" action="/team">
              <button type="submit">Zkusit znovu načíst seznam týmů</button>
            </form>
          </div>`
    }
    ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
  `;
  return shell("team", body);
}

function renderMatchCard(row) {
  const label = row.played ? row.score.split(" ")[0] : "—";
  const badge = row.result
    ? `<div class="result-badge" style="background:${RESULT_COLOR[row.result]};">${row.result}</div>`
    : `<div class="result-badge" style="background:var(--surface3);color:var(--text-dim);">–</div>`;
  return `
    <a class="match-card" href="/match/${row.id}?team=${row.__teamId}${row.__seasonId ? `&season=${row.__seasonId}` : ""}">
      ${badge}
      <div class="mono" style="font-size:11px;">${escapeHtml(row.opponent)}</div>
      <div class="mono" style="font-weight:600;">${escapeHtml(label)}</div>
      <div class="hint" style="font-size:10px;">${escapeHtml(row.date)}</div>
    </a>
  `;
}

function renderTeamPage(team, fixturesRaw, fixtureRows, squad, history, seasons, selectedSeason, leagueId) {
  const summary = teamSummary(fixturesRaw, team.id);
  const tiles = [
    { label: "Zápasy", value: summary.played },
    { label: "V-R-P", value: `${summary.wins}-${summary.draws}-${summary.losses}` },
    { label: "Body", value: summary.points },
    { label: "Skóre", value: `${summary.gf}:${summary.ga}` },
  ];

  const averages = teamAverages(fixtureRows);
  const averageTiles = averages
    ? [
        { label: "Rohy/zápas", value: averages.cornersAvg },
        { label: "Karty/zápas", value: averages.cardsAvg },
        { label: "Fauly/zápas", value: averages.foulsAvg },
        { label: "Střely/zápas", value: averages.shotsAvg },
        { label: "Na branku/zápas", value: averages.shotsOnTargetAvg },
        { label: "Góly/zápas", value: (summary.gf / (summary.played || 1)).toFixed(1) },
      ]
    : [];
  const timingTiles = averages
    ? [
        { label: "Karta do 30.'", value: `${averages.cardBy30Pct} %` },
        { label: "Gól do 30.'", value: `${averages.goalBy30Pct} %` },
        { label: "Ø minuta 1. karty", value: averages.firstCardMinuteAvg !== null ? `${averages.firstCardMinuteAvg}'` : "—" },
      ]
    : [];

  const matchCards = fixtureRows
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((r) => renderMatchCard({ ...r, __teamId: team.id, __seasonId: selectedSeason?.id }))
    .join("");

  const squadGroups = groupByPosition(squad, (row) => row.position);
  const squadTable = squadGroups
    .map(
      (group) => `
        <div class="group-label" style="color:${group.color};background:${group.bg};">${escapeHtml(group.label)}</div>
        <table>
          <thead><tr><th title="Číslo dresu">Č.</th><th>Hráč</th><th title="Zápasy">Z</th><th title="Góly">G</th><th title="Asistence">A</th><th title="Žluté karty">ŽK</th><th title="Červené karty">ČK</th><th title="Minuty">Min</th></tr></thead>
          <tbody>
            ${group.players
              .map(
                (p) => `<tr>
                  <td class="mono">${escapeHtml(p.number)}</td>
                  <td>${escapeHtml(p.name)}</td>
                  <td class="mono">${escapeHtml(p.apps)}</td>
                  <td class="mono">${escapeHtml(p.goals)}</td>
                  <td class="mono">${escapeHtml(p.assists)}</td>
                  <td class="mono">${escapeHtml(p.yellow)}</td>
                  <td class="mono">${escapeHtml(p.red)}</td>
                  <td class="mono">${escapeHtml(p.minutes)}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      `
    )
    .join("");

  const body = `
    <div style="display:flex;align-items:center;gap:20px;">
      ${badge(team, 60)}
      <div>
        <h1>${escapeHtml(team.name)}</h1>
        <div class="lead">${escapeHtml(team.venue?.name || "")}</div>
      </div>
    </div>

    <div class="chip-row" style="margin-top:20px;">
      ${seasons.map((s) => `<a class="chip ${selectedSeason && s.id === selectedSeason.id ? "active" : ""}" href="/team/${team.id}?season=${s.id}&league=${leagueId}">${escapeHtml(s.name)}</a>`).join("")}
    </div>

    <div class="card">
      <h2>Sezóna ${escapeHtml(selectedSeason?.name || "")}</h2>
      <div class="tiles">
        ${tiles.map((t) => `<div class="tile"><div class="tile-label">${escapeHtml(t.label)}</div><div class="tile-value mono">${escapeHtml(t.value)}</div></div>`).join("")}
      </div>
    </div>

    ${
      averages
        ? `<div class="card">
            <h2>Průměry a časování — ${escapeHtml(selectedSeason?.name || "")}</h2>
            <div class="tiles">
              ${averageTiles.map((t) => `<div class="tile"><div class="tile-label">${escapeHtml(t.label)}</div><div class="tile-value mono">${escapeHtml(t.value)}</div></div>`).join("")}
            </div>
            <div class="tiles" style="margin-top:10px;">
              ${timingTiles.map((t) => `<div class="tile"><div class="tile-label">${escapeHtml(t.label)}</div><div class="tile-value mono">${escapeHtml(t.value)}</div></div>`).join("")}
            </div>
            <p class="hint" style="margin-top:10px;">Rohy/karty/fauly/střely jsou průměr za ${escapeHtml(team.name)}. Časování karty/gólu do 30. minuty počítá s oběma týmy v zápase (odpovídá sázkovým trhům na "do X. minuty").</p>
          </div>`
        : ""
    }

    <div class="card">
      <h2>Zápasy</h2>
      ${fixtureRows.length ? `<div class="match-list">${matchCards}</div>` : `<p class="hint">Pro tuto sezónu nejsou žádné zápasy v evidenci.</p>`}
    </div>

    <div class="card">
      <h2>Kádr</h2>
      ${squadTable}
      <form class="plain" method="POST" action="/download.csv" style="margin-top:16px;">
        <input type="hidden" name="kind" value="squad">
        <input type="hidden" name="team" value="${escapeHtml(team.name)}">
        <input type="hidden" name="rows" value='${escapeHtml(JSON.stringify(squad))}'>
        <button type="submit" class="secondary">Stáhnout kádr jako Excel (CSV)</button>
      </form>
    </div>

    <div class="card">
      <h2>Zápasy — export</h2>
      <p class="hint">Detaily jednotlivých zápasů (góly, karty, statistiky) najdeš po kliknutí na zápas výše. Kompletní přehled zápasů vybrané sezóny si můžeš stáhnout i jako tabulku.</p>
      <form class="plain" method="POST" action="/download.csv">
        <input type="hidden" name="kind" value="fixtures">
        <input type="hidden" name="team" value="${escapeHtml(team.name)}">
        <input type="hidden" name="rows" value='${escapeHtml(JSON.stringify(fixtureRows))}'>
        <button type="submit" class="secondary">Stáhnout zápasy jako Excel (CSV)</button>
      </form>
    </div>

    ${
      history.length
        ? `<div class="card">
            <h2>Historie sezón</h2>
            <table>
              <thead><tr><th>Sezóna</th><th>Poř.</th><th>Body</th><th>Skóre</th></tr></thead>
              <tbody>
                ${history
                  .map(
                    (h) => `<tr>
                      <td class="mono"><a href="/team/${team.id}?season=${h.seasonId}&league=${leagueId}">${escapeHtml(h.season)}</a></td>
                      <td class="mono" style="color:${h.position === 1 ? "var(--gold)" : "var(--text)"};font-weight:700;">${escapeHtml(h.position)}.</td>
                      <td class="mono">${escapeHtml(h.points)}</td>
                      <td class="mono">${escapeHtml(h.gf)}:${escapeHtml(h.ga)}</td>
                    </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>`
        : ""
    }

    <a class="btn secondary" href="/team" style="margin-top:20px;">Vybrat jiný tým</a>
  `;
  return shell("team", body);
}

function statBarRow(fixture, homeId, awayId, typeName, label) {
  const homeVal = statValue(fixture, homeId, typeName);
  const awayVal = statValue(fixture, awayId, typeName);
  if (homeVal === null && awayVal === null) return "";
  const h = Number(homeVal) || 0;
  const a = Number(awayVal) || 0;
  const total = h + a || 1;
  const hp = Math.round((h / total) * 100);
  return `
    <div class="stat-row">
      <div class="labels"><span class="mono">${escapeHtml(homeVal ?? "-")}</span><span class="label">${escapeHtml(label)}</span><span class="mono">${escapeHtml(awayVal ?? "-")}</span></div>
      <div class="stat-bar"><div class="home" style="width:${hp}%;"></div><div class="away" style="width:${100 - hp}%;"></div></div>
    </div>
  `;
}

function renderHalfStatsTable(fixture, home, away) {
  const rows = Object.entries(HALF_STAT_TYPES)
    .map(([typeName, label]) => {
      const h1h = periodStatValue(fixture, "1st-half", home?.id, typeName);
      const h1a = periodStatValue(fixture, "1st-half", away?.id, typeName);
      const h2h = periodStatValue(fixture, "2nd-half", home?.id, typeName);
      const h2a = periodStatValue(fixture, "2nd-half", away?.id, typeName);
      if (h1h === null && h1a === null && h2h === null && h2a === null) return "";
      return `<tr>
        <td>${escapeHtml(label)}</td>
        <td class="mono">${escapeHtml(h1h ?? "-")}</td>
        <td class="mono">${escapeHtml(h1a ?? "-")}</td>
        <td class="mono">${escapeHtml(h2h ?? "-")}</td>
        <td class="mono">${escapeHtml(h2a ?? "-")}</td>
      </tr>`;
    })
    .join("");

  if (!rows) return `<p class="hint">Pro tento zápas nejsou poločasové statistiky evidované.</p>`;

  const homeCode = escapeHtml(badgeCode(home));
  const awayCode = escapeHtml(badgeCode(away));
  const homeName = escapeHtml(home?.name || "");
  const awayName = escapeHtml(away?.name || "");
  return `
    <div class="overflow-x">
      <table>
        <thead>
          <tr><th></th><th colspan="2">1. poločas</th><th colspan="2">2. poločas</th></tr>
          <tr><th>Statistika</th><th title="${homeName}">${homeCode}</th><th title="${awayName}">${awayCode}</th><th title="${homeName}">${homeCode}</th><th title="${awayName}">${awayCode}</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

const EVENT_STYLE = {
  Goal: { label: "GÓL", color: "var(--accent)" },
  Penalty: { label: "PEN", color: "var(--accent)" },
  Yellowcard: { label: "ŽK", color: "var(--gold)" },
  Redcard: { label: "ČK", color: "var(--danger)" },
  "Yellow/Red card": { label: "2.ŽK", color: "var(--danger)" },
};

function renderTimeline(fixture, homeId) {
  const events = (fixture.events || [])
    .filter((e) => EVENT_STYLE[e.type?.name])
    .sort((a, b) => Number(a.minute) - Number(b.minute));

  if (!events.length) return `<p class="hint">Žádné zaznamenané události.</p>`;

  return events
    .map((e) => {
      const style = EVENT_STYLE[e.type.name];
      const isHome = e.participant_id === homeId;
      const text = `<span class="ev-tag" style="color:${style.color};">${style.label}</span>${escapeHtml(e.player_name || "?")}`;
      return `
        <div class="timeline-row">
          <div class="home-side">${isHome ? text : ""}</div>
          <div class="minute">${formatMinute(e)}</div>
          <div class="away-side">${!isHome ? text : ""}</div>
        </div>
      `;
    })
    .join("");
}

const LINEUP_TABLE_COLUMNS = [
  { key: "rating", label: "Hod", title: "Hodnocení" },
  { key: "minutes", label: "Min", title: "Minuty" },
  { key: "passes", label: "Přih", title: "Přihrávky" },
  { key: "shots", label: "Stř", title: "Střely" },
  { key: "shotsOnTarget", label: "NaBr", title: "Střely na branku" },
  { key: "fouls", label: "F", title: "Fauly" },
  { key: "crosses", label: "Cen", title: "Centry" },
  { key: "assists", label: "As", title: "Asistence" },
  { key: "saves", label: "Zákr", title: "Zákroky (brankář)" },
];

function renderLineupColumn(fixture, teamId, teamName) {
  const lineups = (fixture.lineups || []).filter((l) => l.team_id === teamId);
  const starters = lineups.filter((l) => l.type?.name === "Lineup");
  const bench = lineups.filter((l) => l.type?.name === "Bench");
  const formation = (fixture.formations || []).find((f) => f.participant_id === teamId)?.formation || "";

  const groups = groupByPosition(
    starters.map((l) => {
      const stats = playerMatchStats(l);
      return { jersey: l.jersey_number, name: l.player_name, position: l.position?.name, stats };
    }),
    (row) => row.position
  );

  const groupsHtml = groups
    .map(
      (g) => `
        <div class="group-label" style="color:${g.color};background:${g.bg};">${escapeHtml(g.label)}</div>
        <div class="overflow-x">
          <table>
            <thead>
              <tr>
                <th>Č.</th><th>Hráč</th>
                ${LINEUP_TABLE_COLUMNS.map((c) => `<th title="${escapeHtml(c.title)}">${escapeHtml(c.label)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${g.players
                .map(
                  (p) => `<tr>
                    <td class="mono">${escapeHtml(p.jersey)}</td>
                    <td>${escapeHtml(p.name)}</td>
                    ${LINEUP_TABLE_COLUMNS.map((c) => `<td class="mono">${escapeHtml(p.stats[c.key] ?? "-")}</td>`).join("")}
                  </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `
    )
    .join("");

  const benchText = bench.map((p) => `${p.jersey_number || ""} ${p.player_name}`).join(" · ");

  return `
    <div>
      <div class="hint" style="margin-bottom:8px;">${escapeHtml(teamName)} ${formation ? `· <span class="mono">${escapeHtml(formation)}</span>` : ""}</div>
      ${starters.length ? groupsHtml : `<p class="hint">Sestava zatím není k dispozici.</p>`}
      ${bench.length ? `<div class="hint" style="margin-top:10px;">Náhradníci: ${escapeHtml(benchText)}</div>` : ""}
    </div>
  `;
}

function renderH2H(h2h, teamId) {
  if (!h2h.length) return `<p class="hint">Žádné dřívější vzájemné zápasy v evidenci.</p>`;
  return `
    <div class="overflow-x">
      <table>
        <thead><tr><th>Datum</th><th>Soutěž</th><th>Skóre</th><th></th></tr></thead>
        <tbody>
          ${h2h
            .map((f) => {
              const result = classifyResult(f, teamId);
              const score = scoreAt(f.scores || [], "CURRENT") || f.result_info || "";
              return `<tr>
                <td>${escapeHtml((f.starting_at || "").slice(0, 10))}</td>
                <td>${escapeHtml(f.league?.name || "")}</td>
                <td class="mono">${escapeHtml(score)}</td>
                <td>${result ? `<span class="result-badge" style="background:${RESULT_COLOR[result]};">${result}</span>` : ""}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderSeasonPage(seasons, selectedSeason, table, topScorers, leagueId) {
  const leagueLabel = LEAGUES.find((l) => l.id === leagueId)?.label || "";
  const leagueChips = LEAGUES.map(
    (l) => `<a class="chip ${l.id === leagueId ? "active" : ""}" href="/league?league=${l.id}">${escapeHtml(l.label)}</a>`
  ).join("");
  const chips = seasons
    .map(
      (s) => `<a class="chip ${s.id === selectedSeason.id ? "active" : ""}" href="/league/${s.id}?league=${leagueId}">${escapeHtml(s.name)}</a>`
    )
    .join("");

  const champion = table[0];

  const tableRows = table
    .map((r) => {
      const zoneClass = r.position <= 3 ? "zone-top" : r.position >= table.length - 2 ? "zone-bottom" : "";
      return `<tr class="${zoneClass}" style="padding-left:8px;">
        <td class="mono" style="font-weight:700;">${escapeHtml(r.position)}</td>
        <td><a href="/team/${r.teamId}?league=${leagueId}">${escapeHtml(r.teamName)}</a></td>
        <td class="mono">${escapeHtml(r.played)}</td>
        <td class="mono">${escapeHtml(r.won)}</td>
        <td class="mono">${escapeHtml(r.draw)}</td>
        <td class="mono">${escapeHtml(r.lost)}</td>
        <td class="mono">${escapeHtml(r.gf)}:${escapeHtml(r.ga)}</td>
        <td class="mono" style="font-weight:700;">${escapeHtml(r.points)}</td>
      </tr>`;
    })
    .join("");

  const scorerCards = topScorers
    .map(
      (p) => `<div class="scorer-row">
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:600;">${escapeHtml(p.name)}</div>
          <div class="hint">${escapeHtml(p.team)}</div>
        </div>
        <div class="mono" style="font-weight:700;color:var(--accent);">${escapeHtml(p.goals)}</div>
      </div>`
    )
    .join("");

  const body = `
    <h1>Sezóny</h1>
    <p class="lead">Tabulka a nejlepší střelci — ${escapeHtml(leagueLabel)}.</p>

    <div class="chip-row" style="margin-top:16px;">${leagueChips}</div>
    <div class="chip-row" style="margin-top:10px;">${chips}</div>

    ${
      champion
        ? `<div class="champion-banner">
            ${badge({ id: champion.teamId, name: champion.teamName, short_code: champion.shortCode }, 52)}
            <div>
              <div class="champion-label">Vede tabulku — ${escapeHtml(selectedSeason.name)}</div>
              <div style="font-family:'Space Grotesk',sans-serif;font-size:19px;font-weight:700;">${escapeHtml(champion.teamName)}</div>
            </div>
            <div class="mono" style="margin-left:auto;font-size:21px;font-weight:700;">${escapeHtml(champion.points)} b.</div>
          </div>`
        : ""
    }

    <div class="card">
      <h2>Tabulka</h2>
      ${
        table.length
          ? `<div class="overflow-x"><table>
              <thead><tr><th title="Pořadí">Poř.</th><th>Tým</th><th title="Zápasy">Z</th><th title="Výhry">V</th><th title="Remízy">R</th><th title="Prohry">P</th><th>Skóre</th><th title="Body">B</th></tr></thead>
              <tbody>${tableRows}</tbody>
            </table></div>`
          : `<p class="hint">Pro tuto sezónu není tabulka k dispozici.</p>`
      }
    </div>

    <div class="card">
      <h2>Nejlepší střelci</h2>
      ${topScorers.length ? `<div style="display:flex;gap:14px;flex-wrap:wrap;">${scorerCards}</div>` : `<p class="hint">Pro tuto sezónu nejsou střelci k dispozici.</p>`}
    </div>
  `;
  return shell("league", body);
}

const MATCH_PREDICTION_MARKETS = [
  { label: "Rohy", avgKey: "cornersAvg" },
  { label: "Karty", avgKey: "cardsAvg", title: "Žluté i červené karty dohromady" },
  { label: "Fauly", avgKey: "foulsAvg" },
  { label: "Střely na branku", avgKey: "shotsOnTargetAvg" },
];

function renderMatchPrediction(prediction, home, away) {
  if (!prediction) return "";
  const { rangeLabel, homeAvg, awayAvg } = prediction;

  const rows = MATCH_PREDICTION_MARKETS.map(({ label, avgKey, title }) => {
    const lambda = (Number(homeAvg[avgKey]) || 0) + (Number(awayAvg[avgKey]) || 0);
    if (!lambda) return "";
    const lineCells = thresholdLines(lambda)
      .map((line) => {
        const pct = Math.round(overProbability(line, lambda) * 100);
        return `<td class="mono">nad ${escapeHtml(line)}: ${pct} %</td>`;
      })
      .join("");
    const labelCell = title
      ? `<td title="${escapeHtml(title)}">${escapeHtml(label)}</td>`
      : `<td>${escapeHtml(label)}</td>`;
    return `<tr>${labelCell}<td class="mono">${lambda.toFixed(1)}</td>${lineCells}</tr>`;
  }).join("");

  if (!rows) return "";

  const cardBy30 =
    homeAvg.cardBy30Pct !== undefined && awayAvg.cardBy30Pct !== undefined
      ? Math.round((homeAvg.cardBy30Pct + awayAvg.cardBy30Pct) / 2)
      : null;

  return `
    <div class="card">
      <h2>Odhad pro tento zápas</h2>
      <p class="hint">Založeno na průměrech obou týmů za sezóny ${escapeHtml(rangeLabel || "")}
        (${escapeHtml(home?.name || "")}: ${escapeHtml(homeAvg.matches)} zápasů, ${escapeHtml(away?.name || "")}:
        ${escapeHtml(awayAvg.matches)} zápasů). Jednoduchý statistický odhad (Poissonovo rozdělení z průměrů) —
        orientační vodítko, ne skutečná predikce ani kurz.</p>

      <div style="font-weight:600;font-size:14px;margin-top:16px;">Za celý zápas (0–90+ minut)</div>
      <div class="overflow-x">
        <table>
          <thead><tr><th>Statistika</th><th title="Očekávaná hodnota — součet průměrů obou týmů">Ø</th><th colspan="3">Pravděpodobnost, že padne...</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      ${
        cardBy30 !== null
          ? `<div style="font-weight:600;font-size:14px;margin-top:18px;padding-top:14px;border-top:1px solid var(--border);">Jiná otázka: padne karta brzy?</div>
            <p class="hint" style="margin-top:6px;">Tohle nesouvisí s počtem karet v tabulce výše (ten je za celý zápas) — jde jen o to, jestli padne
              <strong>alespoň jedna</strong> karta (kterýkoliv tým) už v prvních 30 minutách: v zápasech obou týmů v průměru
              <span class="mono" style="font-weight:600;">${cardBy30} %</span>
              (${escapeHtml(home?.name || "")} <span class="mono" style="font-weight:600;">${homeAvg.cardBy30Pct} %</span>,
              ${escapeHtml(away?.name || "")} <span class="mono" style="font-weight:600;">${awayAvg.cardBy30Pct} %</span>).</p>`
          : ""
      }
    </div>
  `;
}

function renderMatchPage(fixture, teamId, h2h, seasonId, prediction) {
  const participants = fixture.participants || [];
  const home = participants.find((p) => p.meta?.location === "home");
  const away = participants.find((p) => p.meta?.location === "away");
  const fullTime = scoreAt(fixture.scores || [], "CURRENT");
  const halfTime = scoreAt(fixture.scores || [], "1ST_HALF");
  const played = !!fullTime;
  const referee = mainReferee(fixture);

  const statRows = Object.entries(STAT_LABELS)
    .map(([typeName, label]) => statBarRow(fixture, home?.id, away?.id, typeName, label))
    .join("");

  const meta = [fixture.league?.name, (fixture.starting_at || "").slice(0, 16).replace("T", " "), referee]
    .filter(Boolean)
    .join(" · ");

  const allLineupRows = (fixture.lineups || []).map((l) =>
    lineupRow(l, l.team_id === home?.id ? home?.name || "" : away?.name || "")
  );
  const matchLabel = `${home?.name || ""} vs ${away?.name || ""}`;

  const body = `
    <h1>Zápas</h1>
    <p class="lead">${escapeHtml(meta)}</p>

    <div class="card">
      <div class="score-header">
        <div class="score-side">${badge(home, 56)}<div style="font-weight:600;text-align:center;">${escapeHtml(home?.name || "")}</div></div>
        <div class="score-mid">
          <div class="score-big mono">${escapeHtml(played ? fullTime : "—")}</div>
          <div class="status-pill">${played ? `${halfTime ? "poločas " + escapeHtml(halfTime) : ""} Konec` : "Zápas se ještě neodehrál"}</div>
        </div>
        <div class="score-side">${badge(away, 56)}<div style="font-weight:600;text-align:center;">${escapeHtml(away?.name || "")}</div></div>
      </div>
    </div>

    ${
      played
        ? `<div class="card">
            <h2>Klíčové statistiky</h2>
            ${statRows || `<p class="hint">Pro tento zápas nejsou statistiky evidované.</p>`}
          </div>

          <div class="card">
            <h2>Statistiky podle poločasu</h2>
            ${renderHalfStatsTable(fixture, home, away)}
          </div>

          <div class="card">
            <h2>Průběh zápasu</h2>
            ${renderTimeline(fixture, home?.id)}
          </div>

          <div class="card">
            <h2>Sestavy</h2>
            <div class="lineup-cols">
              ${renderLineupColumn(fixture, home?.id, home?.name || "")}
              ${renderLineupColumn(fixture, away?.id, away?.name || "")}
            </div>
            ${
              allLineupRows.length
                ? `<form class="plain" method="POST" action="/download.csv" style="margin-top:16px;">
                    <input type="hidden" name="kind" value="lineups">
                    <input type="hidden" name="team" value="${escapeHtml(matchLabel)}">
                    <input type="hidden" name="rows" value='${escapeHtml(JSON.stringify(allLineupRows))}'>
                    <button type="submit" class="secondary">Stáhnout sestavy jako Excel (CSV)</button>
                  </form>`
                : ""
            }
          </div>`
        : renderMatchPrediction(prediction, home, away)
    }

    <div class="card">
      <h2>Vzájemné zápasy</h2>
      ${renderH2H(h2h, teamId)}
    </div>

    ${(() => {
      const backParams = [seasonId ? `season=${seasonId}` : "", fixture.league?.id ? `league=${fixture.league.id}` : ""]
        .filter(Boolean)
        .join("&");
      return `<a class="btn secondary" href="/team/${teamId}${backParams ? `?${backParams}` : ""}" style="margin-top:20px;">Zpět na tým</a>`;
    })()}
  `;
  return shell("team", body);
}

// ============================== CSV export ==============================

function escapeCsvValue(value) {
  const str = String(value ?? "");
  return /[;"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

const CSV_SCHEMAS = {
  squad: {
    header: ["Číslo", "Jméno", "Pozice", "Datum narození", "Zápasy", "Góly", "Asistence", "Žluté", "Červené", "Minuty"],
    toRow: (r) => [r.number, r.name, r.position, r.birthDate, r.apps, r.goals, r.assists, r.yellow, r.red, r.minutes],
    filenameSuffix: "kadr",
  },
  fixtures: {
    header: [
      "Datum", "Soupeř", "Doma/Venku", "Výsledek", "Góly", "Karty", "Statistiky", "Rozhodčí",
      "Rohy", "Žluté", "Červené", "Fauly", "Střely", "Střely na branku", "Ofsajdy",
      "Karta do 30.", "Gól do 30.", "Minuta 1. karty",
      "Rohy 1.PL", "Rohy 2.PL", "Žluté 1.PL", "Žluté 2.PL", "Červené 1.PL", "Červené 2.PL",
      "Fauly 1.PL", "Fauly 2.PL", "Na branku 1.PL", "Na branku 2.PL", "Ofsajdy 1.PL", "Ofsajdy 2.PL",
    ],
    toRow: (r) => [
      r.date, r.opponent, r.venue, r.score, r.goals, r.cards, r.stats, r.referee,
      r.corners, r.yellow, r.red, r.fouls, r.shots, r.shotsOnTarget, r.offsides,
      r.cardBy30, r.goalBy30, r.firstCardMinute,
      r.cornersH1, r.cornersH2, r.yellowH1, r.yellowH2, r.redH1, r.redH2,
      r.foulsH1, r.foulsH2, r.shotsOnTargetH1, r.shotsOnTargetH2, r.offsidesH1, r.offsidesH2,
    ],
    filenameSuffix: "zapasy",
  },
  lineups: {
    header: [
      "Tým", "Číslo", "Jméno", "Pozice", "Role",
      "Hodnocení", "Minuty", "Přihrávky", "Klíčové přihrávky", "Střely", "Střely na branku",
      "Centry", "Vytvořené šance", "Zahozené šance",
      "Fauly", "Vynucené fauly", "Zaviněné penalty", "Vynucené penalty",
      "Skluzy", "Vyhrané souboje", "Asistence", "Zákroky", "Zákroky v pokutovém",
    ],
    toRow: (r) => [
      r.team, r.number, r.name, r.position, r.role,
      r.rating, r.minutes, r.passes, r.keyPasses, r.shots, r.shotsOnTarget,
      r.crosses, r.bigChancesCreated, r.bigChancesMissed,
      r.fouls, r.foulsDrawn, r.penaltiesCommitted, r.penaltiesWon,
      r.tackles, r.duelsWon, r.assists, r.saves, r.savesInsidebox,
    ],
    filenameSuffix: "sestavy",
  },
};

function buildCsv(kind, rows) {
  const schema = CSV_SCHEMAS[kind] || CSV_SCHEMAS.squad;
  const lines = [schema.header, ...rows.map(schema.toRow)].map((line) => line.map(escapeCsvValue).join(";"));
  // Leading BOM + semicolon delimiter so Czech-locale Excel opens it correctly by default.
  return "﻿" + lines.join("\r\n");
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

// ============================== Route handlers ==============================

// Seasons worth offering a chip for (skip anything neither finished nor
// currently running), most recent first.
function displayableSeasons(seasons) {
  return seasons
    .filter((s) => s.finished || s.is_current)
    .sort((a, b) => (a.starting_at < b.starting_at ? 1 : -1));
}

// Default to the most recently finished season rather than "is_current" —
// Sportmonks flags next season as current as soon as it's scheduled, weeks
// before a ball is kicked, which would otherwise default to an empty season.
function pickSeason(seasons, seasonId) {
  return seasonId ? seasons.find((s) => s.id === seasonId) : seasons.find((s) => s.finished) || seasons[0];
}

async function teamSeasonHistory(teamId, finishedSeasons, token) {
  const history = [];
  for (const season of finishedSeasons) {
    try {
      const standings = await fetchStandings(season.id, token);
      const table = mainTableStage(standings).map(standingRow);
      const row = table.find((r) => r.teamId === teamId);
      if (row) {
        history.push({
          seasonId: season.id,
          season: season.name,
          position: row.position,
          points: row.points,
          gf: row.gf,
          ga: row.ga,
        });
      }
    } catch {
      // Skip a season whose standings failed to resolve.
    }
  }
  return history;
}

async function handleTeamPage(teamId, seasonId, leagueId, env) {
  try {
    const token = env.SPORTMONKS_API_TOKEN;
    const team = await fetchTeam(teamId, token);
    const seasons = await fetchLeagueSeasons(leagueId, token);
    const seasonOptions = displayableSeasons(seasons);
    const selectedSeason = pickSeason(seasonOptions, seasonId);

    const fixturesRaw = selectedSeason
      ? await fetchFixtures(teamId, selectedSeason.starting_at.slice(0, 10), selectedSeason.ending_at.slice(0, 10), token)
      : [];
    const squadData = await fetchSquad(teamId, token);
    const history = await teamSeasonHistory(teamId, seasonOptions.filter((s) => s.finished), token).catch(() => []);

    const fixtureRows = fixturesRaw.map((f) => fixtureRow(f, teamId));
    const squad = squadData.map(squadRow);

    return htmlResponse(
      renderTeamPage(team || { id: teamId, name: "Tým" }, fixturesRaw, fixtureRows, squad, history, seasonOptions, selectedSeason, leagueId)
    );
  } catch (err) {
    return htmlResponse(renderTeamPicker({ leagueGroups: [], error: err.message }));
  }
}

async function handleSeasonPage(seasonId, leagueId, env) {
  const token = env.SPORTMONKS_API_TOKEN;
  const seasons = await fetchLeagueSeasons(leagueId, token);
  const displayable = displayableSeasons(seasons);
  const selected = pickSeason(displayable, seasonId);

  if (!selected) {
    return htmlResponse(renderSeasonPage([], { id: 0, name: "Sezóny" }, [], [], leagueId));
  }

  const [standings, scorersRaw] = await Promise.all([
    fetchStandings(selected.id, token).catch(() => []),
    fetchTopScorers(selected.id, token).catch(() => []),
  ]);
  const table = mainTableStage(standings).map(standingRow);
  const topScorers = topScorersList(scorersRaw);

  return htmlResponse(renderSeasonPage(displayable, selected, table, topScorers, leagueId));
}

// Span across every *finished* season (currently 2024/25 + 2025/26) rather
// than just the latest one, so averages are computed from ~60-70 matches
// instead of ~30-35 — more stable, at the cost of including a squad that may
// have since changed via transfers. fixtures/between/{start}/{end}/{team}
// only returns matches that actually happened in the window, so spanning the
// gap between seasons (May to July) is harmless.
function finishedSeasonsRange(seasons) {
  const finished = seasons.filter((s) => s.finished).sort((a, b) => (a.starting_at < b.starting_at ? -1 : 1));
  if (!finished.length) return null;
  const label =
    finished.length > 1 ? `${finished[0].name}–${finished[finished.length - 1].name}` : finished[0].name;
  return {
    start: finished[0].starting_at.slice(0, 10),
    end: finished[finished.length - 1].ending_at.slice(0, 10),
    label,
  };
}

async function fetchTeamAveragesForRange(teamId, start, end, token) {
  const fixturesRaw = await fetchFixtures(teamId, start, end, token);
  const fixtureRows = fixturesRaw.map((f) => fixtureRow(f, teamId));
  return teamAverages(fixtureRows);
}

async function handleMatchPage(fixtureId, teamId, seasonId, env) {
  try {
    const token = env.SPORTMONKS_API_TOKEN;
    const fixture = await fetchFixtureById(fixtureId, token);
    if (!fixture) throw new Error("Zápas se nepodařilo najít.");

    const participants = fixture.participants || [];
    const home = participants.find((p) => p.meta?.location === "home");
    const away = participants.find((p) => p.meta?.location === "away");
    let h2h = [];
    if (home && away) {
      const all = await fetchHeadToHead(home.id, away.id, token);
      h2h = all.filter((f) => f.id !== fixture.id).sort((a, b) => (a.starting_at < b.starting_at ? 1 : -1));
    }

    // Only worth computing a preview for matches that haven't happened yet —
    // for a finished match we already show what actually happened.
    let prediction = null;
    const alreadyPlayed = !!scoreAt(fixture.scores || [], "CURRENT");
    const leagueId = fixture.league?.id;
    if (!alreadyPlayed && home && away && leagueId) {
      try {
        const seasons = await fetchLeagueSeasons(leagueId, token);
        const range = finishedSeasonsRange(seasons);
        if (range) {
          const [homeAvg, awayAvg] = await Promise.all([
            fetchTeamAveragesForRange(home.id, range.start, range.end, token),
            fetchTeamAveragesForRange(away.id, range.start, range.end, token),
          ]);
          if (homeAvg && awayAvg) {
            prediction = { rangeLabel: range.label, homeAvg, awayAvg };
          }
        }
      } catch {
        // No prediction rather than a broken page if the underlying data fails.
      }
    }

    return htmlResponse(renderMatchPage(fixture, teamId, h2h, seasonId, prediction));
  } catch (err) {
    return redirectTo(`/team/${teamId}`);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/" && request.method === "GET") {
      return htmlResponse(renderPinPage());
    }
    if (path === "/" && request.method === "POST") {
      const form = await request.formData();
      const pin = (form.get("pin") || "").toString();
      if (pin !== env.ACCESS_PIN) {
        return htmlResponse(renderPinPage({ error: "Nesprávný PIN." }));
      }
      return redirectTo("/team", { "Set-Cookie": sessionCookie(pin) });
    }

    if (path === "/team" && request.method === "GET") {
      if (!isAuthed(request, env)) return redirectTo("/");
      try {
        const leagueGroups = await fetchLeagueGroups(env.SPORTMONKS_API_TOKEN);
        return htmlResponse(renderTeamPicker({ leagueGroups }));
      } catch (err) {
        return htmlResponse(renderTeamPicker({ leagueGroups: [], error: err.message }));
      }
    }
    if (path === "/team" && request.method === "POST") {
      if (!isAuthed(request, env)) return redirectTo("/");
      const form = await request.formData();
      const teamId = form.get("team_id");
      if (!teamId) {
        const leagueGroups = await fetchLeagueGroups(env.SPORTMONKS_API_TOKEN).catch(() => []);
        return htmlResponse(renderTeamPicker({ leagueGroups, error: "Vyber prosím tým ze seznamu." }));
      }
      const leagueId = Number(form.get("league_id")) || LEAGUES[0].id;
      return redirectTo(`/team/${teamId}?league=${leagueId}`);
    }

    const teamMatch = path.match(/^\/team\/(\d+)$/);
    if (teamMatch && request.method === "GET") {
      if (!isAuthed(request, env)) return redirectTo("/");
      const seasonId = url.searchParams.get("season");
      const leagueId = Number(url.searchParams.get("league")) || LEAGUES[0].id;
      return handleTeamPage(Number(teamMatch[1]), seasonId ? Number(seasonId) : null, leagueId, env);
    }

    const matchMatch = path.match(/^\/match\/(\d+)$/);
    if (matchMatch && request.method === "GET") {
      if (!isAuthed(request, env)) return redirectTo("/");
      const teamId = Number(url.searchParams.get("team"));
      const seasonId = url.searchParams.get("season");
      return handleMatchPage(Number(matchMatch[1]), teamId, seasonId ? Number(seasonId) : null, env);
    }

    const seasonMatch = path.match(/^\/league(?:\/(\d+))?$/);
    if (seasonMatch && request.method === "GET") {
      if (!isAuthed(request, env)) return redirectTo("/");
      const leagueId = Number(url.searchParams.get("league")) || LEAGUES[0].id;
      return handleSeasonPage(seasonMatch[1] ? Number(seasonMatch[1]) : null, leagueId, env);
    }

    if (path === "/download.csv" && request.method === "POST") {
      return handleDownload(request);
    }

    return new Response("Not found", { status: 404 });
  },
};
