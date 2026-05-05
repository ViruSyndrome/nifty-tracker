// =============================================
// GetNiftyReady — script.js
// Yahoo Finance CORS proxy via allorigins.win
// =============================================

const PROXY = 'https://api.allorigins.win/get?url=';
const YF_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';
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

// -- Popular stocks (NSE .NS suffix) --
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

// -- Nifty 50 stocks for gainers/losers --
const NIFTY50_SYMBOLS = [
  'RELIANCE.NS','TCS.NS','HDFCBANK.NS','INFY.NS','ICICIBANK.NS',
  'HINDUNILVR.NS','ITC.NS','SBIN.NS','BHARTIARTL.NS','KOTAKBANK.NS',
  'LT.NS','AXISBANK.NS','ASIANPAINT.NS','MARUTI.NS','SUNPHARMA.NS',
  'BAJFINANCE.NS','TITAN.NS','WIPRO.NS','ULTRACEMCO.NS','HCLTECH.NS',
  'NESTLEIND.NS','ADANIENT.NS','POWERGRID.NS','NTPC.NS','ONGC.NS',
  'JSWSTEEL.NS','TATAMOTORS.NS','TATASTEEL.NS','TECHM.NS','M&M.NS',
];

// =============================================
// FETCH HELPER
// =============================================
async function fetchYahoo(symbol) {
  const url = `${YF_BASE}${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  try {
    const res = await fetch(`${PROXY}${encodeURIComponent(url)}`);
    const json = await res.json();
    const data = JSON.parse(json.contents);
    const meta = data?.chart?.result?.[0]?.meta;
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
function fmt(n, decimals = 2) {
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
// RENDER INDEX CARDS
// =============================================
async function loadIndices() {
  await Promise.all(INDICES.map(async (idx) => {
    const el = document.getElementById(idx.id);
    const data = await fetchYahoo(idx.symbol);
    el.classList.remove('skeleton');
    if (!data) {
      el.querySelector('.idx-price').textContent = 'N/A';
      el.querySelector('.idx-change').textContent = '—';
      return;
    }
    const pct = changePct(data.price, data.prevClose);
    const diff = data.price - data.prevClose;
    const cls = changeClass(pct);
    el.classList.add(cls);
    el.querySelector('.idx-price').textContent = fmt(data.price);
    const sign = diff >= 0 ? '+' : '';
    el.querySelector('.idx-change').innerHTML =
      `<span>${sign}${fmt(diff)} (${sign}${pct != null ? pct.toFixed(2) : '—'}%)</span>`;
  }));
}

// =============================================
// RENDER POPULAR STOCKS
// =============================================
async function loadPopular() {
  const grid = document.getElementById('popularGrid');
  grid.innerHTML = POPULAR.map(() => `<div class="popular-card skeleton"><div class="pc-name">—</div><div class="pc-price">—</div><div class="pc-change">—</div></div>`).join('');

  await Promise.all(POPULAR.map(async (stock, i) => {
    const data = await fetchYahoo(stock.symbol);
    const cards = grid.querySelectorAll('.popular-card');
    const card = cards[i];
    card.classList.remove('skeleton');
    if (!data) {
      card.innerHTML = `<div class="pc-name">${stock.name}</div><div class="pc-price">N/A</div><div class="pc-change neutral">—</div>`;
      card.addEventListener('click', () => searchBySymbol(stock.symbol, stock.name));
      return;
    }
    const pct = changePct(data.price, data.prevClose);
    const cls = changeClass(pct);
    const sign = pct >= 0 ? '+' : '';
    card.innerHTML = `
      <div class="pc-name">${stock.name}</div>
      <div class="pc-price">₹${fmt(data.price)}</div>
      <div class="pc-change ${cls}">${sign}${pct != null ? pct.toFixed(2) : '—'}%</div>
    `;
    card.addEventListener('click', () => searchBySymbol(stock.symbol, data.name || stock.name));
    card.style.cursor = 'pointer';
  }));
}

// =============================================
// RENDER GAINERS / LOSERS
// =============================================
async function loadMovers() {
  const results = await Promise.all(
    NIFTY50_SYMBOLS.slice(0, 20).map(sym => fetchYahoo(sym))
  );
  const valid = results.filter(Boolean).map(d => ({
    ...d,
    pct: changePct(d.price, d.prevClose),
  })).filter(d => d.pct != null);

  valid.sort((a, b) => b.pct - a.pct);
  const gainers = valid.filter(d => d.pct > 0).slice(0, 5);
  const losers  = valid.filter(d => d.pct < 0).reverse().slice(0, 5);

  renderMovers('gainersList', gainers, 'positive');
  renderMovers('losersList', losers, 'negative');
}

function renderMovers(elId, items, cls) {
  const el = document.getElementById(elId);
  if (!items.length) {
    el.innerHTML = '<div class="mover-empty">Market closed or data unavailable</div>';
    return;
  }
  el.innerHTML = items.map(d => {
    const sign = d.pct >= 0 ? '+' : '';
    const shortName = d.name.replace(' Limited', '').replace(' Ltd', '').replace(' Ltd.', '');
    return `
      <div class="mover-row" onclick="searchBySymbol('${d.symbol}', '${shortName.replace(/'/g,"\\'")}')">
        <div class="mover-name">${shortName}</div>
        <div class="mover-price">₹${fmt(d.price)}</div>
        <div class="mover-pct ${cls}">${sign}${d.pct.toFixed(2)}%</div>
      </div>`;
  }).join('');
}

// =============================================
// SEARCH
// =============================================
async function searchBySymbol(symbol, name) {
  const section = document.getElementById('resultSection');
  const card = document.getElementById('resultCard');
  section.classList.remove('hidden');
  card.innerHTML = `<div class="result-loading">Fetching ${name}...</div>`;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const data = await fetchYahoo(symbol);
  if (!data) {
    card.innerHTML = `<div class="result-error">Could not fetch data for <strong>${name}</strong>. Try again or check the ticker symbol.</div>`;
    return;
  }

  const pct = changePct(data.price, data.prevClose);
  const diff = data.price != null && data.prevClose != null ? data.price - data.prevClose : null;
  const cls = changeClass(pct);
  const sign = diff >= 0 ? '+' : '';
  const currency = data.currency === 'INR' ? '₹' : (data.currency || '') + ' ';

  card.innerHTML = `
    <div class="result-header">
      <div class="result-name-wrap">
        <h2 class="result-name">${data.name}</h2>
        <span class="result-symbol">${symbol.replace('.NS','').replace('.BO','')} · ${data.exchange || 'NSE'}</span>
      </div>
      <div class="result-price-wrap">
        <div class="result-price">${currency}${fmt(data.price)}</div>
        <div class="result-change ${cls}">${sign}${fmt(diff)} (${sign}${pct != null ? pct.toFixed(2) : '—'}%)</div>
      </div>
    </div>
    <div class="result-stats">
      <div class="stat-item"><div class="stat-label">Open</div><div class="stat-value">${currency}${fmt(data.open)}</div></div>
      <div class="stat-item"><div class="stat-label">Prev Close</div><div class="stat-value">${currency}${fmt(data.prevClose)}</div></div>
      <div class="stat-item"><div class="stat-label">Day High</div><div class="stat-value positive">${currency}${fmt(data.high)}</div></div>
      <div class="stat-item"><div class="stat-label">Day Low</div><div class="stat-value negative">${currency}${fmt(data.low)}</div></div>
      <div class="stat-item"><div class="stat-label">52W High</div><div class="stat-value">${currency}${fmt(data.weekHigh52)}</div></div>
      <div class="stat-item"><div class="stat-label">52W Low</div><div class="stat-value">${currency}${fmt(data.weekLow52)}</div></div>
      <div class="stat-item"><div class="stat-label">Volume</div><div class="stat-value">${fmtVol(data.volume)}</div></div>
      <div class="stat-item"><div class="stat-label">Market Cap</div><div class="stat-value">${fmtCap(data.marketCap)}</div></div>
    </div>
    <div class="result-footer">
      <span>Data may be delayed up to 15 minutes · Not financial advice</span>
      <button class="btn-close" onclick="document.getElementById('resultSection').classList.add('hidden')">✕ Close</button>
    </div>
  `;
}

async function doSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  document.getElementById('suggestions').classList.add('hidden');

  // If it looks like a raw ticker, append .NS
  const isTickerLike = /^[A-Z0-9&]+$/.test(q.toUpperCase()) && q.length <= 12;
  if (isTickerLike) {
    await searchBySymbol(q.toUpperCase() + '.NS', q.toUpperCase());
    return;
  }
  // Otherwise search Yahoo
  await searchAndShow(q);
}

async function searchAndShow(q) {
  const section = document.getElementById('resultSection');
  const card = document.getElementById('resultCard');
  section.classList.remove('hidden');
  card.innerHTML = `<div class="result-loading">Searching for "${q}"...</div>`;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    const url = `${YF_SEARCH}${encodeURIComponent(q)}&lang=en-US&region=IN&quotesCount=5&newsCount=0`;
    const res = await fetch(`${PROXY}${encodeURIComponent(url)}`);
    const json = await res.json();
    const data = JSON.parse(json.contents);
    const quotes = data?.finance?.result?.[0]?.quotes || [];
    const indian = quotes.filter(q => q.symbol?.endsWith('.NS') || q.symbol?.endsWith('.BO'));

    if (!indian.length && quotes.length) {
      // fallback: use first result
      await searchBySymbol(quotes[0].symbol, quotes[0].longname || quotes[0].shortname || quotes[0].symbol);
      return;
    }
    if (!indian.length) {
      card.innerHTML = `<div class="result-error">No results found for "<strong>${q}</strong>". Try the NSE ticker symbol (e.g. RELIANCE, TCS, INFY).</div>`;
      return;
    }
    await searchBySymbol(indian[0].symbol, indian[0].longname || indian[0].shortname || indian[0].symbol);
  } catch {
    card.innerHTML = `<div class="result-error">Search failed. Please try the NSE ticker directly (e.g. RELIANCE, TCS).</div>`;
  }
}

// =============================================
// AUTOCOMPLETE SUGGESTIONS
// =============================================
let suggestTimer;
document.getElementById('searchInput').addEventListener('input', (e) => {
  clearTimeout(suggestTimer);
  const q = e.target.value.trim();
  if (q.length < 2) {
    document.getElementById('suggestions').classList.add('hidden');
    return;
  }
  suggestTimer = setTimeout(() => fetchSuggestions(q), 300);
});

async function fetchSuggestions(q) {
  const sugEl = document.getElementById('suggestions');
  try {
    const url = `${YF_SEARCH}${encodeURIComponent(q)}&lang=en-US&region=IN&quotesCount=6&newsCount=0`;
    const res = await fetch(`${PROXY}${encodeURIComponent(url)}`);
    const json = await res.json();
    const data = JSON.parse(json.contents);
    const quotes = (data?.finance?.result?.[0]?.quotes || [])
      .filter(q => q.symbol?.endsWith('.NS') || q.symbol?.endsWith('.BO'))
      .slice(0, 6);

    if (!quotes.length) { sugEl.classList.add('hidden'); return; }

    sugEl.innerHTML = quotes.map(q => `
      <div class="suggestion-item" data-symbol="${q.symbol}" data-name="${(q.longname || q.shortname || q.symbol).replace(/"/g,'&quot;')}">
        <span class="sug-name">${q.longname || q.shortname || q.symbol}</span>
        <span class="sug-ticker">${q.symbol.replace('.NS','').replace('.BO','')}</span>
      </div>`).join('');

    sugEl.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
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

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-wrap')) {
    document.getElementById('suggestions').classList.add('hidden');
  }
});

// =============================================
// EVENT LISTENERS
// =============================================
document.getElementById('searchBtn').addEventListener('click', doSearch);
document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doSearch();
});

// URL param support: ?q=RELIANCE
const urlQ = new URLSearchParams(window.location.search).get('q');
if (urlQ) {
  document.getElementById('searchInput').value = urlQ;
  searchAndShow(urlQ);
}

// =============================================
// AUTO REFRESH every 30 seconds
// =============================================
let refreshTimer;
function startAutoRefresh() {
  refreshTimer = setInterval(() => {
    loadIndices();
  }, 30000);
}

// =============================================
// INIT
// =============================================
(async function init() {
  await loadIndices();
  loadPopular();
  loadMovers();
  startAutoRefresh();
})();
