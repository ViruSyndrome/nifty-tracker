// 12-Week Moving Average Strategy Logic for Nifty 50

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const currentSignalEl = document.getElementById('currentSignal');
  const metricsBox      = document.getElementById('metricsBox');
  const niftyCloseEl    = document.getElementById('niftyClose');
  const wmaValueEl      = document.getElementById('wmaValue');
  const diffValueEl     = document.getElementById('diffValue');
  const historyBody     = document.getElementById('historyTableBody');
  const chartCanvas     = document.getElementById('wmaChart');

  const SYMBOL = '^NSEI';
  
  // We need at least ~65 weeks to compute a robust 12WMA line and have ~1 year of plot data
  // Let's fetch 2 years of weekly data
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${SYMBOL}?interval=1wk&range=2y`;

  try {
    if (typeof proxyFetch === 'undefined') {
        throw new Error("proxyFetch is not defined. Ensure script.js is loaded first.");
    }
    
    const data = await proxyFetch(url);
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error("Invalid data format from Yahoo Finance.");

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    
    // Filter out null closes
    const cleanData = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] !== null && closes[i] !== undefined) {
        cleanData.push({
          date: new Date(timestamps[i] * 1000),
          close: closes[i]
        });
      }
    }

    if (cleanData.length < 12) {
      throw new Error("Not enough data to calculate 12-week moving average.");
    }

    // Calculate 12 WMA
    // For each point starting from index 11, average the last 12 closes
    const wmaPeriod = 12;
    for (let i = 0; i < cleanData.length; i++) {
      if (i >= wmaPeriod - 1) {
        let sum = 0;
        for (let j = 0; j < wmaPeriod; j++) {
          sum += cleanData[i - j].close;
        }
        cleanData[i].wma12 = sum / wmaPeriod;
      } else {
        cleanData[i].wma12 = null;
      }
    }

    // Prepare data for UI (use only the last 1 year / 52 weeks for the chart)
    const displayData = cleanData.slice(-52);
    
    // Latest values
    const latest = displayData[displayData.length - 1];
    const prev   = displayData[displayData.length - 2];
    
    // Determine Signal
    const isBuy = latest.close > latest.wma12;
    
    // Update DOM
    currentSignalEl.textContent = isBuy ? "BUY / HOLD" : "CASH / SELL";
    currentSignalEl.className = "signal-status " + (isBuy ? "buy" : "cash");
    
    niftyCloseEl.textContent = latest.close.toFixed(2);
    wmaValueEl.textContent = latest.wma12.toFixed(2);
    
    const diff = latest.close - latest.wma12;
    const diffPct = (diff / latest.wma12) * 100;
    diffValueEl.innerHTML = `<span style="color: ${diff > 0 ? 'var(--success)' : 'var(--danger)'}">${diff > 0 ? '+' : ''}${diffPct.toFixed(2)}%</span>`;
    
    currentSignalEl.classList.remove('loading');
    metricsBox.style.display = 'flex';

    // Populate History Table (Last 10 weeks, reversed so latest is top)
    const tableData = displayData.slice(-10).reverse();
    let rowsHtml = '';
    for (const row of tableData) {
      const dateStr = row.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const signal = row.close > row.wma12 ? 'BUY' : 'CASH';
      const badgeCls = signal === 'BUY' ? 'buy' : 'cash';
      const colorStyle = signal === 'BUY' ? 'color: var(--success); font-weight: 600;' : 'color: var(--danger); font-weight: 600;';
      
      rowsHtml += `
        <tr>
          <td>${dateStr}</td>
          <td style="${colorStyle}">${row.close.toFixed(2)}</td>
          <td>${row.wma12 ? row.wma12.toFixed(2) : '--'}</td>
          <td><span class="badge ${badgeCls}">${signal}</span></td>
        </tr>
      `;
    }
    historyBody.innerHTML = rowsHtml;

    // Render Chart.js
    const ctx = chartCanvas.getContext('2d');
    
    const labels = displayData.map(d => d.date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
    const niftyData = displayData.map(d => d.close);
    const wmaData = displayData.map(d => d.wma12);
    
    // Dynamic Colors based on Trend
    const isBullish = latest.close >= latest.wma12;
    const trendColor = isBullish ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'; // Success Green / Danger Red
    const trendGradient = ctx.createLinearGradient(0, 0, 0, 400);
    if (isBullish) {
      trendGradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
      trendGradient.addColorStop(1, 'rgba(34, 197, 94, 0.0)');
    } else {
      trendGradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
      trendGradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
    }

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Nifty 50 Close',
            data: niftyData,
            borderColor: trendColor,
            backgroundColor: trendGradient,
            borderWidth: 3,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: trendColor,
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
            tension: 0.4 // Smooth, curvy lines
          },
          {
            label: '12-Week MA',
            data: wmaData,
            borderColor: 'rgba(20, 184, 166, 0.8)', // Teal
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            pointHoverRadius: 0,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          x: {
            type: 'number',
            easing: 'linear',
            duration: 1000,
            from: NaN, // the point is initially skipped
            delay(ctx) {
              if (ctx.type !== 'data' || ctx.xStarted) {
                return 0;
              }
              ctx.xStarted = true;
              return ctx.index * 10;
            }
          },
          y: {
            type: 'number',
            easing: 'linear',
            duration: 1000,
            from: (ctx) => {
              return ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
            }
          }
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { family: 'Inter', size: 13 } }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { size: 13, family: 'Inter' },
            bodyFont: { size: 13, family: 'Inter' },
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            intersect: false,
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.parsed.y.toFixed(2);
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 12, font: { family: 'Inter' } }
          },
          y: {
            grid: { color: 'rgba(226, 232, 240, 0.5)' },
            ticks: { font: { family: 'Inter' } }
          }
        }
      }
    });

  } catch (err) {
    console.error("Error loading 12WMA data:", err);
    currentSignalEl.textContent = "Error loading data";
    historyBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--danger);">Could not fetch live market data. Try again later.</td></tr>`;
  }

  // ─── LIVE MARKET BREADTH SCANNER ───
  async function calculateMarketBreadth() {
    const statusText = document.getElementById('breadthStatusText');
    const progressBar = document.getElementById('breadthProgressBar');
    const metricResult = document.getElementById('breadthMetricResult');
    const funnel = document.getElementById('actionFunnel');
    if (!statusText || !progressBar) return;
    
    let bullCount = 0;
    let completed = 0;
    const symbols = NIFTY50_SYMBOLS;
    const chunkSize = 5;
    
    for (let i = 0; i < symbols.length; i += chunkSize) {
      const chunk = symbols.slice(i, i + chunkSize);
      const promises = chunk.map(async sym => {
        try {
          const res = await proxyFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1wk&range=6mo`, 5000);
          if (!res || !res.chart || !res.chart.result) return null;
          const quote = res.chart.result[0].indicators.quote[0];
          const closes = quote.close.filter(c => c !== null);
          if (closes.length < 13) return null; // need 12 weeks
          
          const price = closes[closes.length - 1];
          const wma = Indicators.last(Indicators.sma(closes, 12));
          if (price > wma) bullCount++;
        } catch(e) {}
      });
      
      await Promise.all(promises);
      completed += chunk.length;
      statusText.textContent = `Scanning ${Math.min(completed, symbols.length)} / ${symbols.length} Nifty Stocks...`;
      await new Promise(r => setTimeout(r, 400));
    }
    
    const breadthPct = (bullCount / symbols.length) * 100;
    progressBar.style.width = `${breadthPct}%`;
    metricResult.textContent = `${bullCount} of ${symbols.length} stocks (${breadthPct.toFixed(0)}%)`;
    
    if (breadthPct >= 50) {
      statusText.textContent = 'BULLISH BREADTH (Risk-On)';
      statusText.style.color = 'var(--success)';
      statusText.style.animation = 'none';
      if (funnel) funnel.style.display = 'flex';
    } else {
      statusText.textContent = 'BEARISH BREADTH (Risk-Off)';
      statusText.style.color = 'var(--danger)';
      statusText.style.animation = 'none';
      if (funnel) {
        funnel.style.display = 'flex';
        funnel.style.background = 'linear-gradient(135deg, var(--danger), #ef4444)';
        funnel.querySelector('h3').innerHTML = 'Market is Weak ⚠️';
        funnel.querySelector('p').innerHTML = 'Breakout setups are highly likely to fail right now.';
      }
    }
  }

  // Run breadth calculation in background
  setTimeout(calculateMarketBreadth, 1000);
});
