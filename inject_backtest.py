import os
import re

os.chdir(r'C:\Users\Vinod\Desktop\Website ideas\Nifty-Tracker')

# 1. Update HTML
html_path = '12-week-moving-average.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

backtest_ui = """
    <!-- BACKTEST RESULTS -->
    <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem 2rem; margin-bottom: 2rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <h2 style="font-size: 1.2rem; margin-top: 0; margin-bottom: 1.5rem; color: var(--text); border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">5-Year Historical Backtest <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted); float: right; margin-top: 4px;">Live Data</span></h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
        <div style="padding: 1.25rem; background: rgba(0,0,0,0.02); border-radius: 12px; border: 1px solid var(--border);">
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Buy & Hold Return</div>
          <div id="btBhReturn" style="font-size: 1.5rem; font-weight: 700; color: var(--text);">--</div>
        </div>
        <div style="padding: 1.25rem; background: rgba(34, 197, 94, 0.05); border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.2);">
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">12-WMA Strategy</div>
          <div id="btWmaReturn" style="font-size: 1.5rem; font-weight: 700; color: var(--success);">--</div>
        </div>
        <div style="padding: 1.25rem; background: rgba(0,0,0,0.02); border-radius: 12px; border: 1px solid var(--border);">
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Outperformance</div>
          <div id="btOutperformance" style="font-size: 1.5rem; font-weight: 700;">--</div>
        </div>
        <div style="padding: 1.25rem; background: rgba(0,0,0,0.02); border-radius: 12px; border: 1px solid var(--border);">
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Total Trades (5y)</div>
          <div id="btTrades" style="font-size: 1.5rem; font-weight: 700; color: var(--text);">--</div>
        </div>
      </div>
      <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 1rem; margin-bottom: 0; text-align: center;">*Backtest assumes buying on the Monday open following a weekly close above/below the 12WMA. Taxes and slippage not included.</p>
    </div>
"""

if 'id="btBhReturn"' not in html:
    html = html.replace('<div class="chart-container">', backtest_ui + '\n    <div class="chart-container">')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
        print("Patched HTML")


# 2. Update JS
js_path = 'wma-strategy.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Change URL to 5y
js = js.replace('range=2y', 'range=5y')

# Inject Backtest logic
backtest_js = """
    // --- BACKTEST LOGIC (5-Year) ---
    try {
      let initialCapital = 10000;
      let cash = initialCapital;
      let shares = 0;
      let position = 'CASH';
      
      let bhShares = initialCapital / cleanData[wmaPeriod].close;
      let trades = 0;
      
      for(let i = wmaPeriod + 1; i < cleanData.length; i++) {
        const row = cleanData[i];
        const prevRow = cleanData[i-1];
        
        // Signal logic based on previous week's close vs WMA
        if (prevRow.close > prevRow.wma12 && position === 'CASH') {
           // Buy at current week's close (approximation for next open)
           shares = cash / row.close;
           cash = 0;
           position = 'LONG';
           trades++;
        } else if (prevRow.close < prevRow.wma12 && position === 'LONG') {
           // Sell at current week's close
           cash = shares * row.close;
           shares = 0;
           position = 'CASH';
           trades++;
        }
      }
      
      const finalWmaValue = position === 'LONG' ? (shares * cleanData[cleanData.length-1].close) : cash;
      const finalBhValue = bhShares * cleanData[cleanData.length-1].close;
      
      const wmaReturn = ((finalWmaValue - initialCapital) / initialCapital) * 100;
      const bhReturn = ((finalBhValue - initialCapital) / initialCapital) * 100;
      
      const outperformance = wmaReturn - bhReturn;
      
      const btTradesEl = document.getElementById('btTrades');
      const btWmaReturnEl = document.getElementById('btWmaReturn');
      const btBhReturnEl = document.getElementById('btBhReturn');
      const btDiffEl = document.getElementById('btOutperformance');
      
      if(btTradesEl) btTradesEl.textContent = trades;
      if(btWmaReturnEl) btWmaReturnEl.textContent = wmaReturn.toFixed(1) + '%';
      if(btBhReturnEl) btBhReturnEl.textContent = bhReturn.toFixed(1) + '%';
      
      if(btDiffEl) {
        btDiffEl.textContent = (outperformance > 0 ? '+' : '') + outperformance.toFixed(1) + '%';
        btDiffEl.style.color = outperformance > 0 ? 'var(--success)' : 'var(--danger)';
      }
    } catch(err) {
      console.error("Backtest error:", err);
    }
    // --- END BACKTEST LOGIC ---

"""

if 'BACKTEST LOGIC' not in js:
    # Inject right before displayData definition
    js = js.replace('// Prepare data for UI', backtest_js + '\n    // Prepare data for UI')
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js)
        print("Patched JS")
