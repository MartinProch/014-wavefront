# Wavefront — poznámky pro Claude Code

Single-file app: `wavefront-mobile.html` (~18 000 řádků), vanilla JS + Canvas 2D, Capacitor Android WebView.

## Známé bug patterny — VŽDY zkontroluj před commitem

### 1. `state.ticker` neexistuje — NIKDY se nikde nepřiřazuje
Jediný správný zdroj aktuálního tickeru je **`state.selected`**.
Pokud najdeš `const sym = state.ticker;` BEZ fallbacku `|| state.selected`, je to bug —
funkce dostane `sym = undefined` a buď:
- tiše selže (fetch na `symbol=undefined`), nebo
- spustí guard `if (!sym) return "SELECT A TICKER"` i když ticker JE vybraný

**Nalezeno a opraveno 2026-06-16** v: `renderDCF`, `calcDCF`, `renderBuffett`, `renderDividends`,
`renderQuality`, `renderEarnTrend`, `renderValHist`, `renderInstitutional`, `renderOptions`.

Kontrola před commitem:
```bash
grep -n "state\.ticker\b" wavefront-mobile.html
```
Každý výskyt MUSÍ mít fallback `state.ticker || state.selected` (lepší: použij přímo `state.selected`).

### 2. `state.bars` neexistuje — vždy `state.data[sym].bars`
Stejný typ bugu jako výše. `state.bars` je vždy `undefined`, takže výrazy jako
`state.bars && state.bars.length ? ... : 0` vždy spadnou na fallback `0`.

**Nalezeno a opraveno 2026-06-16** v: `renderDCF`, `calcDCF`, `renderDividends`, `renderRevDCF`/EPV.

Kontrola:
```bash
grep -n "state\.bars\b" wavefront-mobile.html
```
Správně: `state.data[sym]?.bars` (kde `sym = state.selected`, ne `state.ticker`).

### 3. Bar date field je `b.date` (Date objekt), NE `b.t`
`b.t` patří k Polygon API formátu (`{t, o, h, l, c, v}`), ale appka po vnitřní konverzi
ukládá bary jako `{date: Date, o, h, l, c, v}`. Pokud kód čte `new Date(bar.t)` na barech
z `state.data[sym].bars`, je `bar.t` undefined → `Invalid Date`.

### 4. FMP `/stable/` endpointy — `limit` parametr má strop podle plánu
Aktuální plán dovoluje **`limit` max 5** u prémiových endpointů. Vyšší limit vrátí
HTTP 402 s tělem `{"Error Message":"Premium Query Parameter..."}`, což `resp.json()`
nezvládne naparsovat → throw → catch → tichý `null`/`undefined` return.

**Endpointy s tímto stropem** (ověřeno 2026-06-16):
- `/stable/ratios` (limit≤5)
- `/stable/key-metrics` (limit≤5)
- `/stable/income-statement` (limit≤5)
- `/stable/cash-flow-statement` (limit≤5)

OK jsou: `/stable/balance-sheet-statement` (limit=5 funguje), `/stable/analyst-estimates`,
`/stable/earnings-calendar`, `/stable/dividends`, `/stable/news/stock` (vrací max 5 article).

**Před přidáním nového FMP volání s `limit > 5`** vždy nejdřív ověř v terminálu:
```bash
curl -s "https://financialmodelingprep.com/stable/<endpoint>?symbol=AAPL&limit=<N>&apikey=$FMP_KEY" -o /dev/null -w "%{http_code}\n"
```
Pokud vrátí 402, sniž limit na 5 — i za cenu kratší historie (8y → 5y apod.).

### 5. `state.watchlist` neexistuje — vždy `state.tickers`
Stejný typ bugu jako `state.ticker`/`state.bars`. Nalezeno a opraveno 2026-06-16
v `renderDivCalendar`, journal fallback ticker listu, `renderCorrelation` —
všechny ukazovaly "watchlist je prázdný" i s plným watchlistem.

### 6. `state.viewStart` / `state.viewEnd` neexistují — žádné chart-viewport okno v state
Nalezeno a opraveno 2026-06-16 v SMC overlay (Order Blocks, FVG, BOS) a candlestick pattern
badges. `state.viewStart + i` = `undefined + number` = `NaN` → `px(NaN)` nic nevykreslí
(tichý fail, žádná JS chyba). Pokud appka v budoucnu potřebuje "viditelné okno barů" odlišné
od celého `bars` pole, je třeba tento state nejdřív zavést (a nastavovat při zoomu/panu),
ne jen předpokládat že existuje.

