// WAVEFRONT — local proxy server
// Fetches Yahoo Finance data server-side (bypasses browser CORS)
// Maintains a persistent crumb session for quoteSummary (fundamentals)
// No npm install needed — uses only built-in Node modules

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT = process.env.PORT || 3456;
const DIR  = __dirname;

const FMP_KEY  = 'Rfmle5Bf82SFSfcjnaMGciY7NXIfKWak';
const FMP_BASE = 'https://financialmodelingprep.com/stable';

// ── Yahoo Finance crumb session ────────────────────────────────────────────
const UAs = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

let session = { crumb: null, cookies: [], ua: UAs[0] };
let crumbPending = null;  // promise, so concurrent calls wait for same fetch

function httpsGet(urlStr, headers, cookieJar, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: { ...headers, 'Cookie': cookieJar.join('; ') }
    };
    const req = https.get(opts, res => {
      (res.headers['set-cookie'] || []).forEach(c => {
        const kv = c.split(';')[0];
        const name = kv.split('=')[0];
        cookieJar = cookieJar.filter(x => x.split('=')[0] !== name);
        cookieJar.push(kv);
      });
      // Follow redirects
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : `https://${u.hostname}${res.headers.location}`;
        res.resume();
        return httpsGet(next, headers, cookieJar, timeoutMs).then(resolve).catch(reject);
      }
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body, cookies: cookieJar }));
    }).on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`httpsGet timeout after ${timeoutMs}ms: ${urlStr}`));
    });
  });
}

