const SPORTMONKS_BASE = "https://api.sportmonks.com/v3/football";

const PAGE_STYLE = `
  body { font-family: system-ui, sans-serif; background: #f4f6f8; margin: 0; padding: 1.5rem; color: #1a1a1a; }
  main { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  h1 { font-size: 1.5rem; margin-top: 0; }
  label { display: block; font-weight: 600; margin: 1rem 0 0.3rem; }
  input[type=text], input[type=password] { width: 100%; box-sizing: border-box; padding: 0.6rem; font-size: 1.1rem; border: 1px solid #ccc; border-radius: 8px; }
  button { margin-top: 1.5rem; width: 100%; padding: 0.8rem; font-size: 1.1rem; font-weight: 600; color: #fff; background: #2563eb; border: none; border-radius: 8px; cursor: pointer; }
  button:hover { background: #1d4ed8; }
  button.secondary { background: #16a34a; margin-top: 1rem; }
  button.secondary:hover { background: #15803d; }
  .error { color: #b91c1c; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; font-size: 0.95rem; }
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
    <h1>Soupiska týmu</h1>
    <form method="POST" action="/">
      <label for="pin">PIN</label>
      <input id="pin" type="password" name="pin" required>
      <label for="team">Název týmu</label>
      <input id="team" type="text" name="team" required placeholder="např. FC Kobenhavn" value="${escapeHtml(team)}">
      <button type="submit">Zobrazit soupisku</button>
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

function squadRow(entry) {
  return {
    number: entry.jersey_number ?? "",
    name: entry.player?.display_name ?? entry.player?.name ?? "",
    position: entry.position?.name ?? "",
    birthDate: entry.player?.date_of_birth ?? "",
  };
}

function renderResults(teamName, rows) {
  const tableRows = rows
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.number)}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${escapeHtml(row.position)}</td>
        <td>${escapeHtml(row.birthDate)}</td>
      </tr>`
    )
    .join("");

  return `
    <h1>${escapeHtml(teamName)}</h1>
    <table>
      <thead><tr><th>Číslo</th><th>Jméno</th><th>Pozice</th><th>Datum narození</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
    <form method="POST" action="/download.csv">
      <input type="hidden" name="team" value="${escapeHtml(teamName)}">
      <input type="hidden" name="rows" value='${escapeHtml(JSON.stringify(rows))}'>
      <button type="submit" class="secondary">Stáhnout jako Excel (CSV)</button>
    </form>
    <form method="GET" action="/">
      <button type="submit">Hledat jiný tým</button>
    </form>
  `;
}

function escapeCsvValue(value) {
  const str = String(value ?? "");
  return /[;"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function buildCsv(rows) {
  const header = ["Číslo", "Jméno", "Pozice", "Datum narození"];
  const lines = [header, ...rows.map((r) => [r.number, r.name, r.position, r.birthDate])].map(
    (line) => line.map(escapeCsvValue).join(";")
  );
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
    const squad = await fetchSquad(foundTeam.id, env.SPORTMONKS_API_TOKEN);
    const rows = squad.map(squadRow);
    return htmlResponse(renderResults(foundTeam.name, rows));
  } catch (err) {
    return htmlResponse(renderForm({ error: err.message, team }));
  }
}

async function handleDownload(request) {
  const form = await request.formData();
  const team = (form.get("team") || "tym").toString();
  let rows = [];
  try {
    rows = JSON.parse((form.get("rows") || "[]").toString());
  } catch {
    rows = [];
  }

  const csv = buildCsv(rows);
  const safeName = team.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 60) || "tym";
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${safeName}-soupiska.csv"`,
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
