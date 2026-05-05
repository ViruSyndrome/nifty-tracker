// =============================================
// GetNiftyReady — script.js
// =============================================

// -----------------------------------------------------------
// STEP 1: After deploying worker.js to Cloudflare Workers,
// replace the placeholder below with your worker URL.
// Example: 'https://nifty-proxy.yourname.workers.dev'
// Until then, free proxies are used as fallback.
// -----------------------------------------------------------
const CF_WORKER = 'https://nifty-proxy.vinodjamesisaac.workers.dev';

const YF_BASE   = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const YF_SEARCH = 'https://query1.finance.yahoo.com/v1/finance/search?q=';

// -- Index symbols --
const INDICES = [
  { id: 'idx-nifty50',   symbol: '^NSEI',       name: 'Nifty 50' },
  { id: 'idx-sensex',    symbol: '^BSESN',      name: 'Sensex' },
  { id: 'idx-banknifty', symbol: '^NSEBANK',    name: 'Bank Nifty' },
  { id: 'idx-niftyit',   symbol: '^CNXIT',      name: 'Nifty IT' },
  { id: 'idx-midcap',    symbol: '^NSEMDCP50',  name: 'Nifty Midcap' },
  { id: 'idx-sgxnifty',  symbol: '^INDIAVIX',   name: 'India VIX' },
];

