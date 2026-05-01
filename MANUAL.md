# WAVEFRONT — Elliott Wave Terminal Manual

> **WAVEFRONT** is a real-time Elliott Wave analysis platform for traders. Chart price action, detect wave patterns, manage positions, and scan the market — all in one terminal.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Chart Controls](#chart-controls)
4. [Overlays & Analysis](#overlays--analysis)
5. [Right Panel Features](#right-panel-features)
6. [Keyboard Shortcuts](#keyboard-shortcuts)
7. [Tips & Strategies](#tips--strategies)
8. [FAQ](#faq)

---

## Getting Started

### Load Your First Ticker

1. **Top header** — Find the ticker input field (center-left, next to the WAVEFRONT logo)
2. Type a stock symbol (e.g., `AAPL`, `MSFT`, `SPY`)
3. Press **Enter** — the chart loads with historical data
4. The ticker card appears in the **left sidebar** under WATCHLIST

### Add to Watchlist

Multiple tickers in the watchlist let you jump between them quickly:
- Type a ticker and press Enter — it's added automatically
- Click any ticker card in the left sidebar to view its chart
- Number keys **1–9** jump to the ticker at that position in the list

### Remove from Watchlist

- Right-click a ticker card in the left sidebar → **Delete**
- Or click the ✕ button on the card

---

## Interface Overview

### Left Sidebar — Watchlist

- **Folder tabs** at the top — organize tickers into groups (Tech, Biotech, etc.)
  - Click `+` to create a new folder
  - Right-click a folder to rename, add/remove tickers, or delete it
- **Sort buttons** — reorder by DEFAULT, SENTIMENT, RSI, WAVE, or CHG%
- **Ticker cards** — each shows:
  - **Symbol** (bold blue) and current **price**
  - **1D change %** (color: green=up, red=down)
  - **Status dot** — green=buy zone, red=sell zone, gold=near stop loss
  - **Earnings countdown** — days until next earnings (if available)

### Center — Chart

The heart of the app. Large price chart with candlesticks, wave labels, and overlays.
- **Scroll to zoom** — zoom in/out on price action
- **Drag when zoomed** — pan left/right through time
- **Double-click** — reset zoom to full timeframe
- **Crosshair** — hover over the chart to see price/date at that bar

### Top Toolbar — Timeframe & Overlays

**Timeframe buttons** (left):
- **1W**, **1M**, **3M**, **1Y**, **2Y**, **5Y** — jump between timeframes
- Current timeframe is highlighted in blue

**Overlay toggles** (center-right):
- **W** — Elliott Waves (on by default)
- **U** — Subwaves (fractal waves within waves)
- **F** — Fibonacci levels (extensions & retracements)
- **R** — Support & Resistance levels
- **Z** — Buy/sell zones (based on wave structure)
- **X** — Stop loss line (reversal risk)
- **V** — Volume bars
- **MM** — Measured Move projections (AB=CD pattern)
- **CHAN** — Regression channel (trend strength)
- **VP** — Volume profile (left edge histogram)
- **FIBT** — Fibonacci time zones (vertical lines at fib intervals)
- **DIVG** — RSI divergence scanner (bullish/bearish divs)
- **CNDL** — Candlestick patterns (14 classic patterns)
- **ECON** — Economic calendar (FOMC, CPI, NFP events)

Press **?** to see all shortcuts.

### Right Sidebar — Analysis Panels

6 tabs rotate through different analyses:

1. **WAVES** (default) — Current wave count, confidence, targets, and forecast zones
2. **FUND.** — Fundamentals (sector, P/E, market cap, earnings, insider trades)
3. **RESEARCH** — Deep analysis (news, sentiment, competitor moves)
4. **JOURNAL** — Trade log (record entry wave, R:R ratio, outcome)
5. **SCREENER** — Wave pattern scanner across all watchlist tickers
6. **RS RANK** — Relative strength vs SPY (1M / 3M momentum)
7. **HEAT** — Sector heatmap (11 SPDR ETFs colour-coded by performance)
8. **PORTFOLIO** — Position tracker (cost basis, current P&L, open trades)

---

## Chart Controls

### Zoom & Pan

| Action | Effect |
|--------|--------|
| **Scroll up/down** | Zoom in/out (slower = finer control) |
| **Drag (when zoomed)** | Pan left/right through bars |
| **Double-click** | Reset zoom to full timeframe |
| **Escape** | Clear crosshair |

### Drawing

- **Trendline tool** — Click the ✏️ icon in the toolbar, then click two price points to draw a line. Click a third time to confirm or ESC to cancel.
- **Price alert** — Click the 🔔 icon, then click a price level to set an alert. When crossed, you'll get a browser notification.
- **Drag to move** — Click & drag any drawn line to reposition it
- **Right-click to delete** — Right-click a line to remove it

---

## Overlays & Analysis

### Elliott Waves (W)

The **foundation** of WAVEFRONT. Detects completed and in-progress Elliott Wave counts:
- **Pivots** — Local price highs/lows (small colored circles)
- **Wave labels** — "W1", "W2", "W3", "W4", "W5", "WA", "WB", "WC"
- **Fib extensions** — Target prices for each wave's next move
- **Confidence %** — How confident the algo is in the count (0–100%)
- **Current wave** — Which wave is forming now (shown in top-left corner of chart)

### Fibonacci Levels (F)

Standard retracement & extension levels:
- **50%** (fib retracement)
- **61.8%** (golden ratio)
- **76.4%**, **100%**, **161.8%**, **261.8%** (extensions)

Each is labeled on the right edge with the price target.

### Support & Resistance (R)

Horizontal lines at price levels where reversals historically occur:
- **Green** = Support (bounce-off zones)
- **Red** = Resistance (rejection zones)

Calculated from recent pivots & wave extremes.

### Buy/Sell Zones (Z)

Colored bands based on Elliott Wave structure:
- **Green zone** — Wave 2 or Wave 4 completion (high-probability entry)
- **Red zone** — Extreme overextension (reduce size)
- **Zones update** as the wave count changes

### Measured Move (MM)

AB=CD projections:
- Finds wave pivots A, B, C
- Projects D at 1.0×, 1.272×, or 1.618× the AB distance
- Gold dashed lines + semi-transparent target zone

### Regression Channel (CHAN)

Statistical trend channel:
- **Blue center line** — least-squares fit through closes
- **Orange upper**, **green lower** — ±1.5σ bands
- Shows trend strength; a widening channel = increasing volatility

### Volume Profile (VP)

Horizontal histogram on the left edge:
- **Bar height** = volume traded at that price level
- **Gold line** = Point of Control (price with most volume)
- Helps find support/resistance by volume concentration

### Fibonacci Time Zones (FIBT)

Vertical dashed purple lines projected forward from the last wave pivot:
- Spacing: 1, 2, 3, 5, 8, 13, 21, 34 bars
- **Time-based confluence** — when these align with price targets (Fibs), major moves often occur

### RSI Divergence (DIVG)

Detects hidden strength/weakness:
- **Green arrows ▲** — Bullish divergence (price lower low, RSI higher low = strength building)
- **Red arrows ▼** — Bearish divergence (price higher high, RSI lower high = weakness building)
- **Dashed connecting lines** between the two pivots

### Candlestick Patterns (CNDL)

14 classic patterns labeled on the chart:
- **Bullish**: Hammer, Morning Star, Engulfing, 3 White Soldiers
- **Bearish**: Hanging Man, Evening Star, Dark Cloud Cover, 3 Black Crows
- **Neutral**: Doji, Spinning Top
- Pill labels with arrows pointing to the candle

### Economic Calendar (ECON)

Major economic events that move markets:
- **Purple** — FOMC (Fed interest rate decisions)
- **Amber** — CPI (inflation data)
- **Light blue** — NFP (non-farm payroll / jobs)
- Vertical dashed lines at event dates; labels at the top

---

## Right Panel Features

### WAVES Panel

**Current wave info:**
- Wave count (e.g., "W3" = third wave forming)
- **Confidence** — 0–100% how certain the algorithm is
- **Next target** — The projected price for the wave to extend to
- **Forecast zones** — BUY zone (W2/W4 completion), SELL zone (extremes)

**What it means:**
- W1 = Initial move (usually weak)
- W2 = Pullback (often retraces 50–78.6%)
- W3 = Main move (longest, strongest) ← **Best risk/reward**
- W4 = Second pullback (shorter than W2)
- W5 = Final push (often weak, early reversal)

### SCREENER

Real-time scanner of all watchlist tickers:
- Sorted by **wave setup quality** (0–100 score)
- Shows current wave, confidence, and next target
- Click **SCAN** to refresh
- Click **LOAD** on any row to jump to that ticker

**Keyboard screener** — Press **S** to open a floating search box:
- Type to filter tickers instantly
- **↑ ↓** to navigate
- **Enter** to load selected ticker
- **Esc** to close

### RS RANK

Relative strength vs SPY:
- **1M return** — ticker's price change over 1 month
- **3M return** — ticker's price change over 3 months
- **RS rating** — how much stronger/weaker than SPY
  - 🔥 **STRONG** (>1.5× SPY) — winning hard
  - **▲ ABOVE** (1.0–1.5×) — outperforming
  - **◆ NEUTRAL** (0.5–1.0×) — tracking SPY
  - **▽ WEAK** (0–0.5×) — lagging
  - **↓ LAGGING** (<0) — down when SPY is up

Click **RANK** to compute (loads SPY baseline if needed).

### HEAT

Sector heatmap showing all 11 SPDR sectors:
- **Colour-coded grid** — green = performing, red = struggling
- **Period selector** — 1D / 1W / 1M / 3M
- **Benchmarks** at top — SPY, QQQ, IWM returns for context
- **Sorted best → worst** within the selected period
- Click any sector to load its ETF chart

**Sector tickers:**
- XLK (Technology) · XLF (Financials) · XLV (Health Care)
- XLY (Consumer Discretionary) · XLP (Consumer Staples) · XLE (Energy)
- XLI (Industrials) · XLC (Communications) · XLB (Materials)
- XLRE (Real Estate) · XLU (Utilities)

### PORTFOLIO

Position tracker for trades you're actively managing:
1. **Add position** — Enter ticker, shares, entry price, wave entered on
2. View all open positions with:
   - **Current price** & **P&L** (both $ and %)
   - **Entry wave** (which Elliott Wave you bought)
   - Current wave in the chart
3. **Edit/delete** any position
4. **Portfolio summary** — Total cost, current value, overall P&L

---

## Keyboard Shortcuts

### Navigation

| Key | Action |
|-----|--------|
| **1–9** | Jump to ticker 1–9 in watchlist |
| **← →** | Step left/right through timeframes |
| **Escape** | Clear crosshair / close modals |
| **?** | Show keyboard help panel |

### Overlay Toggles (press twice to toggle on/off)

| Key | Overlay |
|-----|---------|
| **W** | Waves |
| **U** | Subwaves |
| **F** | Fibonacci levels |
| **R** | Support & Resistance |
| **Z** | Buy/sell zones |
| **X** | Stop loss |
| **V** | Volume |

### Features

| Key | Action |
|-----|--------|
| **S** | Open keyboard screener (↑↓ navigate, Enter select) |
| **/** | Start drawing trendline |
| **⏰** | Set price alert |

---

## Tips & Strategies

### Finding Trade Entries

**Wave 2 / Wave 4 entries** (highest win rate):
1. Watch for a completed Wave 1 (first impulsive move)
2. Wave 2 retraces 50–78.6% (look at Fib levels)
3. When Wave 2 **completes in the green BUY zone**, a strong Wave 3 typically follows
4. Same logic for Wave 4 (small pullback before Wave 5)

**Confluence zones** (multiple signals align):
- Price at a Fibonacci level **AND**
- Price at Support/Resistance **AND**
- Inside green BUY zone **AND**
- RSI divergence showing strength building

→ **High probability entry**

### Managing Risk

1. **Stop loss** — Set below the recent pivot (Wave 1 low for a Wave 2 entry)
2. **Target** — Use Fibonacci extensions (1.618× is common for Wave 3)
3. **Position sizing** — Risk 1–2% per trade (Risk/Reward ratio of 1:2 or better)
4. **Journal entries** — Log each trade and outcome to improve over time

### Screener Workflow

1. Press **S** for keyboard screener
2. Look for high-score setups (85+)
3. Jump to top 3 candidates
4. Compare their charts across different timeframes
5. Filter by sector (HEAT tab) — bias toward strong sectors
6. Check RS RANK — trade stronger names when possible

### Sector Rotation

Use the **HEAT** heatmap to:
- **Identify sector leadership** — which areas are outperforming
- **Buy strength** — trade tickers in sectors showing green
- **Avoid weakness** — reduce exposure to red sectors
- **Spot rotation** — when a sector switches from red to green, it can signal a shift in market leadership

---

## FAQ

### Q: What is an Elliott Wave?

A: A repeating 5-wave pattern in price action representing a complete trend cycle:
- Waves 1, 3, 5 = Impulse waves (direction of main trend)
- Waves 2, 4 = Corrective waves (pullbacks)
- Followed by 3-wave corrections (A, B, C)

Elliott Waves help predict where price is likely to reverse or accelerate.

### Q: How accurate is the wave detection?

A: The algorithm uses statistical pattern recognition (pivots, ratios, structure). It's typically 60–75% accurate on well-defined trends. **Always confirm with support/resistance and other indicators.**

### Q: What does "confidence %" mean?

A: How sure the algorithm is that the current wave count is correct. 0–40% = weak signal, 40–70% = moderate, 70%+ = strong. Use it as a filter when evaluating trades.

### Q: Can I trade on multiple timeframes?

A: Yes! All overlays update when you switch timeframes (← → keys). **Tip:** Use a larger timeframe (3M/1Y) for direction, then zoom into 1W/1M for exact entries.

### Q: How do I set price alerts?

A: Click the 🔔 alert icon in the toolbar, then click a price level on the chart. When that price is crossed, you'll get a browser notification.

### Q: Where does the data come from?

A: Daily bars from Yahoo Finance (via a backend API). Updates are cached to respect rate limits. Refresh by switching tickers or reloading the page.

### Q: How do I export my positions?

A: Positions are saved in your browser's local storage. Export via the Portfolio tab (download CSV) or manually copy the data.

### Q: Can I use this on mobile?

A: **Yes!** The app is responsive and works on tablets/phones. Landscape mode is recommended for the full chart view. Touch gestures:
- **Two-finger pinch** = zoom
- **Swipe** = pan
- **Tap** = crosshair

### Q: Does it work offline?

A: No, you need an internet connection to fetch price data. However, once loaded, the chart renders smoothly and drawing tools work offline (changes sync when reconnected).

### Q: How often is data updated?

A: Daily bars update once per day (market close). The app caches data to avoid hitting rate limits. Refresh manually by clicking a different ticker then returning.

---

## Keyboard Shortcut Cheat Sheet

Print or bookmark this:

```
╔════════════════════════════════════════════════════════╗
║              WAVEFRONT KEYBOARD SHORTCUTS              ║
╠════════════════════════════════════════════════════════╣
║ Navigation:                                            ║
║   1–9     Jump to ticker 1–9                           ║
║   ← →     Step through timeframes                      ║
║   Esc     Clear crosshair                              ║
║   ?       Show this help                               ║
║                                                        ║
║ Overlays (toggle on/off):                              ║
║   W       Waves        │   Z       Buy/sell zones      ║
║   U       Subwaves     │   X       Stop loss           ║
║   F       Fibonacci    │   V       Volume              ║
║   R       S/R levels   │                               ║
║                                                        ║
║ Features:                                              ║
║   S       Open screener (↑↓ navigate, Enter select)    ║
║   /       Trendline tool                               ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

---

## Version History & Updates

**Current version:** 1.0 (May 2026)

### Features Implemented
- ✅ Elliott Wave detection & labeling
- ✅ Fibonacci levels (retracement & extension)
- ✅ Support & Resistance levels
- ✅ Buy/sell zones
- ✅ Stop loss line
- ✅ Volume profile
- ✅ Measured Move (AB=CD) projections
- ✅ Regression channel
- ✅ Fibonacci time zones
- ✅ RSI divergence scanner
- ✅ Candlestick pattern overlay
- ✅ Economic calendar
- ✅ Wave pattern screener (keyboard accessible with S)
- ✅ Relative strength ranking vs SPY (RS RANK tab)
- ✅ Sector heatmap (HEAT tab)
- ✅ Position tracker (PORTFOLIO tab)
- ✅ Watchlist folders & organization
- ✅ Trendline & alert drawing tools
- ✅ Responsive mobile design

### Planned Features (Coming Soon)
- 🔜 Options chain overlay (strike prices & max pain)
- 🔜 Dark pool / unusual volume detection
- 🔜 Alert notifications via email/SMS
- 🔜 Backtesting engine (test entry strategies on historical data)
- 🔜 Chart snapshot export (PNG with annotations)
- 🔜 Live price streaming (WebSocket updates)
- 🔜 Custom indicators (ADX, Stoch RSI, etc.)
- 🔜 Trading bot / automated alerts

---

**Last updated:** May 1, 2026  
**Questions?** Open an issue or reach out via GitHub.

---

*WAVEFRONT is a tool for Elliott Wave traders. Always trade with proper risk management and never risk more than you can afford to lose.*
