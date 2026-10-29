/**
 * GetNiftyReady — Cloudflare Worker CORS Proxy
 *
 * Deploy steps:
 * 1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. Paste this entire file → Deploy
 * 3. Copy your worker URL (e.g. https://nifty-proxy.YOUR-NAME.workers.dev)
 * 4. Update CF_WORKER in script.js with that URL
 *
 * Free tier: 100,000 requests/day — more than enough.
 */

const ALLOWED_ORIGINS = new Set([
  'https://www.getniftyready.com',
  'https://getniftyready.com',
  'http://localhost',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
]);

function corsOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  // Allow any localhost port for local file/dev servers
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return origin;
  return null;
}

function corsHeaders(request) {
  const allowed = corsOrigin(request);
  const headers = {
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Max-Age': '86400',
  };
  if (allowed) {
    headers['Access-Control-Allow-Origin'] = allowed;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    const originOk = corsOrigin(request);
    // Same-origin / non-browser callers (no Origin) are allowed; browsers must match allowlist.
    if (request.headers.has('Origin') && !originOk) {
      return new Response('Forbidden origin', { status: 403 });
    }

    const url = new URL(request.url);
    // action=mcx removed — Moneycontrol endpoint returns empty body (Akamai-blocked).
    // Gold/silver are fetched via GOLDBEES.BO and SILVERBEES.BO through the Yahoo Finance path below.

    const target = url.searchParams.get('url');

    if (!target) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // Restrict to Yahoo Finance only
    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch {
      return new Response('Invalid url', { status: 400 });
    }

    const allowed = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com', 'www.nseindia.com', 'nseindia.com'];
    if (!allowed.includes(targetUrl.hostname)) {
      return new Response('Forbidden', { status: 403 });
    }

    try {
      const response = await fetch(target, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.nseindia.com/',
          'Origin': 'https://www.nseindia.com',
        },
      });

      const data = await response.text();

      return new Response(data, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(request),
          'Cache-Control': 'public, max-age=60',
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message, status: 'timeout' }), {
        status: 504,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(request),
        },
      });
    }
  },
};
