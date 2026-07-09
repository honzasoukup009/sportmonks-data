# sportmonks-data

*[English version here](README.md)*

Nástroj pro stahování dat o hráčích/týmech/soupiskách ze [Sportmonks Football API v3](https://docs.sportmonks.com/football)
na vyžádání. Spustíte běh v GitHub Actions a dostanete CSV soubor ke stažení jako artefakt — bez nutnosti provozovat
vlastní server.

## 1. Získání API tokenu Sportmonks

Zaregistrujte se na [sportmonks.com](https://www.sportmonks.com/) a vyberte plán (zdarma, nebo Standard) pro Football API.
Token najdete v dashboardu Sportmonks v sekci **My Account**.

## 2. Přidání tokenu jako GitHub Actions secret

V repozitáři: **Settings → Secrets and variables → Actions → New repository secret**

- Název: `SPORTMONKS_API_TOKEN`
- Hodnota: váš token

Nebo přes příkazovou řádku:

```bash
gh secret set SPORTMONKS_API_TOKEN
```

## 3. Spuštění

### Přes GitHub Actions (nic se lokálně neinstaluje)

Přejděte na **Actions → Fetch Sportmonks data → Run workflow** a vyplňte:

- `entity`: `team-search`, `player-search`, `team`, `player`, `squad`, nebo `team-stats`
- `id`: číselné ID dané entity v Sportmonks, nebo jméno/hledaný výraz u entit končících na `-search`
- `include` (volitelné): přepíše výchozí řetězec `include`, pokud chcete stáhnout jiná vnořená data

Výsledné CSV soubory stáhnete v sekci **Artifacts** u daného běhu workflow. Pokud odpověď obsahuje vnořené
seznamy (např. u týmu pole `players` nebo `coaches`), jsou rozdělené do samostatných souborů —
`team-85.csv`, `team-85.players.csv`, `team-85.coaches.csv` — a každý podřízený řádek má sloupec `parent_id`,
díky kterému ho lze propojit zpět s hlavní tabulkou. Vnořené jednotlivé objekty (např. `venue`) zůstávají
zploštělé přímo v hlavním souboru jako `venue.name`, `venue.city_name` atd.

### Lokálně

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # a doplňte SPORTMONKS_API_TOKEN

python -m src.fetch --entity team --id 1 --output data/team-1.csv
```

## Přidání nových typů entit

Cesty endpointů a výchozí řetězce `include` jsou definované v [`src/entities.py`](src/entities.py). Přidáním
nového klíče tam podpoříte další endpoint Sportmonks (např. zápasy/fixtures, tabulky, kurzy) — žádné další úpravy
kódu nejsou potřeba, pokud odpověď dodržuje standardní tvar Sportmonks `{ "data": ..., "pagination": ... }`.

## Hledání ID entit

Sportmonks ID nejsou názvy týmů/hráčů — pro jejich zjištění použijte vyhledávací endpointy, např.:

```
https://api.sportmonks.com/v3/football/teams/search/arsenal?api_token=YOUR_TOKEN
```

## Verze pro kamaráda bez GitHubu

Pro sdílení s někým, kdo nemá (a nechce mít) GitHub účet, existuje jednodušší webová verze s formulářem —
viz [`friend-app/README.cz.md`](friend-app/README.cz.md).