// -- Popular stocks --
const POPULAR = [
  { symbol: 'RELIANCE.NS',  name: 'Reliance Industries' },
  { symbol: 'TCS.NS',       name: 'TCS' },
  { symbol: 'HDFCBANK.NS',  name: 'HDFC Bank' },
  { symbol: 'INFY.NS',      name: 'Infosys' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
  { symbol: 'SBIN.NS',      name: 'SBI' },
  { symbol: 'BAJFINANCE.NS',name: 'Bajaj Finance' },
  { symbol: 'WIPRO.NS',     name: 'Wipro' },
  { symbol: 'ADANIENT.NS',  name: 'Adani Enterprises' },
  { symbol: 'VEDL.NS',      name: 'Vedanta' },
  { symbol: 'HDFCAMC.NS',   name: 'HDFC AMC' },
  { symbol: 'CDSL.NS',      name: 'CDSL' },
];

// -- Stocks for gainers/losers --
const NIFTY50_SYMBOLS = [
  'RELIANCE.NS','TCS.NS','HDFCBANK.NS','INFY.NS','ICICIBANK.NS',
  'HINDUNILVR.NS','SBIN.NS','BHARTIARTL.NS','LT.NS','AXISBANK.NS',
  'BAJFINANCE.NS','TATAMOTORS.NS',
];

// -- Commodities --
const COMMODITIES = [
  { symbol: 'GOLDBEES.NS',  label: 'Gold ETF',  tooltip: 'SBI Gold ETF — tracks MCX gold price in INR (₹ per unit ≈ ₹ per gram)' },
  { symbol: 'SILVERBEES.NS',label: 'Silver ETF',tooltip: 'Mirae Asset Silver ETF — tracks MCX silver price in INR' },
  { symbol: 'USDINR=X',    label: 'USD / INR', tooltip: '1 US Dollar in Indian Rupees — live FX rate' },
];

// =============================================
// SPARKLINE ENGINE
// =============================================
var _sparkCache = {};

async function getSparkline(symbol, range, interval) {
  var key = symbol + ':' + range + ':' + interval;
  if (_sparkCache[key]) return _sparkCache[key];
  try {
    var url = YF_BASE + encodeURIComponent(symbol) + '?interval=' + interval + '&range=' + range;
    var json = await proxyFetch(url, 5000);
    var closes = (json && json.chart && json.chart.result && json.chart.result[0] &&
                  json.chart.result[0].indicators && json.chart.result[0].indicators.quote &&
                  json.chart.result[0].indicators.quote[0].close) || [];
    var filtered = closes.filter(function(v) { return v != null; });
    _sparkCache[key] = filtered;
    return filtered;
  } catch(e) {
    return [];
  }
}

function drawSparklineSVG(prices, w, h) {
  w = w || 160; h = h || 48;
  if (!prices || prices.length < 2) {
    return '<svg width="' + w + '" height="' + h + '"><text x="' + (w/2) + '" y="' + (h/2+4) + '" text-anchor="middle" fill="#475569" font-size="9">No chart data</text></svg>';
  }
  var min = Math.min.apply(null, prices);
  var max = Math.max.apply(null, prices);
  var rng = max - min || 1;
  var pad = 3;
  var pts = prices.map(function(p, i) {
    var x = (i / (prices.length - 1)) * (w - pad*2) + pad;
    var y = (h - pad*2) - ((p - min) / rng) * (h - pad*2) + pad;
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  var isUp = prices[prices.length - 1] >= prices[0];
  var color = isUp ? '#22c55e' : '#ef4444';
  var fillPts = pts + ' ' + (w-pad) + ',' + (h-pad) + ' ' + pad + ',' + (h-pad);
  var fillColor = isUp ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';
  return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">' +
    '<polygon points="' + fillPts + '" fill="' + fillColor + '"/>' +
    '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
}

var _sparkTipEl = null;
function _getTip() {
  if (!_sparkTipEl) _sparkTipEl = document.getElementById('sparkTip');
  return _sparkTipEl;
}
function showSparkTip(e, html) {
  var tip = _getTip(); if (!tip) return;
  tip.innerHTML = html;
  tip.classList.remove('hidden'); tip.classList.add('visible');
  _positionTip(e);
}
function _positionTip(e) {
  var tip = _getTip(); if (!tip || tip.classList.contains('hidden')) return;
  var x = e.clientX + 14, y = e.clientY - 20;
  if (x + 220 > window.innerWidth) x = e.clientX - 220;
  if (y + 180 > window.innerHeight) y = e.clientY - 180;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
function hideSparkTip() {
  var tip = _getTip(); if (tip) { tip.classList.remove('visible'); tip.classList.add('hidden'); }
}

// =============================================
// PROXY FETCH — tries multiple sources
// =============================================
async function proxyFetch(targetUrl, timeoutMs = 6000) {
  const proxies = [];

  if (CF_WORKER) {
    proxies.push(async () => {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), timeoutMs);
      try {
        const r = await fetch(CF_WORKER + '?url=' + encodeURIComponent(targetUrl), { signal: ac.signal });
        clearTimeout(t);
        if (!r.ok) throw new Error(r.status);
        return await r.json();
      } finally { clearTimeout(t); }
    });
  }

  // allorigins /raw — returns raw JSON directly
  proxies.push(async () => {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const r = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(targetUrl), { signal: ac.signal });
      clearTimeout(t);
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } finally { clearTimeout(t); }
  });

  // allorigins /get — returns { contents: "..." }
  proxies.push(async () => {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const r = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent(targetUrl), { signal: ac.signal });
      clearTimeout(t);
      if (!r.ok) throw new Error(r.status);
      const wrapper = await r.json();
      if (!wrapper.contents) throw new Error('empty');
      return JSON.parse(wrapper.contents);
    } finally { clearTimeout(t); }
  });

  for (const proxy of proxies) {
    try {
      const result = await proxy();
      if (result) return result;
    } catch { continue; }
  }

  return null;
}

// =============================================
// FETCH STOCK DATA
// =============================================
async function fetchYahoo(symbol) {
  const url = YF_BASE + encodeURIComponent(symbol) + '?interval=1d&range=1d';
  try {
    const data = await proxyFetch(url);
    const meta = data && data.chart && data.chart.result && data.chart.result[0] && data.chart.result[0].meta;
    if (!meta) return null;
    return {
      symbol,
      name: meta.longName || meta.shortName || symbol,
      price: meta.regularMarketPrice,
      prevClose: meta.chartPreviousClose || meta.previousClose,
      open: meta.regularMarketOpen,
      high: meta.regularMarketDayHigh,
      low: meta.regularMarketDayLow,
      weekHigh52: meta.fiftyTwoWeekHigh,
      weekLow52: meta.fiftyTwoWeekLow,
      volume: meta.regularMarketVolume,
      marketCap: meta.marketCap,
      currency: meta.currency,
      exchange: meta.exchangeName,
    };
  } catch {
    return null;
  }
}

