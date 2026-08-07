import 'dotenv/config';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import yahooFinanceModule from 'yahoo-finance2';
const YahooFinanceClass: any = (yahooFinanceModule as any).default || yahooFinanceModule;
const yahooFinance = new YahooFinanceClass();
// Configure yahooFinance to allow extra/new fields gracefully
yahooFinance._setOpts({
  validation: {
    logErrors: false,
    allowAdditionalProps: true
  }
});





// Resilient quote wrapper that auto-retries with validateResult:false on parse errors
export async function fetchQuotesResilient(symbols: string[], options?: any): Promise<any[]> {
  try {
    const res = await yahooFinance.quote(symbols, options);
    return Array.isArray(res) ? res : [res];
  } catch (err: any) {
    // Retry once with skipValidation to tolerate schema drift in yahoo-finance2
    try {
      const res = await (yahooFinance as any).quote(symbols, options, { validateResult: false });
      return Array.isArray(res) ? res : [res];
    } catch {
      return [];
    }
  }
}

export { yahooFinance };

