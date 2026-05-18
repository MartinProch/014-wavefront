# WAVEFRONT — Elliott Wave Terminal

**Long-term investing terminal with Elliott Wave analysis. Detect wave patterns, analyze fundamentals, screen the market, and manage positions in one terminal.**

---

## Quick Start

1. **Open the app** → served via Railway at `https://wavefront-production.up.railway.app`
2. **Type a ticker** (e.g., `SPY`, `AAPL`) → Press Enter
3. **Click 📖 HELP** button (top-right header) to launch the interactive tutorial
4. **Press `?`** anytime to see keyboard shortcuts

---

## Features

### Chart Analysis
- ✅ **Elliott Wave detection** — Automatic wave counting with confidence %
- ✅ **Fibonacci levels** — Retracement & extension targets
- ✅ **Support & Resistance** — Auto-detected key price zones
- ✅ **Buy/sell zones** — Color-coded entry/exit areas
- ✅ **Volume profile** — Horizontal histogram of volume at each price level
- ✅ **Candlestick patterns** — 14 classic patterns labeled on chart
- ✅ **Economic calendar** — FOMC, CPI, NFP events marked
- ✅ **Measured Move (MM)** — AB=CD projections
- ✅ **Regression channel** — Trend strength & volatility
- ✅ **Fibonacci time zones** — Vertical confluence lines at fib intervals
- ✅ **RSI divergence** — Bullish/bearish momentum divergences
- ✅ **WMA200** — 200-day Weighted Moving Average (cyan, dashed)

### Screener & Scanning
- ✅ **Wave pattern screener** — Score all watchlist tickers by setup quality
- ✅ **Keyboard screener** — Press `S` for floating, searchable result list
- ✅ **Relative strength ranking** — Compare momentum vs SPY (1M/3M)
- ✅ **Sector heatmap** — Color-coded grid of all 11 SPDR sector ETFs
- ✅ **COMPARE tab** — Side-by-side fundamental comparison of all watchlist tickers (sortable, 16 metrics)
- ✅ **F-Score ≥ 7 filter** — SCREEN tab filter button; shows only tickers with Piotroski F-Score ≥ 7; F-Score badge on each result row
- ✅ **⚡ MAGIC FORMULA** — Ranks entire watchlist by Greenblatt Magic Formula (Earnings Yield rank + ROIC rank); top 3 get gold/silver/bronze; tap row to navigate to ticker

### Trading Tools
- ✅ **Position tracker** — Log trades with entry wave, shares, price
- ✅ **Trendline drawing** — Click-to-draw support/resistance lines
- ✅ **Price alerts** — Set notifications at any price level
- ✅ **Watchlist folders** — Organize tickers by sector/strategy

### Journal & Portfolio (JOURNAL tab)
- ✅ **ALLOC sub-tab** — Portfolio Allocation: pie chart by position size (% and $ value), horizontal sector bar chart with ⚠ warning if any sector > 30%, Concentration Risk traffic light (top 3 positions)
- ✅ **DCA sub-tab** — Dollar Cost Averaging simulator: enter ticker + monthly amount + start date → computes total invested, current value, total return, avg cost per share, shares accumulated; canvas chart (blue = invested, green = portfolio value over time)
- ✅ **PERF sub-tab** — Portfolio performance vs SPY: Alpha, per-position table sorted by Alpha, timeline chart (portfolio cyan vs SPY green)
- ✅ **WATCH PERF sub-tab** — Watchlist performance since added: ranked table, best/worst/avg return, vs SPY comparison
- ✅ **Rebalancing alerts** — target allocation per ticker, drift warnings, ⚠ banner when >5% off target
- ✅ **Watchlist performance badge** — each row shows return since added (+24.3% / 142d)

