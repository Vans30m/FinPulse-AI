export interface FallbackQuote {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
}

export interface FallbackChartData {
  meta: {
    symbol: string;
    range: string;
    interval: string;
    currency: string;
    exchangeName: string;
    regularMarketPrice: number;
    previousClose: number;
  };
  quotes: FallbackQuote[];
}

export function buildFallbackChartData(
  symbol: string,
  range: string,
  interval: string,
  basePrice: number = 100
): FallbackChartData {
  const now = new Date();
  const points = interval === '1d' ? 120 : interval === '1wk' ? 80 : 60;
  const quotes: FallbackQuote[] = [];
  let price = basePrice;

  for (let i = points; i >= 0; i -= 1) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const drift = Math.sin(i / 5) * 1.8 + Math.cos(i / 12) * 0.7;
    const open = Number((price + drift).toFixed(2));
    const high = Number((open + Math.abs(Math.sin(i / 3)) * 2.2 + 0.6).toFixed(2));
    const low = Number((open - Math.abs(Math.cos(i / 4)) * 2.0 - 0.4).toFixed(2));
    const close = Number((open + Math.sin(i / 7) * 1.1).toFixed(2));
    const adjClose = close;
    const volume = Math.round(1200000 + i * 4500 + Math.abs(Math.sin(i / 2)) * 100000);

    quotes.push({ date: date.toISOString(), open, high, low, close, adjClose, volume });
    price = close;
  }

  return {
    meta: {
      symbol: symbol.toUpperCase(),
      range,
      interval,
      currency: 'USD',
      exchangeName: 'NASDAQ',
      regularMarketPrice: quotes[quotes.length - 1].close,
      previousClose: quotes[quotes.length - 2]?.close ?? quotes[quotes.length - 1].close,
    },
    quotes,
  };
}
