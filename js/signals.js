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
  generate(closes) {
    const EMPTY = (reason = 'Insufficient data') => ({
      signal: 'NEUTRAL', confidence: 0, score: 0, indicators: {},
      recommendation: reason, arrays: {}, calculatedAt: new Date().toISOString(),
    });

    if (!closes || closes.length < 30) return EMPTY();
    const valid = closes.filter(v => v !== null && !isNaN(v));
    if (valid.length < 30) return EMPTY();

    // ── Calculate indicator arrays ──────────────────────────────────────────
    const rsiArr  = Indicators.rsi(closes, 14);
    const sma20   = Indicators.sma(closes, 20);
    const sma50   = closes.length >= 50 ? Indicators.sma(closes, 50) : Indicators.sma(closes, Math.max(10, Math.floor(closes.length / 2)));
    const macdData= Indicators.macd(closes);
    const bbData  = Indicators.bollingerBands(closes);

    // ── Get current (latest) values ─────────────────────────────────────────
    const price     = Indicators.last(closes);
    const rsi       = Indicators.last(rsiArr);
    const macdLine  = Indicators.last(macdData.macdLine);
    const macdSig   = Indicators.last(macdData.signalLine);
    const macdHist  = Indicators.last(macdData.histogram);
    const curSma20  = Indicators.last(sma20);
    const curSma50  = Indicators.last(sma50);
    const bbUpper   = Indicators.last(bbData.upper);
    const bbLower   = Indicators.last(bbData.lower);
    const bbMiddle  = Indicators.last(bbData.middle);
    const bbPctB    = Indicators.last(bbData.percentB);
    const crossover = Indicators.macdCrossover(macdData.macdLine, macdData.signalLine);

    let score = 0;
    const indDetails = {};

    // ── 1. RSI scoring (max ±2) ─────────────────────────────────────────────
    if (rsi !== null) {
      let s = 0, sig = 'NEUTRAL', desc = '';
      if      (rsi < 20)  { s =  2.0; sig = 'STRONG_BUY';  desc = 'Deeply oversold — high-probability reversal zone'; }
      else if (rsi < 30)  { s =  1.5; sig = 'BUY';         desc = 'Oversold — potential bounce forming'; }
      else if (rsi < 40)  { s =  0.5; sig = 'BUY';         desc = 'Cooling toward oversold — watch for entry'; }
      else if (rsi <= 60) { s =  0.0; sig = 'NEUTRAL';     desc = 'Neutral zone — no strong directional bias'; }
      else if (rsi <= 70) { s = -0.5; sig = 'NEUTRAL';     desc = 'Getting elevated — approaching overbought'; }
      else if (rsi <= 80) { s = -1.5; sig = 'SELL';        desc = 'Overbought — consider taking profits'; }
      else                { s = -2.0; sig = 'STRONG_SELL'; desc = 'Extremely overbought — high reversal risk'; }
      score += s;
      indDetails.rsi = { value: +rsi.toFixed(1), signal: sig, description: desc, score: s };
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

    // ── 3. Moving Average scoring (max ±1.5) ────────────────────────────────
    if (price !== null && curSma20 !== null) {
      let s = 0, sig = 'NEUTRAL', desc = '';
      const a20 = price > curSma20;
      const a50 = curSma50 !== null ? price > curSma50 : null;
      const alignment = curSma50 !== null ? curSma20 > curSma50 : null;

      if (a20) {
        if (a50 === null) { s = 0.5; sig = 'BUY'; desc = 'Price above 20-day moving average'; }
        else if (a50 === true) {
          if (alignment === true) { s = 1.5; sig = 'BUY'; desc = 'Price > 20MA > 50MA — perfect bullish alignment ✅'; }
          else { s = 1.0; sig = 'BUY'; desc = 'Price breaking above both 20MA and 50MA'; }
        } else {
          s = 0.5; sig = 'NEUTRAL'; desc = 'Price above 20MA but facing 50MA resistance';
        }
      } else {
        if (a50 === null) { s = -0.5; sig = 'SELL'; desc = 'Price below 20-day moving average'; }
        else if (a50 === false) {
          if (alignment === false) { s = -1.5; sig = 'SELL'; desc = 'Price < 20MA < 50MA — bearish alignment ❌'; }
          else { s = -1.0; sig = 'SELL'; desc = 'Price breaking below both 20MA and 50MA'; }
        } else {
          s = -0.5; sig = 'NEUTRAL'; desc = 'Price below 20MA but finding 50MA support';
        }
      }

      score += s;
      indDetails.movingAvg = {
        price: +price.toFixed(4), sma20: +(curSma20 || 0).toFixed(4),
        sma50: curSma50 !== null ? +curSma50.toFixed(4) : null,
        aboveSma20: a20, aboveSma50: a50,
        signal: sig, description: desc, score: s,
      };
    }

    // ── 4. Bollinger Bands scoring (max ±1) ──────────────────────────────────
    if (bbPctB !== null) {
      let s = 0, sig = 'NEUTRAL', desc = '';
      if      (bbPctB < 0.05)  { s =  1.0; sig = 'BUY';         desc = 'Price at/below lower band — extreme oversold squeeze'; }
      else if (bbPctB < 0.2)   { s =  0.5; sig = 'BUY';         desc = 'Near lower Bollinger Band — potential support bounce'; }
      else if (bbPctB > 0.95)  { s = -1.0; sig = 'SELL';        desc = 'Price at/above upper band — extreme overbought territory'; }
      else if (bbPctB > 0.8)   { s = -0.5; sig = 'SELL';        desc = 'Near upper Bollinger Band — potential resistance rejection'; }
      else                      { s =  0.0; sig = 'NEUTRAL';     desc = `Price within Bollinger range (${(bbPctB * 100).toFixed(0)}% of band width)`; }
      score += s;
      indDetails.bollinger = {
        upper: +(bbUpper || 0).toFixed(4), middle: +(bbMiddle || 0).toFixed(4), lower: +(bbLower || 0).toFixed(4),
        percentB: +(bbPctB * 100).toFixed(1),
        signal: sig, description: desc, score: s,
      };
    }

    // ── Confidence: % of sub-indicators agreeing with direction ──────────────
    const dir = score > 0.5 ? 'bull' : score < -0.5 ? 'bear' : 'flat';
    const indArr = Object.values(indDetails);
    const agree = indArr.filter(ind => {
      if (dir === 'bull') return ['BUY', 'STRONG_BUY'].includes(ind.signal);
      if (dir === 'bear') return ['SELL', 'STRONG_SELL'].includes(ind.signal);
      return ind.signal === 'NEUTRAL';
    }).length;
    const confidence = indArr.length > 0 ? Math.round((agree / indArr.length) * 100) : 0;

    // ── Determine composite signal ───────────────────────────────────────────
    // Strong signals require BOTH a high score AND at least 75% confidence
    // (3 out of 4 indicators must agree). This prevents a single dominant
    // indicator from triggering a false Strong Buy/Sell.
    let signal = 'NEUTRAL';
    if      (score >= 3.0 && confidence >= 75)  signal = 'STRONG_BUY';
    else if (score >= 1.0)                      signal = 'BUY';
    else if (score >= -1.0)                     signal = 'NEUTRAL';
    else if (score > -3.0 || confidence < 75)   signal = 'SELL';
    else                                        signal = 'STRONG_SELL';

    // ── Plain-English recommendation ─────────────────────────────────────────
    const recommendation = this._recommend(signal, score, indDetails);

    return {
      signal,
      confidence,
      score: +score.toFixed(2),
      indicators: indDetails,
      recommendation,
      arrays: { rsi: rsiArr, macd: macdData, sma20, sma50, bb: bbData, closes },
      calculatedAt: new Date().toISOString(),
    };
  },

  // ─── Recommendation text ───────────────────────────────────────────────────
  _recommend(signal, score, ind) {
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
    return text.join(' ');
  },

  /** Return the LEVEL object for a given signal key */
  level(signalKey) {
    return this.LEVELS[signalKey] || this.LEVELS.NEUTRAL;
  },
};