### 7. Duplicitní definice funkce = JS hoisting tichá výhra druhé definice
Pokud se stejné jméno funkce objeví 2× v souboru, druhá definice (níž v souboru) VŽDY
přebije první bez jakéhokoli varování. Stalo se s `computeWaveConfidence` (vracela jednou
objekt `{score,rules}`, podruhé number) → crash v `renderConfidence`.

Kontrola před commitem:
```bash
grep -oE "^(async )?function [a-zA-Z_][a-zA-Z0-9_]*" wavefront-mobile.html | sed 's/^async function /function /' | sort | uniq -c | sort -rn | awk '$1>1'
```
Měl by vrátit nic. Pokud něco vrátí, přejmenuj jednu z definic.

## Testování bez Android Studia

Android Studio na tomto Macu nainstalováno není. Pro rychlé ověření JS logiky/UI použij
preview server (Claude Code preview tools) — ale **pozor**:
- `server.js` (node, port 3456) servuje `wavefront-app.html` (desktop verze) na `/`
- Pro mobilní verzi jdi na `/wavefront-mobile.html` explicitně
- `www/index.html` je STARÁ verze (před refaktorem na `state.overlays`) — needituj ji přímo,
  je to jen build artefakt. Před testováním v preview ji přepiš: `cp wavefront-mobile.html www/index.html`

Pro syntax check bez prohlížeče:
```bash
node -e "const fs=require('fs');const h=fs.readFileSync('wavefront-mobile.html','utf8');const m=h.match(/<script>([\s\S]*?)<\/script>/);fs.writeFileSync('/tmp/wf.js',m[1]);"
node --check /tmp/wf.js
```

## Performance — memoizace

Funkce volané opakovaně se stejnými/podobnými argumenty během jednoho `redrawChart()` průchodu
(`detectWaves`, `detectSupportResistance`) MAJÍ vlastní cache (`Map` klíčovaná podle
`bars.length + první/poslední datum + poslední cena`). Při úpravě těchto funkcí cache nezapomeň
zachovat nebo invalidovat korektně. Nepřidávej další těžké výpočty (O(n²) smyčky přes bary) bez
zvážení, jestli se nebudou v jednom redraw cyklu počítat víckrát.

## Data provider failover (FMP rate-limit ochrana)

Zaveden 2026-06-16 po incidentu kdy FMP vrátil `429 Limit Reach` a appka přestala fungovat
celá najednou (Fundamentals, tickery, vše bylo prázdné).

**Dva soubory, MUSÍ zůstat synchronizované:**
- `data-providers.js` — kanonická implementace, testovaná přes `node test-data-providers.js`
- `wavefront-mobile.html` — identická kopie vlepená inline do `<script>` (sekce
  "DATA PROVIDER FAILOVER", hned za `const FMP_KEY = ...`). Appka je single-file
  záměrně (Capacitor WebView), takže `<script src>` na `data-providers.js` nejde použít.

**Pokud upravuješ failover logiku, změň ji na OBOU místech.** Spusť `node test-data-providers.js`
po každé změně v `data-providers.js`, a syntax check (`node --check`, viz sekce výše) po změně v HTML.

**Pořadí poskytovatelů:** FMP (primární) → Finnhub → Twelve Data → Alpha Vantage.
Failover se spustí JEN na `err.isRateLimit === true` (HTTP 429, FMP 402 "Premium Query
Parameter", Twelve Data `{status:'error',code:429}` v HTTP 200 těle, Alpha Vantage `Note`/
`Information` pole v HTTP 200 těle). Běžná network/timeout chyba bubliny nahoru okamžitě —
NEpokouší se o další providery (to je explicitní požadavek, ne bug).

**API klíče** — hardcoded JS konstanty v HTML (stejný vzor jako `FMP_KEY`), NE `.env`
(appka běží v WebView bez Node runtime, `.env` se tam nedostane):
- `FINNHUB_API_KEY` — už vyplněný (stejný klíč jako `FINNHUB_KEY` v `.env` pro server.js)
- `TWELVE_DATA_API_KEY` — prázdný placeholder, doplnit z https://twelvedata.com/
- `ALPHA_VANTAGE_API_KEY` — prázdný placeholder, doplnit z https://www.alphavantage.co/
- `TWELVE_DATA_API_KEY` — vyplněný 2026-06-16, free tier (800 req/den)

