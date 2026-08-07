import express, { Request, Response } from 'express';
import { YahooClient, COMMODITY_SYMBOLS } from '../services/YahooClient.js';
import NodeCache from 'node-cache';

const router = express.Router();
const assetCache = new NodeCache({ stdTTL: 120 });

function calcSMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  return data.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calcEMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const k = 2 / (period + 1);
  for (let i = period; i < data.length; i++) ema = data[i] * k + ema * (1 - k);
  return ema;
}

function calcRSI(data: number[], period = 14): number | null {
  if (data.length <= period) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    avgGain = (avgGain * 13 + (diff > 0 ? diff : 0)) / 14;
    avgLoss = (avgLoss * 13 + (diff < 0 ? -diff : 0)) / 14;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function calcMACD(data: number[]) {
  if (data.length < 26) return null;
  const ema12List: number[] = [], ema26List: number[] = [];
  let ema12 = data.slice(0, 12).reduce((a, b) => a + b, 0) / 12;
  let ema26 = data.slice(0, 26).reduce((a, b) => a + b, 0) / 26;
  const k12 = 2 / 13, k26 = 2 / 27;
  for (let i = 0; i < data.length; i++) {
    if (i >= 12) ema12 = data[i] * k12 + ema12 * (1 - k12);
    if (i >= 26) ema26 = data[i] * k26 + ema26 * (1 - k26);
    ema12List.push(ema12); ema26List.push(ema26);
  }
  const macdLine = ema12List.slice(26).map((v, i) => v - ema26List[i + 26]);
  const signal = calcEMA(macdLine, 9);
  const macd = macdLine[macdLine.length - 1];
  return { macd, signal, histogram: signal != null ? macd - signal : null };
}

function calcBollingerBands(data: number[], period = 20) {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  const sma = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, v) => sum + Math.pow(v - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  return { upper: sma + 2 * stdDev, middle: sma, lower: sma - 2 * stdDev };
}

function computeTechnicals(quotes: any[]) {
  if (!quotes || quotes.length < 50) return null;
  const closes = quotes.map(q => q.close).filter(c => c != null) as number[];
  const highs  = quotes.map(q => q.high).filter(h => h != null) as number[];
  const lows   = quotes.map(q => q.low).filter(l => l != null) as number[];
  const latest = closes[closes.length - 1];

  return {
    rsi: calcRSI(closes),
    macd: calcMACD(closes),
    sma20:  calcSMA(closes, 20),
    sma50:  calcSMA(closes, 50),
    sma200: calcSMA(closes, 200),
    ema12:  calcEMA(closes, 12),
    ema26:  calcEMA(closes, 26),
    bollingerBands: calcBollingerBands(closes),
    latestClose: latest,
    fiftyTwoWeekHigh: Math.max(...highs.slice(-252)),
    fiftyTwoWeekLow:  Math.min(...lows.slice(-252)),
  };
}

router.get('/:symbol', async (req: Request, res: Response) => {
  const symbol = String(req.params['symbol'] || '').toUpperCase();
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  const cacheKey = `asset-details-${symbol}`;
  const cached = assetCache.get<any>(cacheKey);
  if (cached) return res.json(cached);

  try {
    const isCrypto = symbol.endsWith('-USD') || symbol.endsWith('-USDT');
    const isCommodity = symbol.endsWith('=F') || symbol in COMMODITY_SYMBOLS;

    const [quoteResult, chartResult, summaryResult] = await Promise.allSettled([
      YahooClient.quote(symbol),
      YahooClient.chart(symbol, {
        period1: new Date(Date.now() - 365 * 86_400_000),
        period2: new Date(),
        interval: '1d',
      }),
      (!isCrypto && !isCommodity)
        ? YahooClient.quoteSummary(symbol, {
            modules: ['summaryProfile', 'financialData', 'defaultKeyStatistics', 'assetProfile'],
          })
        : Promise.resolve(null),
    ]);

    const quote   = quoteResult.status === 'fulfilled' ? quoteResult.value : null;
    const chart   = chartResult.status === 'fulfilled' ? chartResult.value : null;
    const summary = summaryResult.status === 'fulfilled' ? summaryResult.value : null;

    const quotes = chart?.quotes || [];
    const technicals = computeTechnicals(quotes);

    const result = {
      symbol,
      name:  quote?.shortName || quote?.longName || COMMODITY_SYMBOLS[symbol] || symbol,
      type:  isCrypto ? 'crypto' : isCommodity ? 'commodity' : 'stock',
      currency: quote?.currency ?? 'USD',
      exchange: quote?.fullExchangeName || quote?.exchangeName || null,

      price: quote?.regularMarketPrice ?? null,
      change: quote?.regularMarketChange ?? null,
      changePercent: quote?.regularMarketChangePercent ?? null,
      previousClose: quote?.regularMarketPreviousClose ?? null,
      open:   quote?.regularMarketOpen ?? null,
      dayHigh: quote?.regularMarketDayHigh ?? null,
      dayLow:  quote?.regularMarketDayLow ?? null,
      volume:  quote?.regularMarketVolume ?? null,
      marketCap: quote?.marketCap ?? null,
      fiftyTwoWeekHigh: quote?.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow:  quote?.fiftyTwoWeekLow ?? null,
      bid:  quote?.bid ?? null,
      ask:  quote?.ask ?? null,

      trailingPE:   quote?.trailingPE ?? null,
      forwardPE:    quote?.forwardPE ?? null,
      eps:          quote?.epsTrailingTwelveMonths ?? null,
      dividendYield: quote?.dividendYield ?? null,
      beta:         quote?.beta ?? null,
      bookValue:    quote?.bookValue ?? null,
      priceToBook:  quote?.priceToBook ?? null,

      description: summary?.assetProfile?.longBusinessSummary || summary?.summaryProfile?.longBusinessSummary || null,
      sector:      summary?.assetProfile?.sector || null,
      industry:    summary?.assetProfile?.industry || null,
      website:     summary?.assetProfile?.website || null,
      employees:   summary?.assetProfile?.fullTimeEmployees || null,
      country:     summary?.assetProfile?.country || null,

      revenueGrowth: summary?.financialData?.revenueGrowth ?? null,
      grossMargins:  summary?.financialData?.grossMargins ?? null,
      operatingMargins: summary?.financialData?.operatingMargins ?? null,
      returnOnEquity: summary?.financialData?.returnOnEquity ?? null,
      debtToEquity:  summary?.financialData?.debtToEquity ?? null,
      currentRatio:  summary?.financialData?.currentRatio ?? null,
      totalCash:     summary?.financialData?.totalCash ?? null,
      totalDebt:     summary?.financialData?.totalDebt ?? null,
      targetMeanPrice: summary?.financialData?.targetMeanPrice ?? null,
      recommendationMean: summary?.financialData?.recommendationMean ?? null,
      recommendationKey:  summary?.financialData?.recommendationKey ?? null,

      technicals,

      chart: quotes.map((q: any) => ({
        date: q.date instanceof Date ? q.date.toISOString() : q.date,
        open: q.open, high: q.high, low: q.low, close: q.close,
        adjclose: q.adjclose ?? q.close,
        volume: q.volume,
      })),
    };

    assetCache.set(cacheKey, result, 120);
    res.json(result);
  } catch (err: any) {
    console.error(`[AssetDetails/${symbol}] Error:`, err.message);
    res.status(500).json({ error: `Failed to fetch details for ${symbol}` });
  }
});

router.get('/technicals/:symbol', async (req: Request, res: Response) => {
  const symbol = String(req.params['symbol'] || '').toUpperCase();
  try {
    const chart = await YahooClient.chart(symbol, {
      period1: new Date(Date.now() - 365 * 86_400_000),
      period2: new Date(),
      interval: '1d',
    });
    const technicals = computeTechnicals(chart?.quotes || []);
    res.json(technicals ?? { error: 'Not enough data for technicals' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch technicals' });
  }
});

router.get('/fundamentals/:symbol', async (req: Request, res: Response) => {
  const symbol = String(req.params['symbol'] || '').toUpperCase();
  try {
    const summary = await YahooClient.quoteSummary(symbol, {
      modules: ['financialData', 'defaultKeyStatistics', 'incomeStatementHistory'],
    });
    res.json(summary ?? {});
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch fundamentals' });
  }
});

router.get('/financial-health/:symbol', async (req: Request, res: Response) => {
  const symbol = String(req.params['symbol'] || '').toUpperCase();
  try {
    const summary = await YahooClient.quoteSummary(symbol, {
      modules: ['financialData', 'balanceSheetHistory'],
    });
    const fd = summary?.financialData;
    res.json({
      symbol,
      currentRatio: fd?.currentRatio ?? null,
      debtToEquity: fd?.debtToEquity ?? null,
      totalCash:    fd?.totalCash ?? null,
      totalDebt:    fd?.totalDebt ?? null,
      freeCashflow: fd?.freeCashflow ?? null,
      operatingCashflow: fd?.operatingCashflow ?? null,
      returnOnEquity: fd?.returnOnEquity ?? null,
      returnOnAssets: fd?.returnOnAssets ?? null,
      grossMargins:   fd?.grossMargins ?? null,
      operatingMargins: fd?.operatingMargins ?? null,
      profitMargins:  fd?.profitMargins ?? null,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch financial health' });
  }
});

router.get('/events/:symbol', async (req: Request, res: Response) => {
  const symbol = String(req.params['symbol'] || '').toUpperCase();
  try {
    const summary = await YahooClient.quoteSummary(symbol, {
      modules: ['calendarEvents', 'upgradeDowngradeHistory'],
    });
    res.json({
      earnings:  summary?.calendarEvents?.earnings ?? null,
      dividends: summary?.calendarEvents?.dividendDate ?? null,
      upgrades:  summary?.upgradeDowngradeHistory?.history?.slice(0, 10) ?? [],
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

export default router;
