# Ligastat — dashboard pro kamaráda (bez GitHubu)

Tmavý dashboard ve stylu profesionální sportovní analytiky: kamarád zadá PIN, vybere tým z Chance Ligy
a dostane profil týmu (kádr se sezónními statistikami, forma, přehled zápasů) i detail jednotlivého
zápasu (skóre, klíčové statistiky, průběh zápasu, sestavy, vzájemné zápasy). Soupisku i zápasy si může
stáhnout jako Excel (CSV). Běží na Cloudflare Workers zdarma, bez nutnosti mít GitHub účet — kamarád jen
otevře odkaz v prohlížeči.

## Jednorázové nastavení (děláš ty)

1. **Založ si Cloudflare účet** (pokud ho nemáš) na [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) — zdarma.

2. **Přihlas se přes příkazovou řádku** (otevře prohlížeč pro potvrzení):

   ```bash
   cd friend-app
   npx wrangler login
   ```

3. **Nastav tajné hodnoty** (token a PIN se ptají interaktivně, nikam se neukládají do repozitáře):

   ```bash
   npx wrangler secret put SPORTMONKS_API_TOKEN
   # vlož svůj Sportmonks API token

   npx wrangler secret put ACCESS_PIN
   # vymysli PIN, který sdělíš jen kamarádovi (např. 4-6 znaků)
   ```

4. **Nasaď:**

   ```bash
   npx wrangler deploy
   ```

   Wrangler vypíše URL adresu (něco jako `https://sportmonks-friend-lookup.<tvuj-subdomain>.workers.dev`).

5. **Pošli kamarádovi odkaz a PIN — ideálně odděleně** (např. odkaz e-mailem, PIN SMS), ať to spolu nikde
   neuvidí třetí strana.

## Jak to kamarád používá

1. Otevře odkaz v prohlížeči (funguje i na mobilu).
2. Zadá PIN a klikne na "Pokračovat" — přihlášení se pamatuje (cookie na 24 hodin), nemusí PIN zadávat
   znovu při každé stránce.
3. Vybere tým z rozbalovacího seznamu (týmy Chance Ligy — české nejvyšší soutěže).
4. Na stránce **Tým** vidí: chipy pro přepnutí sezóny (nahoře), sezónní přehled (zápasy, V-R-P, body,
   skóre), **průměry a časování za sezónu** (rohy/karty/fauly/střely na zápas, kolik % zápasů mělo kartu
   nebo gól do 30. minuty, průměrná minuta první karty — užitečné pro sázky na statistiky, ne jen na
   výsledek), formu (posledních 5 zápasů), klikací přehled zápasů vybrané sezóny — včetně starších
   ročníků, ne jen aktuálního — a kompletní kádr se sezónními statistikami každého hráče (zápasy, góly,
   asistence, karty, minuty).
5. Kliknutím na konkrétní zápas se dostane na stránku **Zápas**: skóre s poločasem, klíčové statistiky
   (rohy, držení míče, fauly, střely, karty — porovnání obou týmů), **statistiky podle poločasu** (žluté/
   červené karty, rohy, fauly, střely na branku, ofsajdy — zvlášť za 1. a 2. poločas, oba týmy), průběh
   zápasu (góly a karty s minutou a jménem hráče), sestavy obou týmů (podle formace a postu, u každého
   hráče hodnocení, odehrané minuty, přihrávky a střely) a posledních 5 vzájemných zápasů.
6. Kdekoliv na stránce Tým může kliknout na "Stáhnout jako Excel (CSV)" u kádru nebo u zápasů; na stránce
   Zápas jde stejně stáhnout sestavy obou týmů se statistikami hráčů. Export zápasů teď navíc obsahuje
   samostatné sloupce (rohy, žluté/červené karty, fauly, střely, ofsajdy, karta/gól do 30. minuty, minuta
   první karty, a totéž zvlášť za 1. a 2. poločas) — jde si v Excelu spočítat vlastní průměry a filtry
   místo spoléhání na čísla na stránce.
7. V postranním menu klikne na **Sezóny**: tabulka Chance Ligy (aktuální i minulé ročníky přes chipy
   nahoře), banner vedoucího týmu a přehled 10 nejlepších střelců sezóny. Na stránce Tým navíc je
   "Historie sezón" — umístění a body týmu v předchozích ročnících, s odkazem na zápasy dané sezóny.

Sportmonks se volá až po zadání správného PINu (samotné otevření stránky nic nestahuje) — žádná data se
nenačtou, dokud PIN neprojde, aby cizí návštěvník s odkazem, ale bez PINu, nemohl čerpat tvůj limit.

Statistiky se ukazují jen u typů, které jsme ověřili naostro (rohy, držení míče, fauly, střely, žluté/
červené karty, asistence). Sportmonks má pro Chance Ligu evidované jen 3 sezóny (2024/25, 2025/26,
2026/27) — hlubší historie není na tomto tarifu k dispozici.

## Údržba

- Změna kódu: uprav `src/worker.js`, pak znovu `npx wrangler deploy`.
- Změna PIN: `npx wrangler secret put ACCESS_PIN` a zadej nový.
- Sledování využití API limitu: v Sportmonks dashboardu (My Account), stránka volá Sportmonks jen když
  někdo zadá PIN a klikne na vyhledání (žádné volání naprázdno).
