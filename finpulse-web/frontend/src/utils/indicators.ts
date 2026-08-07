/**
 * Technical analysis indicators calculation library.
 * Computes SMA, EMA, VWAP, Bollinger Bands, RSI, MACD, Stochastic, and ATR.
 */

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ----------------------------------------------------
// Overlays Calculations
// ----------------------------------------------------

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(data: Candle[], period: number): { time: number; value: number }[] {
  const result: { time: number; value: number }[] = [];
  if (data.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  result.push({ time: data[period - 1].time, value: sum / period });

  for (let i = period; i < data.length; i++) {
    sum = sum - data[i - period].close + data[i].close;
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(data: { time: number; close: number }[], period: number): { time: number; value: number }[] {
  const result: { time: number; value: number }[] = [];
  if (data.length < period) return result;

  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  let ema = sum / period;
  result.push({ time: data[period - 1].time, value: ema });

  for (let i = period; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
    result.push({ time: data[i].time, value: ema });
  }
  return result;
}

/**
 * Calculates Volume Weighted Average Price (VWAP)
 * Resets at start of new day for intraday charts, cumulative for daily+
 */
export function calculateVWAP(data: Candle[]): { time: number; value: number }[] {
  const result: { time: number; value: number }[] = [];
  if (data.length === 0) return result;

  // Determine if timeframe is intraday
  let isIntraday = false;
  if (data.length > 1) {
    const avgSpacing = (data[data.length - 1].time - data[0].time) / (data.length - 1);
    isIntraday = avgSpacing < 80000; // Less than 22 hours = intraday
  }

  let cumulativeTypicalVolume = 0;
  let cumulativeVolume = 0;
  let prevDateString = "";

  for (let i = 0; i < data.length; i++) {
    const bar = data[i];
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    const volume = bar.volume;

    if (isIntraday) {
      const dateString = new Date(bar.time * 1000).toDateString();
      if (dateString !== prevDateString) {
        cumulativeTypicalVolume = 0;
        cumulativeVolume = 0;
        prevDateString = dateString;
      }
    }

    cumulativeTypicalVolume += typicalPrice * volume;
    cumulativeVolume += volume;

    const vwapValue = cumulativeVolume > 0 ? (cumulativeTypicalVolume / cumulativeVolume) : typicalPrice;
    result.push({ time: bar.time, value: vwapValue });
  }
  return result;
}

/**
 * Calculates Bollinger Bands (basis, upper, lower)
 */
export function calculateBollingerBands(
  data: Candle[],
  period: number = 20,
  multiplier: number = 2
): { time: number; middle: number; upper: number; lower: number }[] {
  const result: { time: number; middle: number; upper: number; lower: number }[] = [];
  if (data.length < period) return result;

  for (let i = period - 1; i < data.length; i++) {
    // Middle Band (SMA)
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j].close;
    }
    const middle = sum / period;

    // Variance & Standard Deviation
    let varianceSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      varianceSum += Math.pow(data[j].close - middle, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);

    const upper = middle + multiplier * stdDev;
    const lower = middle - multiplier * stdDev;

    result.push({
      time: data[i].time,
      middle,
      upper,
      lower,
    });
  }
  return result;
}

// ----------------------------------------------------
// Separated Panes Calculations
// ----------------------------------------------------

/**
 * Calculates Relative Strength Index (RSI)
 */
export function calculateRSI(data: Candle[], period: number = 14): { time: number; value: number }[] {
  const result: { time: number; value: number }[] = [];
  if (data.length <= period) return result;

  let gains = 0;
  let losses = 0;

  // First RSI value (Simple average of gain/loss)
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff > 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);
  result.push({ time: data[period].time, value: rsi });

  // Subsequent values using Wilder's smoothing
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);
    result.push({ time: data[i].time, value: rsi });
  }

  return result;
}

/**
 * Calculates Moving Average Convergence Divergence (MACD)
 */
export function calculateMACD(
  data: Candle[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { time: number; macd: number; signal: number; histogram: number }[] {
  const result: { time: number; macd: number; signal: number; histogram: number }[] = [];

  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  const fastMap = new Map(fastEMA.map((d) => [d.time, d.value]));
  const macdLineData: { time: number; close: number }[] = [];

  for (const item of slowEMA) {
    const fVal = fastMap.get(item.time);
    if (fVal !== undefined) {
      const macdVal = fVal - item.value;
      macdLineData.push({ time: item.time, close: macdVal });
    }
  }

  if (macdLineData.length < signalPeriod) return result;

  const signalEMA = calculateEMA(macdLineData, signalPeriod);
  const signalMap = new Map(signalEMA.map((d) => [d.time, d.value]));

  for (const item of macdLineData) {
    const sigVal = signalMap.get(item.time);
    if (sigVal !== undefined) {
      const histVal = item.close - sigVal;
      result.push({
        time: item.time,
        macd: item.close,
        signal: sigVal,
        histogram: histVal,
      });
    }
  }

  return result;
}

/**
 * Calculates Stochastic Oscillator (%K and %D lines)
 */
export function calculateStochastic(
  data: Candle[],
  kPeriod: number = 14,
  kSmooth: number = 3,
  dPeriod: number = 3
): { time: number; k: number; d: number }[] {
  const result: { time: number; k: number; d: number }[] = [];
  if (data.length < kPeriod) return result;

  const kFast: { time: number; value: number }[] = [];

  for (let i = kPeriod - 1; i < data.length; i++) {
    let minLow = Infinity;
    let maxHigh = -Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (data[j].low < minLow) minLow = data[j].low;
      if (data[j].high > maxHigh) maxHigh = data[j].high;
    }

    const diff = maxHigh - minLow;
    const fastK = diff === 0 ? 50 : ((data[i].close - minLow) / diff) * 100;
    kFast.push({ time: data[i].time, value: fastK });
  }

  const kSlow: { time: number; close: number }[] = [];
  if (kFast.length < kSmooth) return result;

  for (let i = kSmooth - 1; i < kFast.length; i++) {
    let sum = 0;
    for (let j = i - kSmooth + 1; j <= i; j++) {
      sum += kFast[j].value;
    }
    kSlow.push({ time: kFast[i].time, close: sum / kSmooth });
  }

  if (kSlow.length < dPeriod) return result;

  for (let i = dPeriod - 1; i < kSlow.length; i++) {
    let sum = 0;
    for (let j = i - dPeriod + 1; j <= i; j++) {
      sum += kSlow[j].close;
    }
    result.push({
      time: kSlow[i].time,
      k: kSlow[i].close,
      d: sum / dPeriod,
    });
  }

  return result;
}

/**
 * Calculates Average True Range (ATR)
 */
export function calculateATR(data: Candle[], period: number = 14): { time: number; value: number }[] {
  const result: { time: number; value: number }[] = [];
  if (data.length <= period) return result;

  const trs: { time: number; tr: number }[] = [];
  for (let i = 1; i < data.length; i++) {
    const hl = data[i].high - data[i].low;
    const hc = Math.abs(data[i].high - data[i - 1].close);
    const lc = Math.abs(data[i].low - data[i - 1].close);
    const tr = Math.max(hl, hc, lc);
    trs.push({ time: data[i].time, tr });
  }

  if (trs.length < period) return result;

  let trSum = 0;
  for (let i = 0; i < period; i++) {
    trSum += trs[i].tr;
  }
  let atr = trSum / period;
  result.push({ time: trs[period - 1].time, value: atr });

  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i].tr) / period;
    result.push({ time: trs[i].time, value: atr });
  }

  return result;
}