### Valuation Tools (FUND tab — new sub-tabs)
- ✅ **VAL HIST sub-tab** — P/E, P/S, P/FCF ratio history charts (5 years), dashed 5Y average line, green = cheaper than historical avg
- ✅ **MOAT sub-tab** — Economic Moat checklist (6 sources), score 0–6, 🏰 badge in OVERVIEW
- ✅ **INST sub-tab** — Institutional Ownership: total %, top 10 holders with QoQ change (▲/▼), net activity signal
- ✅ **SWAN sub-tab** — "Sleeping Well at Night" score 0–100: semicircle gauge, 5 components
- ✅ **CHECKLIST sub-tab** — 10-question pre-buy checklist, auto-fill from fundamentals (🤖), ANO/NE/? toggles, score badge in OVERVIEW
- ✅ **REV DCF sub-tab** — Reverse DCF: implied growth rate baked into current price, 3×3 sensitivity table, interpretation
- ✅ **EPV sub-tab** — Earnings Power Value (Greenwald): firm value at zero growth, EPV vs price, growth premium, WACC detail
- ✅ **REL VAL sub-tab** — Relative Valuation vs 3 peers: P/E, P/S, EV/EBITDA, P/FCF, P/B table, premium/discount %, bubble chart, verdict

### Analysis (ANALYSIS tab — new sub-tabs)
- ✅ **RECESSION sub-tab** — Resilience vs COVID Crash 2020 and Bear Market 2022: max drawdown vs SPY, recovery time, Resilience Score 0–100
- ✅ **ROTATION sub-tab** — Sector Rotation map: 11 SPDR sectors heatmap (1M/3M/1Y), horizontal bar chart, cycle interpretation

### Chart Tools
- ✅ **Pivot Points overlay** — PIVOT button in toolbar, D/W/M periods, 7 levels (PP, R1–R3, S1–S3)
- ✅ **Buy Zone indicator** — "KDY NAKOUPIT" card in FUND OVERVIEW (5 auto-conditions), 🎯 ZONE overlay, 🎯 badge in watchlist

### Investment Thesis
- ✅ **📝 THESIS button** — per-ticker thesis: 4 fields (why / catalyst / risks / target price), 📝 badge in watchlist, preview in FUND OVERVIEW

### Dividends (FUND → DIVID tab)
- ✅ **Dividend Growth Streak** — consecutive years of growth, King/Aristocrat/Achiever badges, mini bar chart

### Fundamentals (FUND tab)
- ✅ **Valuation metrics** — Market Cap, P/E (TTM), Forward P/E, **PEG Ratio**, P/B, EPS, Beta, 52W High/Low, Dividend Yield
- ✅ **Profitability** — Revenue, Revenue Growth, Earnings Growth, Gross/Operating/Net Margins, ROA, ROE, Debt/Equity
- ✅ **Analyst targets** — Mean/High/Low price targets, recommendation, implied upside, analyst count
- ✅ **Hover tooltips on every metric** — 600ms hover shows plain-English explanation + trading context
- ✅ **Earnings history** — Actual vs estimate vs surprise for last 6 quarters
- ✅ **Revenue history** — Annual revenue & net income table
- ✅ **Insider transactions** — Recent buy/sell activity
- ✅ **News** — Latest headlines with publisher and age

### Quality Analysis (FUND → QUALITY sub-tab)
- ✅ **PEG Ratio** — P/E ÷ EPS Growth Rate, color-coded: green < 1 (Undervalued), yellow 1–2 (Fair), red > 2 (Expensive)
- ✅ **ROIC Trend** — 6-year bar chart; green highlight when ROIC > 10% (economic moat label); WACC comparison line
- ✅ **Share Buyback Trend** — 5-year line chart of shares outstanding; green = buybacks (▼%), red = dilution (▲%)
- ✅ **Growth Quality** — Revenue / EPS / Free Cash Flow CAGR for 3Y and 5Y in table; Growth Score badge (Excellent / Good / Weak)
- ✅ **Piotroski F-Score** — 9 criteria across Profitability / Leverage / Efficiency; ✓/✗ per criterion; score 0–9 colored green ≥7 / yellow 3–6 / red ≤2
- ✅ **Net Debt / EBITDA trend** — 6-year chart, green <1.5 / yellow <3.0 / red >3.0
- ✅ **ROE / ROA trend** — dual-line 6-year chart, 15% excellence threshold
- ✅ **Capital Allocation Score** — composite 0–10 (Buybacks / Dividends / Reinvestment sub-scores)

