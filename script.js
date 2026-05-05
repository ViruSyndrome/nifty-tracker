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
  { id: 'idx-sgxnifty',  symbol: 'SGXNIFTY.SI', name: 'SGX Nifty' },
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
    return '<div class="mover-row" onclick="searchBySymbol(\'' + d.symbol + '\', \'' + shortName.replace(/'/g, "\\'") + '\')">'
      + '<div class="mover-name">' + shortName + '</div>'
      + '<div class="mover-price">₹' + fmt(d.price) + '</div>'
      + '<div class="mover-pct ' + cls + '">' + sign + d.pct.toFixed(2) + '%</div>'
      + '</div>';
  }).join('');
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
    + '<div class="result-footer">'
    + '<span>Data may be delayed up to 15 minutes · Not financial advice</span>'
    + '<button class="btn-close" onclick="document.getElementById(\'resultSection\').classList.add(\'hidden\')">✕ Close</button>'
    + '</div>';
}

// =============================================
// SEARCH INPUT
// =============================================
async function doSearch() {
  var q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  document.getElementById('suggestions').classList.add('hidden');
  var isTickerLike = /^[A-Z0-9&]+$/i.test(q) && q.length <= 12;
  if (isTickerLike) {
    await searchBySymbol(q.toUpperCase() + '.NS', q.toUpperCase());
  } else {
    await searchAndShow(q);
  }
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
    var indian = quotes.filter(function(q) { return q.symbol && (q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO')); });
    var best   = indian.length ? indian[0] : quotes[0];
    if (!best) {
      card.innerHTML = '<div class="result-error">No results for "<strong>' + q + '</strong>". Try the NSE ticker directly (e.g. RELIANCE, TCS, INFY).</div>';
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
// AUTO REFRESH every 30s
// =============================================
setInterval(loadIndices, 30000);

// =============================================
// INIT
// =============================================
(async function init() {
  loadIndices();
  loadPopular();
  loadMovers();
})();