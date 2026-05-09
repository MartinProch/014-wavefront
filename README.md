# WAVEFRONT — Elliott Wave Terminal

**Real-time Elliott Wave analysis for traders. Detect wave patterns, scan the market, and manage positions in one terminal.**

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
- ✅ **VWAP + ±1σ/±2σ bands** — Cumulative VWAP with dashed deviation bands; mean-reversion entries at ±1σ, extremes at ±2σ
- ✅ **Bollinger Bands (BB)** — SMA20 ± 2σ amber envelope; band squeeze signals pre-breakout compression
- ✅ **Supertrend (ST)** — ATR-based trend line; green below price = bullish, red above = bearish; ▲/▼ markers at crossovers
- ✅ **MACD** — EMA12−EMA26 line + EMA9 signal + histogram in sub-panel; live values shown
- ✅ **ADX / DMI** — Trend-strength sub-panel (ADX purple, DI+ green, DI- red)
- ✅ **Stochastic RSI** — %K/%D sub-panel with 20/80 bands
- ✅ **Pivot Points (PVTS)** — Classic floor-trader PP/R1/R2/S1/S2 dashed levels with right-side labels
- ✅ **52-Week High/Low (52W)** — Gold/red dashed lines with distance-% tags; Y-axis expands to show both
- ✅ **Gap detector (GAPS)** — Gap-up (green) and gap-down (red) shaded zones; unfilled gaps stay bright
- ✅ **Dark pool / block volume (DARK)** — Highlights candles with volume ≥ 2.5× average
- ✅ **Earnings expected-move cone** — ±N% shaded cone from current price to earnings date; derived from historical EPS surprise

### Sub-panel Indicators
All sub-panels stack below the price chart and can be combined freely:

| Button | Indicator | Notes |
|--------|-----------|-------|
| **ADX** | ADX / DMI | Trend strength + directional force |
| **STOCH** | Stochastic RSI | %K/%D oscillator |
| **MACD** | MACD | Momentum crossover + histogram |

### Screener & Scanning
- ✅ **Wave pattern screener** — Score all watchlist tickers by setup quality
- ✅ **Keyboard screener** — Press `S` for floating, searchable result list
- ✅ **Relative strength ranking** — Compare momentum vs SPY (1M/3M)
- ✅ **Sector heatmap** — Color-coded grid of all 11 SPDR sector ETFs
- ✅ **COMPARE tab** — Side-by-side fundamental comparison of all watchlist tickers (sortable, 16 metrics)
- ✅ **Correlation matrix (CORR)** — Pearson return-correlation heatmap across all watchlist tickers; green = correlated, red = inverse
- ✅ **Multi-timeframe alignment table** — WAVES panel shows DIR/WAVE/RSI/MA status for all 6 timeframes at a glance
- ✅ **Backtesting engine (BACKTEST)** — Select symbol + timeframe + entry rule + TP/SL → win rate, R:R, equity curve

### Trading Tools
- ✅ **Position tracker** — Log trades with entry wave, shares, price
- ✅ **Trendline drawing** — Click-to-draw support/resistance lines
- ✅ **Price alerts** — Set notifications at any price level (email support via SMTP env vars)
- ✅ **Watchlist folders** — Organize tickers by sector/strategy
- ✅ **Watchlist CSV import/export** — ⬇ CSV / ⬆ CSV buttons in watchlist header; bulk-import tickers from any CSV
- ✅ **Chart snapshots (SNAP)** — Save/restore named annotation snapshots (trendlines + alerts)
- ✅ **Position size calculator** — Embedded in trade setup card; account size + risk % → shares, dollar risk, profit potential
- ✅ **Risk calculator (RISK)** — Floating calculator for position size, max dollar loss, and R:R

### Fundamentals (FUND tab)
- ✅ **Valuation metrics** — Market Cap, P/E (TTM), Forward P/E, **PEG Ratio**, P/B, EPS, Beta, 52W High/Low, Dividend Yield
- ✅ **Profitability** — Revenue, Revenue Growth, Earnings Growth, Gross/Operating/Net Margins, ROA, ROE, Debt/Equity
- ✅ **Analyst targets** — Mean/High/Low price targets, recommendation, implied upside, analyst count
- ✅ **Hover tooltips on every metric** — 600ms hover shows plain-English explanation + trading context
- ✅ **Earnings history** — Actual vs estimate vs surprise for last 6 quarters
- ✅ **Revenue history** — Annual revenue & net income table
- ✅ **Insider transactions** — Recent buy/sell activity
- ✅ **News** — Latest headlines with publisher and age

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

### Session 9 (May 2026)
- ✅ **Supertrend** — **ST** toolbar toggle; ATR-based trend line drawn on the price chart, green when bullish (below price) and red when bearish (above price); ▲/▼ markers at every crossover flip; ATR period 10, multiplier 3
- ✅ **MACD** — **MACD** toolbar toggle; EMA12−EMA26 line (cyan), EMA9 signal line (amber), and histogram (green/red bars) in a sub-panel below the chart; live MACD and signal values shown top-right of panel
- ✅ **Bollinger Bands** — **BB** toolbar toggle; SMA20 ± 2σ envelope with a lightly filled band; upper/lower bands dashed amber, midline solid; band squeeze signals low-volatility breakout setups
- ✅ **Pivot points** — **PVTS** toolbar toggle; draws classic floor-trader PP, R1, R2 (resistance, red) and S1, S2 (support, teal) as dashed horizontal lines with right-side labels; computed from prior bar's High/Low/Close