### User Experience
- ✅ **Dark / Light theme toggle** — ☀ LIGHT / 🌙 DARK button in header, preference saved
- ✅ **Responsive design** — Works on desktop, tablet, mobile
- ✅ **Keyboard shortcuts** — Fast navigation without mouse
- ✅ **Multi-timeframe** — Same analysis across 1W / 1M / 3M / 1Y / 2Y / 5Y
- ✅ **Interactive tutorial** — 21-step walkthrough of all features
- ✅ **Comprehensive manual** — Full documentation with strategy tips
- ✅ **Right-click featured overlays** — Right-click any toggle to make it 2.2× more prominent on the chart

---

## COMPARE Tab

Click the **COMPARE** tab in the right sidebar to rank all watchlist tickers side-by-side.

**16 metrics available:**

| Group | Metrics |
|---|---|
| Valuation | P/E, Fwd P/E, PEG, P/B |
| Earnings | EPS (TTM), Fwd EPS |
| Size | Market Cap |
| Growth | Revenue Growth %, Earnings Growth % |
| Profitability | Net Margin, ROE |
| Risk | Debt/Equity, Beta |
| Income | Dividend Yield |
| Expectations | Analyst Upside, 3M Price Change |

- **Click a metric pill** at the top → sorts table by that metric (smart direction: low-is-better = ascending, high-is-better = descending)
- **Click a column header** → sort ascending/descending (toggle)
- **Best value** in each column highlighted **green**, worst in **red**
- **Click a ticker name** → jumps to its full FUND tab
- **↺ REFRESH** button → clears cache and re-fetches all fundamentals

---

## Key Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **1–9** | Jump to ticker 1–9 |
| **← →** | Switch timeframes |
| **W** | Toggle waves |
| **F** | Toggle Fibonacci |
| **R** | Toggle S/R levels |
| **Z** | Toggle buy/sell zones |
| **V** | Toggle volume |
| **S** | Open keyboard screener |
| **?** | Show shortcut panel |

---

## Right Panel Tabs

| Row | Tabs |
|-----|------|
| 1 | WAVES · FUND. · RESEARCH |
| 2 | JOURNAL · SCREENER · RS RANK |
| 3 | HEAT · PORTFOLIO · COMPARE |
| — | FORECAST (dedicated trade plan tab) |

---

## Data Sources

| Source | Used For | Notes |
|--------|----------|-------|
| **Finnhub** | Fundamentals (primary) | Free tier, 60 req/min, no daily cap |
| **FMP** | Fundamentals (fallback) | Paid stable endpoint, daily limit |
| **Yahoo Finance** | Price charts, fundamentals (fallback) | v10/v11 quoteSummary |
| **NASDAQ API** | Fundamentals (last resort) | Limited data |
| **Yahoo RSS** | News | No auth required |

Fundamentals are **cached 24h server-side** (Railway memory) so API quota is not burned on every page load. The client also caches in localStorage.

**Environment variables required on Railway:**
- `FINNHUB_KEY` — Finnhub API key (free at finnhub.io)

---

## Documentation

- **📖 [MANUAL.md](./MANUAL.md)** — Complete feature guide, strategies, and FAQ
- **Interactive Tutorial** — Click the **📖 HELP** button in-app for a 21-step walkthrough
- **Keyboard Reference** — Press **?** in-app to see all shortcuts

---

## Tech Stack

- Single-file HTML5 app (no build required, `wavefront-app.html` ~420KB)
- Vanilla JavaScript, Canvas 2D for charting
- Node.js backend (`server.js`) — proxies all API calls, handles CORS
- Local Storage for client-side persistence
- Capacitor Android wrapper (`android/`) for mobile app
- Deployed on Railway (`https://wavefront-production.up.railway.app`)
- Source: `https://github.com/MartinProch/014-wavefront`

