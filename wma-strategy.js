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

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Nifty 50 Close',
            data: niftyData,
            borderColor: '#f1f5f9',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            tension: 0.1
          },
          {
            label: '12-Week MA',
            data: wmaData,
            borderColor: '#3b82f6',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            pointHoverRadius: 5,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { size: 13, family: 'Inter' },
            bodyFont: { size: 13, family: 'Inter' },
            padding: 10,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toFixed(2);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 12 }
          },
          y: {
            grid: { color: '#e2e8f0' }
          }
        }
      }
    });

  } catch (err) {
    console.error("Error loading 12WMA data:", err);
    currentSignalEl.textContent = "Error loading data";
    historyBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--danger);">Could not fetch live market data. Try again later.</td></tr>`;
  }
});

