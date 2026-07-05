import { useState } from 'react';

const DOMAIN_MAP: { [key: string]: string } = {
  // US / Global Stocks
  AAPL: 'apple.com',
  MSFT: 'microsoft.com',
  GOOG: 'google.com',
  GOOGL: 'google.com',
  AMZN: 'amazon.com',
  META: 'meta.com',
  TSLA: 'tesla.com',
  NVDA: 'nvidia.com',
  NFLX: 'netflix.com',
  AMD: 'amd.com',
  INTC: 'intel.com',
  PYPL: 'paypal.com',
  BABA: 'alibaba.com',
  TCEHY: 'tencent.com',
  NKE: 'nike.com',
  DIS: 'disney.com',
  V: 'visa.com',
  MA: 'mastercard.com',
  JPM: 'jpmorganchase.com',
  BAC: 'bankofamerica.com',
  WMT: 'walmart.com',
  KO: 'cocacola.com',
  PEP: 'pepsico.com',
  XOM: 'exxonmobil.com',
  CVX: 'chevron.com',
  JNJ: 'jnj.com',
  PFE: 'pfizer.com',
  MRK: 'merck.com',
  UNH: 'unitedhealthgroup.com',

  // Indian Stocks
  'TCS.NS': 'tcs.com',
  'HCLTECH.NS': 'hcltech.com',
  'INFY.NS': 'infosys.com',
  'RELIANCE.NS': 'ril.com',
  'HDFCBANK.NS': 'hdfcbank.com',
  'ICICIBANK.NS': 'icicibank.com',
  'SBIN.NS': 'sbi.co.in',
  'BHARTIARTL.NS': 'airtel.in',
  'ITC.NS': 'itcportal.com',
  'HINDUNILVR.NS': 'hul.co.in',
  'LTIM.NS': 'ltimindtree.com',
  'WIPRO.NS': 'wipro.com',
  'AXISBANK.NS': 'axisbank.com',
  'KOTAKBANK.NS': 'kotak.com',
  'LT.NS': 'larsentoubro.com',
  'M&M.NS': 'mahindra.com',
  'MARUTI.NS': 'marutisuzuki.com',
  'TATASTEEL.NS': 'tatasteel.com',
  'TATAELXSI.NS': 'tataelxsi.com',
  'TATAMOTORS.NS': 'tatamotors.com',
  'POWERGRID.NS': 'powergrid.in',
  'NTPC.NS': 'ntpc.co.in',
  'ONGC.NS': 'ongcindia.com',
  'COALINDIA.NS': 'coalindia.in',
  'ADANIENT.NS': 'adani.com',
  'ADANIPORTS.NS': 'adaniports.com',
  'SUNPHARMA.NS': 'sunpharma.com',
  'JSWSTEEL.NS': 'jsw.in',
  'GRASIM.NS': 'grasim.com',
  'ULTRACEMCO.NS': 'ultratechcement.com',
  'BAJFINANCE.NS': 'bajajfinserv.in',
  'BAJAJFINSV.NS': 'bajajfinserv.in',
  'HEROMOTOCO.NS': 'heromotocorp.com',
  'EICHERMOT.NS': 'eicher.in',
  'BPCL.NS': 'bharatpetroleum.in',
  'IOC.NS': 'iocl.com',
  'HINDALCO.NS': 'hindalco.com',
  'TATACONSUM.NS': 'tataconsumer.com',
  'BRITANNIA.NS': 'britannia.co.in',
  'NESTLEIND.NS': 'nestle.in',
  'APOLLOHOSP.NS': 'apollohospitals.com',
  'DIVISLAB.NS': 'divislabs.com',
  'DRREDDY.NS': 'drreddys.com',
  'CIPLA.NS': 'cipla.com',
  'INDUSINDBK.NS': 'indusind.com',
  'BAJAJ-AUTO.NS': 'bajajauto.com',
};

/**
 * Helper to resolve domain names for symbols.
 */
function getDomain(symbol: string): string {
  const upperSymbol = symbol.toUpperCase();
  let domain = DOMAIN_MAP[upperSymbol];
  if (!domain) {
    const baseSymbol = upperSymbol.replace(".NS", "").split(".")[0].toLowerCase();
    domain = `${baseSymbol}.com`;
  }
  return domain;
}

/**
 * Returns a high-quality stock logo URL using Clearbit Logo API.
 */
export function getStockLogoUrl(symbol: string): string {
  if (!symbol) return "";
  return `https://logo.clearbit.com/${getDomain(symbol)}`;
}

/**
 * Returns a backup stock logo URL using Google's Favicon Service if Clearbit fails.
 */
export function getStockLogoFallbackUrl(symbol: string): string {
  if (!symbol) return "";
  return `https://www.google.com/s2/favicons?sz=128&domain=${getDomain(symbol)}`;
}

/**
 * A beautiful, self-healing React component for displaying stock logos.
 * Handles primary (Clearbit) and fallback (Google Favicon, Initials) logic internally.
 */
export function StockLogo({
  symbol,
  name,
  className = "h-8 w-8",
  imgSizeClass = "w-5.5 h-5.5"
}: {
  symbol: string;
  name: string;
  className?: string;
  imgSizeClass?: string;
}) {
  const [logoState, setLogoState] = useState<'primary' | 'fallback' | 'text'>('primary');

  const getLetterAvatarColor = (sym: string) => {
    const colors = [
      "from-blue-500 to-indigo-600",
      "from-emerald-400 to-teal-600",
      "from-purple-500 to-indigo-700",
      "from-rose-400 to-pink-600",
      "from-amber-400 to-orange-600",
    ];
    const index = sym.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (logoState === 'text') {
    return (
      <div className={`${className} flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br ${getLetterAvatarColor(symbol)} text-white text-xs font-black uppercase shadow-sm select-none`}>
        {symbol.slice(0, 2).replace("^", "")}
      </div>
    );
  }

  return (
    <div className={`${className} flex-shrink-0 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-night-800 border border-slate-200/40 dark:border-white/5 overflow-hidden relative shadow-sm`}>
      <img
        src={logoState === 'primary' ? getStockLogoUrl(symbol) : getStockLogoFallbackUrl(symbol)}
        alt={name}
        className={`${imgSizeClass} object-contain`}
        onError={() => {
          if (logoState === 'primary') {
            setLogoState('fallback');
          } else {
            setLogoState('text');
          }
        }}
      />
    </div>
  );
}