**Browser Support:** Chrome, Firefox, Safari, Edge (latest versions)

---

## Changelog

### Session 7 (May 2026)
- ✅ **FUND → VAL HIST sub-tab** — P/E, P/S, P/FCF ratio history charts (5 years) with dashed 5Y average line; green = cheaper than historical average
- ✅ **FUND → MOAT sub-tab** — Economic Moat checklist: 6 sources (Pricing Power, Switching Costs, Network Effects, Cost Advantage, Intangibles, Efficient Scale), score 0–6, 🏰 badge in OVERVIEW
- ✅ **FUND → INST sub-tab** — Institutional Ownership: total % owned by institutions, top 10 holders table with QoQ change (▲ buying / ▼ selling), net activity signal
- ✅ **FUND → SWAN sub-tab** — "Sleeping Well at Night" score 0–100: semicircle gauge, 5 components (Balance Sheet, Dividend Stability, Earnings Consistency, Beta, Business Quality)
- ✅ **FUND → CHECKLIST sub-tab** — 10-question pre-buy checklist with auto-fill from fundamentals (🤖), ANO/NE/? toggles, score badge in OVERVIEW
- ✅ **FUND → REV DCF sub-tab** — Reverse DCF: implied growth rate baked into current price, sensitivity table (3×3), interpretation (market too optimistic/pessimistic/fair)
- ✅ **FUND → EPV sub-tab** — Earnings Power Value (Greenwald): firm value assuming zero growth, EPV vs current price, growth premium breakdown, WACC detail
- ✅ **FUND → REL VAL sub-tab** — Relative Valuation vs 3 peers: P/E, P/S, EV/EBITDA, P/FCF, P/B table, premium/discount %, bubble chart, verdict
- ✅ **FUND → QUALITY enhancements** — Net Debt/EBITDA trend (6 years, color-coded), ROE/ROA dual-line chart (15% excellence threshold), Capital Allocation Score 0–10
- ✅ **ANALYSIS → RECESSION sub-tab** — Resilience vs COVID Crash 2020 and Bear Market 2022: max drawdown vs SPY, recovery time, mini charts, Resilience Score 0–100
- ✅ **ANALYSIS → ROTATION sub-tab** — Sector Rotation map: 11 SPDR sectors heatmap (1M/3M/1Y), horizontal bar chart, cycle interpretation (Risk-on / Defensive / Commodity / Reflation)
- ✅ **JOURNAL → PERF sub-tab** — Portfolio performance vs SPY: Alpha, per-position table sorted by Alpha, timeline chart (portfolio cyan vs SPY green)
- ✅ **JOURNAL → WATCH PERF sub-tab** — Watchlist performance since added: ranked table, best/worst/avg return, vs SPY comparison
- ✅ **Watchlist performance badge** — each watchlist row shows return since added (+24.3% / 142d)
- ✅ **📝 THESIS button** — Investment Thesis per ticker: 4 fields (why / catalyst / risks / target price), 📝 badge in watchlist, preview in FUND OVERVIEW
- ✅ **Pivot Points overlay** — PIVOT button in toolbar, D/W/M periods, 7 levels (PP, R1–R3, S1–S3)
- ✅ **Rebalancing alerts in ALLOC tab** — target allocation per ticker, drift warnings, ⚠ banner when >5% off target
- ✅ **Buy Zone indicator** — "KDY NAKOUPIT" card in FUND OVERVIEW (5 auto-conditions), 🎯 ZONE chart overlay, 🎯 badge in watchlist
- ✅ **Dividend Growth Streak** — consecutive years of growth card in DIVID tab, King/Aristocrat/Achiever badges, mini bar chart

