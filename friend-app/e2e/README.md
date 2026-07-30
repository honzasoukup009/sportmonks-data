# Ligastat E2E testy (Playwright)

Nezávislá, čistě read-only sada testů proti nasazené appce — nic nevytváří,
needituje ani nemaže. Testy ale běží proti **živému** Sportmonks API (appka
necachuje), takže každý běh stojí reálné dotazy z limitu — spouštět s
rozvahou, ne při každé maličkosti.

Co jednotlivé testy pokrývají a proč, viz [`../REQUIREMENTS.md`](../REQUIREMENTS.md).

Kromě základních "zobrazí se to" testů obsahuje sada i tři druhy kontrol
správnosti dat (`tests/oracle.ts` + testy popsané jako "internal
consistency" / "cross-page" / "oracle" v jednotlivých `*.spec.ts`):

- **Vnitřní konzistence** — čísla, co appka sama zobrazuje, si musí sedět
  navzájem (např. body = 3×výhry+remízy, součet V-R-P = zápasy).
- **Křížová kontrola mezi stránkami** — stejný fakt zobrazený na dvou místech
  (skóre zápasu na Tým vs. na Zápas, žluté karty celkem vs. součet poločasů)
  se musí shodovat.
- **Nezávislé ověření proti Sportmonks** (`tests/oracle.ts`) — testy si samy
  natáhnou data přímo ze Sportmonks (potřebují `SPORTMONKS_API_TOKEN` v
  `.env`) a porovnají je s tím, co appka vykreslila. Tohle je jediný způsob,
  jak testem odhalit, že appka něco spočítala nebo namapovala špatně, ne jen
  že se to "nějak" zobrazilo.

## Jednorázové nastavení

```bash
cd friend-app/e2e
npm install
npx playwright install chromium   # jen Chromium, stačí to
cp .env.example .env
# do .env vyplň LIGASTAT_PIN a SPORTMONKS_API_TOKEN
```

## Spuštění

```bash
npm test
```

Proti jinému cíli než produkci (např. `wrangler dev` běžícímu na
`localhost:8787`):

```bash
LIGASTAT_BASE_URL=http://localhost:8787 npm test
```

Report z posledního běhu: `npx playwright show-report`.

## Údržba

- `tests/match-page.spec.ts` má dva druhy testů: na **dokončený** zápas (pevná
  data, nemění se — bezpečné pro přesné hodnoty) a na **nadcházející** zápas
  (ID zápasu časem "dohraje" a test přestane sedět — až se to stane, najdi
  nový nadcházející zápas Sparty a uprav `UPCOMING_FIXTURE_URL`).
- Když appka změní chování, aktualizuj nejdřív `REQUIREMENTS.md`, pak testy.
