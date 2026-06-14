// ── Safe localStorage Wrapper ──────────────────────────────────────────────
// Catches QuotaExceededError and private-browsing SecurityError silently.
// Usage: lsSet('key', value)  lsGet('key', fallback)  lsDel('key')
// ──────────────────────────────────────────────────────────────────────────
const _ls = (() => {
  const _ok = (() => { try { window.localStorage.setItem('__ls_test__', '1'); window.localStorage.removeItem('__ls_test__'); return true; } catch (e) { return false; } })();
  return {
    get(key, fallback = null) {
      if (!_ok) return fallback;
      try { const v = window.localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, val) {
      if (!_ok) return false;
      try { window.localStorage.setItem(key, JSON.stringify(val)); return true; }
      catch (e) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          console.warn('[Storage] Quota exceeded — clearing old data to make room.');
          try { window.localStorage.clear(); window.localStorage.setItem(key, JSON.stringify(val)); } catch (err) { return false; }
        }
        return false;
      }
    },
    setRaw(key, val) {
      if (!_ok) return false;
      try { window.localStorage.setItem(key, val); return true; }
      catch (e) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          console.warn('[Storage] Quota exceeded — clearing old data to make room.');
          try { window.localStorage.clear(); window.localStorage.setItem(key, val); } catch (err) { return false; }
        }
        return false;
      }
    },
    getRaw(key, fallback = null) {
      if (!_ok) return fallback;
      try { const v = window.localStorage.getItem(key); return v !== null ? v : fallback; } catch (e) { return fallback; }
    },
    del(key)   { if (!_ok) return; try { window.localStorage.removeItem(key); } catch (e) {} },
    clear()    { if (!_ok) return; try { window.localStorage.clear(); } catch (e) {} },
  };
})();
// Convenience aliases
function lsGet(key, fallback = null) { return _ls.get(key, fallback); }
function lsSet(key, val)             { return _ls.set(key, val); }
function lsDel(key)                  { return _ls.del(key); }
// ──────────────────────────────────────────────────────────────────────────// ──────────────────────────────────────────────────────────────────────────


// =============================================
// GetNiftyReady — script.js
// =============================================

// -----------------------------------------------------------
// STEP 1: After deploying worker.js to Cloudflare Workers,
// replace the placeholder below with your worker URL.
// Example: 'https://nifty-proxy.yourname.workers.dev'
// Until then, free proxies are used as fallback.
// -----------------------------------------------------------
const CF_WORKER = 'https://ancient-limit-cf75.vinodjamesisaac.workers.dev';

// ── Personalised Dashboard — localStorage ──
const LS_RECENT    = 'gnr_recent';
const LS_WATCHLIST = 'gnr_watchlist';
const MAX_RECENT   = 8;
const MAX_WATCHLIST = 20;
catch (e) {} }

// Analytics Tracking Helper
function trackEvent(eventName, params = {}) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, params);
  }
}

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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
// -- Full Nifty 50 symbols for accurate gainers/losers --
const NIFTY50_SYMBOLS = [
  'ADANIENT.NS', 'ADANIPORTS.NS', 'APOLLOHOSP.NS', 'ASIANPAINT.NS', 'AXISBANK.NS',
  'BAJAJ-AUTO.NS', 'BAJFINANCE.NS', 'BAJAJFINSV.NS', 'BPCL.NS', 'BHARTIARTL.NS',
  'BRITANNIA.NS', 'CIPLA.NS', 'COALINDIA.NS', 'DIVISLAB.NS', 'DRREDDY.NS',
  'EICHERMOT.NS', 'GRASIM.NS', 'HCLTECH.NS', 'HDFCBANK.NS', 'HDFCLIFE.NS',
  'HEROMOTOCO.NS', 'HINDALCO.NS', 'HINDUNILVR.NS', 'ICICIBANK.NS', 'ITC.NS',
  'INDUSINDBK.NS', 'INFY.NS', 'JSWSTEEL.NS', 'KOTAKBANK.NS', 'LTIM.NS',
  'LT.NS', 'M&M.NS', 'MARUTI.NS', 'NESTLEIND.NS', 'NTPC.NS',
  'ONGC.NS', 'POWERGRID.NS', 'RELIANCE.NS', 'SBILIFE.NS', 'SBIN.NS',
  'SUNPHARMA.NS', 'TATACONSUM.NS', 'TATAMOTORS.NS', 'TATASTEEL.NS', 'TCS.NS',
  'TECHM.NS', 'TITAN.NS', 'ULTRACEMCO.NS', 'UPL.NS', 'WIPRO.NS'
];

// -- Broad Market (Mid-cap High Volatility) --
const BROAD_MARKET_SYMBOLS = [
  'ZOMATO.NS', 'PAYTM.NS', 'NYKAA.NS', 'IDEA.NS', 'SUZLON.NS',
  'IRFC.NS', 'RVNL.NS', 'MAZDOCK.NS', 'POLYCAB.NS', 'TRENT.NS',
  'HAL.NS', 'BEL.NS', 'MCX.NS', 'IREDA.NS', 'JIOFIN.NS',
  'BHEL.NS', 'NHPC.NS', 'YESBANK.NS', 'PFC.NS', 'RECLTD.NS',
  'GMRINFRA.NS', 'KALYANKJIL.NS', 'HDFCAMC.NS', 'CDSL.NS', 'MAPMYINDIA.NS',
  'AUsmall.NS', 'AARTIIND.NS', 'ABCAPITAL.NS', 'ABFRL.NS', 'ASHOKLEY.NS',
  'FEDERALBNK.NS', 'FORTIS.NS', 'IDFCFIRSTB.NS', 'JUBLFOOD.NS', 'LUPIN.NS',
  'CENTRALBK.NS', 'IOB.NS', 'PNB.NS', 'HUDCO.NS', 'IRCTC.NS',
  'SAIL.NS', 'NBCC.NS', 'NMDC.NS', 'MANAPPURAM.NS', 'MUTHOOTFIN.NS',
  'LICI.NS', 'GLENMARK.NS', 'ESCORTS.NS', 'ASTRAL.NS', 'CONCOR.NS'
];

