# Vyhledávač soupisek a zápasů pro kamaráda (bez GitHubu)

Jednoduchá webová stránka s formulářem: kamarád napíše název týmu a PIN, dostane soupisku hráčů a přehled
letošních zápasů (výsledky + základní statistiky) rovnou na stránce, obojí si může stáhnout jako Excel
(CSV). Běží na Cloudflare Workers zdarma, bez nutnosti mít GitHub účet — kamarád jen otevře odkaz v prohlížeči.

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
2. Zadá PIN a klikne na "Pokračovat".
3. Vybere tým z rozbalovacího seznamu (týmy dánské Superligy a skotské Premiership — obě soutěže, které
   máš na free planu) a klikne na "Zobrazit".
4. Uvidí soupisku hráčů a přehled letošních zápasů (datum, soupeř, doma/venku, výsledek, pár statistik jako
   rohy, držení míče, žluté/červené karty — pokud je Sportmonks pro danou soutěž eviduje).
5. Volitelně klikne na "Stáhnout jako Excel (CSV)" u soupisky nebo u zápasů — soubor se stáhne do
   počítače/mobilu.

Sportmonks se volá až po zadání správného PINu (samotné otevření stránky nic nestahuje) — dropdown se
naplní teprve poté, co PIN projde, aby cizí návštěvník s odkazem, ale bez PINu, nemohl čerpat tvůj limit.

Statistiky se ukazují jen u typů, které Sportmonks na free planu skutečně poskytuje (rohy, držení míče,
žluté/červené karty, asistence) — jiné typy (např. střely na branku) na tomto plánu k dispozici nejsou.

## Údržba

- Změna kódu: uprav `src/worker.js`, pak znovu `npx wrangler deploy`.
- Změna PIN: `npx wrangler secret put ACCESS_PIN` a zadej nový.
- Sledování využití API limitu: v Sportmonks dashboardu (My Account), stránka volá Sportmonks jen když
  někdo zadá PIN a klikne na vyhledání (žádné volání naprázdno).
