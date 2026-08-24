'use strict';

const Scanner = {
  isRunning: false,
  savedBreakouts: JSON.parse(localStorage.getItem('nifty_breakouts') || '[]'),
  
  async runFullScan() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    const btn = document.getElementById('runScannerBtn');
    const status = document.getElementById('scannerStatus');
    const progress = document.getElementById('scannerProgress');
    const grid = document.getElementById('breakoutGrid');
    
    if(btn) btn.disabled = true;
    if(grid) grid.innerHTML = '';
    if(status) status.innerText = 'Initializing scan...';
    if(progress) progress.style.width = '0%';
    
    try {
      // 1. Get Nifty Regime
      const niftyRes = await proxyFetch(`https://query1.finance.yahoo.com/v8/finance/chart/^NSEI?interval=1d&range=6mo`, 5000);
      let marketRegime = 'flat';
      if (niftyRes && niftyRes.chart && niftyRes.chart.result && niftyRes.chart.result[0]) {
        const c = niftyRes.chart.result[0].indicators.quote[0];
        const closes = c.close;
        if (closes && closes.length > 50) {
          const sma50 = Indicators.last(Indicators.sma(closes, 50));
          const price = closes[closes.length - 1];
          marketRegime = price > sma50 ? 'bull' : 'bear';
        }
      }
      
      const allSymbols = [...new Set([...NIFTY50_SYMBOLS, ...BROAD_MARKET_SYMBOLS])];
      let results = [];
      let completed = 0;
      
      const chunkSize = 5;
      for (let i = 0; i < allSymbols.length; i += chunkSize) {
        const chunk = allSymbols.slice(i, i + chunkSize);
        
        const promises = chunk.map(async sym => {
          try {
            const res = await proxyFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=6mo`, 6000);
            if (!res || !res.chart || !res.chart.result || !res.chart.result[0]) return null;
            
            const quote = res.chart.result[0].indicators.quote[0];
            const timestamp = res.chart.result[0].timestamp;
            if (!quote || !quote.close || quote.close.length < 50) return null;
            
            const closes = quote.close.filter(c => c !== null);
            const highs = quote.high.filter(c => c !== null);
            const lows = quote.low.filter(c => c !== null);
            const volumes = quote.volume.filter(c => c !== null);
            
            if (closes.length < 30) return null;
            
            const b = BreakoutEngine.generateBreakout(closes, { highs, lows, volumes, marketRegime, symbol: sym });
            if (b.signal === 'BUY' || b.signal === 'STRONG_BUY') {
              return { symbol: sym, price: Indicators.last(closes), breakout: b, history: closes };
            }
            return null;
          } catch(e) {
            console.warn("Scanner failed for", sym, e);
            return null;
          }
        });
        
        const chunkRes = await Promise.all(promises);
        results.push(...chunkRes.filter(Boolean));
        completed += chunk.length;
        
        if (status) status.innerText = `Scanning... ${Math.min(completed, allSymbols.length)} / ${allSymbols.length}`;
        if (progress) progress.style.width = `${(completed / allSymbols.length) * 100}%`;
        
        // Wait before next chunk to avoid Yahoo ban
        await new Promise(r => setTimeout(r, 600)); 
      }
      
      // Sort by score
      results.sort((a,b) => b.breakout.score - a.breakout.score);
      
      // Save top 8 to localStorage for auto-refresh
      this.savedBreakouts = results.slice(0, 8).map(r => r.symbol);
      localStorage.setItem('nifty_breakouts', JSON.stringify(this.savedBreakouts));
      
      this.renderGrid(results);
      if (status) status.innerText = `Scan complete! Found ${results.length} breakout setups.`;
      
    } catch(err) {
      console.error(err);
      if (status) status.innerText = 'Scan failed due to an error or rate limit.';
    } finally {
      this.isRunning = false;
      if(btn) btn.disabled = false;
    }
  },
  
  async refreshSavedBreakouts() {
    if (!this.savedBreakouts || this.savedBreakouts.length === 0) return;
    const grid = document.getElementById('breakoutGrid');
    const status = document.getElementById('scannerStatus');
    
    if (grid && grid.innerHTML.trim() === '') {
      grid.innerHTML = '<div class="mover-empty" style="grid-column: 1 / -1;">Checking live signals for tracked breakouts...</div>';
    }
    
    try {
      const niftyRes = await proxyFetch(`https://query1.finance.yahoo.com/v8/finance/chart/^NSEI?interval=1d&range=6mo`, 5000);
      let marketRegime = 'flat';
      if (niftyRes && niftyRes.chart && niftyRes.chart.result && niftyRes.chart.result[0]) {
        const c = niftyRes.chart.result[0].indicators.quote[0];
        const closes = c.close.filter(c => c !== null);
        if (closes && closes.length > 50) {
          const sma50 = Indicators.last(Indicators.sma(closes, 50));
          const price = closes[closes.length - 1];
          marketRegime = price > sma50 ? 'bull' : 'bear';
        }
      }

      let results = [];
      const promises = this.savedBreakouts.map(async sym => {
        try {
          const res = await proxyFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=6mo`, 6000);
          if (!res || !res.chart || !res.chart.result || !res.chart.result[0]) return null;
          const quote = res.chart.result[0].indicators.quote[0];
          const closes = quote.close.filter(c => c !== null);
          const highs = quote.high.filter(c => c !== null);
          const lows = quote.low.filter(c => c !== null);
          const volumes = quote.volume.filter(c => c !== null);
          
          if (closes.length < 30) return null;

          const b = BreakoutEngine.generateBreakout(closes, { highs, lows, volumes, marketRegime, symbol: sym });
          if (b.signal === 'BUY' || b.signal === 'STRONG_BUY') {
            return { symbol: sym, price: Indicators.last(closes), breakout: b, history: closes };
          }
          return null;
        } catch(e) {
          return null;
        }
      });
      
      const chunkRes = await Promise.all(promises);
      results = chunkRes.filter(Boolean);
      results.sort((a,b) => b.breakout.score - a.breakout.score);
      
      // Update saved list (auto clean losers)
      this.savedBreakouts = results.map(r => r.symbol);
      localStorage.setItem('nifty_breakouts', JSON.stringify(this.savedBreakouts));
      
      this.renderGrid(results);
      if (status) status.innerText = `Monitoring ${results.length} active breakout setups.`;
      
    } catch(err) {
      console.error(err);
    }
  },
  
  renderGrid(results) {
    const grid = document.getElementById('breakoutGrid');
    if (!grid) return;
    
    if (results.length === 0) {
      grid.innerHTML = `<div class="mover-empty" style="grid-column: 1 / -1; padding: 20px; background: var(--card-bg); border-radius:8px;">No strong breakouts detected right now.</div>`;
      return;
    }
    
    grid.innerHTML = results.map(r => {
      const b = r.breakout;
      const sigClass = b.signal === 'STRONG_BUY' ? 'up' : 'up';
      const score = b.score;
      const name = r.symbol.replace('.NS','').replace('.BO','');
      
      // Build a simple SVG sparkline
      const cl = r.history.slice(-30);
      let sparkHTML = '';
      if (cl.length > 5) {
        const min = Math.min(...cl);
        const max = Math.max(...cl);
        const range = max - min || 1;
        const width = 100;
        const height = 30;
        const pts = cl.map((c, i) => `${(i / (cl.length - 1)) * width},${height - ((c - min) / range) * height}`).join(' ');
        sparkHTML = `<svg viewBox="0 0 100 30" class="sparkline" preserveAspectRatio="none" style="width:100%; height:100%;">
          <polyline points="${pts}" fill="none" stroke="var(--success)" stroke-width="2" vector-effect="non-scaling-stroke"></polyline>
        </svg>`;
      }
      
      return `
        <div style="background:var(--card-bg); padding:15px; border-radius:12px; border:1px solid var(--border); border-left: 4px solid var(--success);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <a href="stock/${r.symbol.toLowerCase().replace('.ns','-share-price.html')}" style="font-weight:700; color:var(--text-main); font-size:1.1rem; text-decoration:none;">${name}</a>
            <span class="pct ${sigClass}" style="padding:4px 8px; border-radius:4px; font-weight:bold; background:rgba(34,197,94,0.1); color:var(--success); font-size:0.8rem;">${b.signal}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <span style="color:var(--text-muted); font-size:0.9rem;">₹${r.price.toFixed(2)}</span>
            <span style="color:var(--text-muted); font-size:0.9rem;">Score: <strong style="color:var(--text-main);">${score}</strong></span>
          </div>
          ${sparkHTML ? `<div style="height:35px; margin-bottom:10px; width:100%;">${sparkHTML}</div>` : ''}
          <div style="font-size:0.85rem; color:var(--text-muted); line-height:1.4;">
            ${b.recommendation}
          </div>
        </div>
      `;
    }).join('');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('runScannerBtn');
  if (btn) {
    btn.addEventListener('click', () => Scanner.runFullScan());
  }
  
  // Auto-refresh saved breakouts after basic rendering completes
  if (document.getElementById('breakoutGrid')) {
    setTimeout(() => {
      Scanner.refreshSavedBreakouts();
    }, 2500);
  }
});
