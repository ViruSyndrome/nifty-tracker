'use strict';

/**
 * signals.js — Composite signal generation from technical indicators.
 * Scores each indicator, combines them, and outputs a Buy/Sell/Hold signal
 * with a confidence percentage and a plain-English recommendation.
 */
const Signals = {

  LEVELS: {
    STRONG_BUY:  { label: 'Strong Bullish',  short: 'S.BULL',  cls: 'strong-buy',  icon: '🚀', minScore:  3.0 },
    BUY:         { label: 'Bullish',          short: 'BULL',    cls: 'buy',          icon: '🟢', minScore:  1.0 },
    NEUTRAL:     { label: 'Neutral / Watch', short: 'NEUTRAL', cls: 'neutral',      icon: '⏸️',  minScore: -1.0 },
    SELL:        { label: 'Bearish',         short: 'BEAR',   cls: 'sell',         icon: '🔴', minScore: -3.0 },
    STRONG_SELL: { label: 'Strong Bearish', short: 'S.BEAR', cls: 'strong-sell',  icon: '🔻', minScore: -Infinity },
  },

  // ─── Main entry point ──────────────────────────────────────────────────────
  // opts: { highs, lows, volumes }
  generate(closes, opts = {}) {
    const EMPTY = (reason = 'Insufficient data') => ({
      signal: 'NEUTRAL', confidence: 0, score: 0, indicators: {},
      recommendation: reason,
      risk: null,
      quality: { score: 0, label: 'No Signal' },
      arrays: {},
      calculatedAt: new Date().toISOString(),
    });

    if (!closes || closes.length < 30) return EMPTY();
    const valid = closes.filter(v => v !== null && !isNaN(v));
    if (valid.length < 30) return EMPTY();

    const { highs, lows, volumes } = opts;

    // ── Calculate indicator arrays ──────────────────────────────────────────
    const rsiArr  = Indicators.rsi(closes, 14);
    const sma20   = Indicators.sma(closes, 20);
    const sma50Period = closes.length >= 50 ? 50 : Math.max(10, Math.floor(closes.length / 2));
    const sma50   = Indicators.sma(closes, sma50Period);
    const sma200  = closes.length >= 200 ? Indicators.sma(closes, 200) : null;
    const ema9    = Indicators.ema(closes, 9);
    const ema21   = Indicators.ema(closes, 21);
    const macdData= Indicators.macd(closes);
    const bbData  = Indicators.bollingerBands(closes);
    const atrArr  = (highs && lows) ? Indicators.atr(highs, lows, closes, 14) : null;

    // ── Get current (latest) values ─────────────────────────────────────────
    const price     = Indicators.last(closes);
    const rsi       = Indicators.last(rsiArr);
    const macdLine  = Indicators.last(macdData.macdLine);
    const macdSig   = Indicators.last(macdData.signalLine);
    const macdHist  = Indicators.last(macdData.histogram);
    const curSma20  = Indicators.last(sma20);
    const curSma50  = Indicators.last(sma50);
    const curSma200 = sma200 ? Indicators.last(sma200) : null;
    const curEma9   = Indicators.last(ema9);
    const curEma21  = Indicators.last(ema21);
    const bbUpper   = Indicators.last(bbData.upper);
    const bbLower   = Indicators.last(bbData.lower);
    const bbMiddle  = Indicators.last(bbData.middle);
    const bbPctB    = Indicators.last(bbData.percentB);
    const crossover = Indicators.macdCrossover(macdData.macdLine, macdData.signalLine);

    let score = 0;
    const indDetails = {};

    // Trend regime: price vs long SMA decides whether oversold = dip-buy or falling knife.
    const trendRef  = curSma200 !== null && curSma200 !== undefined ? curSma200 : curSma50;
    const inUptrend = trendRef !== null && trendRef !== undefined ? price > trendRef : true;

    // ── 1. RSI scoring (max ±1.5, trend-aware) ─────────────────────────────
    if (rsi !== null) {
      let s = 0, sig = 'NEUTRAL', desc = '';
      if (inUptrend) {
        if      (rsi < 30)  { s =  1.5; sig = 'BUY';     desc = 'Oversold pullback within an uptrend — classic dip-buy zone'; }
        else if (rsi < 40)  { s =  1.0; sig = 'BUY';     desc = 'Cooling dip in an uptrend — favorable entry'; }
        else if (rsi <= 65) { s =  0.0; sig = 'NEUTRAL'; desc = 'Neutral momentum within an uptrend'; }
        else if (rsi <= 80) { s = -0.5; sig = 'NEUTRAL'; desc = 'Hot but uptrends can stay overbought — caution'; }
        else                { s = -1.0; sig = 'SELL';    desc = 'Extremely overbought even for an uptrend — pullback likely'; }
      } else {
        if      (rsi < 30)  { s =  0.0; sig = 'NEUTRAL'; desc = 'Oversold in a downtrend — no buy points awarded'; }
        else if (rsi < 40)  { s =  0.0; sig = 'NEUTRAL'; desc = 'Weak momentum in a downtrend — no edge'; }
        else if (rsi <= 60) { s = -0.5; sig = 'NEUTRAL'; desc = 'Downtrend with neutral RSI — trend still points down'; }
        else if (rsi <= 70) { s = -1.0; sig = 'SELL';    desc = 'Bear-market rally losing steam — common exit zone'; }
        else                { s = -1.5; sig = 'SELL';    desc = 'Overbought inside a downtrend — high reversal risk'; }
      }
      score += s;
      indDetails.rsi = { value: +rsi.toFixed(1), inUptrend, signal: sig, description: desc, score: s };
    }

    // ── 2. MACD scoring (max ±2) ────────────────────────────────────────────
    if (macdLine !== null && macdSig !== null) {
      let s = 0, sig = 'NEUTRAL', desc = '';
      if      (crossover === 'bullish')             { s =  2.0; sig = 'STRONG_BUY';  desc = '🔔 Bullish crossover! MACD just crossed above signal line'; }
      else if (crossover === 'bearish')             { s = -2.0; sig = 'STRONG_SELL'; desc = '🔔 Bearish crossover! MACD just crossed below signal line'; }
      else if (macdLine > 0 && macdLine > macdSig) { s =  1.0; sig = 'BUY';         desc = 'MACD above zero and above signal — uptrend momentum confirmed'; }
      else if (macdLine > 0 && macdLine < macdSig) { s =  0.0; sig = 'NEUTRAL';     desc = 'MACD positive but losing steam — momentum fading'; }
      else if (macdLine < 0 && macdLine > macdSig) { s =  0.0; sig = 'NEUTRAL';     desc = 'MACD negative but recovering — early recovery signs'; }
      else                                          { s = -1.0; sig = 'SELL';        desc = 'MACD below zero and below signal — downtrend momentum'; }
      score += s;
      indDetails.macd = {
        value: +macdLine.toFixed(4), signalValue: +macdSig.toFixed(4),
        histogram: +(macdHist || 0).toFixed(4), crossover,
        signal: sig, description: desc, score: s,
      };
    }

    // ── 3. Dual MA scoring (EMA9/21 + SMA50 trend gate, max ±2) ─────────────
    if (price !== null && curSma20 !== null && curEma9 !== null && curEma21 !== null) {
      let s = 0, sig = 'NEUTRAL', desc = '';
      const a20 = price > curSma20;
      const a50 = curSma50 !== null ? price > curSma50 : null;
      const macroBullish = a50 === null ? true : a50;
      const microBullish = curEma9 > curEma21;

      if (macroBullish && microBullish) {
        s = 2.0; sig = 'BUY'; desc = 'Dual bullish alignment: EMA9 > EMA21 and price > SMA50';
      } else if (!macroBullish && !microBullish) {
        s = -2.0; sig = 'SELL'; desc = 'Dual bearish alignment: EMA9 < EMA21 and price < SMA50';
      } else if (macroBullish && !microBullish) {
        s = -0.5; sig = 'NEUTRAL'; desc = 'Macro uptrend, short-term pullback — wait for EMA9 crossover';
      } else {
        s = 0.5; sig = 'NEUTRAL'; desc = 'Counter-trend rally risk: EMA9 > EMA21 but below SMA50';
      }

      score += s;
      indDetails.movingAvg = {
        price: +price.toFixed(4), sma20: +(curSma20 || 0).toFixed(4),
        sma50: curSma50 !== null ? +curSma50.toFixed(4) : null,
        sma200: curSma200 !== null ? +curSma200.toFixed(4) : null,
        ema9: +curEma9.toFixed(4), ema21: +curEma21.toFixed(4),
        sma50Period,
        macroBullish, microBullish,
        aboveSma20: a20, aboveSma50: a50,
        signal: sig, description: desc, score: s,
      };
    }

    // ── 4. Bollinger Bands scoring (max ±1, trend-aware) ─────────────────────
    if (bbPctB !== null) {
      let s = 0, sig = 'NEUTRAL', desc = '';
      if (inUptrend) {
        if      (bbPctB < 0.2)   { s =  1.0; sig = 'BUY';     desc = 'Dip to lower Bollinger Band within an uptrend'; }
        else if (bbPctB > 0.95)  { s = -0.5; sig = 'NEUTRAL'; desc = 'Riding upper band — strong but stretched'; }
        else                      { s =  0.0; sig = 'NEUTRAL'; desc = `Price within Bollinger range (${(bbPctB * 100).toFixed(0)}% of band width)`; }
      } else {
        if      (bbPctB < 0.2)   { s =  0.0; sig = 'NEUTRAL'; desc = 'Lower band touch in downtrend — no buy points'; }
        else if (bbPctB > 0.8)   { s = -1.0; sig = 'SELL';    desc = 'Rally to upper band inside downtrend — likely rejection'; }
        else                      { s =  0.0; sig = 'NEUTRAL'; desc = `Price within Bollinger range (${(bbPctB * 100).toFixed(0)}% of band width)`; }
      }
      score += s;
      indDetails.bollinger = {
        upper: +(bbUpper || 0).toFixed(4), middle: +(bbMiddle || 0).toFixed(4), lower: +(bbLower || 0).toFixed(4),
        percentB: +(bbPctB * 100).toFixed(1),
        inUptrend, signal: sig, description: desc, score: s,
      };
    }

    // ── 5. Volume confirmation nudge (max ±0.5) ─────────────────────────────
    if (volumes && volumes.length >= 20 && score !== 0) {
      const lastVol = volumes[volumes.length - 1];
      const avg20 = Indicators.avgLast(volumes.slice(0, -1), 20);
      if (lastVol != null && avg20 && avg20 > 0) {
        const ratio = lastVol / avg20;
        let s = 0, desc = '';
        if      (ratio >= 1.5) { s = score > 0 ?  0.5 : -0.5; desc = `Volume ${ratio.toFixed(1)}x 20-day average confirms move`; }
        else if (ratio <= 0.5) { s = score > 0 ? -0.3 :  0.3; desc = `Volume ${ratio.toFixed(1)}x 20-day average weakens conviction`; }
        else                   { desc = `Volume near average (${ratio.toFixed(1)}x 20-day average)`; }
        score += s;
        indDetails.volume = {
          last: lastVol, avg20: +avg20.toFixed(2), ratio: +ratio.toFixed(2),
          signal: s > 0 ? 'BUY' : s < 0 ? 'SELL' : 'NEUTRAL',
          description: desc, score: s,
        };
      }
    }

    // ── Confidence: % of sub-indicators agreeing with direction ──────────────
    const dir = score > 0.5 ? 'bull' : score < -0.5 ? 'bear' : 'flat';
    const indArr = Object.values(indDetails);
    const directional = indArr.filter(ind => Math.abs(ind.score || 0) > 0.05);
    const pool = directional.length > 0 ? directional : indArr;
    const agree = pool.filter(ind => {
      if (dir === 'bull') return ['BUY', 'STRONG_BUY'].includes(ind.signal);
      if (dir === 'bear') return ['SELL', 'STRONG_SELL'].includes(ind.signal);
      return ind.signal === 'NEUTRAL';
    }).length;
    const confidence = pool.length > 0 ? Math.round((agree / pool.length) * 100) : 0;

    // ── Determine composite signal ───────────────────────────────────────────
    // Strong signals require BOTH a high score AND at least 75% confidence
    // (3 out of 4 indicators must agree). This prevents a single dominant
    // indicator from triggering a false Strong Buy/Sell.
    const WEAK_GATE = 30;
    const STRONG_GATE = 60;
    const ma = indDetails.movingAvg;
    const macd = indDetails.macd;
    const bullishTrendAligned = !!(ma?.macroBullish && ma?.microBullish);
    const bearishTrendAligned = !!(ma && !ma.macroBullish && !ma.microBullish);
    const bullishMomentumConfirmed = ['BUY', 'STRONG_BUY'].includes(macd?.signal) &&
      (macd?.crossover === 'bullish' || ((macd?.value ?? 0) > (macd?.signalValue ?? 0)));
    const bearishMomentumConfirmed = ['SELL', 'STRONG_SELL'].includes(macd?.signal) &&
      (macd?.crossover === 'bearish' || ((macd?.value ?? 0) < (macd?.signalValue ?? 0)));

    let signal = 'NEUTRAL';
    if (score >= this.LEVELS.BUY.minScore && confidence >= WEAK_GATE) {
      signal = 'BUY';
      if (score >= this.LEVELS.STRONG_BUY.minScore && confidence >= STRONG_GATE && bullishTrendAligned && bullishMomentumConfirmed) {
        signal = 'STRONG_BUY';
      }
    } else if (score <= this.LEVELS.SELL.minScore && confidence >= WEAK_GATE) {
      signal = 'SELL';
      if (score <= this.LEVELS.STRONG_SELL.minScore && confidence >= STRONG_GATE && bearishTrendAligned && bearishMomentumConfirmed) {
        signal = 'STRONG_SELL';
      }
    }

    // ── ATR-backed risk hints (market-agnostic) ─────────────────────────────
    const atrValueRaw = atrArr ? Indicators.last(atrArr) : null;
    const atrValue = atrValueRaw != null && !isNaN(atrValueRaw) ? +atrValueRaw.toFixed(4) : null;
    const atrPct = atrValue != null && price ? +((atrValue / price) * 100).toFixed(2) : null;
    const riskLevel = atrPct == null ? 'Unknown' : (atrPct <= 1.2 ? 'Low' : atrPct <= 2.8 ? 'Medium' : 'High');
    const stopMult = signal === 'STRONG_BUY' || signal === 'STRONG_SELL' ? 1.8 : 1.5;
    const tpMult = signal === 'STRONG_BUY' || signal === 'STRONG_SELL' ? 2.2 : 1.8;
    let risk = null;
    if (atrValue != null && price != null) {
      const isLongBias = signal === 'BUY' || signal === 'STRONG_BUY';
      const isShortBias = signal === 'SELL' || signal === 'STRONG_SELL';
      const stopLoss = isLongBias
        ? price - (atrValue * stopMult)
        : isShortBias
          ? price + (atrValue * stopMult)
          : null;
      const takeProfit = isLongBias
        ? price + (atrValue * tpMult)
        : isShortBias
          ? price - (atrValue * tpMult)
          : null;
      risk = {
        atr: atrValue,
        atrPercent: atrPct,
        level: riskLevel,
        stopLoss: stopLoss != null ? +stopLoss.toFixed(2) : null,
        takeProfit: takeProfit != null ? +takeProfit.toFixed(2) : null,
        direction: isLongBias ? 'LONG' : isShortBias ? 'SHORT' : 'NEUTRAL',
      };
    }

    // ── Quality score for ranking (0-100 conviction) ────────────────────────
    const normScore = Math.min(Math.abs(score) / 6.5, 1); // 0-1
    const trendBoost = bullishTrendAligned || bearishTrendAligned ? 10 : 0;
    const momentumBoost = bullishMomentumConfirmed || bearishMomentumConfirmed ? 8 : 0;
    const riskAdj = riskLevel === 'Low' ? 4 : riskLevel === 'High' ? -8 : riskLevel === 'Medium' ? -2 : 0;
    let qualityScore = Math.round(normScore * 45 + confidence * 0.35 + trendBoost + momentumBoost + riskAdj);
    qualityScore = Math.max(0, Math.min(100, qualityScore));
    const qualityLabel = qualityScore >= 80
      ? 'High Conviction'
      : qualityScore >= 65
        ? 'Good Setup'
        : qualityScore >= 50
          ? 'Watchlist'
          : 'Weak Setup';

    // ── Plain-English recommendation ─────────────────────────────────────────
    const recommendation = this._recommend(signal, score, indDetails, risk);

    return {
      signal,
      confidence,
      score: +score.toFixed(2),
      indicators: indDetails,
      recommendation,
      risk,
      quality: {
        score: qualityScore,
        label: qualityLabel,
      },
      arrays: { rsi: rsiArr, macd: macdData, sma20, sma50, sma200, ema9, ema21, bb: bbData, atr: atrArr, closes },
      calculatedAt: new Date().toISOString(),
    };
  },

  // ─── Recommendation text ───────────────────────────────────────────────────
  _recommend(signal, score, ind, risk) {
    const rsi  = ind.rsi?.value;
    const cross = ind.macd?.crossover;
    const ma   = ind.movingAvg;
    const bb   = ind.bollinger;

    let text = [];
    switch (signal) {
      case 'STRONG_BUY':
        text.push('🚀 Strong buying conditions detected.');
        if (rsi && rsi < 35) text.push(`RSI at ${rsi} signals deeply oversold levels.`);
        if (cross === 'bullish') text.push('A MACD bullish crossover just fired — a classic entry trigger.');
        if (ma?.aboveSma20 && ma?.aboveSma50) text.push('Price is in bullish MA alignment above both 20 & 50 SMA.');
        text.push('Consider entering with a defined stop-loss below nearest support. Risk only 1–2% of capital.');
        break;
      case 'BUY':
        text.push('📈 Lean bullish — conditions favor buyers, but confirmation is advised.');
        if (rsi && rsi < 50) text.push(`RSI at ${rsi} shows the asset is not overbought — room to run.`);
        text.push('Wait for a green candle confirmation before entering. Always set a stop-loss.');
        break;
      case 'NEUTRAL':
        text.push('⏸️ Mixed signals — no clear directional edge.');
        text.push('Sit on the sidelines or hold existing positions. Avoid new entries until a clearer setup forms.');
        text.push('Watch for a breakout above resistance or a breakdown below support.');
        break;
      case 'SELL':
        text.push('📉 Conditions lean bearish — consider reducing exposure.');
        if (rsi && rsi > 60) text.push(`RSI at ${rsi} suggests the asset may be running out of steam.`);
        if (ma && !ma.aboveSma20) text.push('Price has broken below the 20-day moving average — a warning sign.');
        text.push('If holding a long position, consider tightening your stop-loss.');
        break;
      case 'STRONG_SELL':
        text.push('🔻 Strong selling conditions. High risk for longs.');
        if (rsi && rsi > 70) text.push(`RSI at ${rsi} is in extreme overbought territory.`);
        if (cross === 'bearish') text.push('A MACD bearish crossover confirms selling pressure.');
        text.push('⚠️ Do NOT average down against this signal. Protect your capital first.');
        break;
    }
    if (risk && risk.atrPercent != null) {
      text.push(`Volatility: ATR is ${risk.atrPercent}% of price (${risk.level.toLowerCase()} risk regime).`);
      if (risk.stopLoss != null) text.push(`Illustrative stop zone: ₹${risk.stopLoss.toFixed(2)}.`);
      if (risk.takeProfit != null) text.push(`Illustrative first target: ₹${risk.takeProfit.toFixed(2)}.`);
    }
    return text.join(' ');
  },

  /** Return the LEVEL object for a given signal key */
  level(signalKey) {
    return this.LEVELS[signalKey] || this.LEVELS.NEUTRAL;
  },
};
