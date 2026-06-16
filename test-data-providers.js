// Lightweight test runner for data-providers.js — no framework, just Node's
// built-in `assert`. Run with: node test-data-providers.js
'use strict';
const assert = require('assert');
const {
  RateLimiter,
  makeProviders,
  fetchQuoteWithFailover,
  fetchHistoricalBarsWithFailover,
  fetchFundamentalsWithFailover,
  fetchQualityMetricsWithFailover,
  fetchValuationHistoryWithFailover,
  fetchEarningsTrendWithFailover,
  fetchInstitutionalOwnershipWithFailover,
  setFailoverLogger,
  setFetchImpl,
  clearHttpCache,
} = require('./data-providers.js');

let passed = 0, failed = 0;
const failures = [];

async function test(name, fn) {
  clearHttpCache(); // each test simulates a fresh request — no cross-test cache bleed
  try {
    await fn();
    passed++;
    console.log('  ok  ' + name);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log('  FAIL ' + name + ' — ' + err.message);
  }
}

// ── fetch mock helpers ───────────────────────────────────────────────────
function jsonResponse(status, body) {
  return Promise.resolve({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}
function textResponse(status, body) {
  return Promise.resolve({
    status,
    ok: status >= 200 && status < 300,
    json: async () => { throw new Error('not JSON'); },
    text: async () => body,
  });
}

const ALL_KEYS = {
  FMP_KEY: 'fmp-test-key',
  FINNHUB_API_KEY: 'finnhub-test-key',
  TWELVE_DATA_API_KEY: 'twelvedata-test-key',
  ALPHA_VANTAGE_API_KEY: 'alphavantage-test-key',
};

function freshProviders(keys) {
  return makeProviders(keys || ALL_KEYS);
}

async function main() {
  console.log('data-providers.js — test suite\n');

  await test('FMP succeeds → returns FMP-sourced normalized quote, no failover', async () => {
    let calls = [];
    setFetchImpl(async (url) => {
      calls.push(url);
      assert.ok(url.includes('financialmodelingprep.com'));
      return jsonResponse(200, [{ symbol: 'AAPL', price: 250.5, change: 1.2, changesPercentage: 0.48 }]);
    });
    const logs = [];
    setFailoverLogger((...a) => logs.push(a.join(' ')));

    const q = await fetchQuoteWithFailover('AAPL', freshProviders());
    assert.strictEqual(q.source, 'FMP');
    assert.strictEqual(q.price, 250.5);
    assert.strictEqual(calls.length, 1, 'should only call FMP, no failover needed');
    assert.strictEqual(logs.length, 0, 'no failover log expected on first-try success');
  });

  await test('FMP HTTP 429 → fails over to Finnhub, logs the failover', async () => {
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) {
        return jsonResponse(429, { 'Error Message': 'Limit Reach . Please upgrade your plan' });
      }
      if (url.includes('finnhub.io')) {
        return jsonResponse(200, { c: 99.9, d: 0.5, dp: 0.5 });
      }
      throw new Error('unexpected provider called: ' + url);
    });
    const logs = [];
    setFailoverLogger((...a) => logs.push(a.join(' ')));

    const q = await fetchQuoteWithFailover('TSLA', freshProviders());
    assert.strictEqual(q.source, 'Finnhub');
    assert.strictEqual(q.price, 99.9);
    assert.ok(logs.some(l => /FMP.*rate-limited/i.test(l)), 'should log FMP rate-limit');
    assert.ok(logs.some(l => /Finnhub.*used as fallback/i.test(l)), 'should log Finnhub used as fallback');
  });

  await test('FMP HTTP 402 (premium param) also triggers failover (not just 429)', async () => {
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) {
        return jsonResponse(402, { 'Error Message': "Premium Query Parameter: 'limit' must be between 0 and 5" });
      }
      return jsonResponse(200, { c: 10, d: 0, dp: 0 });
    });
    const q = await fetchQuoteWithFailover('MSFT', freshProviders());
    assert.strictEqual(q.source, 'Finnhub');
  });

  await test('FMP HTTP 402 with a PLAIN TEXT body (not JSON) still triggers failover (real bug: /stable/analyst-estimates returns plain text on this plan)', async () => {
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) {
        return textResponse(402, "Premium Query Parameter: 'Special Endpoint : This value set for 'period' is not available under your current subscription");
      }
      return jsonResponse(200, { c: 10, d: 0, dp: 0 });
    });
    const q = await fetchQuoteWithFailover('MSFT', freshProviders());
    assert.strictEqual(q.source, 'Finnhub', 'a non-JSON 402 body must still be classified as a rate-limit, not bubble as a generic parse error');
  });

  await test('FMP and Finnhub both rate-limited → falls through to Twelve Data', async () => {
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) return jsonResponse(429, { 'Error Message': 'Limit Reach' });
      if (url.includes('finnhub.io')) return jsonResponse(429, {});
      if (url.includes('twelvedata.com')) {
        return jsonResponse(200, { symbol: 'NVDA', close: '120.0', change: '1.0', percent_change: '0.8', status: 'ok' });
      }
      throw new Error('unexpected provider called: ' + url);
    });
    const q = await fetchQuoteWithFailover('NVDA', freshProviders());
    assert.strictEqual(q.source, 'TwelveData');
    assert.strictEqual(q.price, 120.0);
  });

  await test('Twelve Data quota-exhausted body (HTTP 200, status:error, code:429) is detected as rate-limit', async () => {
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) return jsonResponse(429, { 'Error Message': 'Limit Reach' });
      if (url.includes('finnhub.io')) return jsonResponse(429, {});
      if (url.includes('twelvedata.com')) {
        return jsonResponse(200, { code: 429, message: 'You have run out of API credits for the day.', status: 'error' });
      }
      if (url.includes('alphavantage.co')) {
        return jsonResponse(200, { 'Global Quote': { '05. price': '5.0', '09. change': '0.1', '10. change percent': '2.0%' } });
      }
      throw new Error('unexpected provider called: ' + url);
    });
    const q = await fetchQuoteWithFailover('GOOG', freshProviders());
    assert.strictEqual(q.source, 'AlphaVantage');
  });

  await test('Alpha Vantage "Note" rate-limit body (HTTP 200) is detected, all exhausted → throws', async () => {
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) return jsonResponse(429, { 'Error Message': 'Limit Reach' });
      if (url.includes('finnhub.io')) return jsonResponse(429, {});
      if (url.includes('twelvedata.com')) return jsonResponse(200, { code: 429, status: 'error', message: 'limit' });
      if (url.includes('alphavantage.co')) {
        return jsonResponse(200, { Note: 'Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute.' });
      }
      throw new Error('unexpected provider called: ' + url);
    });
    await assert.rejects(
      () => fetchQuoteWithFailover('IBM', freshProviders()),
      /frequency|rate.?limit|All configured providers failed/i
    );
  });

  await test('Non-rate-limit error (network failure) bubbles immediately — no failover attempted', async () => {
    let finnhubCalled = false;
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) throw new Error('network timeout');
      if (url.includes('finnhub.io')) { finnhubCalled = true; return jsonResponse(200, { c: 1 }); }
      throw new Error('unexpected provider called: ' + url);
    });
    await assert.rejects(
      () => fetchQuoteWithFailover('AMZN', freshProviders()),
      /network timeout/
    );
    assert.strictEqual(finnhubCalled, false, 'Finnhub must NOT be called for a plain network error');
  });

  await test('Non-rate-limit FMP error response (unrelated "Error Message") bubbles, no failover', async () => {
    let finnhubCalled = false;
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) return jsonResponse(200, { 'Error Message': 'Invalid API KEY.' });
      if (url.includes('finnhub.io')) { finnhubCalled = true; return jsonResponse(200, { c: 1 }); }
      throw new Error('unexpected provider called: ' + url);
    });
    await assert.rejects(() => fetchQuoteWithFailover('XYZ', freshProviders()), /Invalid API KEY/);
    assert.strictEqual(finnhubCalled, false);
  });

  await test('Provider without configured API key is skipped silently (no call attempted)', async () => {
    const calledUrls = [];
    setFetchImpl(async (url) => {
      calledUrls.push(url);
      if (url.includes('financialmodelingprep.com')) return jsonResponse(429, { 'Error Message': 'Limit Reach' });
      return jsonResponse(200, { symbol: 'X', close: '1', change: '0', percent_change: '0', status: 'ok' });
    });
    const providers = freshProviders({ FMP_KEY: 'k', FINNHUB_API_KEY: '', TWELVE_DATA_API_KEY: 'k2', ALPHA_VANTAGE_API_KEY: '' });
    const q = await fetchQuoteWithFailover('X', providers);
    assert.strictEqual(q.source, 'TwelveData');
    assert.ok(!calledUrls.some(u => u.includes('finnhub.io')), 'Finnhub has no key — must not be called');
  });

  await test('Finnhub HTTP 403 on historical bars (free-tier plan restriction) skips to Twelve Data, not a dead end', async () => {
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) return jsonResponse(429, { 'Error Message': 'Limit Reach' });
      if (url.includes('finnhub.io/api/v1/stock/candle')) return jsonResponse(403, { error: "You don't have access to this resource." });
      if (url.includes('twelvedata.com')) {
        return jsonResponse(200, { values: [{ datetime: '2024-01-02', open: '1', high: '2', low: '0.5', close: '1.5', volume: '100' }], status: 'ok' });
      }
      throw new Error('unexpected provider called: ' + url);
    });
    const logs = [];
    setFailoverLogger((...a) => logs.push(a.join(' ')));
    const bars = await fetchHistoricalBarsWithFailover('AMZN', '2024-01-01', freshProviders());
    assert.strictEqual(bars.length, 1);
    assert.ok(logs.some(l => /Finnhub.*unavailable for this operation/i.test(l)), 'should log Finnhub as unavailable, not a hard stop');
  });

  await test('Historical bars failover normalizes output identically across providers', async () => {
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) return jsonResponse(429, { 'Error Message': 'Limit Reach' });
      if (url.includes('finnhub.io/api/v1/stock/candle')) {
        return jsonResponse(200, { s: 'ok', t: [1700000000, 1700086400], o: [10, 11], h: [12, 13], l: [9, 10], c: [11, 12], v: [1000, 1100] });
      }
      throw new Error('unexpected provider called: ' + url);
    });
    const bars = await fetchHistoricalBarsWithFailover('AAPL', '2023-01-01', freshProviders());
    assert.strictEqual(bars.length, 2);
    assert.ok(bars[0].date instanceof Date);
    assert.strictEqual(typeof bars[0].c, 'number');
  });

  await test('Fundamentals: FMP rate-limited → Finnhub fills EPS/forward P/E (the reported bug)', async () => {
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) return jsonResponse(429, { 'Error Message': 'Limit Reach' });
      if (url.includes('stock/profile2')) return jsonResponse(200, { ticker: 'NVDA', marketCapitalization: 3000000, shareOutstanding: 24000, beta: 1.7, description: 'GPUs', finnhubIndustry: 'Semiconductors' });
      if (url.includes('stock/metric')) return jsonResponse(200, { metric: { peBasicExclExtraTTM: 45, epsBasicExclExtraItemsTTM: 2.8, forwardPE: 30, netProfitMarginTTM: 55 } });
      if (url.includes('stock/recommendation')) return jsonResponse(200, []);
      if (url.includes('stock/price-target')) return jsonResponse(200, {});
      throw new Error('unexpected provider called: ' + url);
    });
    const fund = await fetchFundamentalsWithFailover('NVDA', freshProviders());
    assert.strictEqual(fund._source, 'Finnhub');
    assert.strictEqual(fund.defaultKeyStatistics.trailingEps.raw, 2.8);
    assert.strictEqual(fund.defaultKeyStatistics.forwardPE.raw, 30);
    assert.ok(fund.defaultKeyStatistics.forwardEps.raw > 0, 'forward EPS should be derived from price/forwardPE');
  });

  await test('Fundamentals: one of FMP\'s 5 parallel calls rate-limited → whole fetch treated as rate-limited, fails over as a unit', async () => {
    let fmpCallCount = 0;
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) {
        fmpCallCount++;
        // Simulate only ONE of the 5 parallel FMP endpoints being rate-limited —
        // the whole getFundamentals() call must still fail over, not return partial data.
        if (url.includes('/ratios-ttm')) return jsonResponse(429, { 'Error Message': 'Limit Reach' });
        return jsonResponse(200, [{ symbol: 'AAPL' }]);
      }
      if (url.includes('stock/profile2')) return jsonResponse(200, { ticker: 'AAPL', beta: 1.2 });
      if (url.includes('stock/metric')) return jsonResponse(200, { metric: { epsBasicExclExtraItemsTTM: 6.1 } });
      if (url.includes('stock/recommendation')) return jsonResponse(200, []);
      if (url.includes('stock/price-target')) return jsonResponse(200, {});
      throw new Error('unexpected provider called: ' + url);
    });
    const fund = await fetchFundamentalsWithFailover('AAPL', freshProviders());
    assert.strictEqual(fund._source, 'Finnhub');
    assert.ok(fmpCallCount === 5, 'all 5 FMP endpoints should have been attempted before declaring rate-limit');
  });

  await test('Fundamentals: Finnhub price-target 403 (plan restriction on an OPTIONAL field) does not blank out EPS/PE', async () => {
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) return jsonResponse(429, { 'Error Message': 'Limit Reach' });
      if (url.includes('stock/profile2')) return jsonResponse(200, { ticker: 'NVDA', marketCapitalization: 3000000, shareOutstanding: 24000, beta: 1.7 });
      if (url.includes('stock/metric')) return jsonResponse(200, { metric: { peBasicExclExtraTTM: 45, epsBasicExclExtraItemsTTM: 2.8, forwardPE: 30 } });
      if (url.includes('stock/recommendation')) return jsonResponse(200, []);
      if (url.includes('stock/price-target')) return jsonResponse(403, { error: "You don't have access to this resource." });
      throw new Error('unexpected provider called: ' + url);
    });
    const fund = await fetchFundamentalsWithFailover('NVDA', freshProviders());
    assert.strictEqual(fund._source, 'Finnhub');
    assert.strictEqual(fund.defaultKeyStatistics.trailingEps.raw, 2.8, 'EPS must survive a price-target 403 — this was the actual reported bug');
    assert.strictEqual(fund.defaultKeyStatistics.forwardPE.raw, 30);
  });

  await test('Quality Metrics (Buffett score): FMP rate-limited → single Finnhub metric=all call fills ROE/D-E/margins/FCF yield', async () => {
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) return jsonResponse(429, { 'Error Message': 'Limit Reach' });
      if (url.includes('stock/metric')) {
        return jsonResponse(200, { metric: {
          roeTTM: 45.2, 'totalDebt/totalEquityQuarterly': 0.3, operatingMarginTTM: 30, netProfitMarginTTM: 22,
          pfcfShareTTM: 25, currentRatioQuarterly: 1.8, peBasicExclExtraTTM: 28,
        }});
      }
      throw new Error('unexpected provider called: ' + url);
    });
    const q = await fetchQualityMetricsWithFailover('MSFT', freshProviders());
    assert.strictEqual(q.source, 'Finnhub');
    assert.strictEqual(q.roe, 45.2);
    assert.strictEqual(q.debtEq, 0.3);
    assert.strictEqual(q.currentRatio, 1.8);
    assert.strictEqual(q.fcfYield, 4); // 100 / 25
  });

  await test('Valuation History (FUND/VALHIST): FMP rate-limited → Finnhub series.annual merges pe/pb/ps/pfcf by period', async () => {
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) return jsonResponse(429, { 'Error Message': 'Limit Reach' });
      if (url.includes('stock/metric')) {
        return jsonResponse(200, { series: { annual: {
          pe: [{ period: '2025-12-31', v: 30 }, { period: '2024-12-31', v: 28 }],
          pb: [{ period: '2025-12-31', v: 40 }, { period: '2024-12-31', v: 38 }],
          ps: [{ period: '2025-12-31', v: 8 }, { period: '2024-12-31', v: 7.5 }],
          pfcf: [{ period: '2025-12-31', v: 25 }, { period: '2024-12-31', v: 24 }],
        } } });
      }
      throw new Error('unexpected provider called: ' + url);
    });
    const rows = await fetchValuationHistoryWithFailover('AAPL', freshProviders());
    assert.strictEqual(rows.length, 2);
    assert.strictEqual(rows[0].date, '2025-12-31', 'must be sorted newest-first like FMP key-metrics');
    assert.strictEqual(rows[0].peRatio, 30);
    assert.strictEqual(rows[0].pbRatio, 40);
    assert.strictEqual(rows[0].priceToSalesRatio, 8);
    assert.strictEqual(rows[0].priceToFreeCashFlowsRatio, 25);
  });

  await test('Earnings Trend (FUND/EARNTREND): FMP rate-limited → Finnhub /stock/earnings fills actual EPS history (fwd stays empty, no forward estimates on free tier)', async () => {
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) return jsonResponse(429, { 'Error Message': 'Limit Reach' });
      if (url.includes('stock/earnings')) {
        return jsonResponse(200, [
          { period: '2026-03-31', actual: 2.01, estimate: 1.98 },
          { period: '2025-12-31', actual: 2.84, estimate: 2.73 },
        ]);
      }
      throw new Error('unexpected provider called: ' + url);
    });
    const trend = await fetchEarningsTrendWithFailover('AAPL', freshProviders());
    assert.strictEqual(trend.source, 'Finnhub');
    assert.strictEqual(trend.hist.length, 2);
    assert.strictEqual(trend.hist[0].date, '2026-03-31', 'hist must be sorted newest-first to match FMP raw shape (caller reverses itself)');
    assert.strictEqual(trend.hist[0].eps, 2.01);
    assert.deepStrictEqual(trend.fwd, []);
  });

  await test('Institutional Ownership (FUND/INSTITUTIONAL): no Finnhub equivalent on free tier → error bubbles instead of hanging', async () => {
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) return jsonResponse(429, { 'Error Message': 'Limit Reach' });
      throw new Error('unexpected provider called: ' + url);
    });
    await assert.rejects(() => fetchInstitutionalOwnershipWithFailover('AAPL', freshProviders()), /Limit Reach/);
  });

  await test('Shared HTTP cache: identical URL within TTL is served from cache, not a fresh network call', async () => {
    let callCount = 0;
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) {
        callCount++;
        return jsonResponse(200, [{ symbol: 'AAPL', price: 250.5, change: 1.2, changesPercentage: 0.48 }]);
      }
      throw new Error('unexpected provider called: ' + url);
    });
    const providers = freshProviders();
    const q1 = await fetchQuoteWithFailover('AAPL', providers);
    const q2 = await fetchQuoteWithFailover('AAPL', providers);
    assert.strictEqual(callCount, 1, 'second call for the same URL must be served from cache, not hit the network again');
    assert.strictEqual(q1.price, q2.price);
  });

  await test('Shared HTTP cache: errors are never cached — a rate-limit clears on the very next call', async () => {
    let callCount = 0;
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) {
        callCount++;
        return callCount === 1
          ? jsonResponse(429, { 'Error Message': 'Limit Reach' })
          : jsonResponse(200, [{ symbol: 'AAPL', price: 251, change: 1, changesPercentage: 0.4 }]);
      }
      throw new Error('unexpected provider called: ' + url);
    });
    const providers = freshProviders({ FMP_KEY: 'k', FINNHUB_API_KEY: '', TWELVE_DATA_API_KEY: '', ALPHA_VANTAGE_API_KEY: '' });
    await assert.rejects(() => fetchQuoteWithFailover('AAPL', providers));
    const q = await fetchQuoteWithFailover('AAPL', providers);
    assert.strictEqual(q.price, 251, 'a cached error would have wrongly blocked this second, now-successful call');
    assert.strictEqual(callCount, 2);
  });

  await test('RateLimiter blocks acquisition once max is reached within the window', () => {
    const rl = new RateLimiter(2, 1000);
    const now = 1000000;
    assert.strictEqual(rl.tryAcquire(now), true);
    assert.strictEqual(rl.tryAcquire(now + 10), true);
    assert.strictEqual(rl.tryAcquire(now + 20), false, 'third call within window should be blocked');
    assert.strictEqual(rl.tryAcquire(now + 1001), true, 'call after window expiry should succeed');
  });

  await test('Client-side rate limit on a fallback provider causes it to be skipped (not retried indefinitely)', async () => {
    setFetchImpl(async (url) => {
      if (url.includes('financialmodelingprep.com')) return jsonResponse(429, { 'Error Message': 'Limit Reach' });
      if (url.includes('twelvedata.com')) return jsonResponse(200, { symbol: 'Y', close: '1', change: '0', percent_change: '0', status: 'ok' });
      throw new Error('unexpected provider called: ' + url);
    });
    const providers = freshProviders();
    // Exhaust Finnhub's client-side limiter (60/min) before the real call.
    const finnhub = providers.find(p => p.name === 'Finnhub');
    for (let i = 0; i < 60; i++) finnhub.rateLimiter.tryAcquire();

    const logs = [];
    setFailoverLogger((...a) => logs.push(a.join(' ')));
    const q = await fetchQuoteWithFailover('Y', providers);
    assert.strictEqual(q.source, 'TwelveData');
    assert.ok(logs.some(l => /Finnhub.*skipped.*client-side rate limit/i.test(l)));
  });

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    failures.forEach(f => console.error('\n' + f.name + ':\n' + f.err.stack));
    process.exit(1);
  }
}

main();