### Session 6 (May 2026)
- ✅ **FUND → QUALITY sub-tab** — completely new quality analysis section with 5 panels:
  - **PEG Ratio** — P/E ÷ EPS Growth Rate, color-coded green < 1 / yellow 1–2 / red > 2
  - **ROIC Trend** — 6-year bar chart with economic moat label (ROIC > 10%) and WACC comparison
  - **Share Buyback Trend** — 5-year line chart of shares outstanding; green = buybacks, red = dilution
  - **Growth Quality** — Revenue / EPS / Free Cash Flow CAGR table (3Y and 5Y); Growth Score badge (Excellent / Good / Weak)
  - **Piotroski F-Score** — 9 criteria (Profitability / Leverage / Efficiency) with ✓/✗ per criterion; score colored green ≥7 / yellow 3–6 / red ≤2
- ✅ **F-Score ≥ 7 filter in SCREEN tab** — filter button shows only tickers with Piotroski F-Score ≥ 7; F-Score badge displayed on each result row
- ✅ **⚡ MAGIC FORMULA button** — ranks entire watchlist by Greenblatt Magic Formula (Earnings Yield rank + ROIC rank); top 3 highlighted gold/silver/bronze; tap row navigates to ticker
- ✅ **JOURNAL → ALLOC sub-tab** — Portfolio Allocation view: pie chart by position size (% and $ value), horizontal sector bar chart with ⚠ warning if sector > 30%, Concentration Risk traffic light (top 3 positions)
- ✅ **JOURNAL → DCA sub-tab** — Dollar Cost Averaging simulator: enter ticker + monthly amount + start date → computes total invested, current value, total return, avg cost per share, shares accumulated; canvas chart (blue = invested, green = portfolio value over time)

### Session 5 (May 2026)
- ✅ **FORECAST tab** — dedicated sidebar tab showing full trade plan: entry zone, stop loss, target, R:R, bull/bear scenario cards, wave price targets with calendar-estimated dates, buy/sell zones with ⚡ pulse when price is in zone, analyst target confluence, and clickable multi-TF cards
- ✅ **Trade setup card in WAVES panel** — always-visible header card at top of WAVES panel with ENTRY / STOP / TARGET / R:R grid plus embedded position size calculator (account size + risk % → shares, dollar risk, profit potential)
- ✅ **⟶ FC expand button** — toolbar button that widens the forecast zone from 18% to 35% of chart width for more detail on projected wave targets; orange highlight when active
- ✅ **Position size calculator** — embedded in trade setup card; uses entry-zone midpoint (not current price) for accurate sizing; persists account size and risk % to localStorage

### Session 4 (May 2026)
- ✅ **PEG ratio in COMPARE** — Finnhub `pegTTM` field used directly; `currentPrice` derivation fixed (`trailingPE × trailingEPS`); `forwardEps` now correctly derived from `currentPrice / forwardPE`
- ✅ **N/A vs N/M in COMPARE** — "N/A" for missing data, "N/M" (not meaningful) for metrics undefined due to negative earnings (P/E, PEG for RKLB, ASTS, etc.)
- ✅ **Wave 3/4/5 target lines on chart** — horizontal lines for confirmed W3/W4 pivots and dashed W5 projections (=W1 and ×1.618) for IMPULSE; C ×1.618, C mid, C ×2.618 for CORRECTION
- ✅ **Chart Y-axis auto-zoom** — expands to include wave target prices (capped at 60% of bar range) so targets never render off-canvas
- ✅ **X-axis date labels** — labels now include year (`May '24`) and always span first→last bar; last slot replaced by `May '26` in blue so data cutoff is unambiguous
- ✅ **"NOW" marker** — blue label at top of forecast separator line; makes historical/forecast boundary explicit
- ✅ **Crosshair date bug fixed** — was using `chartW` (full width) instead of `barsW` (82%) to map mouse → bar index, causing last ~18% of bar data to appear in the forecast zone; now uses `barsW` and hides date tooltip in forecast zone
- ✅ **Forecast crosshair projected dates** — hovering in the forecast zone shows a blue `~May 15, 2026` tooltip extrapolated from average bar interval
- ✅ **Multi-TF confluence upgraded** — now covers 1M/3M/1Y/2Y/5Y, highlights active timeframe with a glow border, shows even with 1 valid TF, each card is clickable to switch timeframe