// -- Commodities --
// Spot metals: GC=F / SI=F (USD/troy oz) × USDINR=X ÷ 31.1035 g/oz × India duties = INR
// India duties: import duty 15% + GST 3% = × 1.1845
const INDIA_METAL_DUTY = 1.15 * 1.03; // 15% import duty + 3% GST
const COMMODITIES = [
  { id: 'gold-24k', symbol: 'GC=F',     label: 'Gold 24K (10g)', isSpot: true,  purity: 1,      gramsPerUnit: 31.1035, displayGrams: 10,  tooltip: 'Gold 24K per 10g in INR — COMEX spot × USD/INR ÷ troy-oz × India import duty (15%) + GST (3%). Matches IBJA/Google India price.' },
  { id: 'gold-22k', symbol: 'GC=F',     label: 'Gold 22K (10g)', isSpot: true,  purity: 22/24,  gramsPerUnit: 31.1035, displayGrams: 10,  tooltip: 'Gold 22K per 10g in INR — 91.67% of 24K with India import duty (15%) + GST (3%). Standard jewellery karat in India.' },
  { id: 'silver',   symbol: 'SI=F',     label: 'Silver (10g)',   isSpot: true,  purity: 1,      gramsPerUnit: 31.1035, displayGrams: 10,  tooltip: 'Silver per 10g in INR — COMEX spot × USD/INR ÷ troy-oz × India import duty (15%) + GST (3%).' },
  { id: 'crude',    symbol: 'CL=F',     label: 'Crude Oil (bbl)', isFX: true,    tooltip: 'WTI Crude Oil futures (1 barrel) converted to INR at live USD/INR rate' },
  { id: 'natgas',   symbol: 'NG=F',     label: 'Natural Gas',     isFX: true,    tooltip: 'Henry Hub Natural Gas futures (per MMBtu) converted to INR at live USD/INR rate' },
  { id: 'copper',   symbol: 'HG=F',     label: 'Copper (1kg)',    isFX: true,    kgPerUnit: 1/2.20462, tooltip: 'COMEX Copper futures (per lb) × 2.20462 → per kg, converted to INR at live USD/INR rate' },
  { id: 'usd-inr',  symbol: 'USDINR=X', label: 'USD / INR',       tooltip: '1 US Dollar in Indian Rupees — live FX rate' },
  { id: 'gbp-inr',  symbol: 'GBPINR=X', label: 'GBP / INR',       tooltip: '1 British Pound in Indian Rupees — live FX rate' },
  { id: 'eur-inr',  symbol: 'EURINR=X', label: 'EUR / INR',       tooltip: '1 Euro in Indian Rupees — live FX rate' },
];

// -- Sectoral Indices --
const SECTORS = [
  { symbol: '^NSEBANK',    label: 'Banking' },
  { symbol: '^CNXIT',      label: 'IT' },
  { symbol: '^CNXAUTO',    label: 'Auto' },
  { symbol: '^CNXPHARMA',  label: 'Pharma' },
  { symbol: '^CNXFMCG',    label: 'FMCG' },
  { symbol: '^CNXREALTY',  label: 'Realty' },
  { symbol: '^CNXMETAL',   label: 'Metal' },
  { symbol: '^CNXMEDIA',   label: 'Media' },
  { symbol: '^CNXPSUBANK', label: 'PSU Bank' },
  { symbol: '^CNXENERGY',  label: 'Energy' },
  { symbol: '^CNXINFRA',   label: 'Infra' },
  { symbol: '^CNXSERVICE', label: 'Services' },
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
    var result = json && json.chart && json.chart.result && json.chart.result[0];
    var closes    = (result && result.indicators && result.indicators.quote && result.indicators.quote[0].close) || [];
    var timestamps = (result && result.timestamp) || [];
    var filtered = [];
    for (var i = 0; i < closes.length; i++) {
      if (closes[i] != null) filtered.push({ price: closes[i], ts: timestamps[i] || 0 });
    }
    _sparkCache[key] = filtered;
    return filtered;
  } catch(e) {
    return [];
  }
}

function drawSparklineSVG(data, w, h, showTimeAxis) {
  w = w || 160; h = h || 48;
  // Accept both old array-of-numbers and new array-of-{price,ts}
  var prices = data.map(function(d) { return typeof d === 'object' ? d.price : d; });
  var timestamps = data.map(function(d) { return typeof d === 'object' ? d.ts : 0; });
  if (!prices || prices.length < 2) {
    return '<svg width="' + w + '" height="' + h + '"><text x="' + (w/2) + '" y="' + (h/2+4) + '" text-anchor="middle" fill="#475569" font-size="9">No chart data</text></svg>';
  }
  var axisH = showTimeAxis ? 18 : 0;
  var chartH = h - axisH;
  var min = Math.min.apply(null, prices);
  var max = Math.max.apply(null, prices);
  var rng = max - min || 1;
  var pad = 3;
  var pts = prices.map(function(p, i) {
    var x = (i / (prices.length - 1)) * (w - pad*2) + pad;
    var y = (chartH - pad*2) - ((p - min) / rng) * (chartH - pad*2) + pad;
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  var isUp = prices[prices.length - 1] >= prices[0];
  var color = isUp ? '#22c55e' : '#ef4444';
  var fillPts = pts + ' ' + (w-pad).toFixed(1) + ',' + (chartH-pad) + ' ' + pad + ',' + (chartH-pad);
  var fillColor = isUp ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';

  var svg = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">'
    + '<polygon points="' + fillPts + '" fill="' + fillColor + '"/>'
    + '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>';

  // Time axis labels (only when showTimeAxis = true and we have timestamps)
  if (showTimeAxis && timestamps[0]) {
    var numLabels = Math.min(5, prices.length);
    var step = Math.floor((prices.length - 1) / (numLabels - 1));
    for (var i = 0; i < numLabels; i++) {
      var idx = Math.min(i * step, prices.length - 1);
      var tsMs = timestamps[idx] * 1000;
      var d = new Date(tsMs);
      var hh = d.getHours();
      var mm = ('0' + d.getMinutes()).slice(-2);
      var ampm = hh >= 12 ? 'pm' : 'am';
      hh = hh % 12 || 12;
      var label = hh + ':' + mm + ampm;
      var xPos = (idx / (prices.length - 1)) * (w - pad*2) + pad;
      var anchor = i === 0 ? 'start' : (i === numLabels - 1 ? 'end' : 'middle');
      svg += '<text x="' + xPos.toFixed(1) + '" y="' + (h - 3) + '" text-anchor="' + anchor + '" fill="#475569" font-size="9" font-family="Inter,sans-serif">' + label + '</text>';
    }
    // axis line
    svg += '<line x1="' + pad + '" y1="' + (chartH) + '" x2="' + (w-pad) + '" y2="' + (chartH) + '" stroke="#2d3f55" stroke-width="1"/>';
  }

  svg += '</svg>';
  return svg;
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
  tip.style.left = '0px';
  tip.style.top = '0px';
  tip.style.maxWidth = Math.max(160, Math.min(300, window.innerWidth - 24)) + 'px';

  var rect = tip.getBoundingClientRect();
  var width = rect.width || tip.offsetWidth || 220;
  var height = rect.height || tip.offsetHeight || 180;
  var margin = 12;

  var x = e.clientX + 14;
  var y = e.clientY - 20;

  if (x + width + margin > window.innerWidth) {
    x = e.clientX - width - 14;
  }
  if (x < margin) {
    x = margin;
  }

  if (y < margin) {
    y = e.clientY + 18;
  }
  if (y + height + margin > window.innerHeight) {
    y = Math.max(margin, window.innerHeight - height - margin);
  }

  tip.style.left = x + 'px';
  tip.style.top = y + 'px';
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
    } catch (e) { continue; }
  }

  return null;
}