async function refreshCrumb() {
  const ua = UAs[Math.floor(Math.random() * UAs.length)];
  const baseHeaders = {
    'User-Agent': ua,
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'identity',
  };

  console.log('  [crumb] Establishing Yahoo Finance session...');

  // Step 1: Visit Yahoo Finance homepage to get GUCS cookie
  const r1 = await httpsGet('https://finance.yahoo.com/', {
    ...baseHeaders, 'Accept': 'text/html'
  }, []);
  const jar = r1.cookies;
  console.log(`  [crumb] Page visit: ${r1.status}, cookies: ${jar.length}`);

  await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000));

  // Step 2: Fetch crumb
  const r2 = await httpsGet('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    ...baseHeaders, 'Accept': '*/*', 'Referer': 'https://finance.yahoo.com/'
  }, jar);

  console.log(`  [crumb] Crumb fetch: ${r2.status}, body: ${r2.body.slice(0, 40)}`);

  if (r2.status === 200 && r2.body.length < 50 && !r2.body.startsWith('{') && !r2.body.includes('Too Many')) {
    session.crumb = r2.body.trim();
    session.cookies = r2.cookies;
    session.ua = ua;
    console.log(`  [crumb] Session ready. Crumb: ${session.crumb}`);
    return true;
  }
  return false;
}

async function ensureCrumb() {
  if (session.crumb) return true;
  if (crumbPending) return crumbPending;
  crumbPending = refreshCrumb().finally(() => { crumbPending = null; });
  return crumbPending;
}

// Retry helper for Yahoo endpoints
function yahooFetch(urlStr, extraHeaders, attempt = 0) {
  const hosts = ['query2.finance.yahoo.com', 'query1.finance.yahoo.com'];
  if (attempt >= hosts.length * 2) return Promise.reject(new Error('All retries failed'));

  const u = new URL(urlStr);
  u.hostname = hosts[attempt % hosts.length];
  const ua = UAs[attempt % UAs.length];

  const opts = {
    hostname: u.hostname,
    path: u.pathname + u.search,
    headers: {
      'User-Agent': ua,
      'Accept': 'application/json, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://finance.yahoo.com/',
      ...extraHeaders
    }
  };

  return new Promise((resolve, reject) => {
    const delay = attempt > 0 ? 800 * attempt : 0;
    setTimeout(() => {
      https.get(opts, res => {
        if (res.statusCode === 429 || res.statusCode === 503) {
          res.resume();
          console.log(`  [yahoo] ${res.statusCode} from ${u.hostname}, retry ${attempt + 1}...`);
          return yahooFetch(urlStr, extraHeaders, attempt + 1).then(resolve).catch(reject);
        }
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          console.log(`  [yahoo] ${res.statusCode} from ${u.hostname} (${body.length}b)`);
          resolve({ status: res.statusCode, body });
        });
      }).on('error', e => {
        if (attempt < hosts.length * 2 - 1) return yahooFetch(urlStr, extraHeaders, attempt + 1).then(resolve).catch(reject);
        reject(e);
      });
    }, delay);
  });
}

// ── MarketData.app fallback (free, no API key) ────────────────────────────
// https://api.marketdata.app — returns t/o/h/l/c/v arrays, up to 5y history
async function fetchChartMarketData(symbol, rangeYears) {
  const now   = new Date();
  const from  = new Date(now.getTime() - rangeYears * 365.25 * 86400000);
  const fmtDate = d => d.toISOString().slice(0, 10); // YYYY-MM-DD

  // MarketData uses plain ticker for stocks, but different notation for ETFs/indices
  // Most US tickers work as-is; indices like ^GSPC become GSPC
  let sym = symbol;
  if (sym.startsWith('^')) sym = sym.slice(1);

  const mdUrl = `https://api.marketdata.app/v1/stocks/candles/D/${encodeURIComponent(sym)}/?from=${fmtDate(from)}&to=${fmtDate(now)}&adjust=splits`;
  console.log(`  [marketdata] Fetching ${sym}: ${mdUrl}`);

  const r = await httpsGet(mdUrl, {
    'User-Agent': 'Mozilla/5.0 (compatible)',
    'Accept':     'application/json',
  }, []);

  if (r.status !== 200) throw new Error(`MarketData.app HTTP ${r.status}`);
  const j = JSON.parse(r.body);
  if (j.s !== 'ok' || !j.t?.length) throw new Error(`MarketData.app: ${j.errmsg || 'no data'}`);

  const lastClose = j.c[j.c.length - 1];

  // Return Yahoo v8-compatible format
  return JSON.stringify({
    chart: {
      result: [{
        meta: {
          symbol, currency: 'USD', exchangeName: 'MarketData',
          regularMarketPrice: lastClose,
          chartPreviousClose: j.c[j.c.length - 2] || lastClose,
          dataSource: 'marketdata',
        },
        timestamp: j.t,
        indicators: {
          quote: [{ open: j.o, high: j.h, low: j.l, close: j.c, volume: j.v }],
          adjclose: [{ adjclose: j.c }],
        },
      }],
      error: null,
    },
  });
}

// ── NASDAQ API fallback for fundamentals (free, no API key) ───────────────
async function fetchFundamentalsNasdaq(symbol) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nasdaq.com/',
    'Origin': 'https://www.nasdaq.com',
  };

  // Fetch info + summary in parallel
  const [r1, r2] = await Promise.all([
    httpsGet(`https://api.nasdaq.com/api/quote/${symbol}/info?assetclass=stocks`,    headers, []).catch(() => ({ body: '{}' })),
    httpsGet(`https://api.nasdaq.com/api/quote/${symbol}/summary?assetclass=stocks`, headers, []).catch(() => ({ body: '{}' })),
  ]);

  let info = {}, summ = {};
  try { info = JSON.parse(r1.body)?.data || {}; } catch(e) {}
  try { summ = JSON.parse(r2.body)?.data?.summaryData || {}; } catch(e) {}

  // Helper: strip currency/comma formatting and parse to float
  function pn(s) {
    if (!s || s === 'N/A' || s === '--' || s === '') return null;
    const clean = String(s).replace(/[$,%\s]/g, '').replace(/,/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  }

  const price   = pn(info.primaryData?.lastSalePrice);
  const prevCl  = pn(summ?.PreviousClose?.value);
  const mktCap  = pn(summ?.MarketCap?.value);
  const tgtMean = pn(summ?.OneYrTarget?.value);
  const divYield= pn(summ?.Yield?.value);        // "0.38" as percent
  const avgVol  = pn(summ?.AverageVolume?.value);

  // 52-week from summary: "288.62/193.25" (high/low separated by /)
  const wkStr   = summ?.FiftTwoWeekHighLow?.value || '';
  const wkParts = wkStr.split('/');
  const high52  = wkParts[0] ? pn(wkParts[0].trim()) : null;
  const low52   = wkParts[1] ? pn(wkParts[1].trim()) : null;
  // Also from keyStats "193.25 - 288.62"
  const ksRange = info.keyStats?.fiftyTwoWeekHighLow?.value || '';
  const [ksLo, ksHi] = ksRange.split(' - ').map(s => pn(s));

  const sector   = summ?.Sector?.value   || null;
  const industry = summ?.Industry?.value || null;

  const wrap = v => (v == null ? undefined : { raw: v });

  return JSON.stringify({
    quoteSummary: {
      result: [{
        financialData: {
          currentPrice:    wrap(price),
          targetMeanPrice: wrap(tgtMean),
          recommendationKey: null,
          numberOfAnalystOpinions: null,
        },
        defaultKeyStatistics: {
          marketCap:     wrap(mktCap),
          trailingPE:    null,
          forwardPE:     null,
          trailingEps:   null,
          forwardEps:    null,
          beta:          null,
          dividendYield: wrap(divYield != null ? divYield / 100 : null),
        },
        summaryDetail: {
          previousClose:    wrap(prevCl),
          averageVolume:    wrap(avgVol),
          fiftyTwoWeekHigh: wrap(high52 ?? ksHi ?? null),
          fiftyTwoWeekLow:  wrap(low52  ?? ksLo ?? null),
          dividendYield:    wrap(divYield != null ? divYield / 100 : null),
        },
        assetProfile: {
          sector:   sector   || undefined,
          industry: industry || undefined,
        },
        _source: 'nasdaq',
      }],
      error: null,
    },
  });
}

// ── FMP helpers ───────────────────────────────────────────────────────────

async function fmpGet(endpoint, params = {}) {
  const qs = new URLSearchParams({ ...params, apikey: FMP_KEY }).toString();
  const u = `${FMP_BASE}/${endpoint}?${qs}`;
  const r = await httpsGet(u, { 'Accept': 'application/json' }, []);
  if (r.status !== 200) throw new Error(`FMP HTTP ${r.status} for /${endpoint}`);
  const j = JSON.parse(r.body);
  if (j?.['Error Message']) throw new Error(`FMP: ${j['Error Message'].slice(0, 80)}`);
  return j;
}

// Returns Yahoo v8 chart-compatible JSON string
async function fetchFmpChart(symbol, rangeYears) {
  const now  = new Date();
  const from = new Date(now.getTime() - rangeYears * 365.25 * 86400000);
  const fmt  = d => d.toISOString().slice(0, 10);

  let sym = symbol;
  if (sym.startsWith('^')) sym = sym.slice(1);

  // stable endpoint returns newest-first array
  const rows = await fmpGet('historical-price-eod/full', { symbol: sym, from: fmt(from), to: fmt(now) });
  if (!Array.isArray(rows) || !rows.length) throw new Error('FMP chart: no historical data');

  const sorted = [...rows].reverse(); // oldest-first
  const timestamps = sorted.map(r => Math.floor(new Date(r.date).getTime() / 1000));
  const closes     = sorted.map(r => r.close);
  const opens      = sorted.map(r => r.open   ?? r.close);
  const highs      = sorted.map(r => r.high   ?? r.close);
  const lows       = sorted.map(r => r.low    ?? r.close);
  const volumes    = sorted.map(r => r.volume ?? 0);

  return JSON.stringify({
    chart: {
      result: [{
        meta: {
          symbol, currency: 'USD', exchangeName: 'FMP',
          regularMarketPrice: closes[closes.length - 1],
          chartPreviousClose: closes[closes.length - 2] || closes[closes.length - 1],
          dataSource: 'fmp',
        },
        timestamp: timestamps,
        indicators: {
          quote: [{ open: opens, high: highs, low: lows, close: closes, volume: volumes }],
          adjclose: [{ adjclose: closes }],
        },
      }],
      error: null,
    },
  });
}

// Returns Yahoo quoteSummary-compatible JSON string
async function fetchFmpFundamentals(symbol) {
  const [profile, ratios, metrics, income, priceTarget, estimates] = await Promise.all([
    fmpGet('profile',                  { symbol }).catch(() => []),
    fmpGet('ratios',                   { symbol, limit: 1 }).catch(() => []),
    fmpGet('key-metrics',              { symbol, limit: 1 }).catch(() => []),
    fmpGet('income-statement',         { symbol, limit: 4 }).catch(() => []),
    fmpGet('price-target-consensus',   { symbol }).catch(() => []),
    fmpGet('analyst-estimates',        { symbol, limit: 4, period: 'annual' }).catch(() => []),
  ]);

  const p  = Array.isArray(profile) ? profile[0] : profile;
  const ra = Array.isArray(ratios)  ? ratios[0]  : ratios;
  const m  = Array.isArray(metrics) ? metrics[0] : metrics;
  const i0 = Array.isArray(income)  ? income[0]  : income;
  const i1 = Array.isArray(income)  ? income[1]  : null;
  const pt = Array.isArray(priceTarget) ? priceTarget[0] : priceTarget;

  if (!p?.symbol) throw new Error('FMP fundamentals: no profile data');

  const wrap = v => (v == null || (typeof v === 'number' && isNaN(v)) ? undefined : { raw: v });

  // Forward EPS: nearest future estimate
  const today = Date.now();
  const futureEst = Array.isArray(estimates)
    ? estimates.filter(e => new Date(e.date).getTime() > today).sort((a,b) => new Date(a.date) - new Date(b.date))
    : [];
  const fwdEps = futureEst[0]?.epsAvg ?? null;
  const fwdPe  = fwdEps && p.price ? p.price / fwdEps : null;

  // YoY growth (current vs prior period)
  const revGrowth  = (i0?.revenue  && i1?.revenue  && i1.revenue  !== 0) ? (i0.revenue  - i1.revenue)  / Math.abs(i1.revenue)  : null;
  const earnGrowth = (i0?.netIncome && i1?.netIncome && i1.netIncome !== 0) ? (i0.netIncome - i1.netIncome) / Math.abs(i1.netIncome) : null;

  // 52-week range "193.25-288.62"
  const rangeParts = (p.range || '').split('-').map(s => parseFloat(s.trim()));

  const isArr = Array.isArray(income) ? income : [];
  const isHistory = isArr.map(s => ({
    endDate:             { raw: Math.floor(new Date(s.date).getTime() / 1000), fmt: s.date },
    totalRevenue:        wrap(s.revenue),
    netIncome:           wrap(s.netIncome),
    grossProfit:         wrap(s.grossProfit),
    ebit:                wrap(s.operatingIncome),
    researchDevelopment: wrap(s.researchAndDevelopmentExpenses),
  }));

  return JSON.stringify({
    quoteSummary: {
      result: [{
        financialData: {
          currentPrice:      wrap(p.price),
          targetMeanPrice:   wrap(pt?.targetConsensus ?? null),
          targetHighPrice:   wrap(pt?.targetHigh      ?? null),
          targetLowPrice:    wrap(pt?.targetLow       ?? null),
          recommendationKey: null,
          totalRevenue:      wrap(i0?.revenue),
          grossProfits:      wrap(i0?.grossProfit),
          ebitda:            wrap(i0?.ebitda),
          revenueGrowth:     wrap(revGrowth),
          earningsGrowth:    wrap(earnGrowth),
          grossMargins:      wrap(ra?.grossProfitMargin      ?? null),
          operatingMargins:  wrap(ra?.operatingProfitMargin  ?? null),
          profitMargins:     wrap(ra?.netProfitMargin        ?? null),
          returnOnAssets:    wrap(m?.returnOnAssets          ?? null),
          returnOnEquity:    wrap(m?.returnOnEquity          ?? null),
          debtToEquity:      wrap(ra?.debtToEquityRatio      ?? null),
          operatingCashflow: wrap(null),
        },
        defaultKeyStatistics: {
          marketCap:       wrap(p.marketCap),
          trailingPE:      wrap(ra?.priceToEarningsRatio ?? null),
          forwardPE:       wrap(fwdPe),
          priceToBook:     wrap(ra?.priceToBookRatio     ?? null),
          trailingEps:     wrap(ra?.netIncomePerShare    ?? (i0?.eps ?? null)),
          forwardEps:      wrap(fwdEps),
          beta:            wrap(p.beta),
          dividendYield:   wrap(ra?.dividendYield        ?? null),
          payoutRatio:     wrap(ra?.dividendPayoutRatio  ?? null),
          enterpriseValue: wrap(m?.enterpriseValue       ?? null),
          priceToSales:    wrap(ra?.priceToSalesRatio    ?? null),
          evToEbitda:      wrap(m?.evToEBITDA            ?? null),
        },
        summaryDetail: {
          previousClose:    wrap(p.previousClose ?? (p.price - (p.change ?? 0))),
          averageVolume:    wrap(p.averageVolume),
          fiftyTwoWeekHigh: wrap(rangeParts[1] || null),
          fiftyTwoWeekLow:  wrap(rangeParts[0] || null),
          dividendYield:    wrap(ra?.dividendYield ?? null),
          currency:         p.currency || 'USD',
        },
        assetProfile: {
          sector:              p.sector      || undefined,
          industry:            p.industry    || undefined,
          website:             p.website     || undefined,
          longBusinessSummary: p.description || undefined,
          fullTimeEmployees:   p.fullTimeEmployees || undefined,
          country:             p.country     || undefined,
        },
        incomeStatementHistory: { incomeStatementHistory: isHistory },
        calendarEvents: (() => {
          // Estimate next earnings ~90 days after last reported quarter
          const lastDate = Array.isArray(income) && income[0]?.date ? new Date(income[0].date) : null;
          if (!lastDate) return undefined;
          const nextEarn = new Date(lastDate);
          nextEarn.setDate(nextEarn.getDate() + 90);
          // Only include if it's in the future
          if (nextEarn <= new Date()) nextEarn.setDate(nextEarn.getDate() + 90);
          if (nextEarn <= new Date()) return undefined;
          const fmt = nextEarn.toISOString().slice(0, 10);
          return { earnings: { earningsDate: [{ raw: Math.floor(nextEarn.getTime()/1000), fmt }] } };
        })(),
        _source: 'fmp',
      }],
      error: null,
    },
  });
}

// Returns { news: [...] } JSON string
async function fetchFmpNews(symbol) {
  const data = await fmpGet('news/stock', { symbols: symbol, limit: 20 });
  if (!Array.isArray(data) || !data.length) throw new Error('FMP news: no items');
  const items = data.map(n => ({
    title:               n.title,
    link:                n.url,
    publisher:           n.publisher || n.site,
    providerPublishTime: n.publishedDate ? Math.floor(new Date(n.publishedDate).getTime() / 1000) : null,
    thumbnail:           n.image ? { resolutions: [{ url: n.image }] } : undefined,
  }));
  return JSON.stringify({ news: items });
}

// ── HTTP server ────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsed.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── /api/chart/:symbol ────────────────────────────────────────────────────
  if (pathname.startsWith('/api/chart/')) {
    const symbol = pathname.split('/')[3]?.toUpperCase();
    const range    = parsed.searchParams.get('range')    || '5y';
    const interval = parsed.searchParams.get('interval') || '1d';

    if (!symbol || !/^[A-Z0-9.\-^=]{1,12}$/.test(symbol)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid symbol' })); return;
    }

    const rangeYears = { '1W': 0.02, '1M': 0.084, '3M': 0.25, '6M': 0.5, '1Y': 1, '2Y': 2, '5Y': 5 }[range] || 5;

    try {
      // 1. FMP (primary)
      try {
        const body = await fetchFmpChart(symbol, rangeYears);
        console.log(`  [chart] FMP OK for ${symbol}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(body); return;
      } catch(e) {
        console.log(`  [chart] FMP failed: ${e.message}`);
      }

      // 2. Yahoo Finance
      const chartUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}&events=div%2Csplits`;
      const r = await yahooFetch(chartUrl, {});
      let yahooOk = r.status === 200;
      if (yahooOk) {
        try { if (!JSON.parse(r.body)?.chart?.result?.[0]?.timestamp?.length) yahooOk = false; }
        catch(e) { yahooOk = false; }
      }
      if (yahooOk) {
        console.log(`  [chart] Yahoo OK for ${symbol}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(r.body); return;
      }

      // 3. MarketData fallback
      console.log(`  [chart] Yahoo failed (${r.status}), trying MarketData...`);
      const mdBody = await fetchChartMarketData(symbol, rangeYears);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(mdBody);
    } catch (e) {
      try {
        const mdBody = await fetchChartMarketData(symbol, rangeYears);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(mdBody);
      } catch (e2) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `FMP/Yahoo: ${e.message} | MarketData: ${e2.message}` }));
      }
    }
    return;
  }

  // ── /api/fundamentals/:symbol ─────────────────────────────────────────────
  if (pathname.startsWith('/api/fundamentals/')) {
    const symbol = pathname.split('/')[3]?.toUpperCase();
    if (!symbol || !/^[A-Z0-9.\-^=]{1,12}$/.test(symbol)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid symbol' })); return;
    }

    const modules = [
      'financialData', 'defaultKeyStatistics', 'earningsTrends',
      'incomeStatementHistory', 'earningsHistory', 'balanceSheetHistory',
      'cashflowStatementHistory', 'calendarEvents', 'summaryDetail',
    ].join(',');

    // Helper: try Yahoo quoteSummary (needs crumb)
    async function tryYahooFundamentals() {
      const ok = await ensureCrumb();
      if (!ok || !session.crumb) throw new Error('Could not establish Yahoo Finance session');

      const fundUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${encodeURIComponent(modules)}&crumb=${encodeURIComponent(session.crumb)}`;
      const r = await httpsGet(fundUrl, {
        'User-Agent': session.ua, 'Accept': 'application/json',
        'Referer': 'https://finance.yahoo.com/', 'Cookie': session.cookies.join('; ')
      }, []);

      // Crumb expired → refresh once
      if (r.status === 401 || (r.status === 200 && r.body.includes('Invalid Crumb'))) {
        console.log('  [crumb] Expired, refreshing...');
        session.crumb = null;
        const ok2 = await refreshCrumb();
        if (!ok2) throw new Error('Could not refresh crumb');
        const fundUrl2 = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${encodeURIComponent(modules)}&crumb=${encodeURIComponent(session.crumb)}`;
        const r2 = await httpsGet(fundUrl2, {
          'User-Agent': session.ua, 'Accept': 'application/json',
          'Referer': 'https://finance.yahoo.com/', 'Cookie': session.cookies.join('; ')
        }, []);
        return r2;
      }
      return r;
    }

    // Helper: try Yahoo v11 (sometimes works without crumb)
    async function tryYahooV11() {
      const v11Url = `https://query2.finance.yahoo.com/v11/finance/quoteSummary/${symbol}?modules=${encodeURIComponent(modules)}`;
      const r = await yahooFetch(v11Url, { 'Accept': 'application/json' });
      if (r.status !== 200) throw new Error(`Yahoo v11 HTTP ${r.status}`);
      const j = JSON.parse(r.body);
      if (j?.quoteSummary?.result?.[0]) return r;
      throw new Error('Yahoo v11 returned no data');
    }

    try {
      let finalBody = null;

      // 1. FMP (primary)
      try {
        finalBody = await fetchFmpFundamentals(symbol);
        console.log(`  [fundamentals] FMP OK for ${symbol}`);
      } catch(e) {
        console.log(`  [fundamentals] FMP failed: ${e.message}`);
      }

      // 2. Try Yahoo v10 with crumb
      try {
        const r = await tryYahooFundamentals();
        const j = JSON.parse(r.body);
        if (r.status === 200 && j?.quoteSummary?.result?.[0]) {
          console.log(`  [fundamentals] Yahoo v10 OK for ${symbol}`);
          finalBody = r.body;
        }
      } catch(e) {
        console.log(`  [fundamentals] Yahoo v10 failed: ${e.message}`);
      }

      // 2. Try Yahoo v11 (crumb-free variant)
      if (!finalBody) {
        try {
          const r = await tryYahooV11();
          console.log(`  [fundamentals] Yahoo v11 OK for ${symbol}`);
          finalBody = r.body;
        } catch(e) {
          console.log(`  [fundamentals] Yahoo v11 failed: ${e.message}`);
        }
      }

      // 3. Fallback: NASDAQ API (free, no key)
      if (!finalBody) {
        console.log(`  [fundamentals] Trying NASDAQ API fallback for ${symbol}...`);
        try {
          finalBody = await fetchFundamentalsNasdaq(symbol);
          console.log(`  [fundamentals] NASDAQ fallback OK for ${symbol}`);
        } catch(e) {
          console.log(`  [fundamentals] NASDAQ fallback failed: ${e.message}`);
          throw new Error(`All sources failed for ${symbol} fundamentals`);
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(finalBody);
    } catch (e) {
      console.error('  [fundamentals] All sources failed:', e.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ── /api/news/:symbol ─────────────────────────────────────────────────────
  // Uses Yahoo Finance RSS feed (much less rate-limited than JSON API, no crumb)
  if (pathname.startsWith('/api/news/')) {
    const symbol = pathname.split('/')[3]?.toUpperCase();
    if (!symbol || !/^[A-Z0-9.\-^=]{1,12}$/.test(symbol)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid symbol' })); return;
    }

    function parseRssItems(body, defaultPublisher) {
      const items = [];
      const rawItems = body.match(/<item>([\s\S]*?)<\/item>/g) || [];
      for (const item of rawItems) {
        const title   = (item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)  || item.match(/<title>([\s\S]*?)<\/title>/))?.[1]?.trim()  || '';
        const link    = (item.match(/<link>([\s\S]*?)<\/link>/))?.[1]?.trim()       || '';
        const pubDate = (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/))?.[1]?.trim() || '';
        const source  = (item.match(/<source[^>]*>([\s\S]*?)<\/source>/))?.[1]?.trim()
                     || (item.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/))?.[1]?.trim()
                     || defaultPublisher;
        const published = pubDate ? Math.floor(new Date(pubDate).getTime() / 1000) : null;
        if (title) items.push({ title, link, publisher: source, providerPublishTime: published });
      }
      return items;
    }

    try {
      let items = [];

      // 1. FMP news (primary)
      try {
        const body = await fetchFmpNews(symbol);
        const j = JSON.parse(body);
        if (j.news?.length) {
          console.log(`  [news] FMP: ${j.news.length} items for ${symbol}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(body); return;
        }
      } catch(e) {
        console.log(`  [news] FMP failed: ${e.message}`);
      }

      // 2. Yahoo Finance RSS
      try {
        const rssUrl = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(symbol)}&region=US&lang=en-US`;
        const r = await yahooFetch(rssUrl, { 'Accept': 'application/rss+xml,text/xml,*/*' });
        items = parseRssItems(r.body, 'Yahoo Finance');
        if (items.length) console.log(`  [news] Yahoo RSS: ${items.length} items for ${symbol}`);
      } catch(e) {
        console.log(`  [news] Yahoo RSS failed: ${e.message}`);
      }

      // 2. Yahoo Finance JSON search API
      if (!items.length) {
        try {
          console.log(`  [news] Trying Yahoo search API for ${symbol}...`);
          const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&newsCount=10&enableFuzzyQuery=false&enableCb=false&quotesCount=0`;
          const r2 = await yahooFetch(searchUrl, { 'Accept': 'application/json' });
          const j = JSON.parse(r2.body);
          if (j?.news?.length) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(r2.body);
            return;
          }
        } catch(e) {
          console.log(`  [news] Yahoo search failed: ${e.message}`);
        }
      }

      // 3. Google News RSS (free, no API key, very reliable)
      if (!items.length) {
        try {
          console.log(`  [news] Trying Google News RSS for ${symbol}...`);
          const query = encodeURIComponent(`${symbol} stock`);
          const googleRss = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
          const rg = await httpsGet(googleRss, {
            'User-Agent': 'Mozilla/5.0 (compatible; Feedfetcher-Google)',
            'Accept': 'application/rss+xml,text/xml,*/*',
          }, []);
          items = parseRssItems(rg.body, 'Google News');
          if (items.length) console.log(`  [news] Google News RSS: ${items.length} items for ${symbol}`);
        } catch(e) {
          console.log(`  [news] Google News failed: ${e.message}`);
        }
      }

      // 4. Bing News RSS (another free fallback)
      if (!items.length) {
        try {
          console.log(`  [news] Trying Bing News for ${symbol}...`);
          const query = encodeURIComponent(`${symbol} stock`);
          const bingRss = `https://www.bing.com/news/search?q=${query}&format=RSS`;
          const rb = await httpsGet(bingRss, {
            'User-Agent': 'Mozilla/5.0 (compatible)',
            'Accept': 'application/rss+xml,text/xml,*/*',
          }, []);
          items = parseRssItems(rb.body, 'Bing News');
          if (items.length) console.log(`  [news] Bing News: ${items.length} items for ${symbol}`);
        } catch(e) {
          console.log(`  [news] Bing News failed: ${e.message}`);
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ news: items }));
    } catch (e) {
      console.error('  [news] All sources failed:', e.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ── /api/edgar/:symbol ────────────────────────────────────────────────────
  // SEC EDGAR — no API key, no daily limit, official US government filings data
  // Returns recent 10-K/10-Q filing summaries and key XBRL facts
  if (pathname.startsWith('/api/edgar/')) {
    const symbol = pathname.split('/')[3]?.toUpperCase();
    if (!symbol || !/^[A-Z0-9.\-^=]{1,12}$/.test(symbol)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid symbol' })); return;
    }

    try {
      // Step 1: get CIK from SEC ticker mapping (cached in memory by server)
      if (!global.secTickers) {
        console.log('  [edgar] Loading SEC ticker map...');
        const r = await httpsGet('https://www.sec.gov/files/company_tickers.json', {
          'User-Agent': 'WavefrontApp/1.0 (contact@example.com)',
          'Accept': 'application/json',
        }, []);
        global.secTickers = JSON.parse(r.body);
      }

      // Find CIK for ticker
      const entry = Object.values(global.secTickers).find(e => e.ticker === symbol);
      if (!entry) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `No SEC filing found for ${symbol}` })); return;
      }

      const cik = String(entry.cik_str).padStart(10, '0');

      // Step 2: get recent filings (submissions)
      const subUrl = `https://data.sec.gov/submissions/CIK${cik}.json`;
      const r2 = await httpsGet(subUrl, {
        'User-Agent': 'WavefrontApp/1.0 (contact@example.com)',
        'Accept': 'application/json',
      }, []);
      const sub = JSON.parse(r2.body);

      // Extract recent 10-K and 10-Q filings
      const filings = sub.filings?.recent || {};
      const forms  = filings.form        || [];
      const dates  = filings.filingDate  || [];
      const accNos = filings.accessionNumber || [];
      const descs  = filings.primaryDocument || [];

      const relevant = [];
      for (let i = 0; i < forms.length && relevant.length < 6; i++) {
        if (forms[i] === '10-K' || forms[i] === '10-Q' || forms[i] === '8-K') {
          relevant.push({
            form: forms[i],
            date: dates[i],
            accessionNumber: accNos[i],
            url: `https://www.sec.gov/Archives/edgar/full-index/${dates[i]?.slice(0,4)}/${dates[i]?.slice(5,7)}/`,
          });
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        symbol,
        cik: entry.cik_str,
        name: sub.name || entry.title || symbol,
        sic: sub.sic,
        sicDescription: sub.sicDescription,
        recentFilings: relevant,
        edgarUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${entry.cik_str}&type=10-K&dateb=&owner=include&count=5`,
      }));
    } catch (e) {
      console.error('  [edgar] Error:', e.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ── /api/vix ─────────────────────────────────────────────────────────────
  if (pathname === '/api/vix') {
    try {
      const data = await fmpGet('quote', { symbol: '^VIX' });
      const q = Array.isArray(data) ? data[0] : data;
      if (!q?.price) throw new Error('No VIX data');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        price:         q.price,
        change:        q.change,
        changePercent: q.changePercentage,
        dayHigh:       q.dayHigh,
        dayLow:        q.dayLow,
        yearHigh:      q.yearHigh,
        yearLow:       q.yearLow,
      }));
    } catch(e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ── /api/quote/:symbol ───────────────────────────────────────────────────
  // Live real-time quote (price, change, volume) — used for alert polling
  if (pathname.startsWith('/api/quote/')) {
    const symbol = decodeURIComponent(pathname.split('/')[3] || '').toUpperCase();
    if (!symbol || !/^[A-Z0-9.\-^=]{1,12}$/.test(symbol)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid symbol' })); return;
    }
    try {
      const data = await fmpGet('quote', { symbol });
      const q = Array.isArray(data) ? data[0] : data;
      if (!q?.price) throw new Error('No quote data');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        symbol,
        price:         q.price,
        change:        q.change,
        changePercent: q.changePercentage,
        volume:        q.volume,
        dayHigh:       q.dayHigh,
        dayLow:        q.dayLow,
        timestamp:     q.timestamp,
      }));
    } catch(e) {
      console.error(`  [quote] ${symbol}: ${e.message}`);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ── /api/insider/:symbol ─────────────────────────────────────────────────
  if (pathname.startsWith('/api/insider/')) {
    const symbol = decodeURIComponent(pathname.split('/')[3] || '').toUpperCase();
    if (!symbol || !/^[A-Z0-9.\-]{1,12}$/.test(symbol)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid symbol' })); return;
    }
    try {
      const data = await fmpGet('insider-trading/search', { symbol, limit: 20 });
      const rows = (Array.isArray(data) ? data : []).map(r => ({
        name:            r.reportingName || r.reportingCik,
        title:           r.typeOfOwner   || '',
        type:            r.transactionType,
        shares:          r.securitiesTransacted,
        price:           r.price,
        value:           r.securitiesTransacted && r.price ? r.securitiesTransacted * r.price : null,
        date:            r.transactionDate || r.filingDate,
        isBuy:           (r.transactionType || '').toUpperCase().includes('P-PURCHASE') ||
                         (r.transactionType || '').toUpperCase().includes('A-AWARD'),
      }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ symbol, transactions: rows }));
    } catch(e) {
      console.error(`  [insider] ${symbol}: ${e.message}`);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ── /api/earnings/:symbol ────────────────────────────────────────────────
  if (pathname.startsWith('/api/earnings/')) {
    const symbol = decodeURIComponent(pathname.split('/')[3] || '').toUpperCase();
    if (!symbol || !/^[A-Z0-9.\-]{1,12}$/.test(symbol)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid symbol' })); return;
    }
    try {
      const [surprises, hist] = await Promise.all([
        fmpGet('earnings', { symbol, limit: 5 }).catch(() => []),
        fmpGet('historical-price-eod/full', { symbol, limit: 5 }).catch(() => []),
      ]);
      // Build a date→close lookup from recent history for day-after reaction
      const priceLookup = {};
      if (Array.isArray(hist)) hist.forEach(r => { priceLookup[r.date] = r.close || r.adjClose; });

      const rows = (Array.isArray(surprises) ? surprises : []).map(r => {
        const epsSurprisePct = r.epsEstimated
          ? (r.epsActual - r.epsEstimated) / Math.abs(r.epsEstimated) * 100 : null;
        const revSurprisePct = r.revenueEstimated
          ? (r.revenueActual - r.revenueEstimated) / Math.abs(r.revenueEstimated) * 100 : null;
        return {
          date:             r.date,
          epsActual:        r.epsActual,
          epsEstimated:     r.epsEstimated,
          epsSurprisePct,
          revenueActual:    r.revenueActual,
          revenueEstimated: r.revenueEstimated,
          revSurprisePct,
        };
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ symbol, earnings: rows }));
    } catch(e) {
      console.error(`  [earnings] ${symbol}: ${e.message}`);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ── /api/econ-calendar ───────────────────────────────────────────────────
  if (pathname === '/api/econ-calendar') {
    try {
      const from = new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10);
      const to   = new Date(Date.now() + 200 * 864e5).toISOString().slice(0, 10);
      const data = await fmpGet('economic-calendar', { from, to });
      const KEY_TERMS = [
        'federal open market', 'fomc', 'fed funds', 'interest rate decision',
        'consumer price index', 'cpi',
        'nonfarm payroll', 'non-farm payroll', 'nfp',
        'personal consumption expenditure', 'pce',
        'gdp', 'gross domestic product',
        'unemployment rate',
      ];
      const events = (Array.isArray(data) ? data : [])
        .filter(e => {
          const name = (e.event || '').toLowerCase();
          return KEY_TERMS.some(k => name.includes(k));
        })
        .map(e => ({
          date:    e.date,
          event:   e.event,
          country: e.country,
          actual:  e.actual,
          forecast:e.estimate,
          prev:    e.previous,
          impact:  e.impact,        // 'High' | 'Medium' | 'Low'
        }))
        .sort((a, b) => a.date > b.date ? 1 : -1);
      const json = JSON.stringify({ events });
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=21600' });
      res.end(json);
    } catch (e) {
      console.error('[econ-calendar]', e.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ── /api/claude (AI commentary via Anthropic) ─────────────────────────────
  if (pathname === '/api/claude' && req.method === 'POST') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ commentary: null, error: 'No API key' }));
      return;
    }
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      let prompt;
      try { prompt = JSON.parse(body).prompt || ''; } catch(e) { prompt = ''; }
      const payload = JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      });
      const opts = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      };
      const areq = https.request(opts, ares => {
        let rbody = '';
        ares.on('data', d => rbody += d);
        ares.on('end', () => {
          try {
            const parsed = JSON.parse(rbody);
            const text = parsed?.content?.[0]?.text || '';
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ commentary: text }));
          } catch(e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Parse error' }));
          }
        });
      });
      areq.on('error', e => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      });
      areq.write(payload);
      areq.end();
    });
    return;
  }

  // ── Static files ──────────────────────────────────────────────────────────
  let filePath;
  if (pathname === '/' || pathname === '/index.html') {
    filePath = path.join(DIR, 'wavefront-app.html');
  } else {
    filePath = path.join(DIR, pathname.replace(/^\//, ''));
  }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' }[ext] || 'text/plain';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', async () => {
  const addr = `http://localhost:${PORT}`;
  console.log(`\n  ╔══════════════════════════════════════╗`);
  console.log(`  ║   WAVEFRONT  Elliott Wave Terminal   ║`);
  console.log(`  ╠══════════════════════════════════════╣`);
  console.log(`  ║   Running at ${addr}     ║`);
  console.log(`  ║   Press Ctrl+C to stop               ║`);
  console.log(`  ╚══════════════════════════════════════╝\n`);

  // Pre-warm the crumb session in background (don't block server start)
  setTimeout(() => refreshCrumb().catch(e => console.log('  [crumb] Pre-warm failed:', e.message)), 3000);

  require('child_process').exec(`open "${addr}"`);
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is already in use. Open http://localhost:${PORT} directly.\n`);
  } else console.error('Server error:', e);
  process.exit(1);
});
