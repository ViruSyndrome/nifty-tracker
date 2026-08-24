'use strict';

const BreakoutEngine = {
  // Looks for Bollinger Squeezes followed by volume surges and price breakouts.
  // Adapted from Crypto Moonshot Scanner for Indian Stocks.
  generateBreakout(closes, opts = {}) {
    const EMPTY = (reason = 'Insufficient data') => ({
      signal: 'NEUTRAL', confidence: 0, score: 0, indicators: {},
      recommendation: reason, arrays: {}, calculatedAt: new Date().toISOString(),
    });

    if (!closes || closes.length < 30) return EMPTY();
    const { highs, lows, volumes, marketRegime } = opts;

    // ── Calculate required indicator arrays ───────────────────────
    const bbData = Indicators.bollingerBands(closes, 20, 2);
    const bbwArr = bbData.bandWidth; // Normalized BBW array
    const sma50Arr = Indicators.sma(closes, 50);
    const ema9Arr = Indicators.ema(closes, 9);
    const rsiArr = Indicators.rsi(closes, 14);
    
    // ── Current Values ───────────────────────────────────────────
    const price = Indicators.last(closes);
    const bbUpper = Indicators.last(bbData.upper);
    const previousBbUpper = bbData.upper.length >= 2 ? bbData.upper[bbData.upper.length - 2] : null;
    const bbLower = Indicators.last(bbData.lower);
    const bbw = Indicators.last(bbwArr);
    const ema9 = Indicators.last(ema9Arr);
    const rsiVal = Indicators.last(rsiArr);
    const lookbackStart = Math.max(0, closes.length - 21);
    const priorHighs = highs?.slice(lookbackStart, -1).filter(Number.isFinite) || [];
    const priorSwingHigh = priorHighs.length ? Math.max(...priorHighs) : null;
    const priorClose = closes.length >= 2 ? closes[closes.length - 2] : null;
    
    // Average BBW over last 20 days to detect compression
    const bbwAvg20 = Indicators.avgLast(bbwArr, 20);
    const prevBbw = bbwArr.length >= 2 ? bbwArr[bbwArr.length - 2] : null;
    // We check if it was squeezing BEFORE the breakout blew the bands open
    const isSqueezing = prevBbw !== null && bbwAvg20 !== null && prevBbw < bbwAvg20 * 0.8; 

    // Volume Surge Detection
    let isVolumeSurge = false;
    let volumeRatio = 1;
    if (volumes && volumes.length >= 20) {
      const currentVol = volumes[volumes.length - 1];
      const avgVol = Indicators.avgLast(volumes.slice(0, -2), 20);
      if (avgVol && avgVol > 0) {
        const curRatio = currentVol / avgVol;
        volumeRatio = curRatio;
        isVolumeSurge = volumeRatio >= 1.5; // 150% average volume
      }
    }

    let score = 0;
    let desc = [];
    
    // 1. Core Breakout logic (Price crossing above Upper Band)
    const breakoutBuffer = bbUpper ? (price > bbUpper ? (price - bbUpper) / bbUpper : 0) : 0;
    // We want the PREVIOUS close to be inside the bands, and the CURRENT close to break out above them.
    const isBreakingOut = bbUpper && price > bbUpper && breakoutBuffer >= 0.005 && (
      // Check current candle: prior close was inside bands
      (priorClose !== null && previousBbUpper !== null && priorClose <= previousBbUpper) ||
      // OR check 2nd-to-last candle (breakout happened 1 candle ago, still holding)
      (closes.length >= 3 && bbData.upper.length >= 3 &&
        closes[closes.length - 3] <= bbData.upper[bbData.upper.length - 3] &&
        closes[closes.length - 2] > bbData.upper[bbData.upper.length - 2])
    );
    
    if (isBreakingOut) {
      score += 2;
      desc.push("Closed above the upper Bollinger Band.");
      // Bonus for also exceeding prior swing high
      if (priorSwingHigh !== null && price > priorSwingHigh) {
        score += 0.5;
        desc.push("Also exceeded the prior 20-bar swing high.");
      }
    }
    
    // 2. Squeeze condition (Coiled Spring)
    if (isSqueezing && isBreakingOut) {
      score += 2;
      desc.push("Volatility Squeeze detected: Breakout is occurring after extreme consolidation.");
    }
    
    // 3. Volume Anomaly (Institutional Buying)
    if (isVolumeSurge && isBreakingOut) {
      score += 1.5;
      desc.push(`Volume Anomaly: ${volumeRatio.toFixed(1)}x average volume confirming the move.`);
    }

    // 4. Trend Alignment (Don't buy falling knives)
    const healthyBreakoutCandle = priorClose !== null && price > priorClose;
    if (price > ema9 && healthyBreakoutCandle) {
      score += 0.5;
    } else if (isBreakingOut) {
      score -= 2;
      desc.push("Price is below 9 EMA or candle is red. Breakout failed.");
    }

    // 5. Market Regime Filter (Protect against Nifty dumps)
    if (marketRegime === 'bear' && opts.symbol !== '^NSEI') {
      score -= 3; // Huge penalty for breakout attempts during a market crash
      desc.push("Market Regime is Bearish (Nifty 50 < 50 SMA). Breakouts are likely fakeouts.");
    }

    let signal = 'NEUTRAL';
    if (score >= 5.0) signal = 'STRONG_BUY';
    else if (score >= 3.0) signal = 'BUY';
    else if (score <= -2.0) signal = 'SELL';

    // Standard ATR-based Stop-Loss
    let stopSuggest = null;
    let chandExit = null;
    if (highs && lows) {
      chandExit = Indicators.chandelierExit(highs, lows, closes, 22, 3);
      const atrArr = Indicators.atr(highs, lows, closes, 14);
      const curAtr = Indicators.last(atrArr);
      
      if (curAtr && (signal.includes('BUY') || signal.includes('SELL'))) {
        const isLong = signal.includes('BUY');
        const mult = 2.5; // Slightly wider stop for breakouts
        const risk = curAtr * mult;
        const stopPrice = isLong ? price - risk : price + risk;
        const takeProfitPrice = isLong ? price + risk * 2 : price - risk * 2;
        const distPct = ((risk / price) * 100).toFixed(2);
        
        stopSuggest = {
          stopPrice: +stopPrice.toFixed(2),
          takeProfitPrice: +takeProfitPrice.toFixed(2),
          distancePct: +distPct,
          takeProfitPct: +(((risk * 2) / price) * 100).toFixed(2),
          riskMultiple: 2,
          side: isLong ? 'long' : 'short'
        };
        desc.push(`Suggested Stop: ₹${stopPrice.toFixed(2)} (${distPct}% away) with a 2R partial-profit target.`);
      }
    }

    return {
      signal,
      conviction: signal === 'STRONG_BUY' ? 'strong' : (signal === 'BUY' ? 'standard' : 'none'),
      confidence: score >= 5.0 ? 100 : (score >= 3.0 ? 75 : 0),
      score: +score.toFixed(2),
      indicators: {
        breakout: { isSqueezing, isBreakingOut, breakoutBuffer: +(breakoutBuffer * 100).toFixed(2), priorSwingHigh, healthyBreakoutCandle, volumeRatio, isVolumeSurge },
        rsi: { value: rsiVal !== null ? Math.round(rsiVal) : null }
      },
      recommendation: desc.join(' ') || 'No breakout setup detected.',
      stopSuggest,
      arrays: { closes, highs, lows, bb: bbData, chandelier: chandExit, rsi: rsiArr },
      calculatedAt: new Date().toISOString(),
    };
  }
};