// fetchMCXData removed — Moneycontrol MCX API is blocked by Akamai bot-protection
// at the server level, returning empty 0-byte responses from Cloudflare Workers.

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
  } catch (e) {
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
    var wlName = data && data.name ? data.name : stock.name;
    var starCls = isWatchlisted(stock.symbol) ? 'star-btn starred' : 'star-btn';
    card.innerHTML = '<div class="pc-header">'
      + '<div class="pc-name">' + stock.name + '</div>'
      + '<button class="' + starCls + '" data-sym="' + stock.symbol + '" title="Toggle watchlist" aria-label="Toggle watchlist">★</button>'
      + '</div>'
      + '<div class="pc-price">' + (data ? '₹' + fmt(data.price) : 'N/A') + '</div>'
      + '<div class="pc-change ' + cls + '">' + (pct != null ? sign + pct.toFixed(2) + '%' : '—') + '</div>';
    card.style.cursor = 'pointer';
    card.querySelector('.star-btn').addEventListener('click', (function(sym, nm) {
      return function(e) { e.stopPropagation(); toggleWatchlist(sym, nm); };
    })(stock.symbol, wlName));
    card.addEventListener('click', (function(sym, nm) {
      return function() { searchBySymbol(sym, nm); };
    })(stock.symbol, wlName));
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
  var gEl = document.getElementById('gainersList');
  var lEl = document.getElementById('losersList');
  var bgEl = document.getElementById('broadGainersList');
  var blEl = document.getElementById('broadLosersList');

  // 1. Fetch Nifty 50
  var results = await Promise.all(NIFTY50_SYMBOLS.map(function(sym) { return fetchYahoo(sym); }));
  var valid = results.filter(Boolean).map(function(d) {
    return Object.assign({}, d, { pct: changePct(d.price, d.prevClose) });
  }).filter(function(d) { return d.pct != null; });

  if (valid.length) {
    valid.sort(function(a, b) { return b.pct - a.pct; });
    renderMovers('gainersList', valid.filter(function(d) { return d.pct > 0; }).slice(0, 5), 'positive');
    renderMovers('losersList',  valid.filter(function(d) { return d.pct < 0; }).reverse().slice(0, 5), 'negative');
    updateMarketSummary(valid);
  } else {
    var msg = '<div class="mover-empty">Data unavailable</div>';
    if (gEl) gEl.innerHTML = msg;
    if (lEl) lEl.innerHTML = msg;
  }

  // 2. Fetch Broad Market (Curated volatile set)
  var bResults = await Promise.all(BROAD_MARKET_SYMBOLS.map(function(sym) { return fetchYahoo(sym); }));
  var bValid = bResults.filter(Boolean).map(function(d) {
    return Object.assign({}, d, { pct: changePct(d.price, d.prevClose) });
  }).filter(function(d) { return d.pct != null; });

  if (bValid.length && bgEl) {
    bValid.sort(function(a, b) { return b.pct - a.pct; });
    renderMovers('broadGainersList', bValid.filter(function(d) { return d.pct > 0; }).slice(0, 5), 'positive');
    renderMovers('broadLosersList',  bValid.filter(function(d) { return d.pct < 0; }).reverse().slice(0, 5), 'negative');
  } else if (bgEl) {
    var bMsg = '<div class="mover-empty">Data unavailable</div>';
    bgEl.innerHTML = bMsg;
    blEl.innerHTML = bMsg;
  }
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

function hideEmptyAdSlots() {
  document.querySelectorAll('.ad-slot').forEach(function(slot) {
    const ins = slot.querySelector('ins.adsbygoogle');
    if (!ins) {
      slot.classList.add('hidden');
      return;
    }

    slot.classList.add('hidden');

    var hasVisibleAd = function() {
      var iframe = ins.querySelector('iframe');
      if (!iframe) return false;
      var rect = iframe.getBoundingClientRect();
      var src = iframe.getAttribute('src') || '';
      if (!src.trim()) return false;
      if (rect.width < 20 || rect.height < 20) return false;
      if (iframe.style.display === 'none' || iframe.style.visibility === 'hidden') return false;
      return true;
    };

    var showAdSlot = function() {
      if (hasVisibleAd()) {
        slot.classList.remove('hidden');
        return true;
      }
      return false;
    };

    var observer = new MutationObserver(function() {
      if (showAdSlot()) {
        observer.disconnect();
      }
    });
    observer.observe(ins, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'src', 'srcdoc'] });

    if (showAdSlot()) {
      observer.disconnect();
      return;
    }

    setTimeout(function() {
      if (!showAdSlot()) {
        slot.classList.add('hidden');
      }
      observer.disconnect();
    }, 7000);
  });
}