// =============================================
// FORMATTERS
// =============================================
function fmt(n, decimals) {
  if (decimals === undefined) decimals = 2;
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCap(n) {
  if (!n) return '—';
  if (n >= 1e12) return '₹' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '₹' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e7)  return '₹' + (n / 1e7).toFixed(2) + 'Cr';
  return '₹' + fmt(n, 0);
}

function fmtVol(n) {
  if (!n) return '—';
  if (n >= 1e7) return (n / 1e7).toFixed(2) + 'Cr';
  if (n >= 1e5) return (n / 1e5).toFixed(2) + 'L';
  return n.toLocaleString('en-IN');
}

function changeClass(pct) {
  if (pct > 0) return 'positive';
  if (pct < 0) return 'negative';
  return 'neutral';
}

function changePct(price, prev) {
  if (!price || !prev) return null;
  return ((price - prev) / prev) * 100;
}

// =============================================
// INDICES
// =============================================
async function loadIndices() {
  await Promise.all(INDICES.map(async function(idx) {
    var el = document.getElementById(idx.id);
    var data = await fetchYahoo(idx.symbol);
    el.classList.remove('skeleton');
    if (!data) {
      el.innerHTML = '<div class="idx-name">' + idx.name + '</div><div class="idx-price">—</div><div class="idx-change neutral">Unavailable</div>';
      return;
    }
    var pct  = changePct(data.price, data.prevClose);
    var diff = data.price - data.prevClose;
    var cls  = changeClass(pct);
    el.classList.add(cls);
    var sign = diff >= 0 ? '+' : '';
    el.innerHTML = '<div class="idx-name">' + idx.name + '</div>'
      + '<div class="idx-price">' + fmt(data.price) + '</div>'
      + '<div class="idx-change">' + sign + fmt(diff) + ' (' + sign + (pct != null ? pct.toFixed(2) : '—') + '%)</div>';
  }));
}

// =============================================
// POPULAR STOCKS
// =============================================
async function loadPopular() {
  var grid = document.getElementById('popularGrid');
  grid.innerHTML = POPULAR.map(function(s) {
    return '<div class="popular-card skeleton"><div class="pc-name">' + s.name + '</div><div class="pc-price">Loading…</div><div class="pc-change">—</div></div>';
  }).join('');

  await Promise.all(POPULAR.map(async function(stock, i) {
    var data = await fetchYahoo(stock.symbol);
    var card = grid.querySelectorAll('.popular-card')[i];
    card.classList.remove('skeleton');
    var pct  = data ? changePct(data.price, data.prevClose) : null;
    var cls  = changeClass(pct);
    var sign = pct != null && pct >= 0 ? '+' : '';
    card.innerHTML = '<div class="pc-name">' + stock.name + '</div>'
      + '<div class="pc-price">' + (data ? '₹' + fmt(data.price) : 'N/A') + '</div>'
      + '<div class="pc-change ' + cls + '">' + (pct != null ? sign + pct.toFixed(2) + '%' : '—') + '</div>';
    card.style.cursor = 'pointer';
    card.addEventListener('click', (function(sym, nm) {
      return function() { searchBySymbol(sym, nm); };
    })(stock.symbol, data && data.name ? data.name : stock.name));
    // Hover sparkline tooltip
    var _tipData = data;
    var _tipSym  = stock.symbol;
    var _tipName = stock.name;
    card.addEventListener('mouseenter', function(e) {
      var pctVal = _tipData ? changePct(_tipData.price, _tipData.prevClose) : null;
      var s2 = pctVal != null && pctVal >= 0 ? '+' : '';
      var col = pctVal != null && pctVal >= 0 ? '#22c55e' : '#ef4444';
      showSparkTip(e,
        '<div class="stip-name">' + _tipName + '</div>' +
        '<div class="stip-price">' + (_tipData ? '₹' + fmt(_tipData.price) : '—') +
        (_tipData ? ' <span style="color:' + col + '">' + s2 + pctVal.toFixed(2) + '%</span>' : '') + '</div>' +
        '<div class="stip-loading">Loading 5-day chart…</div>'
      );
      getSparkline(_tipSym, '5d', '60m').then(function(prices) {
        var p2 = _tipData ? changePct(_tipData.price, _tipData.prevClose) : null;
        var s3 = p2 != null && p2 >= 0 ? '+' : '';
        var c2 = p2 != null && p2 >= 0 ? '#22c55e' : '#ef4444';
        showSparkTip(e,
          '<div class="stip-name">' + _tipName + '</div>' +
          '<div class="stip-price">' + (_tipData ? '₹' + fmt(_tipData.price) : '—') +
          (_tipData ? ' <span style="color:' + c2 + '">' + s3 + p2.toFixed(2) + '%</span>' : '') + '</div>' +
          drawSparklineSVG(prices, 170, 52) +
          '<div class="stip-label">5-day · hover to explore · click for details</div>'
        );
      });
    });
    card.addEventListener('mousemove', function(e) {
      var tip = _getTip(); if (tip && !tip.classList.contains('hidden')) _positionTip(e);
    });
    card.addEventListener('mouseleave', hideSparkTip);
  }));
}

