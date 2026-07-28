# Ligastat — požadavky na aplikaci

Zdroj pravdy pro to, co appka má dělat — základ pro Playwright testy v `e2e/`.
Appka je bez JavaScriptu (server-rendered HTML), PIN-gated Cloudflare Worker,
volá živé Sportmonks API. Žádná akce v appce nic nevytváří/nemaže/needituje —
appka je čistě pro čtení (lookup + export existujících dat).

Stav ke dni sepsání: 2026-07-28. Aktualizovat při každé změně appky (stejné
pravidlo jako pro `/help`).

## 1. Přihlášení a session

- `GET /` bez session cookie zobrazí PIN formulář. Sportmonks se nevolá.
- `POST /` se špatným PIN → zůstane na PIN stránce s chybovou hláškou, cookie
  se nenastaví.
- `POST /` se správným PIN → nastaví session cookie (24 h) a přesměruje na
  `/team`.
- Kterákoliv jiná stránka (`/team`, `/team/:id`, `/match/:id`, `/league`,
  `/rozlozeni`, `/help`) bez platné session cookie přesměruje na `/`.
- Session cookie platí napříč všemi stránkami bez nutnosti zadávat PIN znovu.

## 2. Výběr týmu (`GET /team`)

- Zobrazí 5 karet, jedna na ligu: Chance Liga, Premier League, Bundesliga,
  Serie A, La Liga.
- Každá karta obsahuje mřížku klikacích dlaždic (odkazů) — jedna na tým dané
  ligy, seřazené abecedně.
- Každá dlaždice ukazuje znak klubu (`<img>` z `cdn.sportmonks.com`) nebo,
  pokud znak chybí, barevný medailonek s iniciálami týmu.
- Klik na dlaždici vede na `/team/:id?league=:leagueId`.
- Postranní nápis "LIGASTAT" vede na `/team`.

## 3. Stránka Tým (`GET /team/:id`)

### Hlavička
- Znak klubu (nebo medailonek), název týmu, název stadionu.

### Sezónní chipy
- Zaoblená tlačítka pro každou sezónu ligy (aktuální i starší), aktivní
  zvýrazněná. Klik přepne `?season=:seasonId`.

### Karta "Sezóna X"
- Dlaždice: Zápasy, V-R-P, Body, Skóre — za vybranou sezónu.

### Karta "Průměry a časování — Sezóna X"
- Dlaždice: Rohy/zápas, Karty/zápas, Fauly/zápas, Střely/zápas,
  Na branku/zápas, Góly/zápas — průměr **za vybraný tým**.
- Dlaždice: Karta v 1. poločase (%), Gól v 1. poločase (%) — počítáno **za
  celý zápas obou týmů dohromady** (pokud kterýkoliv tým dostal kartu/dal gól
  v 1. poločase, zápas se počítá jako "Ano"). Zahrnuje vlastní góly a druhou
  žlutou kartu.
- Dlaždice: Ø minuta 1. karty.

### Karta "Zápasy"
- Klikací seznam všech zápasů vybrané sezóny (nejnovější první). Každá karta
  zápasu: kolečko V/R/P (nebo "–" pro neodehraný), soupeř, skóre/výsledek,
  datum. Klik vede na `/match/:id?team=:teamId&season=:seasonId`.
- Bez zápasů v sezóně → hláška "Pro tuto sezónu nejsou žádné zápasy v
  evidenci."

### Karta "Posledních N zápasů"
- Nezávislé na vybrané sezóně nahoře — formulář: počet zápasů (číslo,
  1–500), hřiště (Vše / Jen doma / Jen venku).
- Po odeslání appka spojí obě dostupné dokončené sezóny do jednoho okna,
  seřadí zápasy od nejnovějšího, vezme zadaný počet (po filtru na hřiště).
- Pokud je k dispozici méně zápasů, než bylo zadáno → hláška "K dispozici...
  je jen X zápasů... — zobrazeny všechny." Jinak "Zobrazeno posledních X
  zápasů...".
- Dlaždice Zápasy/V-R-P + průměry/časování počítané jen z tohohle výběru.
- Odkaz "Zobrazit rozložení statistik" → `/rozlozeni?team1=:id::leagueId` (s
  předvyplněným počtem/hřištěm, pokud byly zadané).

### Karta "Kádr"
- Tabulka hráčů podle postu (Brankáři/Obránci/Záložníci/Útočníci): číslo,
  jméno, zápasy, góly, asistence, žluté, červené, minuty — sezónní součty.
- Tlačítko "Stáhnout kádr jako Excel (CSV)".

### Karta "Zápasy — export"
- Tlačítko "Stáhnout zápasy jako Excel (CSV)" — CSV má víc sloupců než web
  (rohy, žluté/červené zvlášť, karta/gól v 1. poločase, minuta první karty, a
  totéž zvlášť za 1./2. poločas).

### Karta "Historie sezón" (jen pokud existuje historie)
- Tabulka: sezóna (odkaz), umístění, body, skóre — za předchozí dokončené
  ročníky, kde appka dokázala dohledat pozici týmu.

## 4. Stránka Zápas (`GET /match/:id`)

### Odehraný zápas
- Skóre (+ poločas), status "Konec".
- Klíčové statistiky: srovnávací pruhy home/away pro rohy, držení míče,
  fauly, střely, žluté/červené karty.
- Statistiky podle poločasu: tabulka se sloupci 1./2. poločas pro oba týmy.
- Průběh zápasu: chronologický seznam gólů a karet s minutou a jménem hráče,
  včetně vlastních gólů a druhé žluté karty (typy „Own Goal“, „Yellow/Red
  card“ ze Sportmonks).
