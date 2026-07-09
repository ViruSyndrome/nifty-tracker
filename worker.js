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

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Max-Age': '86400',
        },
      });
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
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60',
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message, status: 'timeout' }), {
        status: 504,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
