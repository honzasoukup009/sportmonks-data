# sportmonks-data

On-demand fetcher for player/team/squad data from the [Sportmonks Football API v3](https://docs.sportmonks.com/football).
Trigger a run from GitHub Actions, get back a CSV as a downloadable artifact — no server to maintain.

## 1. Get a Sportmonks API token

Sign up at [sportmonks.com](https://www.sportmonks.com/) and pick a plan (Free trial or Standard) for the Football API.
Your token appears in the Sportmonks dashboard under **My Account**.

## 2. Add the token as a GitHub Actions secret

In the repo: **Settings → Secrets and variables → Actions → New repository secret**

- Name: `SPORTMONKS_API_TOKEN`
- Value: your token

Or via the CLI:

```bash
gh secret set SPORTMONKS_API_TOKEN
```

## 3. Run it

### Via GitHub Actions (no local setup needed)

Go to **Actions → Fetch Sportmonks data → Run workflow**, fill in:

- `entity`: `team`, `player`, `squad`, or `team-stats`
- `id`: the Sportmonks numeric ID for that entity
- `include` (optional): override the default `include` string to pull different nested data

Download the resulting CSV from the workflow run's **Artifacts** section.

### Locally

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in SPORTMONKS_API_TOKEN

python -m src.fetch --entity team --id 1 --output data/team-1.csv
```

## Adding new entity types

Endpoint paths and default `include` strings live in [`src/entities.py`](src/entities.py). Add a new key there to
support another Sportmonks endpoint (e.g. fixtures, standings, odds) — no other code changes needed as long as the
response follows Sportmonks' standard `{ "data": ..., "pagination": ... }` shape.

## Finding entity IDs

Sportmonks IDs aren't the team/player names — use the search endpoints to resolve them, e.g.:

```
https://api.sportmonks.com/v3/football/teams/search/arsenal?api_token=YOUR_TOKEN
```
