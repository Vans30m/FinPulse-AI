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

  // Indian Stocks (NSE Suffixes and Base Tickers)
  PGEL: 'pgelectroplast.com',
  'PGEL.NS': 'pgelectroplast.com',
  TCS: 'tcs.com',
  'TCS.NS': 'tcs.com',
  HCLTECH: 'hcltech.com',
  'HCLTECH.NS': 'hcltech.com',
  INFY: 'infosys.com',
  'INFY.NS': 'infosys.com',
  RELIANCE: 'ril.com',
  'RELIANCE.NS': 'ril.com',
  HDFCBANK: 'hdfcbank.com',
  'HDFCBANK.NS': 'hdfcbank.com',
  ICICIBANK: 'icicibank.com',
  'ICICIBANK.NS': 'icicibank.com',
  SBIN: 'sbi.co.in',
  'SBIN.NS': 'sbi.co.in',
  BHARTIARTL: 'airtel.in',
  'BHARTIARTL.NS': 'airtel.in',
  ITC: 'itcportal.com',
  'ITC.NS': 'itcportal.com',
  HINDUNILVR: 'hul.co.in',
  'HINDUNILVR.NS': 'hul.co.in',
  LTIM: 'ltimindtree.com',
  'LTIM.NS': 'ltimindtree.com',
  WIPRO: 'wipro.com',
  'WIPRO.NS': 'wipro.com',
  AXISBANK: 'axisbank.com',
  'AXISBANK.NS': 'axisbank.com',
  KOTAKBANK: 'kotak.com',
  'KOTAKBANK.NS': 'kotak.com',
  LT: 'larsentoubro.com',
  'LT.NS': 'larsentoubro.com',
  MM: 'mahindra.com',
  'M&M.NS': 'mahindra.com',
  MARUTI: 'marutisuzuki.com',
  'MARUTI.NS': 'marutisuzuki.com',
  TATASTEEL: 'tatasteel.com',
  'TATASTEEL.NS': 'tatasteel.com',
  TATAELXSI: 'tataelxsi.com',
  'TATAELXSI.NS': 'tataelxsi.com',
  TATAMOTORS: 'tatamotors.com',
  'TATAMOTORS.NS': 'tatamotors.com',
  POWERGRID: 'powergrid.in',
  'POWERGRID.NS': 'powergrid.in',
  NTPC: 'ntpc.co.in',
  'NTPC.NS': 'ntpc.co.in',
  ONGC: 'ongcindia.com',
  'ONGC.NS': 'ongcindia.com',
  COALINDIA: 'coalindia.in',
  'COALINDIA.NS': 'coalindia.in',
  ADANIENT: 'adani.com',
  'ADANIENT.NS': 'adani.com',
  ADANIPORTS: 'adaniports.com',
  'ADANIPORTS.NS': 'adaniports.com',
  SUNPHARMA: 'sunpharma.com',
  'SUNPHARMA.NS': 'sunpharma.com',
  JSWSTEEL: 'jsw.in',
  'JSWSTEEL.NS': 'jsw.in',
  GRASIM: 'grasim.com',
  'GRASIM.NS': 'grasim.com',
  ULTRACEMCO: 'ultratechcement.com',
  'ULTRACEMCO.NS': 'ultratechcement.com',
  BAJFINANCE: 'bajajfinserv.in',
  'BAJFINANCE.NS': 'bajajfinserv.in',
  BAJAJFINSV: 'bajajfinserv.in',
  'BAJAJFINSV.NS': 'bajajfinserv.in',
  HEROMOTOCO: 'heromotocorp.com',
  'HEROMOTOCO.NS': 'heromotocorp.com',
  EICHERMOT: 'eicher.in',
  'EICHERMOT.NS': 'eicher.in',
  BPCL: 'bharatpetroleum.in',
  'BPCL.NS': 'bharatpetroleum.in',
  IOC: 'iocl.com',
  'IOC.NS': 'iocl.com',
  HINDALCO: 'hindalco.com',
  'HINDALCO.NS': 'hindalco.com',
  TATACONSUM: 'tataconsumer.com',
  'TATACONSUM.NS': 'tataconsumer.com',
  BRITANNIA: 'britannia.co.in',
  'BRITANNIA.NS': 'britannia.co.in',
  NESTLEIND: 'nestle.in',
  'NESTLEIND.NS': 'nestle.in',
  APOLLOHOSP: 'apollohospitals.com',
  'APOLLOHOSP.NS': 'apollohospitals.com',
  DIVISLAB: 'divislabs.com',
  'DIVISLAB.NS': 'divislabs.com',
  DRREDDY: 'drreddys.com',
  'DRREDDY.NS': 'drreddys.com',
  CIPLA: 'cipla.com',
  'CIPLA.NS': 'cipla.com',
  INDUSINDBK: 'indusind.com',
  'INDUSINDBK.NS': 'indusind.com',
  'BAJAJ-AUTO': 'bajajauto.com',
  'BAJAJ-AUTO.NS': 'bajajauto.com',
  ZOMATO: 'zomato.com',
  'ZOMATO.NS': 'zomato.com',
  JIOFIN: 'jiofinance.com',
  'JIOFIN.NS': 'jiofinance.com',
  PAYTM: 'paytm.com',
  'PAYTM.NS': 'paytm.com',
  NYKAA: 'nykaa.com',
  'NYKAA.NS': 'nykaa.com',
  IRCTC: 'irctc.co.in',
  'IRCTC.NS': 'irctc.co.in',
  HAL: 'hal-india.co.in',
  'HAL.NS': 'hal-india.co.in',
  BEL: 'bel-india.in',
  'BEL.NS': 'bel-india.in',
  RVNL: 'rvnl.org',
  'RVNL.NS': 'rvnl.org',
};

