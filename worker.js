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
    const action = url.searchParams.get('action');
    
    if (action === 'mcx') {
      try {
        const response = await fetch('https://priceapi.moneycontrol.com/pricefeed/mcx/commoditysummary', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/json'
          }
        });
        const data = await response.text();
        return new Response(data, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'max-age=60',
          },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'MCX fetch failed' }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
      }
    }

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
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://finance.yahoo.com/',
        },
      });

      const data = await response.text();

      return new Response(data, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'max-age=30',
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
