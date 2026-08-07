import express, { Request, Response } from 'express';
import { YahooClient } from '../services/YahooClient.js';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const symbolsParam = String(req.query['symbols'] || '').trim();
    if (!symbolsParam) return res.json([]);

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    if (symbols.length === 0) return res.json([]);

    const quotes = await YahooClient.quote(symbols);
    const list = Array.isArray(quotes) ? quotes : [quotes];

    const formatted = list
      .filter(Boolean)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        price: q.regularMarketPrice ?? null,
        change: q.regularMarketChange ?? null,
        changePercent: q.regularMarketChangePercent ?? null,
        previousClose: q.regularMarketPreviousClose ?? null,
        open: q.regularMarketOpen ?? null,
        dayHigh: q.regularMarketDayHigh ?? null,
        dayLow:  q.regularMarketDayLow ?? null,
        volume:  q.regularMarketVolume ?? null,
        marketCap: q.marketCap ?? null,
        currency: q.currency ?? 'USD',
        exchange: q.fullExchangeName || q.exchangeName || null,
        quoteType: q.quoteType ?? null,
        fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? null,
        fiftyTwoWeekLow:  q.fiftyTwoWeekLow ?? null,
        trailingPE: q.trailingPE ?? null,
        dividendYield: q.dividendYield ?? null,
      }));

    res.json(formatted);
  } catch (err: any) {
    console.error('[Quotes] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

router.get('/:symbol', async (req: Request, res: Response) => {
  try {
    const symbol = String(req.params['symbol'] || '').toUpperCase() || undefined;
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

    const q = await YahooClient.quote(symbol);
    if (!q) return res.status(404).json({ error: 'Symbol not found' });

    res.json({
      symbol: q.symbol,
      name: q.shortName || q.longName || q.symbol,
      price: q.regularMarketPrice ?? null,
      change: q.regularMarketChange ?? null,
      changePercent: q.regularMarketChangePercent ?? null,
      previousClose: q.regularMarketPreviousClose ?? null,
      open: q.regularMarketOpen ?? null,
      dayHigh: q.regularMarketDayHigh ?? null,
      dayLow:  q.regularMarketDayLow ?? null,
      volume:  q.regularMarketVolume ?? null,
      marketCap: q.marketCap ?? null,
      currency: q.currency ?? 'USD',
      exchange: q.fullExchangeName || q.exchangeName || null,
      quoteType: q.quoteType ?? null,
      fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow:  q.fiftyTwoWeekLow ?? null,
      trailingPE: q.trailingPE ?? null,
      eps: q.epsTrailingTwelveMonths ?? null,
      dividendYield: q.dividendYield ?? null,
      bid: q.bid ?? null,
      ask: q.ask ?? null,
      circulatingSupply: q.circulatingSupply ?? null,
    });
  } catch (err: any) {
    console.error('[Quotes/:symbol] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

export default router;