// CDN Mappings for Cryptocurrencies & Commodities
const SPECIAL_ICONS: { [key: string]: string } = {
  // Commodities
  'CL=F': 'https://cdn-icons-png.flaticon.com/128/2921/2921508.png', // Crude Oil
  'GC=F': 'https://cdn-icons-png.flaticon.com/128/272/272535.png',   // Gold
  'SI=F': 'https://cdn-icons-png.flaticon.com/128/4433/4433100.png',  // Silver
  'NG=F': 'https://cdn-icons-png.flaticon.com/128/9203/9203714.png',  // Natural Gas
  
  // Cryptos
  'BTC-USD': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  'ETH-USD': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  'SOL-USD': 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  'XRP-USD': 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  'DOGE-USD': 'https://assets.coingecko.com/coins/images/325/large/dogecoin.png',
  'ADA-USD': 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
};

/**
 * Helper to resolve domain names for symbols.
 */
function getDomain(symbol: string): string {
  const upperSymbol = symbol.toUpperCase();
  let domain = DOMAIN_MAP[upperSymbol];
  if (!domain) {
    const baseSymbol = upperSymbol.replace(".NS", "").replace(".BO", "").split(".")[0].split("-")[0].toLowerCase();
    domain = `${baseSymbol}.com`;
  }
  return domain;
}

/**
 * Returns a high-quality stock logo URL using Clearbit Logo API, or custom special icons.
 */
export function getStockLogoUrl(symbol: string): string {
  if (!symbol) return "";
  const upper = symbol.toUpperCase();
  if (SPECIAL_ICONS[upper]) {
    return SPECIAL_ICONS[upper];
  }
  
  return `https://logo.clearbit.com/${getDomain(symbol)}`;
}

/**
 * Returns a backup stock logo URL using Google's Favicon Service.
 */
export function getStockLogoFallbackUrl(symbol: string): string {
  if (!symbol) return "";
  const upper = symbol.toUpperCase();
  if (SPECIAL_ICONS[upper]) {
    return SPECIAL_ICONS[upper];
  }
  
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