// =============================================
// GAINERS / LOSERS
// =============================================
async function loadMovers() {
  document.getElementById('gainersList').innerHTML = '<div class="mover-empty">Loading…</div>';
  document.getElementById('losersList').innerHTML  = '<div class="mover-empty">Loading…</div>';

  var results = await Promise.all(NIFTY50_SYMBOLS.map(function(sym) { return fetchYahoo(sym); }));
  var valid = results.filter(Boolean).map(function(d) {
    return Object.assign({}, d, { pct: changePct(d.price, d.prevClose) });
  }).filter(function(d) { return d.pct != null; });

  if (!valid.length) {
    var msg = '<div class="mover-empty">Market closed or data unavailable</div>';
    document.getElementById('gainersList').innerHTML = msg;
    document.getElementById('losersList').innerHTML  = msg;
    return;
  }

  valid.sort(function(a, b) { return b.pct - a.pct; });
  renderMovers('gainersList', valid.filter(function(d) { return d.pct > 0; }).slice(0, 5), 'positive');
  renderMovers('losersList',  valid.filter(function(d) { return d.pct < 0; }).reverse().slice(0, 5), 'negative');
}

function renderMovers(elId, items, cls) {
  var el = document.getElementById(elId);
  if (!items.length) {
    el.innerHTML = '<div class="mover-empty">No data for current session</div>';
    return;
  }
  el.innerHTML = items.map(function(d) {
    var sign = d.pct >= 0 ? '+' : '';
    var shortName = d.name.replace(/ Limited| Ltd\.?/g, '');
    return '<div class="mover-row" data-sym="' + d.symbol + '" data-name="' + shortName.replace(/"/g, '&quot;') + '" data-price="' + d.price + '" data-pct="' + d.pct.toFixed(2) + '" data-cls="' + cls + '" onclick="searchBySymbol(\'' + d.symbol + '\', \'' + shortName.replace(/'/g, "\\'") + '\')">'
      + '<div class="mover-name">' + shortName + '</div>'
      + '<div class="mover-price">₹' + fmt(d.price) + '</div>'
      + '<div class="mover-pct ' + cls + '">' + sign + d.pct.toFixed(2) + '%</div>'
      + '</div>';
  }).join('');

  // Attach hover sparkline events
  el.querySelectorAll('.mover-row').forEach(function(row) {
    var sym  = row.dataset.sym;
    var nm   = row.dataset.name;
    var pr   = row.dataset.price;
    var pct  = parseFloat(row.dataset.pct);
    var isUp = pct >= 0;
    var col  = isUp ? '#22c55e' : '#ef4444';
    var sign = isUp ? '+' : '';
    row.addEventListener('mouseenter', function(e) {
      showSparkTip(e,
        '<div class="stip-name">' + nm + '</div>' +
        '<div class="stip-price">₹' + fmt(parseFloat(pr)) + ' <span style="color:' + col + '">' + sign + pct.toFixed(2) + '%</span></div>' +
        '<div class="stip-loading">Loading today\'s chart…</div>'
      );
      getSparkline(sym, '1d', '5m').then(function(prices) {
        showSparkTip(e,
          '<div class="stip-name">' + nm + '</div>' +
          '<div class="stip-price">₹' + fmt(parseFloat(pr)) + ' <span style="color:' + col + '">' + sign + pct.toFixed(2) + '%</span></div>' +
          drawSparklineSVG(prices, 170, 52) +
          '<div class="stip-label">Today\'s intraday performance</div>'
        );
      });
    });
    row.addEventListener('mousemove', function(e) {
      var tip = _getTip(); if (tip && !tip.classList.contains('hidden')) _positionTip(e);
    });
    row.addEventListener('mouseleave', hideSparkTip);
  });
}

// =============================================
// SEARCH BY SYMBOL
// =============================================
async function searchBySymbol(symbol, name) {
  var section = document.getElementById('resultSection');
  var card    = document.getElementById('resultCard');
  section.classList.remove('hidden');
  card.innerHTML = '<div class="result-loading">Fetching ' + name + '…</div>';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  var data = await fetchYahoo(symbol);
  if (!data) {
    card.innerHTML = '<div class="result-error">Could not fetch data for <strong>' + name + '</strong>. Market may be closed or ticker invalid. Try again shortly.</div>';
    return;
  }

  var pct  = changePct(data.price, data.prevClose);
  var diff = (data.price != null && data.prevClose != null) ? data.price - data.prevClose : null;
  var cls  = changeClass(pct);
  var sign = diff >= 0 ? '+' : '';
  var cur  = data.currency === 'INR' ? '₹' : (data.currency || '') + ' ';

  card.innerHTML = '<div class="result-header">'
    + '<div class="result-name-wrap">'
    + '<h2 class="result-name">' + data.name + '</h2>'
    + '<span class="result-symbol">' + symbol.replace(/\.(NS|BO)$/, '') + ' · ' + (data.exchange || 'NSE') + '</span>'
    + '</div>'
    + '<div class="result-price-wrap">'
    + '<div class="result-price">' + cur + fmt(data.price) + '</div>'
    + '<div class="result-change ' + cls + '">' + sign + fmt(diff) + ' (' + sign + (pct != null ? pct.toFixed(2) : '—') + '%)</div>'
    + '</div>'
    + '</div>'
    + '<div class="result-stats">'
    + '<div class="stat-item"><div class="stat-label">Open</div><div class="stat-value">' + cur + fmt(data.open) + '</div></div>'
    + '<div class="stat-item"><div class="stat-label">Prev Close</div><div class="stat-value">' + cur + fmt(data.prevClose) + '</div></div>'
    + '<div class="stat-item"><div class="stat-label">Day High</div><div class="stat-value positive">' + cur + fmt(data.high) + '</div></div>'
    + '<div class="stat-item"><div class="stat-label">Day Low</div><div class="stat-value negative">' + cur + fmt(data.low) + '</div></div>'
    + '<div class="stat-item"><div class="stat-label">52W High</div><div class="stat-value">' + cur + fmt(data.weekHigh52) + '</div></div>'
    + '<div class="stat-item"><div class="stat-label">52W Low</div><div class="stat-value">' + cur + fmt(data.weekLow52) + '</div></div>'
    + '<div class="stat-item"><div class="stat-label">Volume</div><div class="stat-value">' + fmtVol(data.volume) + '</div></div>'
    + '<div class="stat-item"><div class="stat-label">Market Cap</div><div class="stat-value">' + fmtCap(data.marketCap) + '</div></div>'
    + '</div>'
    + '<div id="resultChart" class="result-chart"><div style="font-size:0.78rem;color:#475569;text-align:center;padding:12px 0;">Loading chart…</div></div>'
    + '<div class="result-footer">'
    + '<span>Data may be delayed up to 15 minutes · Not financial advice</span>'
    + '<button class="btn-close" onclick="document.getElementById(\'resultSection\').classList.add(\'hidden\')">✕ Close</button>'
    + '</div>';

  // Async-load intraday chart
  (function(sym, cu) {
    getSparkline(sym, '1d', '5m').then(function(prices) {
      var chartEl = document.getElementById('resultChart');
      if (!chartEl) return;
      if (prices.length > 4) {
        chartEl.innerHTML =
          '<div class="result-chart-label"><span>Today\'s intraday chart (5-min intervals)</span><span>' + sym.replace(/\.(NS|BO)$/, '') + '</span></div>' +
          drawSparklineSVG(prices, 560, 88);
      } else {
        chartEl.innerHTML = '<div style="font-size:0.78rem;color:#475569;text-align:center;padding:12px 0;">Intraday chart unavailable (market closed or no data yet)</div>';
      }
    });
  })(symbol, cur);
}

// =============================================
// SEARCH INPUT
// =============================================
async function doSearch() {
  var q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  document.getElementById('suggestions').classList.add('hidden');
  // Always use Yahoo search — handles names (Airtel→BHARTIARTL), tickers (TCS→TCS.NS), and US stocks
  await searchAndShow(q);
}

async function searchAndShow(q) {
  var section = document.getElementById('resultSection');
  var card    = document.getElementById('resultCard');
  section.classList.remove('hidden');
  card.innerHTML = '<div class="result-loading">Searching for "' + q + '"…</div>';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    var url  = YF_SEARCH + encodeURIComponent(q) + '&lang=en-US&region=IN&quotesCount=5&newsCount=0';
    var data = await proxyFetch(url);
    var quotes = (data && data.finance && data.finance.result && data.finance.result[0] && data.finance.result[0].quotes) || [];
    var indian = quotes.filter(function(item) { return item.symbol && (item.symbol.endsWith('.NS') || item.symbol.endsWith('.BO')); });
    var best   = indian.length ? indian[0] : quotes[0];
    if (!best) {
      // Last resort: try the query as a raw ticker symbol (handles SNPS, AAPL etc.)
      var trimmed = q.trim().toUpperCase().replace(/\s+stock$/i, '').trim();
      if (/^[A-Z0-9.^]+$/.test(trimmed)) {
        await searchBySymbol(trimmed, trimmed);
        return;
      }
      card.innerHTML = '<div class="result-error">No results for "<strong>' + q + '</strong>". Try typing the NSE ticker (e.g. RELIANCE, BHARTIARTL) or company name.</div>';
      return;
    }
    await searchBySymbol(best.symbol, best.longname || best.shortname || best.symbol);
  } catch {
    card.innerHTML = '<div class="result-error">Search failed. Try the NSE ticker directly (e.g. RELIANCE, TCS).</div>';
  }
}