**Známé limity poskytovatelů (ověřeno 2026-06-16):**
- Finnhub free tier **nepodporuje historická OHLCV data** (`/stock/candle` vrací `403`).
  Toto NENÍ klasifikováno jako rate-limit, ale jako `err.isProviderUnavailable` — samostatná
  kategorie chyby vedle `err.isRateLimit`. Orchestrátor na obě reaguje stejně (zkusí dalšího
  providera), ale sémanticky jde o jinou věc: trvalé omezení plánu, ne přechodné vyčerpání
  kvóty. **Bez tohoto rozlišení by Finnhub 403 zablokoval celý fallback chain** (403 by se
  bral jako "běžná chyba" → bubble immediately → Twelve Data/Alpha Vantage by se nikdy
  nezkusily, i kdyby měly platný klíč). Pokud najdeš dalšího providera s podobným "natvrdo
  zakázaná operace na free tier" chováním, použij stejný `providerUnavailableError()`.
  Finnhub fallback tedy reálně pokrývá jen `getQuote`, ne `getHistoricalBars`.
- Pro historická data při FMP výpadku je potřeba mít vyplněný `TWELVE_DATA_API_KEY`
  nebo `ALPHA_VANTAGE_API_KEY` — bez nich `fetchTicker()` spadne až na cache/offline fallback.