function updateMarketSummary(niftyStocks) {
  const adv = niftyStocks.filter(s => s.pct > 0.05).length;
  const dec = niftyStocks.filter(s => s.pct < -0.05).length;
  const total = niftyStocks.length;

  const advEl = document.getElementById('advancesCount');
  const decEl = document.getElementById('declinesCount');
  const advBar = document.getElementById('advancesBar');
  const decBar = document.getElementById('declinesBar');
  const sentEl = document.getElementById('sentimentStatus');

  if (advEl) advEl.innerText = adv;
  if (decEl) decEl.innerText = dec;

  if (advBar && decBar) {
    const advPct = (adv / total) * 100;
    const decPct = (dec / total) * 100;
    advBar.style.width = advPct + '%';
    decBar.style.width = decPct + '%';
  }

  if (sentEl) {
    sentEl.className = 'sentiment-status';
    if (adv > 30) {
      sentEl.innerText = 'Strong Bullish';
      sentEl.classList.add('bullish');
    } else if (adv > 25) {
      sentEl.innerText = 'Bullish';
      sentEl.classList.add('bullish');
    } else if (dec > 30) {
      sentEl.innerText = 'Strong Bearish';
      sentEl.classList.add('bearish');
    } else if (dec > 25) {
      sentEl.innerText = 'Bearish';
      sentEl.classList.add('bearish');
    } else {
      sentEl.innerText = 'Neutral';
      sentEl.classList.add('neutral');
    }
  }
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

  // Save to recently searched
  addRecent(symbol, data.name || name);

  var safeName = (data.name || name).replace(/'/g, "\\'").replace(/"/g, '&quot;');
  var wlStarCls = isWatchlisted(symbol) ? 'star-btn starred result-star' : 'star-btn result-star';
  var wlStarLbl = isWatchlisted(symbol) ? '★ Watchlisted' : '☆ Watchlist';

  card.innerHTML = '<div class="result-header">'
    + '<div class="result-name-wrap">'
    + '<div class="result-name-row">'
    + '<h2 class="result-name">' + data.name + '</h2>'
    + '<button class="' + wlStarCls + '" data-sym="' + symbol + '" onclick="toggleWatchlist(\'' + symbol + '\', \'' + safeName + '\')">'
    + wlStarLbl + '</button>'
    + '</div>'
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
    getSparkline(sym, '1d', '5m').then(function(data) {
      var chartEl = document.getElementById('resultChart');
      if (!chartEl) return;
      if (data.length > 4) {
        chartEl.innerHTML =
          '<div class="result-chart-label"><span>Today\'s intraday chart (5-min intervals, IST)</span><span>' + sym.replace(/\.(NS|BO)$/, '') + '</span></div>' +
          drawSparklineSVG(data, 560, 100, true);
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
  trackEvent('search_symbol', { query: q });
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
  } catch (e) {
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
    var url  = YF_SEARCH + encodeURIComponent(q) + '&lang=en-US&region=IN&quotesCount=8&newsCount=0';
    var data = await proxyFetch(url, 4000);
    var allQuotes = ((data && data.finance && data.finance.result && data.finance.result[0] && data.finance.result[0].quotes) || [])
      .filter(function(item) { return item.symbol && item.quoteType === 'EQUITY'; })
      .slice(0, 7);
    if (!allQuotes.length) { sugEl.classList.add('hidden'); return; }
    sugEl.innerHTML = allQuotes.map(function(item) {
      var isIndian = item.symbol.endsWith('.NS') || item.symbol.endsWith('.BO');
      var exchange = isIndian ? item.symbol.replace(/\.(NS|BO)$/, '') : item.symbol + ' · US';
      return '<div class="suggestion-item" data-symbol="' + item.symbol + '" data-name="' + (item.longname || item.shortname || item.symbol).replace(/"/g, '&quot;') + '">'
        + '<span class="sug-name">' + (item.longname || item.shortname || item.symbol) + '</span>'
        + '<span class="sug-ticker">' + exchange + '</span>'
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
  } catch (e) {
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
  var status = getMarketStatus();
  if (status.status === 'closed') {
    el.textContent = 'Market Closed — Data from last session';
    return;
  }
  var secs = Math.floor((Date.now() - lastRefreshTime) / 1000);
  el.textContent = secs < 5 ? 'Updated just now' : 'Updated ' + secs + 's ago';
}

setInterval(function() {
  lastRefreshTime = Date.now();
  loadIndices();
  loadCommodities();
  loadWatchlist();
}, 20000);

setInterval(function() { updateLastUpdated(); updateMarketStatus(); }, 1000);

// =============================================
// MARKET STATUS & GLOBAL CUES
// =============================================
function getISTDate() {
  var now = new Date();
  var utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utcMs + (330 * 60000)); // UTC+5:30
}

function getMarketStatus() {
  var now = new Date();
  // Compute IST using UTC methods — avoids browser timezone interfering with NSE hours
  // getISTDate() was broken: getTimezoneOffset() is negative for IST, so formula returned UTC
  var utcMins = now.getUTCHours() * 60 + now.getUTCMinutes();
  var istTotalMins = utcMins + 330; // IST = UTC + 5h30m
  var dayOffset = istTotalMins >= 1440 ? 1 : 0;
  var totalMins = istTotalMins % 1440;
  var day = (now.getUTCDay() + dayOffset) % 7; // 0=Sun, 6=Sat
  var h = Math.floor(totalMins / 60);
  var m = totalMins % 60;

  if (day === 0 || day === 6) {
    var daysUntilMon = day === 0 ? 1 : 2;
    return { status: 'closed', minsUntilOpen: daysUntilMon * 24 * 60 - totalMins + 540 };
  }
  if (totalMins < 540)  return { status: 'closed',   minsUntilOpen: 540 - totalMins };
  if (totalMins < 555)  return { status: 'preopen',  minsUntilOpen: 555 - totalMins };
  if (totalMins < 930)  return { status: 'open',     minsUntilClose: 930 - totalMins };

  // After 3:30 PM — find next trading day
  var tDay = (day + 1) % 7; // tomorrow's day in IST
  var daysToAdd = tDay === 6 ? 3 : tDay === 0 ? 2 : 1;
  return { status: 'closed', minsUntilOpen: daysToAdd * 24 * 60 - totalMins + 540 };
}

function formatMktCountdown(mins) {
  if (mins <= 0) return 'now';
  var h = Math.floor(mins / 60), m = mins % 60;
  if (h >= 24) { var d = Math.floor(h / 24); return 'in ' + d + 'd ' + (h % 24) + 'h'; }
  if (h > 0)  return 'in ' + h + 'h ' + (m < 10 ? '0' : '') + m + 'm';
  return 'in ' + m + 'm';
}

function updateMarketStatus() {
  var s   = getMarketStatus();
  var dot = document.getElementById('marketDot');
  var lbl = document.getElementById('marketLabel');
  var ctr = document.getElementById('marketCountdown');
  var cues = document.getElementById('globalCuesSection');
  if (!dot) return;

  var note = document.getElementById('marketInfoNote');
  if (s.status === 'open') {
    dot.style.cssText = 'background:#22c55e';
    lbl.style.color   = '#22c55e';
    lbl.textContent   = 'Open';
    ctr.textContent   = 'Closes ' + formatMktCountdown(s.minsUntilClose) + ' · NSE · 15-min delayed';
    if (note) note.textContent = 'Market is open — showing live market breadth and movers.';
    if (cues) cues.style.display = 'none';
  } else if (s.status === 'preopen') {
    dot.style.cssText = 'background:#f59e0b';
    lbl.style.color   = '#f59e0b';
    lbl.textContent   = 'Pre-Open';
    ctr.textContent   = 'Opens ' + formatMktCountdown(s.minsUntilOpen) + ' · Pre-market session active';
    if (note) note.textContent = 'Pre-open session — showing the latest available market breadth.';
    if (cues) cues.style.display = 'none';
  } else {
    dot.style.cssText = 'background:#ef4444;animation:none';
    lbl.style.color   = '#ef4444';
    lbl.textContent   = 'Closed';
    ctr.textContent   = 'Opens ' + formatMktCountdown(s.minsUntilOpen) + ' · Showing last close';
    if (note) note.textContent = 'Market closed — displaying latest published data for breadth and movers.';
    if (cues) {
      cues.style.display = '';
      if (!window._globalCuesLoaded) { window._globalCuesLoaded = true; loadGlobalCues(); }
    }
  }
}

var GLOBAL_INDICES = [
  { symbol: '^GSPC', name: 'S&P 500',    flag: '🇺🇸' },
  { symbol: '^IXIC', name: 'Nasdaq',      flag: '🇺🇸' },
  { symbol: '^DJI',  name: 'Dow Jones',   flag: '🇺🇸' },
  { symbol: '^N225', name: 'Nikkei 225',  flag: '🇯🇵' },
  { symbol: 'CL=F',  name: 'Crude (WTI)', flag: '🛢️' },
  { symbol: 'GC=F',  name: 'Gold (USD)',  flag: '🥇' },
];

async function loadGlobalCues() {
  var grid = document.getElementById('globalCuesGrid');
  if (!grid) return;
  grid.innerHTML = GLOBAL_INDICES.map(function(idx) {
    var id = 'gcue-' + idx.symbol.replace(/[^a-z0-9]/gi, '_');
    return '<div class="global-cue-card skeleton" id="' + id + '">'
      + '<div class="gcue-flag">' + idx.flag + '</div>'
      + '<div class="gcue-name">' + idx.name + '</div>'
      + '<div class="gcue-price">—</div>'
      + '<div class="gcue-change">Loading…</div>'
      + '</div>';
  }).join('');

  await Promise.all(GLOBAL_INDICES.map(async function(idx) {
    try {
      var url  = YF_BASE + encodeURIComponent(idx.symbol) + '?interval=1d&range=2d';
      var json = await proxyFetch(url, 7000);
      var result = json && json.chart && json.chart.result && json.chart.result[0];
      if (!result) return;
      var meta   = result.meta;
      var price  = meta.regularMarketPrice || 0;
      var prev   = meta.chartPreviousClose || meta.previousClose || 0;
      var change = price - prev;
      var pct    = prev ? (change / prev * 100) : 0;
      var isUp   = change >= 0;
      var pStr   = price >= 1000
        ? price.toLocaleString('en-US', { maximumFractionDigits: 0 })
        : price.toFixed(2);
      var cStr   = (isUp ? '+' : '') + change.toFixed(2) + ' (' + (isUp ? '+' : '') + pct.toFixed(2) + '%)';
      var id   = 'gcue-' + idx.symbol.replace(/[^a-z0-9]/gi, '_');
      var card = document.getElementById(id);
      if (!card) return;
      card.classList.remove('skeleton');
      card.querySelector('.gcue-price').textContent   = pStr;
      card.querySelector('.gcue-change').textContent  = cStr;
      card.querySelector('.gcue-change').className    = 'gcue-change ' + (isUp ? 'up' : 'down');
    } catch(e) {}
  }));
}

// =============================================
// COMMODITY / FX TILES
// =============================================
async function loadCommodities() {
  var row = document.getElementById('commodityRow');
  if (!row) return;

  // Fetch all unique Yahoo symbols in parallel (includes USD/INR needed for conversions)
  var uniqueSymbols = COMMODITIES.map(function(c) { return c.symbol; })
    .filter(function(s, i, arr) { return arr.indexOf(s) === i; });
  var fetched = {};
  await Promise.all(uniqueSymbols.map(async function(sym) {
    fetched[sym] = await fetchYahoo(sym);
  }));

  // Live USD→INR rate (needed for spot metal & USD-denominated commodities)
  var usdInrData = fetched['USDINR=X'];
  var usdInr     = usdInrData ? usdInrData.price : null;

  COMMODITIES.forEach(function(c) {
    var el = document.getElementById('cmd-' + c.id);
    if (!el) return;
    el.classList.remove('skeleton');

    var data = fetched[c.symbol];
    var priceStr, pctVal, sign, cls;

    if (!data || data.price == null) {
      el.querySelector('.idx-price').textContent  = '—';
      el.querySelector('.idx-change').textContent = '—';
      el.classList.remove('positive', 'negative', 'neutral');
      el.classList.add('neutral');
      return;
    }

    var rawPrice  = data.price;
    var rawPrev   = data.prevClose || rawPrice;
    var displayPrice;

    if (c.isSpot && usdInr) {
      // COMEX USD/troy-oz → INR per displayGrams, with India import duty + GST
      displayPrice     = (rawPrice  * usdInr / c.gramsPerUnit) * c.displayGrams * (c.purity || 1) * INDIA_METAL_DUTY;
      var prevDisplay  = (rawPrev   * usdInr / c.gramsPerUnit) * c.displayGrams * (c.purity || 1) * INDIA_METAL_DUTY;
      pctVal           = changePct(displayPrice, prevDisplay);
      priceStr         = '₹' + fmt(Math.round(displayPrice));
    } else if (c.isFX && usdInr) {
      // USD-denominated futures → INR, with optional per-kg conversion for copper
      var mult         = c.kgPerUnit ? (1 / c.kgPerUnit) : 1; // HG=F: per lb → per kg
      displayPrice     = rawPrice * usdInr * (c.kgPerUnit ? (1 / c.kgPerUnit) : 1);
      // copper: HG=F is USD/lb, kgPerUnit = 1/2.20462 → multiply by 2.20462 for per-kg price
      if (c.kgPerUnit) displayPrice = rawPrice * usdInr / c.kgPerUnit;
      var prevFX       = rawPrev * usdInr * (c.kgPerUnit ? 1 / c.kgPerUnit : 1);
      if (c.kgPerUnit) prevFX = rawPrev * usdInr / c.kgPerUnit;
      pctVal           = changePct(displayPrice, prevFX);
      priceStr         = '₹' + fmt(displayPrice, c.symbol === 'NG=F' ? 2 : 0);
    } else {
      // Plain FX pairs (USD/INR, GBP/INR, EUR/INR) — price already in INR
      displayPrice     = rawPrice;
      pctVal           = changePct(displayPrice, rawPrev);
      priceStr         = '₹' + displayPrice.toFixed(2);
    }

    sign = (pctVal != null && pctVal >= 0) ? '+' : '';
    cls  = changeClass(pctVal);
    el.classList.remove('positive', 'negative', 'neutral');
    el.classList.add(cls);
    el.querySelector('.idx-price').textContent  = priceStr;
    el.querySelector('.idx-change').textContent = pctVal != null ? sign + pctVal.toFixed(2) + '%' : '—';
  });
}

function renderCommodities() {
  var row = document.getElementById('commodityRow');
  if (!row) return;
  row.innerHTML = COMMODITIES.map(function(c) {
    return '<div class="index-card skeleton" id="cmd-' + c.id + '" data-tooltip="' + c.tooltip + '">'
      + '<div class="idx-name">' + c.label + '</div>'
      + '<div class="idx-price">--</div>'
      + '<div class="idx-change">--</div>'
      + '</div>';
  }).join('');
}

// =============================================
// FII / DII WIDGET & TRENDS
// =============================================
async function loadFIIDII() {
  const grid = document.getElementById('fiidiiGrid');
  const dateEl = document.getElementById('fiidiiDate');
  const historyTable = document.getElementById('fiidiiHistory');
  if (!grid) return;

  function renderFIIDII(data, sourceLabel) {
    if (!data || data.length === 0) return;
    const latestDay = data.slice(0, 2);
    if (dateEl) dateEl.innerHTML = 'Latest available FII/DII snapshot for ' + latestDay[0].date + ' · ' + sourceLabel;
    grid.innerHTML = latestDay.map(item => {
      const net = parseFloat(item.netValue);
      const isUp = net >= 0;
      const direction = item.category === 'DII' ? 'Domestic Institutional Investors' : 'Foreign Institutional Investors';
      return `<div class="fiidii-item" data-tooltip="${direction}: ${isUp?'+':'-'}₹${fmt(Math.abs(net))} Cr net ${isUp?'buy':'sell'} today."><div class="fiidii-cat">${item.category}</div><div class="fiidii-net" style="color: ${isUp?'var(--success)':'var(--danger)'}">${isUp?'+':'-'}₹${fmt(Math.abs(net))} <small>Cr</small></div></div>`;
    }).join('');

    if (historyTable) {
      const uniqueDates = [];
      const grouped = {};
      data.forEach(item => {
        if (!item.date) return;
        if (!uniqueDates.includes(item.date)) uniqueDates.push(item.date);
        if (!grouped[item.date]) grouped[item.date] = { fii: 0, dii: 0 };
        const val = parseFloat(item.netValue) || 0;
        if (item.category === 'DII') grouped[item.date].dii = val;
        else grouped[item.date].fii = val;
      });
      const rows = uniqueDates.slice(0, 10).map(date => {
        const fii = grouped[date].fii, dii = grouped[date].dii;
        return `<tr><td>${date}</td><td class="${fii>=0?'up':'down'}">${fii>=0?'+':''}${fmt(fii)}</td><td class="${dii>=0?'up':'down'}">${dii>=0?'+':''}${fmt(dii)}</td></tr>`;
      }).join('');
      historyTable.innerHTML = `<table class="trend-table"><thead><tr><th>Date</th><th>FII (Cr)</th><th>DII (Cr)</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    const latestNet = latestDay.reduce((sum, item) => sum + (parseFloat(item.netValue) || 0), 0);
    const gaugeRatio = Math.max(-1, Math.min(1, latestNet / 18000));
    updateGauge(gaugeRatio * 80);
  }

  // Merge new data rows with existing history, deduplicating by date+category, keeping latest 10 days.
  // Merge new data rows with existing history, deduplicating by date+category, keeping latest 10 days.
  function mergeHistory(existingData, newData) {
    const keyOf = item => item.date + '|' + item.category;
    const map = {};
    // Start with existing data as the base
    existingData.forEach(item => { if (item && item.date) map[keyOf(item)] = item; });
    // Overlay new data (it wins for any date it has)
    newData.forEach(item => { if (item && item.date) map[keyOf(item)] = item; });
    // Convert back to array, sort by date descending (newest first)
    const merged = Object.values(map);
    merged.sort((a, b) => {
      const parseDate = d => {
        if (!d) return 0;
        // Handles '27-May-2026' format manually to avoid browser-specific Date parser discrepancies
        const parts = d.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const monthStr = parts[1].toLowerCase();
          const year = parseInt(parts[2], 10);
          const months = {
            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
            jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
          };
          const month = months[monthStr.substring(0, 3)] || 0;
          return new Date(year, month, day).getTime();
        }
        const parsed = new Date(d).getTime();
        return isNaN(parsed) ? 0 : parsed;
      };
      return parseDate(b.date) - parseDate(a.date);
    });
    // Keep only 10 unique dates (20 rows = 2 per day)
    const uniqueDates = [];
    const kept = merged.filter(item => {
      if (!uniqueDates.includes(item.date)) {
        if (uniqueDates.length >= 10) return false;
        uniqueDates.push(item.date);
      }
      return true;
    });
    return kept;
  }

  const LS_FIIDII = 'fiidii_history_v1';

  // Step 1: Render from localStorage cache first (instant render on revisit)
  const cached = lsGet(LS_FIIDII);
  if (cached && Array.isArray(cached) && cached.length) {
    renderFIIDII(cached, 'cached history');
  }

  // Step 2: Load local fiidii.json fallback
  let localData = [];
  try {
    const localRes = await fetch('data/fiidii.json?v=' + Date.now());
    if (localRes.ok) {
      const parsed = await localRes.json();
      if (Array.isArray(parsed) && parsed.length) {
        localData = parsed;
        // Merge with cache
        const base = cached && Array.isArray(cached) ? cached : [];
        const merged = mergeHistory(base, localData);
        lsSet(LS_FIIDII, merged);
        renderFIIDII(merged, 'latest published');
      }
    }
  } catch (localErr) {
    console.warn('Could not load local FII/DII snapshot:', localErr);
  }

  // Step 3: Fetch live data from NSE, merge with existing history
  try {
    const remote = await proxyFetch('https://www.nseindia.com/api/fiidiiTradeReact', 9000);
    if (Array.isArray(remote) && remote.length) {
      // Merge live (today's rows) with BOTH cache and local fallback history to avoid losing the 10-day history trend.
      const cachedData = lsGet(LS_FIIDII) || [];
      const base = mergeHistory(cachedData, localData);
      const merged = mergeHistory(base, remote);
      lsSet(LS_FIIDII, merged);
      renderFIIDII(merged, 'live NSE');
    }
  } catch (remoteErr) {
    console.warn('Live FII/DII fetch failed:', remoteErr);
    if (!grid.innerHTML.trim()) {
      grid.innerHTML = `<div class="mover-empty">Live data temporarily unavailable</div>`;
      if (dateEl) dateEl.innerHTML = 'Data unavailable';
    }
  }
}

function toggleHistory() {
  const el = document.getElementById('fiidiiHistory');
  if (el) el.classList.toggle('hidden');
  trackEvent('view_fii_dii');
}

function updateGauge(angle) {
  const needle = document.getElementById("sentimentNeedle");
  if (needle) needle.style.transform = "translateX(-50%) rotate(" + angle + "deg)";
}

function goSip() {
  const amt = document.getElementById('miniSipAmt').value;
  const time = document.getElementById('miniSipYrs') ? document.getElementById('miniSipYrs').value : 10;
  const rate = document.getElementById('miniSipRate') ? document.getElementById('miniSipRate').value : 12;
  trackEvent('calculate_sip');
  window.location.href = `sip-calculator.html?amt=${amt}&rate=${rate}&time=${time}`;
}

function goSwp() {
  const amt = document.getElementById('miniSwpAmt').value;
  const wd = document.getElementById('miniSwpWd').value;
  const time = document.getElementById('miniSwpYrs') ? document.getElementById('miniSwpYrs').value : 10;
  const rate = document.getElementById('miniSwpRate') ? document.getElementById('miniSwpRate').value : 8;
  trackEvent('calculate_swp');
  window.location.href = `swp-calculator.html?amt=${amt}&rate=${rate}&time=${time}&wd=${wd}`;
}

async function loadSectors() {
  const grid = document.getElementById('sectorsGrid');
  if (!grid) return;

  const results = await Promise.all(SECTORS.map(s => fetchYahoo(s.symbol)));
  
  grid.innerHTML = SECTORS.map((s, i) => {
    const data = results[i];
    if (!data) return '';
    const pct = changePct(data.price, data.prevClose);
    const cls = pct >= 0 ? 'up' : 'down';
    const sign = pct >= 0 ? '+' : '';
    
    return `
      <div class="sector-card" data-sector-symbol="${s.symbol}" data-sector-label="${s.label}" data-sector-price="${data.price}" data-sector-prev="${data.prevClose}">
        <span class="sector-name">${s.label}</span>
        <span class="sector-pct ${cls}">${sign}${pct.toFixed(2)}%</span>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.sector-card').forEach(function(card) {
    var symbol = card.dataset.sectorSymbol;
    var label  = card.dataset.sectorLabel;
    var price  = parseFloat(card.dataset.sectorPrice);
    var prev   = parseFloat(card.dataset.sectorPrev);
    var pct    = !isNaN(price) && !isNaN(prev) ? changePct(price, prev) : null;
    card.addEventListener('mouseenter', function(e) {
      var sign = pct != null && pct >= 0 ? '+' : '';
      var col  = pct != null && pct >= 0 ? '#22c55e' : '#ef4444';
      showSparkTip(e,
        '<div class="stip-name">' + label + '</div>' +
        '<div class="stip-price">' + (price ? '₹' + fmt(price) : 'Loading…') + (pct != null ? ' <span style="color:' + col + '">' + sign + pct.toFixed(2) + '%</span>' : '') + '</div>' +
        '<div class="stip-loading">Loading 5-day sector trend…</div>'
      );
      getSparkline(symbol, '5d', '60m').then(function(prices) {
        showSparkTip(e,
          '<div class="stip-name">' + label + '</div>' +
          '<div class="stip-price">' + (price ? '₹' + fmt(price) : 'N/A') + (pct != null ? ' <span style="color:' + col + '">' + sign + pct.toFixed(2) + '%</span>' : '') + '</div>' +
          drawSparklineSVG(prices, 230, 82) +
          '<div class="stip-label">5-day sector trend · hover to compare</div>'
        );
      });
    });
    card.addEventListener('mousemove', function(e) {
      var tip = _getTip(); if (tip && !tip.classList.contains('hidden')) _positionTip(e);
    });
    card.addEventListener('mouseleave', hideSparkTip);
  });
}

// =============================================
// PERSONALISED DASHBOARD — localStorage
// =============================================

// ── Recently Searched ──
function addRecent(symbol, name) {
  var list = lsGet(LS_RECENT) || [];
  list = list.filter(function(s) { return s.symbol !== symbol; });
  list.unshift({ symbol: symbol, name: name });
  if (list.length > MAX_RECENT) list = list.slice(0, MAX_RECENT);
  lsSet(LS_RECENT, list);
  renderRecentlySearched();
}

function clearRecent() {
  lsSet(LS_RECENT, []);
  renderRecentlySearched();
}

function renderRecentlySearched() {
  var list = lsGet(LS_RECENT) || [];
  var sec  = document.getElementById('recentSection');
  var grid = document.getElementById('recentGrid');
  if (!sec || !grid) return;
  if (!list.length) { sec.classList.add('hidden'); return; }
  sec.classList.remove('hidden');
  grid.innerHTML = list.map(function(s) {
    var safeSymArg = s.symbol.replace(/'/g, "\\'");
    var safeNmArg  = s.name.replace(/'/g, "\\'");
    return '<div class="recent-chip" onclick="searchBySymbol(\'' + safeSymArg + '\', \'' + safeNmArg + '\')" role="button" tabindex="0">'
      + '<span class="recent-chip-name">' + s.name + '</span>'
      + '<span class="recent-chip-sym">' + s.symbol.replace(/\.(NS|BO)$/, '') + '</span>'
      + '</div>';
  }).join('');
}

// ── Watchlist ──
function getWatchlist() { return lsGet(LS_WATCHLIST) || []; }
function isWatchlisted(symbol) { return getWatchlist().some(function(s) { return s.symbol === symbol; }); }

function toggleWatchlist(symbol, name) {
  var list = getWatchlist();
  if (isWatchlisted(symbol)) {
    list = list.filter(function(s) { return s.symbol !== symbol; });
  } else {
    if (list.length >= MAX_WATCHLIST) { alert('Watchlist full — remove a stock first (max ' + MAX_WATCHLIST + ').'); return; }
    list.push({ symbol: symbol, name: name });
  }
  lsSet(LS_WATCHLIST, list);
  updateAllStarButtons(symbol);
  loadWatchlist();
}

function clearWatchlist() {
  lsSet(LS_WATCHLIST, []);
  loadWatchlist();
  document.querySelectorAll('.star-btn').forEach(function(b) {
    b.classList.remove('starred');
    b.textContent = b.classList.contains('result-star') ? '☆ Watchlist' : '★';
  });
}

function updateAllStarButtons(symbol) {
  var starred = isWatchlisted(symbol);
  document.querySelectorAll('.star-btn[data-sym="' + symbol + '"]').forEach(function(b) {
    b.classList.toggle('starred', starred);
    if (b.classList.contains('result-star')) {
      b.textContent = starred ? '★ Watchlisted' : '☆ Watchlist';
    }
  });
}

async function loadWatchlist() {
  var list = getWatchlist();
  var sec  = document.getElementById('watchlistSection');
  var grid = document.getElementById('watchlistGrid');
  if (!sec || !grid) return;
  if (!list.length) { sec.classList.add('hidden'); return; }
  sec.classList.remove('hidden');

  // Skeleton placeholders
  grid.innerHTML = list.map(function(s) {
    var safeId = 'wl-' + s.symbol.replace(/[^a-z0-9]/gi, '_');
    var safeSymArg = s.symbol.replace(/'/g, "\\'");
    var safeNmArg  = s.name.replace(/'/g, "\\'");
    return '<div class="watchlist-card skeleton" id="' + safeId + '" onclick="searchBySymbol(\'' + safeSymArg + '\', \'' + safeNmArg + '\')" role="button" tabindex="0">'
      + '<div class="wl-header">'
      + '<span class="wl-name">' + s.name + '</span>'
      + '<button class="star-btn starred" data-sym="' + s.symbol + '" onclick="event.stopPropagation();toggleWatchlist(\'' + safeSymArg + '\', \'' + safeNmArg + '\')" title="Remove from watchlist" aria-label="Remove from watchlist">★</button>'
      + '</div>'
      + '<div class="wl-price">—</div>'
      + '<div class="wl-change">Loading…</div>'
      + '</div>';
  }).join('');

  // Fetch prices in parallel
  await Promise.all(list.map(async function(s) {
    var safeId = 'wl-' + s.symbol.replace(/[^a-z0-9]/gi, '_');
    var card = document.getElementById(safeId);
    if (!card) return;
    var data = await fetchYahoo(s.symbol);
    card.classList.remove('skeleton');
    if (!data) {
      card.querySelector('.wl-price').textContent = '—';
      card.querySelector('.wl-change').textContent = 'Unavailable';
      return;
    }
    var pct  = changePct(data.price, data.prevClose);
    var cls  = changeClass(pct);
    var sign = pct != null && pct >= 0 ? '+' : '';
    card.classList.add(cls);
    card.querySelector('.wl-price').textContent = '₹' + fmt(data.price);
    var chEl = card.querySelector('.wl-change');
    chEl.textContent = pct != null ? sign + pct.toFixed(2) + '%' : '—';
    chEl.className = 'wl-change ' + cls;
  }));
}

(async function init() {
  document.addEventListener('scroll', hideSparkTip, true);
  renderCommodities();
  renderRecentlySearched();
  loadWatchlist();
  await loadIndices();
  updateLastUpdated();
  loadPopular();
  loadMovers();
  loadCommodities();
  loadFIIDII();
  loadSectors();
  hideEmptyAdSlots();
  window.addEventListener('load', hideEmptyAdSlots);
  setTimeout(hideEmptyAdSlots, 9000);
  setInterval(loadFIIDII, 10 * 60 * 1000); // refresh FII/DII every 10 minutes
})();



// ── Native High-Performance Scroll-Reveal ──
window.addEventListener('load', () => {
  const targets = document.querySelectorAll('.index-card, .market-summary-card, .sector-card, .popular-card, .movers-card, .info-card, .about-section, .faq-item, .legal-card, .result-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      } else {
        entry.target.classList.remove('visible');
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px -10px 0px'
  });
  targets.forEach(target => {
    target.classList.add('reveal-scroll');
    observer.observe(target);
  });
});