- Sestavy: tabulky podle postu pro oba týmy (hodnocení, minuty, přihrávky,
  střely/na branku, fauly, centry, asistence, zákroky). Tlačítko "Stáhnout
  sestavy jako Excel (CSV)" — víc sloupců než web.
- Vzájemné zápasy: posledních 5 zápasů mezi těmito dvěma konkrétními týmy.
- Odkaz "Zpět na tým".

### Nadcházející zápas (žádné skóre)
- Status "Zápas se ještě neodehrál", žádné klíčové statistiky/průběh/sestavy.
- Karta "Odhad pro tento zápas" (jen pokud jsou dostupná data obou týmů):
  - Tabulka "Za celý zápas (0–90+ minut)": Rohy, Karty, Fauly, Střely na
    branku — u každého Ø (součet sezónních průměrů obou týmů) + 3 pravděpo-
    dobnostní pásma (nad X.5).
  - Rohy a Střely na branku používají Bayesovský Gamma-Poisson model
    (tooltip u názvu řádku to říká); Karty a Fauly používají Poissonovo
    rozdělení.
  - Oddělená sekce "Jiná otázka: padne karta v 1. poločase?" — jiné časové
    okno (do 30. minuty… pozor, ve skutečnosti "v 1. poločase"), jasně
    vizuálně oddělená (linka), nesmí se dát zaměnit s tabulkou nad ní.

## 5. Stránka Sezóny (`GET /league`, `GET /league/:seasonId`)

- Ligové chipy (5, jedna na ligu) — přepnutí ligy defaultně vybere její
  nejnovější dokončenou sezónu.
- Sezónní chipy pod nimi — přepínání ročníku vybrané ligy.
- Banner vedoucího týmu tabulky: znak klubu, název, body.
- Tabulka: pořadí, tým (odkaz na `/team/:id`), Z/V/R/P, skóre, body. První 3
  řádky a poslední 2 řádky barevně odlišené (postup/sestup).
- "Nejlepší střelci": až 10 hráčů, jméno + tým + góly.
- Bez tabulky pro danou sezónu → hláška "Pro tuto sezónu není tabulka k
  dispozici." (obdobně pro střelce).

## 6. Rozložení statistik (`GET /rozlozeni`)

- Samostatná položka v postranním menu.
- Formulář se dvěma sloupci: Tým 1 (roletka se všemi týmy, seskupená podle
  ligy) + počet zápasů + hřiště; Tým 2 — stejné, ale nepovinné.
- Bez vybraného týmu (žádné parametry) → zobrazí se jen prázdný formulář.
- S jedním vybraným týmem → jeden sloupec s výsledky.
- Se dvěma vybranými týmy → dva sloupce vedle sebe (na užší obrazovce se
  zalomí pod sebe).
- Výsledkový sloupec: znak + jméno týmu, hláška o počtu použitých zápasů
  (nebo "K dispozici je jen X..." při nedostatku dat), 14 kategorií s
  histogramem do dynamicky počítaných pásem (ne pevné hranice): Rohy 1./2.
  poločas, Góly 1./2. poločas, Žluté karty 1./2. poločas, Fauly celkem,
  Ofsajdy celkem, Ofsajdy soupeře, Centry celkem, Střely celkem, Střely na
  branku, Gól v prvních/posledních 15 minutách.
- Žluté karty po poločasech se počítají z jednotlivých událostí zápasu (ne z
  poločasové statistiky Sportmonks) — spolehlivější (~10 % neshoda se
  skutečným součtem vs. ~29 % u poločasové statistiky, ověřeno na 70
  zápasech).
- Rohy/fauly/ofsajdy/centry/střely na branku po poločasech pořád vycházejí z
  poločasové statistiky Sportmonks, která se u části zápasů neshoduje s
  celkovým součtem (známé omezení, zdokumentované v `/help`).

## 7. Nápověda (`GET /help`)

- Statická stránka, **žádné volání na Sportmonks**.
- Sekce: Jak appka funguje, Stránka Tým, Stránka Zápas, Stránka Sezóny,
  Stránka Rozložení statistik, Technický přehled (schéma + tabulky
  endpointů), Obecné poznámky a omezení.
- Musí být aktualizovaná při každé funkční změně appky (viz `MEMORY.md`
  pravidlo).

## 8. CSV export (`POST /download.csv`)

- Tři druhy (`kind`): `squad`, `fixtures`, `lineups` — každý s vlastní
  hlavičkou sloupců (viz `CSV_SCHEMAS` v kódu).
- Nevolá Sportmonks znovu — jen přeformátuje data, která už appka natáhla a
  vložila do skrytého pole formuláře.
- Odpověď: `Content-Type: text/csv`, BOM na začátku (kvůli českému Excelu),
  název souboru odvozený od týmu/zápasu.

## 9. Obecné chování napříč appkou

- Appka nikde necachuje — každé otevření stránky spustí popsané dotazy na
  Sportmonks znovu.
- Appka se snaží zobrazit statistiky jen tam, kde je jistá, že je Sportmonks
  pro danou ligu skutečně posílá — jinak radši nic nezobrazí, než aby hádala.
- Chybějící/neúspěšné dílčí dotazy appku nezhroutí (např. chybějící historie
  sezón, chybějící predikce u nadcházejícího zápasu) — příslušná sekce se
  jen vynechá nebo zobrazí hlášku.
