// "Ground truth" helpers that query Sportmonks directly, bypassing the app
// entirely — used to independently verify that what the app renders matches
// what Sportmonks actually has. Needs SPORTMONKS_API_TOKEN in e2e/.env.
//
// This is the strongest kind of check in the suite (it's what caught the
// original "wrong card count" bug), but every call here is *in addition* to
// whatever the app itself calls when Playwright loads a page — use it for
// spot-checks on the pages most likely to drift, not on every single number.

const BASE = "https://api.sportmonks.com/v3/football";

function token(): string {
  const t = process.env.SPORTMONKS_API_TOKEN;
  if (!t) throw new Error("SPORTMONKS_API_TOKEN is not set — see e2e/.env.example.");
  return t;
}

async function sportmonksGet(path: string): Promise<any> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}/${path}${sep}api_token=${token()}`);
  const payload = await res.json();
  if (!res.ok) throw new Error(`Sportmonks ${res.status} for ${path}: ${payload?.message}`);
  return payload.data;
}

async function sportmonksGetAll(path: string): Promise<any[]> {
  const sep = path.includes("?") ? "&" : "?";
  let url = `${BASE}/${path}${sep}api_token=${token()}`;
  const results: any[] = [];
  while (url) {
    const res = await fetch(url);
    const payload = await res.json();
    if (!res.ok) throw new Error(`Sportmonks ${res.status} for ${url}: ${payload?.message}`);
    const data = payload.data;
    results.push(...(Array.isArray(data) ? data : data ? [data] : []));
    const pagination = payload.pagination;
    url = pagination?.has_more && pagination?.next_page ? `${pagination.next_page}&api_token=${token()}` : "";
  }
  return results;
}

export async function fetchRealTeamName(teamId: number): Promise<string> {
  const team = await sportmonksGet(`teams/${teamId}`);
  return team.name;
}

export async function fetchRealParticipants(
  fixtureId: number
): Promise<{ homeId: number; awayId: number; homeName: string; awayName: string }> {
  const fixture = await sportmonksGet(`fixtures/${fixtureId}?include=participants`);
  const participants: any[] = fixture.participants || [];
  const home = participants.find((p) => p.meta?.location === "home");
  const away = participants.find((p) => p.meta?.location === "away");
  return { homeId: home?.id, awayId: away?.id, homeName: home?.name, awayName: away?.name };
}

export async function fetchRealScore(fixtureId: number): Promise<{ full: string | null; played: boolean }> {
  const fixture = await sportmonksGet(`fixtures/${fixtureId}?include=scores`);
  const scores: any[] = fixture.scores || [];
  const home = scores.find((s) => s.description === "CURRENT" && s.score?.participant === "home")?.score?.goals;
  const away = scores.find((s) => s.description === "CURRENT" && s.score?.participant === "away")?.score?.goals;
  if (home === undefined || away === undefined) return { full: null, played: false };
  return { full: `${home}:${away}`, played: true };
}

export async function fetchRealFixtureStat(fixtureId: number, teamId: number, typeName: string): Promise<number | null> {
  const fixture = await sportmonksGet(`fixtures/${fixtureId}?include=statistics.type`);
  const stats: any[] = fixture.statistics || [];
  const entry = stats.find((s) => s.participant_id === teamId && s.type?.name === typeName);
  return entry?.data?.value ?? null;
}

export async function fetchRealStandingRow(seasonId: number, teamId: number): Promise<{ position: number; points: number } | null> {
  const rows = await sportmonksGetAll(`standings/seasons/${seasonId}?include=participant;details.type`);
  // Mirror the app's mainTableStage(): only the biggest stage_id group counts
  // (drops championship/relegation-round splits some leagues add at the end).
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.stage_id] = (counts[r.stage_id] || 0) + 1;
  const bestStage = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const mainStage = rows.filter((r) => String(r.stage_id) === String(bestStage));
  const row = mainStage.find((r) => r.participant?.id === teamId);
  return row ? { position: row.position, points: row.points } : null;
}

export async function fetchRealSquadSize(teamId: number): Promise<number> {
  const squad = await sportmonksGetAll(`squads/teams/${teamId}`);
  return squad.length;
}
