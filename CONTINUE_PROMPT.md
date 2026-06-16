Pokračuju na projektu Wavefront (`/Users/martinprochazka/Documents/lab/014-wavefront`) —
mobilní investiční terminál (Capacitor Android WebView), single-file appka `wavefront-mobile.html`.

**Než začneš cokoliv dělat:**
1. Přečti `/Users/martinprochazka/Documents/lab/014-wavefront/CLAUDE.md` — kompletní seznam
   bug patternů s kontrolními `grep`/`curl` příkazy + dokumentace failover systému.
2. Tvoje memory by mělo mít `data_provider_failover.md`, `project_overview.md`, `fmp_api.md`,
   `next_steps.md`, `features.md` — všechny aktualizované k 2026-06-16. Pokud je nevidíš,
   řekni mi a najdeme je v `/Users/martinprochazka/.claude/projects/-Users-martinprochazka-Documents-lab-014-wavefront/memory/`.

## Co se stalo v poslední session (2026-06-16, velmi dlouhá)

**Část 1 — drobné UX fixy:** VIX badge (FMP `^VIX`, tap→FUND/MKTCTX), header ticker tap→CHART,
VOL/CHAN/V.PROFILE overlay barvy (muted→blue, byly nerozeznatelné), SUB overlay (uvolněná
podmínka, preferuje nejnovější nohu), VALU overlay (toast feedback). Watchlist sort/P&L
badge/News sentiment — zjistilo se, že byly už hotové z dřívějška.

**Část 2 — waves debugging:** Waves detekce funguje správně (ověřeno přes Claude Preview
server na `/wavefront-mobile.html`, NE na `/` — to servuje desktop `wavefront-app.html`).
Problém byl jen lokální (toggle vypnutý v localStorage na telefonu).

**Část 3 — performance:** `detectWaves`/`detectSupportResistance` měly redundantní výpočty
(až 8× za redraw) → memoizace přes Map cache klíčovanou bars+datum+cena. MA výpočty
(SMA/EMA/WMA) se počítaly 2× za redraw → cachované v lokální proměnné.

**Část 4 — velký bug-hunt (kontrola na žádost uživatele, 2× kolo):**
- `state.ticker`/`state.bars` neexistují (nikdy přiřazené) — opraveno 8 funkcí bez fallbacku
  (renderDCF, renderBuffett, renderDividends, renderQuality, renderEarnTrend, renderValHist,
  renderInstitutional, renderOptions)
- `state.watchlist` neexistuje (vždy `state.tickers`) — opraveno v renderDivCalendar, journal
  fallback, renderCorrelation
- `state.viewStart`/`viewEnd` neexistují — NaN bug, SMC overlay (Order Blocks/FVG/BOS) a
  candlestick pattern badges se NIKDY nevykreslovaly, opraveno na `0`/`bars.length`
- FMP `limit` parametr má strop **5** u prémiových endpointů (ratios, key-metrics,
  income-statement, cash-flow-statement) — limit>5 vrací HTTP 402, opraveno ~15 výskytů
- `b.t` → `b.date` v renderCandlePatterns (špatné datum u patternů)
- Žádné duplicitní funkce (kontrolováno opakovaně)

**Část 5 — DATA PROVIDER FAILOVER SYSTÉM (hlavní práce této session):**
Spustil to incident: appka přestala fungovat celá najednou protože FMP vrátil `429 Limit Reach`.
- Postavil jsem kompletní failover: **FMP (primární) → Finnhub → Twelve Data → Alpha Vantage**
- 2 nové soubory: `data-providers.js` (kanonický modul) + `test-data-providers.js` (19 testů,
  `node test-data-providers.js`, žádný framework) — **OBA jsou v gitu untracked (`??`)**,
  nikdy nebyly commitnuté, jen `build.sh` automaticky commituje `wavefront-mobile.html`
- Identická kopie modulu je vlepená inline do `wavefront-mobile.html` (sekce
  "DATA PROVIDER FAILOVER") — **musí se udržovat v sync, žádný `<script src>`** (appka je
  single-file záměrně)
- `.env.example` a `CLAUDE.md` taky vznikly tuto session, taky untracked v gitu
- Opraveno failoverem: `fetchTicker` (historická data), `fetchFundamentals` (EPS/fwd P/E/ROE),
  `renderBuffett`/Quality Score, sdílená 5min HTTP cache mezi FUND taby (Quality tab teď
  sdílí cache s Buffett — 0 nových API volání), batch quote pro Portfolio Performance
- **API klíče:** `FINNHUB_API_KEY` vyplněný (reused z `.env`), `TWELVE_DATA_API_KEY` vyplněný
  (uživatel dal klíč v chatu), `ALPHA_VANTAGE_API_KEY` **prázdný placeholder**
- **Co NENÍ opraveno:** `renderEarnTrend`/`renderValHist`/`renderInstitutional` mají jen
  cache (žádný Finnhub fallback) — při FMP výpadku ukážou jasnou chybu, ne tichý fail, ale
  data nedotáhnou. `renderDCF` má fallback "zadej EPS ručně". ~55 dalších přímých FMP volání
  v souboru jsou nedotčená (vědomé rozhodnutí proti přílišnému zásahu).
- **fetchBatchQuotesFmp** — implementováno defenzivně (fallback na per-symbol při neúspěchu),
  ale "happy path" (skutečná batch odpověď z FMP) NEBYL nikdy ověřen živě, protože FMP byl
  literally celou session rate-limited. Stojí za to zkontrolovat až bude FMP dostupné.

## Otevřené otázky / co dál
1. FMP kvóta byla na konci session **stále vyčerpaná** (ověřeno opakovaně přes curl) — může
   se resetovat denně/měsíčně, zkontroluj FMP dashboard pokud problémy přetrvávají
2. Zvážit Finnhub ekvivalenty pro EarnTrend/ValHist/Institutional (vzor: `getQualityMetrics`)
3. Ověřit `fetchBatchQuotesFmp` happy path až FMP nebude rate-limited
4. `data-providers.js`, `test-data-providers.js`, `CLAUDE.md`, `.env.example` jsou v gitu
   untracked — zvaž jestli je commitnout (`build.sh` to nedělá automaticky)

## Jak testovat
- Preview server: `cp wavefront-mobile.html www/index.html`, pak Claude Preview na
  `/wavefront-mobile.html` (NE `/`)
- Node testy: `node test-data-providers.js`
- Syntax check: `node -e "const fs=require('fs');const h=fs.readFileSync('wavefront-mobile.html','utf8');const m=h.match(/<script>([\s\S]*?)<\/script>/);fs.writeFileSync('/tmp/wf.js',m[1]);" && node --check /tmp/wf.js`
- Build do APK: `./build.sh "popis změn"` → `~/Downloads/wavefront-YYYY-MM-DD.apk`
