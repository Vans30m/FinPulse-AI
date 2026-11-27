import YahooFinance from 'yahoo-finance2';

const PROXY_URL = process.env.YAHOO_PROXY_URL?.replace(/\/+$/, '');

export const yahooFinance = new YahooFinance(
  PROXY_URL
    ? {
        fetch: (url: any, options?: any) => {
          const target = String(url);
          if (target.includes('yahoo.com')) {
            const proxied = `${PROXY_URL}/?url=${encodeURIComponent(target)}`;
            return fetch(proxied, options);
          }
          return fetch(url, options);
        },
      }
    : undefined
);

