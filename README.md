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

### Screener & Scanning
- ✅ **Wave pattern screener** — Score all watchlist tickers by setup quality
- ✅ **Keyboard screener** — Press `S` for floating, searchable result list
- ✅ **Relative strength ranking** — Compare momentum vs SPY (1M/3M)
- ✅ **Sector heatmap** — Color-coded grid of all 11 SPDR sector ETFs
- ✅ **COMPARE tab** — Side-by-side fundamental comparison of all watchlist tickers (sortable, 16 metrics)

### Trading Tools
- ✅ **Position tracker** — Log trades with entry wave, shares, price
- ✅ **Trendline drawing** — Click-to-draw support/resistance lines
- ✅ **Price alerts** — Set notifications at any price level
- ✅ **Watchlist folders** — Organize tickers by sector/strategy

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

## Right Panel Tabs (3×3 grid)

| Row | Tabs |
|-----|------|
| 1 | WAVES · FUND. · RESEARCH |
| 2 | JOURNAL · SCREENER · RS RANK |
| 3 | HEAT · PORTFOLIO · COMPARE |

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

### Session 3 (May 2026)
- ✅ **dotenv support** — `require('dotenv').config()` added to server.js; `FINNHUB_KEY` and `FMP_KEY` now loaded from `.env` automatically on `node server.js`
- ✅ **COMPARE active metric column pinned first** — selected metric pill always appears as column 3 (right after SYM), no horizontal scrolling needed; column header gets a blue underline
- ✅ **COMPARE data fix** — one-time localStorage migration (`wf_fund_migrated_v3`) clears stale pre-Finnhub NASDAQ cache on first load; `renderCompare` now also re-fetches sparse entries
- ✅ **Ticker watermark on chart** — active ticker symbol drawn as a semi-transparent label at the bottom-left of the chart canvas (above volume bars), always visible at a glance

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

- 🔜 Options chain overlay (strike prices, max pain)
- 🔜 Dark pool detection (unusual volume)
- 🔜 Backtesting engine (replay strategies on historical data)
- 🔜 Live price streaming (WebSocket updates)
- 🔜 Custom indicators (ADX, Stochastic RSI)
- 🔜 Email/SMS alerts
- 🔜 Chart snapshots (save/share annotations)
- 🔜 Journal export to CSV
- 🔜 Risk calculator (position size → max loss / R:R)

---

**Happy trading! Remember: Risk management > Indicators. Never risk more than you can afford to lose.**

*WAVEFRONT © 2026. Elliott Wave analysis terminal.*