**Použití v appce:** `fetchQuoteFailover(sym)` / `fetchHistoricalBarsFailover(sym, fromDate)` /
`fetchFundamentalsFailover(sym)` / `fetchQualityMetricsFailover(sym)`. Zapojeno v
`fetchTicker()` (historická data, krok 3), Portfolio Performance quote fetchi,
`fetchFundamentals()` (FUND/OVERVIEW — EPS, P/E, forward P/E) a `renderBuffett()`
(FUND/BUFFETT — ROE, D/E, marže, FCF yield, current ratio). Ostatních ~60 přímých FMP
volání v souboru NEBYLO refaktorováno (vědomé rozhodnutí — moc velký zásah do
18000řádkového souboru najednou) — pokud narazíš na další kritickou cestu co stojí za to
zabezpečit (EarnTrend, ValHist, Institutional, Options mají stejný "vlastní 4 FMP fetche
bez failoveru" vzor jako měl Buffett), použij stejné `fetch*Failover`/`getQualityMetrics`-like vzory.

**Cache invalidace — `isFundamentalsEmpty()`:** Pokud FMP vrátí "úspěšnou" odpověď s nulami
(rate-limit chyba se chytí jako JSON, ale `fmpToYahooFormat` defaultuje na `null` a nehodí
exception), výsledek se normálně cachuje na 24h (`wfm_f_` localStorage klíč) jako by byl
platný. `fetchFundamentals()` proto validuje `trailingEps`/`trailingPE` před vrácením
cache — pokud oba chybí, cache se ignoruje a zkusí se fetch znovu. **Stejný vzor zvaž i
pro renderBuffett a další taby, pokud začnou cachovat nuly** (zatím nemají vlastní cache,
takže problém nehrozí, ale pokud se tam cache přidá, hlídej tohle).

## API kvóta — sdílená cache + batch quote (2026-06-16)

**Sdílená 5min HTTP cache** (`cached()` wrapper kolem `fmpRequest`/`finnhubRequest`/
`twelveDataRequest`/`alphaVantageRequest` v sekci "DATA PROVIDER FAILOVER"). Klíčovaná
přesně podle URL — pokud Buffett i Quality tab chtějí stejná FMP/Finnhub data pro stejný
ticker během 5 minut, druhý tab dostane odpověď z cache místo nového volání. Cachují se
JEN úspěšné odpovědi (chyba/rate-limit se nikdy necachuje — musí se zkusit znovu příště).
`clearHttpCache()` je exportovaná, kdyby bylo potřeba vynutit fresh data (v testech se
volá před každým testem, aby se testy nekřížily přes sdílenou cache).

**Batch quote** — `fetchBatchQuotesFmp(symbols)` zkusí FMP `/stable/quote?symbol=A,B,C`
(comma-separated) v JEDNOM volání místo N volání. **Defenzivní implementace** — pokud
odpověď nevypadá jako platná multi-symbol odpověď (není array, nebo pokrývá jen 1 symbol
z N požadovaných), vyhodí chybu a volající (Portfolio Performance) automaticky spadne na
per-symbol `fetchQuoteFailover()` smyčku (plný failover chain zachovaný). **Nebylo možné
ověřit "happy path" živě** — FMP byl celou tuto session rate-limited (429), takže nejde
potvrdit přesný formát batch odpovědi experimentálně. Pokud někdy uvidíš v konzoli
`[perf] batch quote failed, falling back per-symbol: ...` i když FMP NENÍ rate-limited,
zkontroluj přesný formát odpovědi z `/stable/quote?symbol=A,B,C` a uprav `fetchBatchQuotesFmp`
podle skutečného tvaru (může to být jiný endpoint, např. `/stable/batch-quote`).

**Sdílení cache mezi FUND taby (2026-06-16):** `renderQuality`, `renderEarnTrend`,
`renderValHist`, `renderInstitutional`, `renderDCF` měly všechny vlastní přímé `fetch()`
volání na FMP bez cache/failoveru (stejný bug pattern jako Buffett). Přepojeny na
`fmpRequest()` (cache wrapper). **Quality tab používá PŘESNĚ stejné 3 URL jako Buffett's
`getQualityMetrics`** (`key-metrics`/`income-statement`/`ratios`, `period=annual&limit=5`)
→ otevření Buffett tabu první zahřeje cache a Quality tab dostane data **zadarmo, 0 nových
volání** (ověřeno živě). EarnTrend/ValHist/Institutional mají jiné parametry (quarterly,
nebo `limit=1`/`limit=5` bez `period`), takže NEsdílí cache s Buffett/Quality — pokud
chceš víc cross-tab sharing, zvaž normalizaci jejich URL parametrů na shodné s Buffett/
Quality (riziko: může změnit jaká data se vrací, ověř na živém FMP než to uděláš).

**Důležitý bug, na který narazíš, pokud přidáš `fmpRequest`/`finnhubRequest` volání do
nové top-level funkce:** `fmpRequest`/`finnhubRequest` jsou definované UVNITŘ IIFE
("DATA PROVIDER FAILOVER" sekce) a musí být explicitně v `api` objektu (`Object.assign(global, api)`),
jinak funkce definované MIMO IIFE (téměř všechny render* funkce v souboru) dostanou
`ReferenceError: fmpRequest is not defined` — přesně tohle se stalo při migraci Quality/
EarnTrend/ValHist/Institutional/DCF, dokud nebyly `fmpRequest`/`finnhubRequest` doplněny
do exportu. Kontrola: pokud nová funkce mimo IIFE volá `fmpRequest`, ověř že je v `api = {...}`.

**Aktuální stav coverage (2026-06-16):** FMP failover/cache mají: `fetchTicker` (historická
data), `fetchFundamentals` (FUND/OVERVIEW), `renderBuffett`+`renderQuality` (plný Finnhub
fallback nebo cache sharing), Portfolio Performance (batch quote). `renderEarnTrend`/
`renderValHist`/`renderInstitutional`/`renderDCF` mají jen cache (žádný Finnhub fallback)
— při FMP výpadku ukážou jasnou chybovou hlášku namísto tichého N/A, ale data nedotáhnou,
dokud se FMP nezotaví. Pokud se tohle stane znovu problémem, další krok je napsat Finnhub
ekvivalenty pro tyto 4 taby (podobně jako `getQualityMetrics`/`getFundamentals`).

**`getFundamentals` — partial-failure handling (důležité, 2026-06-16 incident):**
Finnhub `/stock/price-target` vrací `403` na free tier (stejně jako `/stock/candle`), ALE
na rozdíl od historických barů zde NESMÍ celý fetch zablokovat — `price-target` dává jen
analyst target ceny (nice-to-have), zatímco `/stock/profile2` + `/stock/metric` (které
fungují na free tier) obsahují EPS, P/E, forward P/E (to hlavní co chceš). Proto je
`getFundamentals` rozdělené na `required` (profile2, metric — chyba zde failoveruje dál)
a `optional` (recommendation, price-target — chyba zde se jen tiše ignoruje, `rc=[]`/`t={}`).
**Pokud přidáváš další multi-endpoint `getX()` metodu, vždy si rozmysli která dílčí volání
jsou "musí být" vs. "nice to have" — `Promise.allSettled` na všem a bubble-on-any-reject
je chyba, kterou jsme tu už jednou udělali** (EPS zmizelo kvůli nepodstatnému price-target
403, ne kvůli skutečnému výpadku dat).

## Build

```bash
./build.sh "popis změn"
```
Automaticky kopíruje HTML, builduje APK do `~/Downloads/`, commituje a pushuje. Git warning o
`android`/`www` ignored paths je normální (jsou v `.gitignore`), neznamená chybu buildu.