### Session 3 (May 2026)
- ✅ **dotenv support** — `require('dotenv').config()` added to server.js; `FINNHUB_KEY` and `FMP_KEY` now loaded from `.env` automatically on `node server.js`
- ✅ **COMPARE active metric column pinned first** — selected metric pill always appears as column 3 (right after SYM), no horizontal scrolling needed; column header gets a blue underline
- ✅ **COMPARE data fix** — one-time localStorage migration (`wf_fund_migrated_v3`) clears stale pre-Finnhub NASDAQ cache on first load; `renderCompare` now also re-fetches sparse entries
- ✅ **Ticker label on chart** — active ticker symbol shown as a crisp HTML overlay at the bottom-left of the chart (always visible, no canvas fighting)
- ✅ **Journal CSV export** — ⬇ EXPORT CSV button in JOURNAL tab; exports all trades with date, symbol, direction, wave, entry/exit/stop prices, shares, P&L %, P&L $, result
- ✅ **Risk calculator** — ⚖ RISK button in toolbar; floating calculator for position size, max dollar loss, and R:R ratio; auto-fills entry/stop/target from current price and wave forecast
- ✅ **Live price streaming** — polling now covers all watchlist tickers (not just alert symbols); updates watchlist prices, chart, and portfolio every 60s; 🟢 LIVE badge in header shows last update time
- ✅ **Options chain overlay** — OPT toggle in toolbar; fetches nearest-expiry options from Yahoo Finance; draws max pain line (orange), top call OI strikes (red dashes), top put OI strikes (green dashes); toast shows P/C ratio on load

### Session 2 (May 2026)
- ✅ Dark / Light theme toggle with CSS variable overrides; saved to localStorage
- ✅ PEG Ratio added to Fundamentals → Valuation section (color-coded: green <1, red >2)
- ✅ Hover tooltips on every fundamental metric label (Valuation, Profitability, Analyst Targets)
- ✅ COMPARE tab — sortable 16-metric fundamental comparison table for all watchlist tickers
- ✅ Sidebar tabs reorganised into 3×3 wrap grid (was single overflowing row)
- ✅ Toolbar row 1 now horizontally scrollable (PNG/alert buttons no longer clipped)
- ✅ Finnhub integrated as primary fundamentals source (60 req/min, no daily cap)
- ✅ Server-side 24h fundamentals cache added to server.js
- ✅ REFRESH button in COMPARE tab busts both client and server cache (`?force=1`)
- ✅ Compare sort: clicking a metric pill now also sorts by that metric
- ✅ Compare fallback field paths broadened for stocks with sparse Yahoo/NASDAQ data

### Session 1 (May 2026)
- ✅ Initial release — Elliott Wave terminal with full feature set
- ✅ WMA200 toggle (cyan dashed line)
- ✅ Fibonacci Time Zones, RSI Divergence, Sector Heatmap, RS Ranking
- ✅ Watchlist folders, Position tracker, Trendline drawing, Price alerts
- ✅ Featured overlay system (right-click to highlight)
- ✅ Rich toolbar tooltips (600ms delay)
- ✅ Interactive 21-step tutorial, MANUAL.md, README.md
- ✅ Capacitor Android + Railway deployment

---

## Planned Features

- 🔜 Revolut CSV import (trades + dividends)
- 🔜 Earnings & Revenue trend chart (8 quarters bar chart)
- 🔜 Benchmark comparison (vs SPY/QQQ normalized, 1Y/3Y/5Y)

---

**Happy trading! Remember: Risk management > Indicators. Never risk more than you can afford to lose.**

*WAVEFRONT © 2026. Elliott Wave analysis terminal.*
