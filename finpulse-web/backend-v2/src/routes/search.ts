import express, { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { YahooClient, COMMODITY_SYMBOLS } from '../services/YahooClient.js';

const router = express.Router();
const searchCache = new NodeCache({ stdTTL: 3600 });

const COMMODITY_KEYWORDS = ['gold', 'silver', 'oil', 'crude', 'gas', 'natural gas', 'copper',
  'platinum', 'wheat', 'corn', 'soybean', 'brent', 'gasoline', 'metal', 'commodity'];

router.get('/', async (req: Request, res: Response) => {
  try {
    const q = String(req.query['q'] || '').trim();
    if (!q) return res.json([]);

    const cacheKey = `search_${q.toLowerCase()}`;
    const cached = searchCache.get<any[]>(cacheKey);
    if (cached) return res.json(cached);

    const lowerQ = q.toLowerCase();

    const yahooResult = await YahooClient.search(q, { quotesCount: 20, newsCount: 0 });
    const yahooItems: any[] = (yahooResult?.quotes || [])
      .filter((item: any) => item?.symbol && (item.shortname || item.longname))
      .slice(0, 20)
      .map((item: any) => ({
        symbol: item.symbol,
        name: item.shortname || item.longname || item.symbol,
        exchange: item.exchDisp || item.exchange || 'GLOBAL',
        type: item.quoteType || 'Asset',
        source: 'yahoo',
      }));

    const isCommodityQuery = COMMODITY_KEYWORDS.some(kw => lowerQ.includes(kw));
    const exactCommodity = Object.entries(COMMODITY_SYMBOLS).find(
      ([sym, name]) =>
        sym.toLowerCase() === lowerQ ||
        name.toLowerCase().includes(lowerQ) ||
        lowerQ.includes(sym.toLowerCase().replace('=f', ''))
    );

    const commodityResults: any[] = [];
    if (isCommodityQuery || exactCommodity) {
      for (const [sym, name] of Object.entries(COMMODITY_SYMBOLS)) {
        if (
          name.toLowerCase().includes(lowerQ) ||
          sym.toLowerCase().includes(lowerQ.replace('=f', '')) ||
          (lowerQ === 'gold' && sym === 'GC=F') ||
          (lowerQ === 'silver' && sym === 'SI=F') ||
          ((lowerQ === 'oil' || lowerQ === 'crude') && (sym === 'CL=F' || sym === 'BZ=F')) ||
          ((lowerQ === 'gas' || lowerQ.includes('natural')) && sym === 'NG=F') ||
          lowerQ === 'commodity'
        ) {
          if (!yahooItems.some(y => y.symbol === sym)) {
            commodityResults.push({
              symbol: sym,
              name,
              exchange: sym.endsWith('=F') ? 'COMEX/NYMEX' : 'GLOBAL',
              type: 'FUTURE',
              source: 'commodity',
            });
          }
        }
      }
    }

    const results = exactCommodity
      ? [...commodityResults, ...yahooItems]
      : [...yahooItems, ...commodityResults];

    const deduped = Array.from(
      new Map(results.map(r => [r.symbol, r])).values()
    ).slice(0, 25);

    searchCache.set(cacheKey, deduped);
    res.json(deduped);
  } catch (err: any) {
    console.error('[Search] Error:', err.message);
    res.status(500).json([]);
  }
});

export default router;
