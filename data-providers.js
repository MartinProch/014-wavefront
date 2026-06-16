// ─── DATA PROVIDER FAILOVER ────────────────────────────────────────────────
// Canonical implementation. This file is the source of truth and is covered
// by test-data-providers.js (run with `node test-data-providers.js`).
//
// wavefront-mobile.html embeds an IDENTICAL copy of this code inline inside
// its <script> tag (the app is intentionally single-file for the Capacitor
// WebView — see CLAUDE.md). If you change the logic here, copy the change
// into wavefront-mobile.html too, in the "DATA PROVIDER FAILOVER" section.
//
// Order of providers (priority): FMP (primary) -> Finnhub -> Twelve Data -> Alpha Vantage.
// Failover triggers ONLY on rate-limit / quota-exhausted responses (err.isRateLimit === true).
// Any other error (network, timeout, malformed response) bubbles up immediately —
// the caller's existing retry/fallback logic handles those, not this module.

(function (global) {
  'use strict';

  // ── Normalized output models ─────────────────────────────────────────────
  // Bar matches the shape already used everywhere in the app: state.data[sym].bars
  function normalizeBar(b) {
    return {
      date: b.date instanceof Date ? b.date : new Date(b.date),
      o: Number(b.o), h: Number(b.h), l: Number(b.l), c: Number(b.c),
      v: Number(b.v) || 0,
    };
  }
  function normalizeQuote(q) {
    return {
      symbol: q.symbol,
      price: Number(q.price),
      change: Number(q.change) || 0,
      changePercent: Number(q.changePercent) || 0,
      source: q.source,
    };
  }

  // Fundamentals normalized shape — mirrors the "Yahoo-like" structure the
  // app already consumes everywhere (defaultKeyStatistics/summaryDetail/
  // financialData/price/assetProfile with { raw: value } leaves). This is a
  // SIMPLIFIED mapper for test coverage of the failover/normalization wiring;
  // wavefront-mobile.html's mirror reuses the existing, more complete
  // fmpToYahooFormat() for the FMP case (same script scope, no duplication).
  function normalizeFundamentalsFromFmp(profile, quote, metrics, ratios, income, symbol) {
    var p = Array.isArray(profile) ? profile[0] : profile || {};
    var q = Array.isArray(quote) ? quote[0] : quote || {};
    var m = Array.isArray(metrics) ? metrics[0] : metrics || {};
    var rt = Array.isArray(ratios) ? ratios[0] : ratios || {};
    var inc = Array.isArray(income) ? income[0] : income || {};
    var eps = inc.eps || inc.epsDiluted || null;
    var pe = rt.priceToEarningsRatioTTM || null;
    return {
      _source: 'FMP',
      defaultKeyStatistics: { trailingEps: { raw: eps }, forwardEps: { raw: null }, trailingPE: { raw: pe }, forwardPE: { raw: null }, beta: { raw: p.beta ?? null } },
      summaryDetail: { marketCap: { raw: q.marketCap || p.marketCap || null }, trailingPE: { raw: pe }, trailingEps: { raw: eps } },
      financialData: { currentPrice: { raw: q.price ?? null }, totalRevenue: { raw: inc.revenue ?? null } },
      price: { regularMarketPrice: { raw: q.price ?? null }, symbol: symbol, sector: p.sector || '', industry: p.industry || '' },
      assetProfile: { longBusinessSummary: p.description || '', sector: p.sector || '', industry: p.industry || '' },
    };
  }

  // Mirrors server.js's fetchFinnhubFundamentals mapping (simplified for
  // test purposes — see wavefront-mobile.html for the byte-identical copy
  // used at runtime, which is the one that matters for the actual app).
  function normalizeFundamentalsFromFinnhub(p, m, rc, t, symbol) {
    var pct = function (v) { return v != null ? v / 100 : null; };
    var trailingPe = m.peBasicExclExtraTTM ?? m.peTTM;
    var trailingEps = m.epsBasicExclExtraItemsTTM ?? m.epsTTM;
    var derivedPrice = (trailingPe != null && trailingEps != null) ? trailingPe * trailingEps
      : (p.marketCapitalization != null && p.shareOutstanding) ? p.marketCapitalization / p.shareOutstanding : null;
    var fwdPe = m.forwardPE;
    var derivedFwdEps = (derivedPrice != null && fwdPe != null && fwdPe > 0) ? derivedPrice / fwdPe : null;
    return {
      _source: 'Finnhub',
      defaultKeyStatistics: { trailingEps: { raw: trailingEps ?? null }, forwardEps: { raw: derivedFwdEps }, trailingPE: { raw: trailingPe ?? null }, forwardPE: { raw: fwdPe ?? null }, beta: { raw: p.beta ?? m.beta ?? null } },
      summaryDetail: { marketCap: { raw: p.marketCapitalization ? p.marketCapitalization * 1e6 : null }, trailingPE: { raw: trailingPe ?? null }, trailingEps: { raw: trailingEps ?? null } },
      financialData: { currentPrice: { raw: derivedPrice }, profitMargins: { raw: pct(m.netProfitMarginTTM ?? m.netMarginTTM) } },
      price: { regularMarketPrice: { raw: derivedPrice }, symbol: symbol, sector: p.ggroup || p.finnhubIndustry || '', industry: p.finnhubIndustry || '' },
      assetProfile: { longBusinessSummary: p.description || '', sector: p.ggroup || p.finnhubIndustry || '', industry: p.finnhubIndustry || '' },
    };
  }

  // ── Rate limiter (sliding window, in-memory) ─────────────────────────────
  function RateLimiter(max, windowMs) {
    this.max = max;
    this.windowMs = windowMs;
    this.timestamps = [];
  }
  RateLimiter.prototype.tryAcquire = function (now) {
    now = now || Date.now();
    this.timestamps = this.timestamps.filter(function (t) { return now - t < this.windowMs; }, this);
    if (this.timestamps.length >= this.max) return false;
    this.timestamps.push(now);
    return true;
  };

  // Combines multiple limiters (e.g. Alpha Vantage: 5/min AND 25/day) —
  // all must have headroom, otherwise none are consumed (no partial spend).
  function CompositeRateLimiter(limiters) {
    this.limiters = limiters;
  }
  CompositeRateLimiter.prototype.tryAcquire = function (now) {
    now = now || Date.now();
    var allOk = this.limiters.every(function (l) {
      l.timestamps = l.timestamps.filter(function (t) { return now - t < l.windowMs; });
      return l.timestamps.length < l.max;
    });
    if (!allOk) return false;
    this.limiters.forEach(function (l) { l.timestamps.push(now); });
    return true;
  };

  // ── Logging (overridable for tests) ──────────────────────────────────────
  var _log = function () {
    var args = Array.prototype.slice.call(arguments);
    console.log.apply(console, ['[failover]'].concat(args));
  };
  function setFailoverLogger(fn) { _log = fn; }

  // ── Fetch injection (overridable for tests / Node without global fetch) ──
  var _fetchImpl = (typeof fetch !== 'undefined') ? fetch : null;
  function setFetchImpl(fn) { _fetchImpl = fn; }

  function doFetch(url, opts) {
    if (!_fetchImpl) throw new Error('No fetch implementation available — call setFetchImpl()');
    return _fetchImpl(url, opts);
  }

  // ── Per-provider request wrappers: detect rate-limit-specific formats ───
  function rateLimitError(message) {
    var err = new Error(message);
    err.isRateLimit = true;
    return err;
  }

  // Distinct from a rate limit: the provider's plan structurally does not
  // include this operation at all (e.g. Finnhub free tier returns HTTP 403
  // for /stock/candle — historical OHLCV requires a paid plan, every single
  // call, forever, regardless of quota). Treated the same as a rate limit by
  // the orchestrator — try the next provider — since retrying THIS provider
  // would never succeed, but unlike a generic error it should not block the
  // rest of the fallback chain.
  function providerUnavailableError(message) {
    var err = new Error(message);
    err.isProviderUnavailable = true;
    return err;
  }

  // ── Shared short-TTL HTTP cache ───────────────────────────────────────────
  // Many FUND sub-tabs (Buffett, Quality, EarnTrend, ValHist...) independently
  // request OVERLAPPING data for the SAME ticker (key-metrics, ratios, income-
  // statement, Finnhub profile2/metric) within minutes of each other as the
  // user navigates between tabs. Caching successful responses by exact URL
  // for a few minutes means the 2nd+ tab reuses the 1st tab's response
  // instead of burning another request — without changing any tab's logic.
  // Errors are NEVER cached (a rate-limit should be re-checked on next call,
  // not "stuck" for the TTL window).
  var HTTP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  var _httpCache = new Map();
  function cached(url, requestFn) {
    var hit = _httpCache.get(url);
    if (hit && (Date.now() - hit.ts) < HTTP_CACHE_TTL) return Promise.resolve(hit.value);
    return requestFn(url).then(function (value) {
      _httpCache.set(url, { value: value, ts: Date.now() });
      if (_httpCache.size > 300) _httpCache.delete(_httpCache.keys().next().value);
      return value;
    });
  }
  function clearHttpCache() { _httpCache.clear(); }

  async function _fmpRequestRaw(url) {
    var res = await doFetch(url);
    var text = await res.text();
    var json;
    try { json = JSON.parse(text); } catch (e) { json = null; }
    // FMP signals rate-limit/quota issues via HTTP 429 ("Limit Reach") or
    // HTTP 402 ("Premium Query Parameter" — param exceeds plan tier). Most
    // endpoints wrap this in a {"Error Message": "..."} JSON body, but some
    // (observed on /stable/analyst-estimates with period=quarter) return
    // PLAIN TEXT instead — checking status BEFORE requiring valid JSON means
    // those still trigger failover instead of bubbling as a generic parse error.
    if (res.status === 429 || res.status === 402) {
      throw rateLimitError('FMP: ' + (json && json['Error Message'] ? json['Error Message'] : (text || ('HTTP ' + res.status))));
    }
    if (!json) throw new Error('FMP: invalid JSON response (status ' + res.status + ')');
    if (json['Error Message']) {
      var msg = json['Error Message'];
      if (/limit|premium/i.test(msg)) throw rateLimitError('FMP: ' + msg);
      throw new Error('FMP error: ' + msg);
    }
    if (!res.ok) throw new Error('FMP HTTP ' + res.status);
    return json;
  }
  function fmpRequest(url) { return cached(url, _fmpRequestRaw); }

  async function _finnhubRequestRaw(url) {
    var res = await doFetch(url);
    if (res.status === 429) throw rateLimitError('Finnhub: HTTP 429 (rate limited)');
    // Free tier returns 403 "You don't have access to this resource" for
    // /stock/candle (historical OHLCV) — a permanent plan restriction, not a
    // transient error. Skip to the next provider instead of blocking the chain.
    if (res.status === 403) throw providerUnavailableError('Finnhub: HTTP 403 (not available on this plan)');
    if (!res.ok) throw new Error('Finnhub HTTP ' + res.status);
    return res.json();
  }
  function finnhubRequest(url) { return cached(url, _finnhubRequestRaw); }

  async function _twelveDataRequestRaw(url) {
    var res = await doFetch(url);
    var json = null;
    try { json = await res.json(); } catch (e) { /* ignore, handled below */ }
    var quotaMsg = json && json.status === 'error' && /credit|limit/i.test(json.message || '') ? json.message : null;
    if (res.status === 429 || (json && json.code === 429) || quotaMsg) {
      throw rateLimitError('Twelve Data: ' + (quotaMsg || (json && json.message) || ('HTTP ' + res.status)));
    }
    if (!json) throw new Error('Twelve Data: invalid JSON response (status ' + res.status + ')');
    if (json.status === 'error') throw new Error('Twelve Data error: ' + json.message);
    if (!res.ok) throw new Error('Twelve Data HTTP ' + res.status);
    return json;
  }
  function twelveDataRequest(url) { return cached(url, _twelveDataRequestRaw); }

  async function _alphaVantageRequestRaw(url) {
    var res = await doFetch(url);
    var json = null;
    try { json = await res.json(); } catch (e) { /* ignore, handled below */ }
    if (res.status === 429) throw rateLimitError('Alpha Vantage: HTTP 429 (rate limited)');
    // Alpha Vantage famously returns HTTP 200 with a "Note" (legacy) or
    // "Information" (current) field instead of a real error status when the
    // daily/per-minute quota is exhausted.
    if (json && (json['Note'] || (json['Information'] && /rate limit|frequency|premium/i.test(json['Information'])))) {
      throw rateLimitError('Alpha Vantage: ' + (json['Note'] || json['Information']));
    }
    if (!json) throw new Error('Alpha Vantage: invalid JSON response (status ' + res.status + ')');
    if (!res.ok) throw new Error('Alpha Vantage HTTP ' + res.status);
    return json;
  }
  function alphaVantageRequest(url) { return cached(url, _alphaVantageRequestRaw); }

  // ── Provider adapters ─────────────────────────────────────────────────────
  // API keys are read from global constants (FMP_KEY, FINNHUB_API_KEY,
  // TWELVE_DATA_API_KEY, ALPHA_VANTAGE_API_KEY) declared near the top of
  // wavefront-mobile.html — same hardcoded-constant pattern as FMP_KEY today.
  // In this standalone file (Node tests) they come from the keys object below.
  function makeProviders(keys) {
    keys = keys || {};
    var FMP_KEY = keys.FMP_KEY || (typeof global.FMP_KEY !== 'undefined' ? global.FMP_KEY : '');
    var FINNHUB_API_KEY = keys.FINNHUB_API_KEY || (typeof global.FINNHUB_API_KEY !== 'undefined' ? global.FINNHUB_API_KEY : '');
    var TWELVE_DATA_API_KEY = keys.TWELVE_DATA_API_KEY || (typeof global.TWELVE_DATA_API_KEY !== 'undefined' ? global.TWELVE_DATA_API_KEY : '');
    var ALPHA_VANTAGE_API_KEY = keys.ALPHA_VANTAGE_API_KEY || (typeof global.ALPHA_VANTAGE_API_KEY !== 'undefined' ? global.ALPHA_VANTAGE_API_KEY : '');

    var fmpProvider = {
      name: 'FMP',
      rateLimiter: { tryAcquire: function () { return true; } }, // primary — no artificial client-side cap
      isConfigured: function () { return !!FMP_KEY; },
      getQuote: async function (symbol) {
        var json = await fmpRequest('https://financialmodelingprep.com/stable/quote?symbol=' + symbol + '&apikey=' + FMP_KEY);
        var q = Array.isArray(json) ? json[0] : json;
        if (!q || q.price == null) throw new Error('FMP: empty quote response');
        return normalizeQuote({ symbol: symbol, price: q.price, change: q.change, changePercent: q.changesPercentage, source: 'FMP' });
      },
      getHistoricalBars: async function (symbol, fromDate) {
        var json = await fmpRequest('https://financialmodelingprep.com/stable/historical-price-eod/full?symbol=' + symbol + '&from=' + fromDate + '&apikey=' + FMP_KEY);
        if (!Array.isArray(json) || !json.length) throw new Error('FMP: no historical data');
        var sorted = json.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
        return sorted.map(function (d) {
          return normalizeBar({ date: d.date, o: d.open, h: d.high, l: d.low, c: d.close, v: d.volume });
        });
      },
      // 5 parallel FMP calls (profile, quote, key-metrics-ttm, ratios-ttm,
      // income-statement). If ANY of them is rate-limited, the whole fetch
      // is treated as rate-limited (so the caller fails over as a unit
      // rather than ending up with a partially-filled, inconsistent result).
      getFundamentals: async function (symbol) {
        var BASE = 'https://financialmodelingprep.com/stable';
        var settled = await Promise.allSettled([
          fmpRequest(BASE + '/profile?symbol=' + symbol + '&apikey=' + FMP_KEY),
          fmpRequest(BASE + '/quote?symbol=' + symbol + '&apikey=' + FMP_KEY),
          fmpRequest(BASE + '/key-metrics-ttm?symbol=' + symbol + '&apikey=' + FMP_KEY),
          fmpRequest(BASE + '/ratios-ttm?symbol=' + symbol + '&apikey=' + FMP_KEY),
          fmpRequest(BASE + '/income-statement?symbol=' + symbol + '&period=annual&limit=1&apikey=' + FMP_KEY),
        ]);
        var rateLimited = settled.find(function (r) { return r.status === 'rejected' && r.reason && r.reason.isRateLimit; });
        if (rateLimited) throw rateLimitError('FMP: ' + rateLimited.reason.message);
        var otherFail = settled.find(function (r) { return r.status === 'rejected'; });
        if (otherFail) throw otherFail.reason;
        return normalizeFundamentalsFromFmp(settled[0].value, settled[1].value, settled[2].value, settled[3].value, settled[4].value, symbol);
      },
      // Used by the Buffett Quality Score (FUND/BUFFETT) — ROE, D/E, margins,
      // FCF yield, current ratio, P/E + 5Y EPS history for CAGR.
      getQualityMetrics: async function (symbol) {
        var BASE = 'https://financialmodelingprep.com/stable';
        var settled = await Promise.allSettled([
          fmpRequest(BASE + '/key-metrics?symbol=' + symbol + '&period=annual&limit=5&apikey=' + FMP_KEY),
          fmpRequest(BASE + '/income-statement?symbol=' + symbol + '&period=annual&limit=5&apikey=' + FMP_KEY),
          fmpRequest(BASE + '/balance-sheet-statement?symbol=' + symbol + '&period=annual&limit=5&apikey=' + FMP_KEY),
          fmpRequest(BASE + '/ratios?symbol=' + symbol + '&period=annual&limit=5&apikey=' + FMP_KEY),
        ]);
        var rateLimited = settled.find(function (r) { return r.status === 'rejected' && r.reason && r.reason.isRateLimit; });
        if (rateLimited) throw rateLimitError('FMP: ' + rateLimited.reason.message);
        var otherFail = settled.find(function (r) { return r.status === 'rejected'; });
        if (otherFail) throw otherFail.reason;
        var km = settled[0].value, is = settled[1].value, bs = settled[2].value, rt = settled[3].value;
        var k = Array.isArray(km) ? km[0] : {};
        var i0 = Array.isArray(is) ? is[0] : {};
        var b0 = Array.isArray(bs) ? bs[0] : {};
        var r0 = Array.isArray(rt) ? rt[0] : {};
        var roe = (k.returnOnEquity ?? r0.returnOnEquity) != null ? (k.returnOnEquity ?? r0.returnOnEquity) * 100 : null;
        var debtEq = r0.debtToEquityRatio || (b0.totalDebt && b0.totalStockholdersEquity ? b0.totalDebt / b0.totalStockholdersEquity : null);
        var opMargin = r0.operatingProfitMargin ? r0.operatingProfitMargin * 100 : (i0.operatingIncomeRatio ? i0.operatingIncomeRatio * 100 : null);
        var netMargin = r0.netProfitMargin ? r0.netProfitMargin * 100 : (i0.netIncomeRatio ? i0.netIncomeRatio * 100 : null);
        var fcfYield = k.freeCashFlowYield ? k.freeCashFlowYield * 100 : null;
        var currentRatio = k.currentRatio || r0.currentRatio || null;
        var peRatio = r0.priceToEarningsRatio || null;
        var epsHistory = Array.isArray(is) ? is.map(function (x) { return x.eps; }) : [];
        return { roe: roe, debtEq: debtEq, opMargin: opMargin, netMargin: netMargin, fcfYield: fcfYield, currentRatio: currentRatio, peRatio: peRatio, epsHistory: epsHistory, source: 'FMP' };
      },
      // FUND/VALHIST — up to 5 years of P/E, P/B, P/S, P/FCF for the
      // valuation-history chart. Returns the raw key-metrics array (newest
      // first, like FMP normally returns it) so callers can keep slicing/
      // reversing exactly as before — only the data source changes.
      getValuationHistory: async function (symbol) {
        var json = await fmpRequest('https://financialmodelingprep.com/stable/key-metrics?symbol=' + symbol + '&limit=5&apikey=' + FMP_KEY);
        if (!Array.isArray(json) || !json.length) throw new Error('FMP: no valuation history');
        return json;
      },
      // FUND/EARNTREND — quarterly EPS/revenue history + forward analyst
      // estimates. Same 2 calls renderEarnTrend already made directly;
      // moved here so Finnhub can stand in when FMP is rate-limited.
      getEarningsTrend: async function (symbol) {
        var BASE = 'https://financialmodelingprep.com/stable';
        var settled = await Promise.allSettled([
          fmpRequest(BASE + '/income-statement?symbol=' + symbol + '&period=quarter&limit=5&apikey=' + FMP_KEY),
          fmpRequest(BASE + '/analyst-estimates?symbol=' + symbol + '&period=quarter&limit=3&apikey=' + FMP_KEY),
        ]);
        var rateLimited = settled.find(function (r) { return r.status === 'rejected' && r.reason && r.reason.isRateLimit; });
        if (rateLimited) throw rateLimitError('FMP: ' + rateLimited.reason.message);
        var otherFail = settled.find(function (r) { return r.status === 'rejected'; });
        if (otherFail) throw otherFail.reason;
        return { hist: Array.isArray(settled[0].value) ? settled[0].value : [], fwd: Array.isArray(settled[1].value) ? settled[1].value : [], source: 'FMP' };
      },
      // FUND/INSTITUTIONAL — ownership percentages. No Finnhub equivalent
      // exists on the free tier (verified: /stock/ownership returns HTTP 403
      // "no access to this resource" even outside rate-limit conditions), so
      // this stays FMP-only; the orchestrator just clears the error sooner.
      getInstitutionalOwnership: async function (symbol) {
        var json = await fmpRequest('https://financialmodelingprep.com/stable/key-metrics?symbol=' + symbol + '&limit=1&apikey=' + FMP_KEY);
        if (!Array.isArray(json) || !json.length) throw new Error('FMP: no institutional ownership data');
        return { holders: [], stats: json };
      },
    };

    var finnhubProvider = {
      name: 'Finnhub',
      rateLimiter: new RateLimiter(60, 60 * 1000), // 60 req/min
      isConfigured: function () { return !!FINNHUB_API_KEY; },
      getQuote: async function (symbol) {
        var json = await finnhubRequest('https://finnhub.io/api/v1/quote?symbol=' + symbol + '&token=' + FINNHUB_API_KEY);
        if (!json || json.c == null || json.c === 0) throw new Error('Finnhub: empty quote response');
        return normalizeQuote({ symbol: symbol, price: json.c, change: json.d, changePercent: json.dp, source: 'Finnhub' });
      },
      getHistoricalBars: async function (symbol, fromDate) {
        var fromUnix = Math.floor(new Date(fromDate).getTime() / 1000);
        var toUnix = Math.floor(Date.now() / 1000);
        var json = await finnhubRequest('https://finnhub.io/api/v1/stock/candle?symbol=' + symbol + '&resolution=D&from=' + fromUnix + '&to=' + toUnix + '&token=' + FINNHUB_API_KEY);
        if (!json || json.s !== 'ok' || !Array.isArray(json.c) || !json.c.length) {
          throw new Error('Finnhub: no historical data (candles require a paid plan on the free tier)');
        }
        return json.t.map(function (t, i) {
          return normalizeBar({ date: new Date(t * 1000), o: json.o[i], h: json.h[i], l: json.l[i], c: json.c[i], v: json.v[i] });
        });
      },
      // Ports the same field mapping server.js already uses for its desktop
      // proxy (fetchFinnhubFundamentals) — profile2 + metric=all + recommendation
      // + price-target, combined into the app's internal "Yahoo-shaped" model.
      // Crucially this is the only fallback that derives forwardPE/forwardEps.
      getFundamentals: async function (symbol) {
        var base = 'https://finnhub.io/api/v1';
        // profile2 + metric=all are REQUIRED (carry EPS/PE/forwardPE — the
        // whole point of this fallback). recommendation + price-target are
        // best-effort extras (analyst targets) — Finnhub's free tier 403s
        // price-target specifically, but that must not blank out EPS/PE.
        var required = await Promise.allSettled([
          finnhubRequest(base + '/stock/profile2?symbol=' + symbol + '&token=' + FINNHUB_API_KEY),
          finnhubRequest(base + '/stock/metric?symbol=' + symbol + '&metric=all&token=' + FINNHUB_API_KEY),
        ]);
        var rateLimited = required.find(function (r) { return r.status === 'rejected' && r.reason && r.reason.isRateLimit; });
        if (rateLimited) throw rateLimitError('Finnhub: ' + rateLimited.reason.message);
        var unavailable = required.find(function (r) { return r.status === 'rejected' && r.reason && r.reason.isProviderUnavailable; });
        if (unavailable) throw providerUnavailableError('Finnhub: ' + unavailable.reason.message);
        var otherFail = required.find(function (r) { return r.status === 'rejected'; });
        if (otherFail) throw otherFail.reason;

        var optional = await Promise.allSettled([
          finnhubRequest(base + '/stock/recommendation?symbol=' + symbol + '&token=' + FINNHUB_API_KEY),
          finnhubRequest(base + '/stock/price-target?symbol=' + symbol + '&token=' + FINNHUB_API_KEY),
        ]);
        var p = required[0].value || {};
        var m = (required[1].value && required[1].value.metric) || {};
        var rc = optional[0].status === 'fulfilled' ? optional[0].value : [];
        var t = optional[1].status === 'fulfilled' ? optional[1].value : {};
        if (!p.ticker) throw new Error('Finnhub: no profile for ' + symbol);
        return normalizeFundamentalsFromFinnhub(p, m, rc, t, symbol);
      },
      // Single metric=all call covers everything the Buffett Quality Score
      // needs (ROE, D/E, margins, FCF yield via P/FCF, current ratio, P/E) —
      // simpler than FMP's 4-call version. No 5Y EPS history from one call,
      // so epsHistory stays empty (CAGR row degrades to N/A, not a dead end).
      getQualityMetrics: async function (symbol) {
        var json = await finnhubRequest('https://finnhub.io/api/v1/stock/metric?symbol=' + symbol + '&metric=all&token=' + FINNHUB_API_KEY);
        var m = (json && json.metric) || {};
        if (!Object.keys(m).length) throw new Error('Finnhub: empty metrics response');
        var debtEq = m['totalDebt/totalEquityQuarterly'] ?? m['totalDebt/totalEquityAnnual'] ?? m['longTermDebt/equityQuarterly'] ?? m['longTermDebt/equityAnnual'] ?? null;
        var fcfYield = m.pfcfShareTTM ? (100 / m.pfcfShareTTM) : null;
        return {
          roe: m.roeTTM ?? m.roeRfy ?? null,
          debtEq: debtEq,
          opMargin: m.operatingMarginTTM ?? null,
          netMargin: m.netProfitMarginTTM ?? null,
          fcfYield: fcfYield,
          currentRatio: m.currentRatioQuarterly ?? m.currentRatioAnnual ?? null,
          peRatio: m.peBasicExclExtraTTM ?? m.peTTM ?? null,
          epsHistory: [],
          source: 'Finnhub',
        };
      },
      // metric=all's series.annual carries multi-year pe/pb/ps/pfcf arrays
      // (each {period, v}) — merge them by period into the same field names
      // FMP's key-metrics uses (peRatio/pbRatio/priceToSalesRatio/
      // priceToFreeCashFlowsRatio) so renderValHist needs no changes.
      getValuationHistory: async function (symbol) {
        var json = await finnhubRequest('https://finnhub.io/api/v1/stock/metric?symbol=' + symbol + '&metric=all&token=' + FINNHUB_API_KEY);
        var ann = (json && json.series && json.series.annual) || {};
        if (!ann.pe && !ann.pb && !ann.ps && !ann.pfcf) throw new Error('Finnhub: no annual valuation series');
        var byPeriod = {};
        function merge(arr, field) {
          (arr || []).forEach(function (pt) {
            if (!byPeriod[pt.period]) byPeriod[pt.period] = { date: pt.period };
            byPeriod[pt.period][field] = pt.v;
          });
        }
        merge(ann.pe, 'peRatio');
        merge(ann.pb, 'pbRatio');
        merge(ann.ps, 'priceToSalesRatio');
        merge(ann.pfcf, 'priceToFreeCashFlowsRatio');
        return Object.keys(byPeriod).map(function (k) { return byPeriod[k]; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      },
      // Finnhub free tier has no forward analyst estimates (fwd stays empty)
      // and no quarterly revenue/margin breakdown — only actual reported EPS
      // per quarter via /stock/earnings. Degraded but real: the EPS bar chart
      // still renders, revenue/margin sections show "No data" instead of crashing.
      getEarningsTrend: async function (symbol) {
        var json = await finnhubRequest('https://finnhub.io/api/v1/stock/earnings?symbol=' + symbol + '&token=' + FINNHUB_API_KEY);
        if (!Array.isArray(json) || !json.length) throw new Error('Finnhub: no earnings history');
        // Newest-first, matching FMP's raw income-statement order — the
        // caller (renderEarnTrend) always does its own .reverse() afterward.
        var hist = json
          .filter(function (r) { return r.actual != null; })
          .sort(function (a, b) { return a.period < b.period ? 1 : -1; })
          .map(function (r) { return { date: r.period, eps: r.actual, revenue: null, grossProfit: null, operatingIncome: null }; });
        return { hist: hist, fwd: [], source: 'Finnhub' };
      },
    };

    var twelveDataProvider = {
      name: 'TwelveData',
      rateLimiter: new RateLimiter(800, 24 * 60 * 60 * 1000), // 800 req/day
      isConfigured: function () { return !!TWELVE_DATA_API_KEY; },
      getQuote: async function (symbol) {
        var json = await twelveDataRequest('https://api.twelvedata.com/quote?symbol=' + symbol + '&apikey=' + TWELVE_DATA_API_KEY);
        if (json.close == null) throw new Error('Twelve Data: empty quote response');
        return normalizeQuote({ symbol: symbol, price: parseFloat(json.close), change: parseFloat(json.change), changePercent: parseFloat(json.percent_change), source: 'TwelveData' });
      },
      getHistoricalBars: async function (symbol, fromDate) {
        var json = await twelveDataRequest('https://api.twelvedata.com/time_series?symbol=' + symbol + '&interval=1day&start_date=' + fromDate + '&outputsize=5000&apikey=' + TWELVE_DATA_API_KEY);
        if (!json.values || !Array.isArray(json.values) || !json.values.length) throw new Error('Twelve Data: no historical data');
        var sorted = json.values.slice().sort(function (a, b) { return a.datetime < b.datetime ? -1 : 1; });
        return sorted.map(function (d) {
          return normalizeBar({ date: d.datetime, o: d.open, h: d.high, l: d.low, c: d.close, v: d.volume });
        });
      },
    };

    var alphaVantageProvider = {
      name: 'AlphaVantage',
      rateLimiter: new CompositeRateLimiter([new RateLimiter(5, 60 * 1000), new RateLimiter(25, 24 * 60 * 60 * 1000)]), // 5/min AND 25/day
      isConfigured: function () { return !!ALPHA_VANTAGE_API_KEY; },
      getQuote: async function (symbol) {
        var json = await alphaVantageRequest('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=' + symbol + '&apikey=' + ALPHA_VANTAGE_API_KEY);
        var q = json['Global Quote'];
        if (!q || !q['05. price']) throw new Error('Alpha Vantage: empty quote response');
        return normalizeQuote({
          symbol: symbol,
          price: parseFloat(q['05. price']),
          change: parseFloat(q['09. change']),
          changePercent: parseFloat((q['10. change percent'] || '0').replace('%', '')),
          source: 'AlphaVantage',
        });
      },
      getHistoricalBars: async function (symbol, fromDate) {
        var json = await alphaVantageRequest('https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=' + symbol + '&outputsize=full&apikey=' + ALPHA_VANTAGE_API_KEY);
        var series = json['Time Series (Daily)'];
        if (!series) throw new Error('Alpha Vantage: no historical data');
        var dates = Object.keys(series).filter(function (d) { return d >= fromDate; }).sort();
        return dates.map(function (d) {
          var row = series[d];
          return normalizeBar({ date: d, o: row['1. open'], h: row['2. high'], l: row['3. low'], c: row['4. close'], v: row['5. volume'] });
        });
      },
    };

    return [fmpProvider, finnhubProvider, twelveDataProvider, alphaVantageProvider];
  }

  // ── Orchestrator ──────────────────────────────────────────────────────────
  async function tryProvidersInOrder(providers, methodName, args) {
    var lastErr = null;
    for (var i = 0; i < providers.length; i++) {
      var provider = providers[i];
      if (typeof provider[methodName] !== 'function') continue; // provider doesn't implement this operation at all
      if (typeof provider.isConfigured === 'function' && !provider.isConfigured()) continue;
      if (provider.rateLimiter && !provider.rateLimiter.tryAcquire()) {
        _log(provider.name + ': skipped (client-side rate limit reached)');
        continue;
      }
      try {
        var result = await provider[methodName].apply(provider, args);
        if (lastErr) _log(provider.name + ': used as fallback for ' + methodName + '(' + args[0] + ') after ' + lastErr.message);
        return result;
      } catch (err) {
        if (err && err.isRateLimit) {
          _log(provider.name + ': rate-limited — ' + err.message + ' — trying next provider');
          lastErr = err;
          continue;
        }
        if (err && err.isProviderUnavailable) {
          _log(provider.name + ': unavailable for this operation — ' + err.message + ' — trying next provider');
          lastErr = err;
          continue;
        }
        // Any other error (network, timeout, malformed response): bubble up
        // immediately, no further failover attempted.
        throw err;
      }
    }
    throw lastErr || new Error('All configured providers failed or are unconfigured for ' + methodName);
  }

  function fetchQuoteWithFailover(symbol, providers) {
    return tryProvidersInOrder(providers, 'getQuote', [symbol]);
  }
  function fetchHistoricalBarsWithFailover(symbol, fromDate, providers) {
    return tryProvidersInOrder(providers, 'getHistoricalBars', [symbol, fromDate]);
  }
  // Only FMP and Finnhub implement getFundamentals (Twelve Data / Alpha Vantage
  // are price-focused) — tryProvidersInOrder skips providers missing the method.
  function fetchFundamentalsWithFailover(symbol, providers) {
    return tryProvidersInOrder(providers, 'getFundamentals', [symbol]);
  }
  function fetchQualityMetricsWithFailover(symbol, providers) {
    return tryProvidersInOrder(providers, 'getQualityMetrics', [symbol]);
  }
  function fetchValuationHistoryWithFailover(symbol, providers) {
    return tryProvidersInOrder(providers, 'getValuationHistory', [symbol]);
  }
  function fetchEarningsTrendWithFailover(symbol, providers) {
    return tryProvidersInOrder(providers, 'getEarningsTrend', [symbol]);
  }
  // Only FMP implements this (no Finnhub free-tier equivalent) — kept as a
  // failover call anyway so the call site is consistent with the other FUND
  // tabs and ready if a future provider adds ownership data.
  function fetchInstitutionalOwnershipWithFailover(symbol, providers) {
    return tryProvidersInOrder(providers, 'getInstitutionalOwnership', [symbol]);
  }

  var api = {
    RateLimiter: RateLimiter,
    CompositeRateLimiter: CompositeRateLimiter,
    normalizeBar: normalizeBar,
    normalizeQuote: normalizeQuote,
    makeProviders: makeProviders,
    tryProvidersInOrder: tryProvidersInOrder,
    fetchQuoteWithFailover: fetchQuoteWithFailover,
    fetchHistoricalBarsWithFailover: fetchHistoricalBarsWithFailover,
    fetchFundamentalsWithFailover: fetchFundamentalsWithFailover,
    fetchQualityMetricsWithFailover: fetchQualityMetricsWithFailover,
    fetchValuationHistoryWithFailover: fetchValuationHistoryWithFailover,
    fetchEarningsTrendWithFailover: fetchEarningsTrendWithFailover,
    fetchInstitutionalOwnershipWithFailover: fetchInstitutionalOwnershipWithFailover,
    setFailoverLogger: setFailoverLogger,
    setFetchImpl: setFetchImpl,
    clearHttpCache: clearHttpCache,
    fmpRequest: fmpRequest,
    finnhubRequest: finnhubRequest,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    Object.assign(global, api);
  }
})(typeof window !== 'undefined' ? window : globalThis);