// =============================================
// AUTOCOMPLETE
// =============================================
var suggestTimer;
document.getElementById('searchInput').addEventListener('input', function(e) {
  clearTimeout(suggestTimer);
  var q = e.target.value.trim();
  var sugEl = document.getElementById('suggestions');
  if (q.length < 2) { sugEl.classList.add('hidden'); return; }
  suggestTimer = setTimeout(function() { fetchSuggestions(q); }, 350);
});

async function fetchSuggestions(q) {
  var sugEl = document.getElementById('suggestions');
  try {
    var url  = YF_SEARCH + encodeURIComponent(q) + '&lang=en-US&region=IN&quotesCount=6&newsCount=0';
    var data = await proxyFetch(url, 4000);
    var quotes = ((data && data.finance && data.finance.result && data.finance.result[0] && data.finance.result[0].quotes) || [])
      .filter(function(q) { return q.symbol && (q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO')); })
      .slice(0, 6);
    if (!quotes.length) { sugEl.classList.add('hidden'); return; }
    sugEl.innerHTML = quotes.map(function(q) {
      return '<div class="suggestion-item" data-symbol="' + q.symbol + '" data-name="' + (q.longname || q.shortname || q.symbol).replace(/"/g, '&quot;') + '">'
        + '<span class="sug-name">' + (q.longname || q.shortname || q.symbol) + '</span>'
        + '<span class="sug-ticker">' + q.symbol.replace(/\.(NS|BO)$/, '') + '</span>'
        + '</div>';
    }).join('');
    sugEl.querySelectorAll('.suggestion-item').forEach(function(item) {
      item.addEventListener('click', function() {
        document.getElementById('searchInput').value = item.dataset.name;
        sugEl.classList.add('hidden');
        searchBySymbol(item.dataset.symbol, item.dataset.name);
      });
    });
    sugEl.classList.remove('hidden');
  } catch {
    sugEl.classList.add('hidden');
  }
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.search-wrap')) document.getElementById('suggestions').classList.add('hidden');
});

// =============================================
// EVENT LISTENERS
// =============================================
document.getElementById('searchBtn').addEventListener('click', doSearch);
document.getElementById('searchInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') doSearch();
});

var urlQ = new URLSearchParams(window.location.search).get('q');
if (urlQ) {
  document.getElementById('searchInput').value = urlQ;
  searchAndShow(urlQ);
}

// =============================================
// AUTO REFRESH every 20s + live counter
// =============================================
var lastRefreshTime = Date.now();

function updateLastUpdated() {
  var el = document.getElementById('lastUpdated');
  if (!el) return;
  var secs = Math.floor((Date.now() - lastRefreshTime) / 1000);
  el.textContent = secs < 5 ? 'Updated just now' : 'Updated ' + secs + 's ago';
}

setInterval(function() {
  lastRefreshTime = Date.now();
  loadIndices();
  loadCommodities();
}, 20000);

setInterval(updateLastUpdated, 1000);

// =============================================
// COMMODITY / FX TILES
// =============================================
async function loadCommodities() {
  var row = document.getElementById('commodityRow');
  if (!row) return;
  await Promise.all(COMMODITIES.map(async function(c) {
    var data = await fetchYahoo(c.symbol);
    var id = 'cmd-' + c.symbol.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('skeleton');
    if (!data) { el.querySelector('.idx-price').textContent = '—'; return; }
    var pct = changePct(data.price, data.prevClose);
    var cls = changeClass(pct);
    var sign = pct != null && pct >= 0 ? '+' : '';
    var priceStr = c.symbol === 'USDINR=X'
      ? '₹' + data.price.toFixed(2)
      : '₹' + fmt(data.price);
    el.classList.remove('positive','negative','neutral');
    el.classList.add(cls);
    el.querySelector('.idx-price').textContent = priceStr;
    var chEl = el.querySelector('.idx-change');
    chEl.textContent = pct != null ? sign + pct.toFixed(2) + '%' : '—';
  }));
}

function renderCommodities() {
  var row = document.getElementById('commodityRow');
  if (!row) return;
  row.innerHTML = COMMODITIES.map(function(c) {
    var id = 'cmd-' + c.symbol.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    return '<div class="index-card skeleton" id="' + id + '" data-tooltip="' + c.tooltip + '">'
      + '<div class="idx-name">' + c.label + '</div>'
      + '<div class="idx-price">--</div>'
      + '<div class="idx-change">--</div>'
      + '</div>';
  }).join('');
}

// =============================================
// INIT
// =============================================
(async function init() {
  renderCommodities();
  await loadIndices();
  lastRefreshTime = Date.now();
  updateLastUpdated();
  loadPopular();
  loadMovers();
  loadCommodities();
})();