- ✅ **VWAP deviation bands ±1σ/±2σ** — when VWAP overlay is active, dashed purple bands show ±1σ and ±2σ from cumulative VWAP; computed from rolling variance; useful for mean-reversion entries
- ✅ **Multi-timeframe alignment table** — WAVES panel now includes a TIMEFRAME ALIGNMENT section showing direction, wave position, RSI, and MA50/MA200 status for all 6 timeframes (1W–5Y) at a glance
- ✅ **Watchlist CSV import/export** — ⬇ CSV / ⬆ CSV buttons in watchlist header; export saves all tickers to a one-column CSV; import reads the file and adds any new valid tickers via the normal load flow

### Session 8 (May 2026)
- ✅ **52-week high/low lines** — **52W** toolbar toggle; gold dashed line at 52W high, red at 52W low; right-side tag shows price + distance % from current; Y-axis auto-expands to include both levels
- ✅ **Correlation matrix** — **CORR** sidebar tab; Pearson return-correlation heatmap across all watchlist tickers for the active timeframe; green = move together, red = move opposite, near-0 = good diversification; cell size adapts to watchlist size
- ✅ **Earnings expected-move cone** — earnings date line now includes days-to-earnings countdown and a `±N%` expected-move estimate; a shaded gold cone projects from current price to the earnings date showing the ±1σ expected range (derived from historical EPS surprise magnitude, falling back to 5-day historical-volatility proxy)
- ✅ **Y-axis auto-zoom** — chart Y-axis now expands to include all drawn forecast prices: wave targets, bull/bear cone endpoints, stop loss, buy/sell zones, analyst mean/high target, and options max pain (hard cap: 3× bar range prevents wild zoom-out)

### Session 7 (May 2026)
- ✅ **Gap detector** — **GAPS** toolbar toggle; shades gap-up zones (green) and gap-down zones (red) on the chart; unfilled gaps stay bright with dashed edges and a GAP↑/↓ label — filled gaps fade; price frequently returns to fill gaps making them reliable targets
- ✅ **AI trade thesis** — **▶ GENERATE** button at the bottom of the WAVES panel; sends wave position, RSI, ADX, Stochastic RSI, and key fundamentals (P/E, revenue growth, analyst target) to Claude; returns a 3-sentence thesis covering wave phase, key price level, and overall bias; result cached per ticker; requires `ANTHROPIC_API_KEY` env var

### Session 6 (May 2026)
- ✅ **ADX / DMI indicator** — sub-panel below chart showing ADX trend strength (purple), DI+ (green), DI- (red) with 20/25 reference lines and live value readout; toggle via **ADX** button
- ✅ **Stochastic RSI** — sub-panel showing %K (cyan) and %D (amber) lines with 20/80 overbought/oversold bands; toggle via **STOCH** button; panels stack under volume
- ✅ **Dark pool / block volume detection** — **DARK** toggle highlights candles where volume ≥ 2.5× 20-bar average with an orange glow/halo; identifies potential institutional accumulation or distribution
- ✅ **Backtesting engine** — **BACKTEST** sidebar tab; select symbol + timeframe + entry rule (W2 dip / W4 dip / W1 breakout / W3 breakout) + TP/SL % → shows trades, win rate, R:R, expectancy, total P&L, SVG equity curve, and scrollable trade log
- ✅ **Email alerts** — alerts fire to your email when a price level is crossed; enter email in the WAVES panel alert section; requires `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` env vars on server (no external packages — raw SMTP via Node built-ins)
- ✅ **Chart snapshots** — **📷 SNAP** toolbar button opens a modal to save/load named annotation snapshots (trendlines + alerts); snapshots persist to localStorage; restore any saved state in one click
- ✅ **Options flow scanner in SIGNALS tab** — after enabling OPT overlay for any ticker, the SIGNALS tab shows P/C ratio (green < 0.7 bullish, red > 1.3 bearish), max pain distance from current price, and heavy call/put OI strikes flagged as unusual

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

- 🔜 SMS alerts (Twilio integration)
- 🔜 Backtesting strategy builder (multi-indicator rules, not just wave entry)
- 🔜 Chart snapshot sharing (export snapshot URL / image with annotations)
- 🔜 Custom indicator builder (user-defined formulas)
- 🔜 SMS alerts (Twilio integration)
- 🔜 Backtesting strategy builder (multi-indicator rule combinations)
- 🔜 Chart snapshot sharing (export image with annotations embedded)
- 🔜 Custom indicator builder (user-defined price formulas)

---

**Happy trading! Remember: Risk management > Indicators. Never risk more than you can afford to lose.**

*WAVEFRONT © 2026. Elliott Wave analysis terminal.*
