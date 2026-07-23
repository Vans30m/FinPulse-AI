import { useState, useEffect, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Globe, DollarSign, TrendingUp, PieChart, Plus, X, Bitcoin, Loader2, ChevronDown, Download, FileText, FileSpreadsheet, Activity } from 'lucide-react';
import { BarChart3 } from "lucide-react";
import { Link } from 'react-router-dom';
import PortfolioAllocationChart from "./PortfolioAllocationChart";
import PortfolioSummarySection, { type PortfolioSummaryMetric } from "./PortfolioSummarySection";

import UpcomingEventsSection from "./UpcomingEventsSection";
import PortfolioPerformanceChart from "./PortfolioPerformanceChart";
import { useChart } from "../../../context/ChartContext";
import { useAppData } from "../../../context/AppDataContext";
import toast from 'react-hot-toast';
import { getFundamentals } from '../../../services/marketService';
import PaperTradingOrderModal from './PaperTradingOrderModal';
import PaperTradingLedger from './PaperTradingLedger';
import API_BASE_URL from "../../../config/api";

interface Holding {
  id?: string;
  ticker: string;
  yahooSymbol?: string;
  exchange?: string;
  type?: string;
  name: string;
  sector: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  totalGain: number;
  gainPercent: number;
  dailyGain?: number;
  colorClass: {
    bg: string;
    text: string;
    border: string;
  };
}

interface MarketSection {
  id: string;
  title: string;
  region: string;
  icon: React.ReactNode;
  holdings: Holding[];
}

const INITIAL_SECTIONS: MarketSection[] = [
  {
    id: 'domestic',
    title: 'Indian Market',
    region: 'India',
    icon: <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
    holdings: []
  },
  {
    id: 'us',
    title: 'US Market',
    region: 'North America',
    icon: <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
    holdings: []
  },
  {
    id: 'crypto',
    title: 'Crypto Market',
    region: 'Digital Assets',
    icon: <Bitcoin className="h-5 w-5 text-amber-500 dark:text-amber-300" />,
    holdings: []
  },
  {
    id: 'other',
    title: 'Other Markets',
    region: 'Global',
    icon: <Globe className="h-5 w-5 text-blue-500 dark:text-blue-400" />,
    holdings: []
  },
  {
    id: 'metals',
    title: 'Precious Metals',
    region: 'Commodities',
    icon: <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
    holdings: []
  }
];

const getHoldingColorClass = (marketId: string, ticker: string) => {
  const mid = (marketId || '').toLowerCase();
  const tick = (ticker || '').toUpperCase();
  
  if (mid === 'domestic' || tick.endsWith('.NS') || tick.endsWith('.BO')) {
    return { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200/50 dark:border-blue-900/50' };
  }
  if (mid === 'us') {
    return { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200/50 dark:border-emerald-900/50' };
  }
  if (mid === 'crypto' || tick.endsWith('-USD') || tick.endsWith('/USD')) {
    return { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200/50 dark:border-orange-900/50' };
  }
  if (mid === 'metals' || tick === 'GC=F' || tick === 'SI=F' || tick === 'PL=F') {
    return { bg: 'bg-yellow-50 dark:bg-yellow-950/40', text: 'text-yellow-600 dark:text-yellow-500', border: 'border-yellow-200/50 dark:border-yellow-900/50' };
  }
  if (mid === 'other') {
    return { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200/50 dark:border-purple-900/50' };
  }
  return { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200/50 dark:border-indigo-900/50' };
};

export default function PortfolioDashboard() {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<MarketSection[]>(INITIAL_SECTIONS);
  const [usdToInrRate, setUsdToInrRate] = useState<number>(83.45);
  const [usdToEurRate, setUsdToEurRate] = useState<number>(0.92);
  const [usdToGbpRate, setUsdToGbpRate] = useState<number>(0.79);
  const { user } = useAppData();
  const getCurrencyCode = (currencyString?: string): 'USD' | 'INR' | 'EUR' | 'GBP' => {
    if (!currencyString) return 'INR';
    if (currencyString.toUpperCase().includes('INR') || currencyString.includes('₹')) return 'INR';
    if (currencyString.toUpperCase().includes('USD') || currencyString.includes('$')) return 'USD';
    if (currencyString.toUpperCase().includes('EUR') || currencyString.includes('€')) return 'EUR';
    if (currencyString.toUpperCase().includes('GBP') || currencyString.includes('£')) return 'GBP';
    return 'INR';
  };

  const [portfolioCurrency, setPortfolioCurrency] = useState<'USD' | 'INR' | 'EUR' | 'GBP'>(() => getCurrencyCode(user?.currency));

  useEffect(() => {
    if (user?.currency) {
      setPortfolioCurrency(getCurrencyCode(user.currency));
    }
  }, [user?.currency]);

  const [advisorData, setAdvisorData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<{ month: string; value: number; invested: number; profit: number }[]>([]);
  const [liveQuotes, setLiveQuotes] = useState<Record<string, { price: number; change: number }>>({});

  // Paper Trading Sandbox States
  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState<boolean>(false);
  const [virtualBalance, setVirtualBalance] = useState<number>(() => {
    const val = localStorage.getItem('finpulse_virtual_balance');
    return val ? parseFloat(val) : 100000;
  });
  const [virtualHoldings, setVirtualHoldings] = useState<any[]>(() => {
    const val = localStorage.getItem('finpulse_virtual_holdings');
    return val ? JSON.parse(val) : [];
  });
  const [virtualTransactions, setVirtualTransactions] = useState<any[]>(() => {
    const val = localStorage.getItem('finpulse_virtual_transactions');
    return val ? JSON.parse(val) : [];
  });

  // Automatically correct virtual cash balance if there is a mismatch due to old short sale proceeds
  useEffect(() => {
    const totalInvested = virtualHoldings.reduce((sum: number, h: any) => sum + (Math.abs(h.shares) * h.avgCost), 0);
    const totalBooked = virtualHoldings.reduce((sum: number, h: any) => sum + (h.bookedPL || 0), 0);
    const expectedBalance = 100000 - totalInvested + totalBooked;
    
    if (Math.abs(virtualBalance - expectedBalance) > 1.0) {
      setVirtualBalance(expectedBalance);
      localStorage.setItem('finpulse_virtual_balance', expectedBalance.toString());
    }
  }, [virtualHoldings, virtualBalance]);

  // Sync virtual states on localStorage updates (e.g. from chart modal actions)
  useEffect(() => {
    const handleStorage = () => {
      const balance = localStorage.getItem('finpulse_virtual_balance');
      const holdings = localStorage.getItem('finpulse_virtual_holdings');
      const txs = localStorage.getItem('finpulse_virtual_transactions');
      if (balance) setVirtualBalance(parseFloat(balance));
      if (holdings) setVirtualHoldings(JSON.parse(holdings));
      if (txs) setVirtualTransactions(JSON.parse(txs));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Automatic SL/TP Evaluation Handler
  useEffect(() => {
    if (!isSandboxMode || !liveQuotes || !virtualHoldings.length) return;

    let balanceChanged = false;
    let nextBalance = virtualBalance;
    let nextHoldings = [...virtualHoldings];
    const newTxs: any[] = [];
    const triggeredMessages: string[] = [];

    nextHoldings = nextHoldings.map(h => {
      if (Math.abs(h.shares) <= 0.0001) return h;

      const uppercaseTicker = h.ticker.toUpperCase();
      const quote = liveQuotes[uppercaseTicker];
      if (!quote) return h;

      const livePrice = quote.price;
      let triggerPrice = 0;
      let triggeredType: 'SL' | 'TP' | null = null;

      const isShort = h.shares < 0;

      // 1. Check Stop Loss (SL)
      if (h.sl) {
        if (isShort && livePrice >= h.sl) {
          triggeredType = 'SL';
          triggerPrice = h.sl;
        } else if (!isShort && livePrice <= h.sl) {
          triggeredType = 'SL';
          triggerPrice = h.sl;
        }
      }

      // 2. Check Take Profit (TP)
      if (h.tp && !triggeredType) {
        if (isShort && livePrice <= h.tp) {
          triggeredType = 'TP';
          triggerPrice = h.tp;
        } else if (!isShort && livePrice >= h.tp) {
          triggeredType = 'TP';
          triggerPrice = h.tp;
        }
      }

      if (triggeredType) {
        balanceChanged = true;
        const sharesToClose = Math.abs(h.shares);
        
        // P&L Calculation
        const pnl = isShort
          ? (h.avgCost - triggerPrice) * sharesToClose
          : (triggerPrice - h.avgCost) * sharesToClose;

        // Cash impact (refund collateral and cover/sell cost)
        const isDomestic = h.ticker.endsWith('.NS') || h.ticker.endsWith('.BO');
        const cashImpactUSD = isDomestic 
          ? (sharesToClose * triggerPrice) / usdToInrRate 
          : (sharesToClose * triggerPrice);
        
        if (isShort) {
          const collateralUSD = isDomestic 
            ? (sharesToClose * h.avgCost) / usdToInrRate 
            : (sharesToClose * h.avgCost);
          nextBalance = nextBalance + collateralUSD - cashImpactUSD;
        } else {
          nextBalance = nextBalance + cashImpactUSD;
        }

        triggeredMessages.push(
          `[${triggeredType} Triggered] ${h.ticker} hit ${triggeredType} at $${triggerPrice.toFixed(2)}. Position closed. P&L: ${isDomestic ? '₹' : '$'}${pnl.toFixed(2)}`
        );

        newTxs.push({
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toISOString(),
          type: isShort ? 'BUY' : 'SELL',
          symbol: h.ticker,
          name: h.name,
          shares: sharesToClose,
          price: triggerPrice,
          totalValue: sharesToClose * triggerPrice
        });

        return {
          ...h,
          shares: 0,
          bookedPL: (h.bookedPL || 0) + pnl,
          sl: undefined,
          tp: undefined
        };
      }

      return h;
    }).filter(h => Math.abs(h.shares) > 0.0001 || (h.bookedPL || 0) !== 0);

    if (balanceChanged) {
      setVirtualBalance(nextBalance);
      setVirtualHoldings(nextHoldings);
      
      const transactions = JSON.parse(localStorage.getItem('finpulse_virtual_transactions') || '[]');
      const nextTxs = [...transactions, ...newTxs];
      setVirtualTransactions(nextTxs);

      localStorage.setItem('finpulse_virtual_balance', nextBalance.toString());
      localStorage.setItem('finpulse_virtual_holdings', JSON.stringify(nextHoldings));
      localStorage.setItem('finpulse_virtual_transactions', JSON.stringify(nextTxs));

      triggeredMessages.forEach(msg => toast.success(msg, { duration: 6000 }));
      
      // Dispatch storage event to update modal/chart in real-time
      window.dispatchEvent(new Event('storage'));
    }
  }, [liveQuotes, virtualHoldings, isSandboxMode, usdToInrRate]);

  const [activeMarket, setActiveMarket] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isBookedHistoryOpen, setIsBookedHistoryOpen] = useState(false);
  const [closeTradeAsset, setCloseTradeAsset] = useState<any | null>(null);
  const [closeTradeShares, setCloseTradeShares] = useState("");
  const [closeTradePrice, setCloseTradePrice] = useState("");
  const [isClosingPosition, setIsClosingPosition] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Debounced Search States
  const [assetSearch, setAssetSearch] = useState('');
  const [assetSuggestions, setAssetSuggestions] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] =
    useState<{
      ticker: string;
      yahooSymbol: string;
      name: string;
      exchange: string;
      type: string;
    } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Form State
  const [marketId, setMarketId] = useState('domestic');
  const [shares, setShares] = useState('');
  const [cost, setCost] = useState('');

  const {
    openAsset,
  } = useChart();

  // Finnhub Debounced Search
  useEffect(() => {
    if (!assetSearch.trim() || !showSuggestions) {
      setAssetSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(assetSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setAssetSuggestions(data);
        }
      } catch (error) {
        console.error("Search fetch failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [assetSearch, showSuggestions]);

  const handleSelectAsset = (
    asset: any
  ) => {
    setSelectedAsset({
      ticker: asset.symbol,
      yahooSymbol: asset.yahooSymbol,
      name: asset.name,
      exchange: asset.exchange,
      type: asset.type,
    });

    setAssetSearch(
      `${asset.name} (${asset.symbol})`
    );

    setShowSuggestions(false);
  };

  const loadPortfolioData = async () => {
    const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
    const userId = storedUser.id;
    const token = localStorage.getItem('finpulse_token') || localStorage.getItem('finpulse-token');
    const headers: any = {};
    if (userId) headers['X-User-Id'] = userId;
    if (token) headers['Authorization'] = `Bearer ${token}`;



    // --- Holdings (independent) ---
    try {
      const virtualTickers = virtualHoldings.map(h => h.ticker).join(',');
      const holdingsUrl = virtualTickers
        ? `${API_BASE_URL}/api/portfolio/holdings?virtualTickers=${encodeURIComponent(virtualTickers)}`
        : `${API_BASE_URL}/api/portfolio/holdings`;
      const holdingsRes = await fetch(holdingsUrl, { headers });
      if (holdingsRes.ok) {
        const data = await holdingsRes.json();
        const mapped = INITIAL_SECTIONS.map(initial => {
          const found = data.sections?.find((s: any) => s.id === initial.id);
          return { ...initial, holdings: found ? found.holdings : [] };
        });
        setSections(mapped);
        if (data.liveQuotes) setLiveQuotes(data.liveQuotes);
      }
    } catch (err) {
      console.error('Holdings fetch error:', err);
    }

    // --- Rolling CAGR (independent, can be slow) ---
    try {
      const cagrRes = await fetch(`${API_BASE_URL}/api/portfolio/rolling-cagr`, { headers });
      if (cagrRes.ok) {
        const cagrData = await cagrRes.json();
        if (cagrData.portfolioValues) {
          const mapped = cagrData.portfolioValues.map((pv: any) => {
            const parts = pv.month.split('-');
            const year = parts[0]?.slice(2) || '';
            const monthIndex = parseInt(parts[1] || '1') - 1;
            const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthIndex];
            return {
              month: `${monthName} '${year}`,
              value: pv.value,
              invested: pv.invested || 0,
              profit: pv.profit || 0
            };
          });
          setPerformanceData(mapped);
        } else {
          setPerformanceData([]);
        }
      }
    } catch (err) {
      console.error('CAGR fetch error:', err);
    }

    // --- Portfolio Advisor (independent, can be slow — skip if cached) ---
    try {
      const cachedAdvisor = sessionStorage.getItem('portfolioAdvisor');
      if (cachedAdvisor) {
        setAdvisorData(JSON.parse(cachedAdvisor));
      } else {
        const advisorRes = await fetch(`${API_BASE_URL}/api/ai/portfolio-advisor`, { headers });
        if (advisorRes.ok) {
          const data = await advisorRes.json();
          sessionStorage.setItem('portfolioAdvisor', JSON.stringify(data));
          setAdvisorData(data);
        }
      }
    } catch (err) {
      console.error('Advisor fetch error:', err);
    }
  };

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const inrData = await getFundamentals('USDINR=X');
        if (inrData && inrData.price) setUsdToInrRate(inrData.price);
      } catch (e) {}
      try {
        const eurData = await getFundamentals('USDEUR=X');
        if (eurData && eurData.price) setUsdToEurRate(eurData.price);
      } catch (e) {}
      try {
        const gbpData = await getFundamentals('USDGBP=X');
        if (gbpData && gbpData.price) setUsdToGbpRate(gbpData.price);
      } catch (e) {}
    };

    const initialize = async () => {
      setLoading(true);
      await Promise.all([
        fetchRates(),
        loadPortfolioData()
      ]);
      setLoading(false);
    };

    initialize();

    const interval = setInterval(() => {
      loadPortfolioData();
    }, 15000); // 15 seconds auto-refresh

  }, [virtualHoldings]);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !shares || !cost) return;

    const numShares = parseFloat(shares);
    const numCost = parseFloat(cost);

    try {
      const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
      const userId = storedUser.id;

      const token = localStorage.getItem('finpulse_token') || localStorage.getItem('finpulse-token');
      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (userId) headers['X-User-Id'] = userId;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/portfolio/holdings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ticker: selectedAsset.ticker,
          name: selectedAsset.name,
          shares: numShares,
          avgCost: numCost,
          marketId
        })
      });

      if (res.ok) {
        toast.success(`Successfully added holding ${selectedAsset.ticker}`);
        loadPortfolioData();
        setIsModalOpen(false);
        setAssetSearch('');
        setSelectedAsset(null);
        setShares('');
        setCost('');
      } else {
        toast.error("Failed to add position");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to persist transaction");
    }
  };

  const handleClosePositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closeTradeAsset) return;

    const sharesToCloseNum = parseFloat(closeTradeShares);
    const closePriceNum = parseFloat(closeTradePrice);

    if (isNaN(sharesToCloseNum) || sharesToCloseNum <= 0 || sharesToCloseNum > Math.abs(closeTradeAsset.shares)) {
      toast.error("Invalid number of shares to close");
      return;
    }
    if (isNaN(closePriceNum) || closePriceNum <= 0) {
      toast.error("Invalid closing price");
      return;
    }

    if (isSandboxMode) {
      const isShort = closeTradeAsset.shares < 0;
      const pnl = isShort 
        ? (closeTradeAsset.avgCost - closePriceNum) * sharesToCloseNum
        : (closePriceNum - closeTradeAsset.avgCost) * sharesToCloseNum;

      const nextHoldings = virtualHoldings.map(h => {
        if (h.ticker.toUpperCase() === closeTradeAsset.ticker.toUpperCase()) {
          const updatedShares = isShort
            ? Math.min(h.shares + sharesToCloseNum, 0)
            : Math.max(h.shares - sharesToCloseNum, 0);
          return {
            ...h,
            shares: updatedShares,
            bookedPL: (h.bookedPL || 0) + pnl
          };
        }
        return h;
      }).filter(h => Math.abs(h.shares) > 0.0001 || (h.bookedPL || 0) !== 0);

      const cashImpactUSD = closeTradeAsset.sectionId === 'domestic' ? (sharesToCloseNum * closePriceNum) / usdToInrRate : (sharesToCloseNum * closePriceNum);
      const nextBalance = isShort ? virtualBalance - cashImpactUSD : virtualBalance + cashImpactUSD;

      const newTx = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        type: isShort ? 'BUY' as const : 'SELL' as const,
        symbol: closeTradeAsset.ticker,
        name: closeTradeAsset.name,
        shares: sharesToCloseNum,
        price: closePriceNum,
        totalValue: sharesToCloseNum * closePriceNum
      };

      const nextTxs = [...virtualTransactions, newTx];

      setVirtualHoldings(nextHoldings);
      setVirtualBalance(nextBalance);
      setVirtualTransactions(nextTxs);

      localStorage.setItem('finpulse_virtual_holdings', JSON.stringify(nextHoldings));
      localStorage.setItem('finpulse_virtual_balance', nextBalance.toString());
      localStorage.setItem('finpulse_virtual_transactions', JSON.stringify(nextTxs));

      toast.success(`Trade closed successfully! Realized P&L: ${closeTradeAsset.sectionId === 'domestic' ? '₹' : '$'}${pnl.toFixed(2)}`);
      setIsCloseModalOpen(false);
      setCloseTradeAsset(null);
      return;
    }

    try {
      setIsClosingPosition(true);
      const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
      const userId = storedUser.id;
      const token = localStorage.getItem('finpulse_token') || localStorage.getItem('finpulse-token') || '';

      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (userId) headers['X-User-Id'] = userId;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/portfolio/holdings/${closeTradeAsset.id}/close`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sharesToClose: sharesToCloseNum,
          closePrice: closePriceNum
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to close position");
      }

      const pnl = (closePriceNum - closeTradeAsset.avgCost) * sharesToCloseNum;
      toast.success(`Trade closed successfully! Realized P&L: ${closeTradeAsset.sectionId === 'domestic' ? '₹' : '$'}${pnl.toFixed(2)}`);
      setIsCloseModalOpen(false);
      setCloseTradeAsset(null);
      loadPortfolioData();
    } catch (err: any) {
      toast.error(err.message || "Failed to close position");
    } finally {
      setIsClosingPosition(false);
    }
  };

  const handleExecutePaperTrade = (trade: {
    type: 'BUY' | 'SELL';
    symbol: string;
    name: string;
    shares: number;
    price: number;
    marketId: string;
  }) => {
    const isDomestic = trade.symbol.endsWith('.NS') || trade.symbol.endsWith('.BO');
    const priceInUSD = isDomestic ? trade.price / usdToInrRate : trade.price;
    const tradeValueUSD = trade.shares * priceInUSD;

    let nextBalance = virtualBalance;
    const nextHoldings = [...virtualHoldings];

    if (trade.type === 'BUY') {
      const existing = nextHoldings.find(h => h.ticker.toUpperCase() === trade.symbol.toUpperCase());
      if (existing) {
        if (existing.shares < 0) {
          // Covering short position
          const sharesToCover = Math.min(trade.shares, Math.abs(existing.shares));
          const extraShares = Math.max(trade.shares - sharesToCover, 0);

          // Return collateral for covered shares and apply cover cost
          const collateralUSD = isDomestic ? (sharesToCover * existing.avgCost) / usdToInrRate : (sharesToCover * existing.avgCost);
          const coverCostUSD = sharesToCover * priceInUSD;
          nextBalance = nextBalance + collateralUSD - coverCostUSD;

          const pnl = (existing.avgCost - trade.price) * sharesToCover;
          existing.bookedPL = (existing.bookedPL || 0) + pnl;
          
          existing.shares += trade.shares;
          if (existing.shares > 0.0001) {
            // Flipped to long position (extra shares cost cash normally)
            nextBalance -= extraShares * priceInUSD;
            existing.avgCost = trade.price;
          }
        } else {
          // Adding to long position (costs cash normally)
          nextBalance -= tradeValueUSD;
          const prevCost = existing.shares * existing.avgCost;
          const newCost = trade.shares * trade.price;
          existing.shares += trade.shares;
          existing.avgCost = (prevCost + newCost) / existing.shares;
        }
      } else {
        // Regular long buy (costs cash normally)
        nextBalance -= tradeValueUSD;
        nextHoldings.push({
          ticker: trade.symbol,
          name: trade.name,
          shares: trade.shares,
          avgCost: trade.price,
          marketId: trade.marketId,
          bookedPL: 0
        });
      }
      toast.success(`Successfully bought ${trade.shares} shares of ${trade.symbol}`);
    } else {
      const existing = nextHoldings.find(h => h.ticker.toUpperCase() === trade.symbol.toUpperCase());
      if (existing) {
        if (existing.shares > 0) {
          // Closing/reducing long position (returns cash)
          const sharesToClose = Math.min(trade.shares, existing.shares);
          const extraShares = Math.max(trade.shares - sharesToClose, 0);

          nextBalance += sharesToClose * priceInUSD;

          const pnl = (trade.price - existing.avgCost) * sharesToClose;
          existing.bookedPL = (existing.bookedPL || 0) + pnl;
          
          existing.shares -= trade.shares;
          if (existing.shares < -0.0001) {
            // Flipped to short position (extra shares lock up collateral)
            nextBalance -= extraShares * priceInUSD;
            existing.avgCost = trade.price;
          }
        } else {
          // Adding to short position (locks up collateral)
          nextBalance -= tradeValueUSD;
          const prevCost = Math.abs(existing.shares) * existing.avgCost;
          const newCost = trade.shares * trade.price;
          existing.shares -= trade.shares;
          existing.avgCost = (prevCost + newCost) / Math.abs(existing.shares);
        }
      } else {
        // Opening a short position (locks up collateral)
        nextBalance -= tradeValueUSD;
        nextHoldings.push({
          ticker: trade.symbol,
          name: trade.name,
          shares: -trade.shares,
          avgCost: trade.price,
          marketId: trade.marketId,
          bookedPL: 0
        });
      }
      toast.success(`Successfully sold ${trade.shares} shares of ${trade.symbol}`);
    }

    // Clean up holdings that are close to 0 shares and have no booked PL
    const cleanedHoldings = nextHoldings.filter(h => Math.abs(h.shares) > 0.0001 || (h.bookedPL || 0) !== 0);

    const newTx = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      type: trade.type,
      symbol: trade.symbol,
      name: trade.name,
      shares: trade.shares,
      price: trade.price,
      totalValue: trade.shares * trade.price
    };

    const nextTxs = [...virtualTransactions, newTx];
    setVirtualBalance(nextBalance);
    setVirtualHoldings(cleanedHoldings);
    setVirtualTransactions(nextTxs);

    localStorage.setItem('finpulse_virtual_balance', nextBalance.toString());
    localStorage.setItem('finpulse_virtual_holdings', JSON.stringify(cleanedHoldings));
    localStorage.setItem('finpulse_virtual_transactions', JSON.stringify(nextTxs));
    
    setIsSandboxOpen(false);
  };

  const handleDeleteHolding = async (id: string, name: string) => {
    // Determine if this is a reset-only or complete delete
    const targetAsset = bookedAssets.find(a => a.id === id);
    const isResetOnly = targetAsset && targetAsset.shares > 0;

    const confirmMsg = isResetOnly 
      ? `Are you sure you want to clear the booked P&L history for ${name}? (Your active position of ${targetAsset.shares} shares will not be deleted)`
      : `Are you sure you want to remove ${name} history entry from your portfolio?`;

    const confirmed = window.confirm(confirmMsg);
    if (!confirmed) return;

    if (isSandboxMode) {
      if (isResetOnly) {
        const nextHoldings = virtualHoldings.map(h => {
          if ((h.id || h.ticker) === id) {
            return { ...h, bookedPL: 0 };
          }
          return h;
        });
        setVirtualHoldings(nextHoldings);
        localStorage.setItem('finpulse_virtual_holdings', JSON.stringify(nextHoldings));
        toast.success(`Cleared booked P&L history for ${name}`);
      } else {
        const nextHoldings = virtualHoldings.filter(h => (h.id || h.ticker) !== id);
        setVirtualHoldings(nextHoldings);
        localStorage.setItem('finpulse_virtual_holdings', JSON.stringify(nextHoldings));
        toast.success(`Removed virtual asset ${name}`);
      }
      return;
    }

    try {
      const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
      const userId = storedUser.id;

      const token = localStorage.getItem('finpulse_token') || localStorage.getItem('finpulse-token');
      const headers: any = {};
      if (userId) headers['X-User-Id'] = userId;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = isResetOnly 
        ? `${API_BASE_URL}/api/portfolio/holdings/${id}/reset-booked-pl`
        : `${API_BASE_URL}/api/portfolio/holdings/${id}`;
      
      const method = isResetOnly ? 'PATCH' : 'DELETE';

      const res = await fetch(url, {
        method,
        headers
      });

      if (res.ok) {
        toast.success(isResetOnly ? `Cleared booked P&L history for ${name}` : `Successfully removed ${name}`);
        loadPortfolioData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to update asset");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update asset");
    }
  };

  const getHoldingValueInUSD = (h: Holding, sectionId: string) => {
    if (sectionId === 'domestic') {
      return h.marketValue / usdToInrRate;
    }
    return h.marketValue;
  };

  const getHoldingGainInUSD = (h: Holding, sectionId: string) => {
    if (sectionId === 'domestic') {
      return h.totalGain / usdToInrRate;
    }
    return h.totalGain;
  };

  const getCurrencyRate = () => {
    if (portfolioCurrency === 'USD') return 1;
    if (portfolioCurrency === 'INR') return usdToInrRate;
    if (portfolioCurrency === 'EUR') return usdToEurRate;
    if (portfolioCurrency === 'GBP') return usdToGbpRate;
    return 1;
  };
  const currencyMultiplier = getCurrencyRate();

  const getAssetPriceInCurrency = (price: number, sectionId: string) => {
    const priceUSD = sectionId === 'domestic' ? price / usdToInrRate : price;
    return priceUSD * currencyMultiplier;
  };

  const displayCurrency = 
    portfolioCurrency === 'INR' ? '₹' : 
    portfolioCurrency === 'EUR' ? '€' : 
    portfolioCurrency === 'GBP' ? '£' : '$';

  // Group values by native currency / segment
  const portfolioSplits = useMemo(() => {
    let inrVal = 0;
    let usdVal = 0;
    let cryptoVal = 0;
    let otherVal = 0;

    const targetSecs = isSandboxMode ? virtualHoldings.map(h => ({
      marketId: h.marketId,
      marketValue: Math.abs(h.shares) * h.avgCost // Cost basis or lookup
    })) : sections.flatMap(s => s.holdings.map(h => ({ marketId: s.id, marketValue: h.marketValue })));

    targetSecs.forEach(h => {
      if (h.marketId === 'domestic') {
        inrVal += h.marketValue;
      } else if (h.marketId === 'us') {
        usdVal += h.marketValue;
      } else if (h.marketId === 'crypto') {
        cryptoVal += h.marketValue;
      } else {
        otherVal += h.marketValue;
      }
    });

    return { inrVal, usdVal, cryptoVal, otherVal };
  }, [sections, virtualHoldings, isSandboxMode]);

  // Group values by native currency / segment for virtual holdings
  const virtualSections = useMemo(() => {
    return INITIAL_SECTIONS.map(initial => {
      const holdingsForSection = virtualHoldings
        .filter(h => h.marketId === initial.id)
        .map(h => {
          // Look up real-time price from liveQuotes first, then database sections
          let livePrice = h.avgCost;
          let changeVal = 0;
          const uppercaseTicker = h.ticker.toUpperCase();
          if (liveQuotes && liveQuotes[uppercaseTicker]) {
            livePrice = liveQuotes[uppercaseTicker].price;
            changeVal = liveQuotes[uppercaseTicker].change;
          } else {
            const realSec = sections.find(s => s.id === h.marketId);
            const realHold = realSec?.holdings.find(rh => rh.ticker.toUpperCase() === uppercaseTicker);
            if (realHold) {
              livePrice = realHold.currentPrice;
              changeVal = (realHold as any).dailyGain / realHold.shares;
            }
          }
          const marketValue = Math.abs(h.shares) * livePrice;
          const costBasis = Math.abs(h.shares) * h.avgCost;
          const totalGain = h.shares < 0 ? costBasis - marketValue : marketValue - costBasis;
          const gainPercent = costBasis !== 0 ? (totalGain / costBasis) * 100 : 0;
          const dailyGain = h.shares * changeVal;
          
          const colorClass = getHoldingColorClass(h.marketId, h.ticker);

          let displayName = h.name;
          if (uppercaseTicker === 'CL=F') {
            displayName = 'USOil';
          }

          return {
            ...h,
            id: h.id || h.ticker,
            name: displayName,
            currentPrice: livePrice,
            marketValue,
            totalGain,
            gainPercent,
            dailyGain,
            colorClass,
            sector: h.marketId === 'crypto' ? 'Crypto' : 'Technology'
          };
        });
      return {
        ...initial,
        holdings: holdingsForSection
      };
    });
  }, [virtualHoldings, sections, liveQuotes]);

  const currentSections = isSandboxMode ? virtualSections : sections;
  const activeHubsCount = currentSections.filter(sec => sec.holdings.length > 0).length;

  const totalHoldingsValue = currentSections
    .filter(sec => activeMarket === 'all' || activeMarket === sec.id)
    .reduce((sum, sec) => {
      return sum + sec.holdings.reduce((s, h) => {
        const valUSD = getHoldingValueInUSD(h, sec.id);
        return s + (valUSD * currencyMultiplier);
      }, 0);
    }, 0);

  const cashBalanceInCurrency = activeMarket === 'domestic'
    ? virtualBalance * usdToInrRate
    : (activeMarket === 'all' 
        ? virtualBalance * currencyMultiplier 
        : (activeMarket === 'us' ? virtualBalance : 0));

  const totalNetValue = isSandboxMode
    ? cashBalanceInCurrency + totalHoldingsValue
    : totalHoldingsValue;

  const totalGain = currentSections
    .filter(sec => activeMarket === 'all' || activeMarket === sec.id)
    .reduce((sum, sec) => {
      return sum + sec.holdings.reduce((s, h) => {
        const gainUSD = getHoldingGainInUSD(h, sec.id);
        return s + (gainUSD * currencyMultiplier);
      }, 0);
    }, 0);

  const totalInvestedAmount = isSandboxMode
    ? Math.max(totalHoldingsValue - totalGain, 0)
    : Math.max(totalNetValue - totalGain, 0);

  const totalBookedPL = useMemo(() => {
    return currentSections
      .filter(sec => activeMarket === 'all' || activeMarket === sec.id)
      .reduce((sum, sec) => {
        return sum + sec.holdings.reduce((s, h) => {
          const bookedPLUSD = sec.id === 'domestic' ? (h.bookedPL || 0) / usdToInrRate : (h.bookedPL || 0);
          return s + (bookedPLUSD * currencyMultiplier);
        }, 0);
      }, 0);
  }, [currentSections, activeMarket, usdToInrRate, currencyMultiplier]);

  const bookedAssets = useMemo(() => {
    return currentSections.flatMap(section => 
      section.holdings
        .filter(h => (h.bookedPL || 0) !== 0)
        .map(h => ({
          ...h,
          sectionId: section.id,
          posCurrency: section.id === 'domestic' ? '₹' : '$'
        }))
    );
  }, [currentSections]);

  const todayProfitLoss = currentSections
    .filter(sec => activeMarket === 'all' || activeMarket === sec.id)
    .reduce((sum, sec) => {
      return sum + sec.holdings.reduce((s, h: any) => {
        const val = h.dailyGain || 0;
        const dailyGainUSD = sec.id === 'domestic' ? val / usdToInrRate : val;
        return s + (dailyGainUSD * currencyMultiplier);
      }, 0);
    }, 0);

  const overallReturnPercent = totalInvestedAmount > 0
    ? (totalGain / totalInvestedAmount) * 100
    : 0;



  const summaryMetrics: PortfolioSummaryMetric[] = [
    {
      id: "invested-amount",
      title: "Total Invested Amount",
      value: totalInvestedAmount,
      format: "currency",
      helperText: "Capital actively deployed across all asset classes.",
      trendLabel: "Capital deployed",
      isPositive: true,
      iconKey: "invested",
    },
    {
      id: "current-value",
      title: "Current Portfolio Value",
      value: isSandboxMode ? totalHoldingsValue : totalNetValue,
      format: "currency",
      helperText: "Live market value of the full portfolio snapshot.",
      trendLabel: "Market value",
      isPositive: true,
      iconKey: "portfolio",
    },
    {
      id: "today-pnl",
      title: "Today's Profit/Loss",
      value: Math.abs(todayProfitLoss),
      format: "currency",
      helperText: "Estimated intraday movement for the latest session.",
      trendLabel: todayProfitLoss >= 0 ? "Session gain" : "Session loss",
      isPositive: todayProfitLoss >= 0,
      iconKey: "today",
    },
    {
      id: "total-pnl",
      title: "Total Profit/Loss",
      value: Math.abs(totalGain),
      format: "currency",
      helperText: "Aggregate performance since the initial entry points.",
      trendLabel: totalGain >= 0 ? "Net gain" : "Net loss",
      isPositive: totalGain >= 0,
      iconKey: "total",
    },
    {
      id: "overall-return",
      title: "Overall Return %",
      value: Math.abs(overallReturnPercent),
      format: "percent",
      helperText: "Return efficiency relative to invested capital.",
      trendLabel: overallReturnPercent >= 0 ? "Positive" : "Negative",
      isPositive: overallReturnPercent >= 0,
      iconKey: "return",
    },
  ];
  const convertedPerformanceData = useMemo(() => {
    return performanceData.map(d => ({
      ...d,
      value: d.value * currencyMultiplier,
      invested: d.invested * currencyMultiplier,
      profit: d.profit * currencyMultiplier
    }));
  }, [performanceData, currencyMultiplier]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Activity className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const allocationData = currentSections
    .map((section) => ({
      name: section.title,
      value: section.holdings.reduce((sum, h) => {
        const valUSD = section.id === 'domestic' ? h.marketValue / usdToInrRate : h.marketValue;
        return sum + (valUSD * currencyMultiplier);
      }, 0),
    }))
    .filter((x) => x.value > 0);

  const allocationTotal = allocationData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const dominantAllocation =
    allocationData.length > 0
      ? [...allocationData].sort((a, b) => b.value - a.value)[0]
      : null;

  const filteredHoldings = currentSections
    .filter((section) => activeMarket === 'all' || activeMarket === section.id)
    .flatMap((section) =>
      section.holdings
        .filter(h => Math.abs(h.shares) > 0.0001)
        .map(h => ({
          ...h,
          category: section.title,
          sectionId: section.id,
        }))
    );

  const exportPortfolioToCSV = (isExcel: boolean = false) => {
    const fileExt = isExcel ? "csv" : "csv";
    let csvContent = "\uFEFF"; // UTF-8 BOM

    // Title & Metadata
    csvContent += "FinPulse Portfolio Holdings Report\n";
    csvContent += `Export Date,${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    csvContent += `Market Filter,${activeMarket === 'all' ? 'All Assets' : activeMarket}\n\n`;

    // Aggregates
    csvContent += "PORTFOLIO SUMMARY\n";
    csvContent += `Total Net Value,${activeMarket === 'domestic' ? '₹' : '$'}${totalNetValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}\n`;
    csvContent += `Total Returns,${activeMarket === 'domestic' ? '₹' : '$'}${totalGain.toLocaleString(undefined, { maximumFractionDigits: 2 })}\n\n`;

    // Holdings headers
    csvContent += "HOLDINGS LEDGER\n";
    csvContent += "Ticker,Name,Category,Qty / Vol,Avg Cost,Current Price,Market Value,Total Returns,Returns %\n";

    filteredHoldings.forEach(asset => {
      const posCurrency = asset.sectionId === 'domestic' ? '₹' : '$';
      csvContent += `"${asset.ticker}","${asset.name}","${asset.category}",${asset.shares},"${posCurrency}${asset.avgCost}","${posCurrency}${asset.currentPrice}","${posCurrency}${asset.marketValue}","${asset.totalGain >= 0 ? '+' : ''}${posCurrency}${asset.totalGain}","${asset.gainPercent >= 0 ? '+' : ''}${asset.gainPercent}%"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `finpulse_portfolio_stocks_${activeMarket}_${new Date().toISOString().slice(0, 10)}.${fileExt}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPortfolioToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const holdingsRows = filteredHoldings
      .map(asset => {
        const posCurrency = asset.sectionId === 'domestic' ? '₹' : '$';
        const gainColor = asset.totalGain >= 0 ? '#10b981' : '#ef4444';
        return `
          <tr>
            <td><strong>${asset.ticker}</strong><br/><small style="color: #64748b;">${asset.name}</small></td>
            <td>${asset.category}</td>
            <td align="right">${asset.shares.toLocaleString()}</td>
            <td align="right">${posCurrency}${asset.avgCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td align="right">${posCurrency}${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td align="right"><strong>${posCurrency}${asset.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td>
            <td align="right" style="color: ${gainColor}; font-weight: bold;">
              ${asset.totalGain >= 0 ? '+' : ''}${posCurrency}${asset.totalGain.toLocaleString(undefined, { minimumFractionDigits: 2 })}<br/>
              <small>${asset.gainPercent >= 0 ? '+' : ''}${asset.gainPercent.toFixed(2)}%</small>
            </td>
          </tr>
        `;
      })
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>FinPulse Portfolio Holdings Report</title>
          <style>
            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              color: #0f172a;
              background-color: #ffffff;
              margin: 40px;
              line-height: 1.5;
            }
            .header {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: -0.5px;
              margin: 0;
            }
            .subtitle {
              font-size: 12px;
              color: #64748b;
              margin-top: 5px;
            }
            .grid-hero {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .card {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 15px;
              background-color: #f8fafc;
            }
            .card-label {
              font-size: 9px;
              text-transform: uppercase;
              color: #64748b;
              font-weight: 700;
            }
            .card-value {
              font-size: 18px;
              font-weight: 800;
              margin-top: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #f1f5f9;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              color: #475569;
              padding: 10px 12px;
              border: 1px solid #cbd5e1;
            }
            td {
              padding: 10px 12px;
              font-size: 11px;
              border: 1px solid #e2e8f0;
              vertical-align: middle;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">FinPulse Portfolio Holdings</h1>
            <div class="subtitle">Asset positions index | Generated on ${new Date().toLocaleDateString()} | Market Hub: ${activeMarket.toUpperCase()}</div>
          </div>

          <div class="grid-hero">
            <div class="card">
              <div class="card-label">Total Net Value</div>
              <div class="card-value">${activeMarket === 'domestic' ? '₹' : '$'}${totalNetValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
            <div class="card">
              <div class="card-label">Total returns</div>
              <div class="card-value" style="color: ${totalGain >= 0 ? '#10b981' : '#ef4444'};">
                ${totalGain >= 0 ? '+' : ''}${activeMarket === 'domestic' ? '₹' : '$'}${totalGain.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
            <div class="card">
              <div class="card-label">Total positions</div>
              <div class="card-value">${filteredHoldings.length} Assets</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th align="left">Asset / Hub</th>
                <th align="left">Category</th>
                <th align="right">Qty / Vol</th>
                <th align="right">Avg Cost</th>
                <th align="right">Current Price</th>
                <th align="right">Market Value</th>
                <th align="right">Returns</th>
              </tr>
            </thead>
            <tbody>
              ${holdingsRows}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto px-1 relative">
      <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 flex-nowrap">
              <h1 className="text-xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white font-display bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
                {isSandboxMode ? '🎮 Paper Sandbox' : 'Asset Portfolio'}
              </h1>
              <button
                onClick={() => setIsSandboxMode(!isSandboxMode)}
                className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-sm whitespace-nowrap ${
                  isSandboxMode
                    ? 'bg-blue-600 hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 border-transparent'
                    : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400 text-white border-transparent'
                }`}
              >
                <span className="hidden sm:inline">{isSandboxMode ? 'Switch to Portfolio Tracker' : 'Switch to Paper Trading'}</span>
                <span className="inline sm:hidden">{isSandboxMode ? 'Portfolio' : 'Paper Trade'}</span>
              </button>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              {isSandboxMode ? 'Test strategies in real-time with $100k virtual cash balance.' : 'Global allocation breakdown with modular tracking.'}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isSandboxMode ? (
              <button
                onClick={() => setIsSandboxOpen(true)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300 min-h-[44px]"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" /> Place Paper Trade
              </button>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-cyan-500 dark:to-blue-600 px-5 py-2.5 text-xs font-bold text-white dark:text-night-950 shadow-lg hover:shadow-blue-500/25 transition-all duration-300 min-h-[44px]"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" /> Add Asset Position
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          {/* Currency Toggle (Horizontal Scrollable Pill Bar on Mobile) */}
          <div className="flex overflow-x-auto no-scrollbar gap-1 py-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none justify-start w-full sm:w-auto">
            {[
              { code: 'USD', symbol: '$' },
              { code: 'INR', symbol: '₹' },
              { code: 'EUR', symbol: '€' },
              { code: 'GBP', symbol: '£' }
            ].map((cur) => (
              <button
                key={cur.code}
                onClick={() => setPortfolioCurrency(cur.code as any)}
                className={`px-2.5 py-1 rounded-xl text-[9px] font-bold border transition-all whitespace-nowrap min-h-[30px] flex items-center justify-center ${
                  portfolioCurrency === cur.code
                    ? 'bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 border-transparent font-black shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] text-slate-655 dark:text-slate-400 border-slate-200 dark:border-white/5'
                }`}
              >
                {cur.code} ({cur.symbol})
              </button>
            ))}
          </div>

          {/* Secondary Action Cluster */}
          <div className="flex items-center gap-1.5 flex-wrap justify-start">
            <Link
              to="/performance"
              className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 shadow-sm inline-flex items-center gap-1 min-h-[30px]"
            >
              <BarChart3 className="h-3 w-3" />
              <span>Comparison</span>
            </Link>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 dark:border-cyan-500/30 bg-blue-50/20 dark:bg-cyan-500/5 px-2.5 py-1 text-[9px] font-extrabold text-blue-600 dark:text-cyan-400 shadow-sm transition-all min-h-[30px]"
              >
                <Download className="h-3 w-3" />
                <span>Export</span>
                <ChevronDown className={`h-2.5 w-2.5 transition-transform duration-300 ${showExportDropdown ? "rotate-180" : ""}`} />
              </button>

              {showExportDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121a2a] shadow-xl overflow-hidden z-50 p-1.5">
                  <button
                    onClick={() => {
                      exportPortfolioToCSV(false);
                      setShowExportDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5 opacity-60 text-blue-500" />
                    <span>Export to CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      exportPortfolioToCSV(true);
                      setShowExportDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 opacity-60 text-emerald-500" />
                    <span>Export to Excel</span>
                  </button>
                  <button
                    onClick={() => {
                      exportPortfolioToPDF();
                      setShowExportDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 opacity-60 text-purple-500" />
                    <span>Export to PDF</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-6 right-6 z-[90]">
        {isSandboxMode ? (
          <button
            onClick={() => setIsSandboxOpen(true)}
            className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-2xl active:scale-95 transition-all"
          >
            <Plus className="h-6 w-6 stroke-[3]" />
          </button>
        ) : (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-cyan-500 dark:to-blue-600 text-white dark:text-night-950 shadow-2xl active:scale-95 transition-all"
          >
            <Plus className="h-6 w-6 stroke-[3]" />
          </button>
        )}
      </div>

      {/* Aggregate Cards Grid (4 columns on all screen sizes, adjusted padding and fonts for mobile) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-4 md:gap-6">
        <div className="glass-panel p-2 sm:p-4 flex items-center gap-2 sm:gap-3 hover:border-slate-350 dark:hover:border-slate-850 hover:shadow-lg transition-all duration-300 min-w-0">
          <div className="hidden sm:flex p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-cyan-400 shrink-0">
            <PieChart className="h-5 w-5" />
          </div>
          <div className="min-w-0 w-full text-center sm:text-left">
            <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">Net Value</p>
            <h3 className="text-xs sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 truncate">
              {displayCurrency}{totalNetValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h3>
          </div>
        </div>

        <div className="glass-panel p-2 sm:p-4 flex items-center gap-2 sm:gap-3 hover:border-slate-350 dark:hover:border-slate-850 hover:shadow-lg transition-all duration-300 min-w-0">
          <div className="hidden sm:flex p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0 w-full text-center sm:text-left">
            <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
              <span className="hidden sm:inline">Total Returns</span>
              <span className="inline sm:hidden">Returns</span>
            </p>
            <h3 className={`text-xs sm:text-2xl font-black mt-0.5 truncate ${totalGain >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-500'}`}>
              {totalGain >= 0 ? '+' : ''}{displayCurrency}{totalGain.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h3>
          </div>
        </div>

        <div className="glass-panel p-2 sm:p-4 flex items-center gap-2 sm:gap-3 hover:border-slate-350 dark:hover:border-slate-850 hover:shadow-lg transition-all duration-300 min-w-0">
          <div className="hidden sm:flex p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
            <Globe className="h-5 w-5" />
          </div>
          <div className="min-w-0 w-full text-center sm:text-left">
            <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
              {isSandboxMode ? "Cash" : (
                <>
                  <span className="hidden sm:inline">Asset Classes</span>
                  <span className="inline sm:hidden">Assets</span>
                </>
              )}
            </p>
            <h3 className="text-xs sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 truncate">
              {isSandboxMode 
                ? `${displayCurrency}${cashBalanceInCurrency.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : `${activeHubsCount} Hub${activeHubsCount !== 1 ? 's' : ''}`}
            </h3>
          </div>
        </div>

        <div 
          onClick={() => setIsBookedHistoryOpen(true)}
          className="glass-panel p-2 sm:p-4 flex items-center gap-2 sm:gap-3 hover:border-slate-350 dark:hover:border-slate-850 hover:shadow-lg transition-all duration-300 cursor-pointer group min-w-0"
        >
          <div className="hidden sm:flex p-2 rounded-xl bg-amber-50 dark:bg-amber-550/10 text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0 w-full text-center sm:text-left">
            <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
              <span className="hidden sm:inline">Booked P&L</span>
              <span className="inline sm:hidden">Booked</span>
            </p>
            <h3 className={`text-xs sm:text-2xl font-black mt-0.5 truncate ${totalBookedPL >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-500'}`}>
              {totalBookedPL >= 0 ? '+' : ''}{displayCurrency}{totalBookedPL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h3>
          </div>
        </div>
      </div>

      <PortfolioSummarySection
        metrics={summaryMetrics}
        currencySymbol={displayCurrency}
      />

      {/* 1. Performance Chart (Full Page Width) */}
      {!isSandboxMode && (
        <PortfolioPerformanceChart
          data={convertedPerformanceData}
          currencySymbol={displayCurrency}
        />
      )}

      {/* Market Tab Selector at Dashboard Level */}
      <div className="flex bg-slate-100/80 dark:bg-white/[0.03] p-1 rounded-2xl border border-slate-200/50 dark:border-white/5 text-xs font-bold shadow-inner select-none mt-10 md:mt-12 mb-4 overflow-x-auto w-full max-w-full scrollbar-none">
        <div className="flex items-center gap-1 min-w-max">
          {['all', 'domestic', 'us', 'other', 'crypto', 'metals'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveMarket(tab)}
              className={`px-4 py-2 rounded-xl capitalize transition-all duration-300 whitespace-nowrap ${activeMarket === tab
                  ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-cyan-400 shadow-sm border border-slate-200/60 dark:border-white/5 font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            >
              {tab === 'all' ? 'All Assets (Consolidated USD)' : tab === 'domestic' ? '🇮🇳 Domestic (INR)' : tab === 'us' ? '🇺🇸 US Market' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Currency Split Info Banner */}
      {activeMarket === 'all' && (
        <div className="bg-slate-50 dark:bg-[#121a2a]/35 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Unified Global View: domestic INR holdings are converted to USD (1 USD = {usdToInrRate.toFixed(4)} INR) to calculate consolidated totals.</span>
          </div>
          <div className="flex items-center gap-3.5 flex-wrap">
            <span className="font-bold text-slate-700 dark:text-slate-350">Asset Segment Splits:</span>
            <span className="bg-slate-100 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800/50">🇮🇳 Domestic: <strong className="text-slate-950 dark:text-white">₹{portfolioSplits.inrVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></span>
            {portfolioSplits.usdVal > 0 && <span className="bg-slate-100 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800/50">🇺🇸 US Market: <strong className="text-slate-950 dark:text-white">${portfolioSplits.usdVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></span>}
            {portfolioSplits.cryptoVal > 0 && <span className="bg-slate-100 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800/50">🪙 Crypto: <strong className="text-slate-950 dark:text-white">${portfolioSplits.cryptoVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></span>}
            {portfolioSplits.otherVal > 0 && <span className="bg-slate-100 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800/50">🌍 Other Markets: <strong className="text-slate-950 dark:text-white">${portfolioSplits.otherVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></span>}
          </div>
        </div>
      )}

      {/* 2. Unified Holdings Card (Full-width Section below main chart) */}
      <div className="glass-panel overflow-hidden shadow-lg transition-all duration-300">
        <div className="p-6 bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Portfolio Positions</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Live holdings index list across active categories.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-500/10 dark:bg-cyan-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-cyan-400">
              {filteredHoldings.length} Positions
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-350 dark:scrollbar-thumb-slate-800">
          <table className="hidden md:table w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/60 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-white/[0.01]">
                <th className="py-4 px-4">Asset</th>
                <th className="py-4 px-4 text-right hidden sm:table-cell">Qty</th>
                <th className="py-4 px-4 text-right hidden md:table-cell">Avg Cost</th>
                <th className="py-4 px-4 text-right hidden md:table-cell">Current Price</th>
                <th className="py-4 px-4 text-right">Market Value</th>
                <th className="py-4 px-4 text-right">Returns (Total)</th>
                <th className="py-4 px-4 text-right hidden sm:table-cell">Day Change</th>
                <th className="py-4 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {filteredHoldings.map((asset, index) => {
                const posCurrency = asset.sectionId === 'domestic' ? '₹' : '$';
                const displayAvgCost = asset.avgCost;
                const displayCurrentPrice = asset.currentPrice;
                const displayMarketValue = asset.marketValue;
                const displayTotalGain = asset.totalGain;
                const displayDailyGain = asset.dailyGain || 0;

                const changePerShare = asset.shares > 0 ? displayDailyGain / asset.shares : 0;
                const prevPrice = displayCurrentPrice - changePerShare;
                const dailyGainPercent = prevPrice > 0 ? (changePerShare / prevPrice) * 100 : 0;

                return (
                  <tr key={asset.id || `${asset.ticker}-${index}`} className="hover:bg-slate-50/30 dark:hover:bg-white/[0.005] transition-colors group align-middle">
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() =>
                          openAsset({
                            symbol: asset.ticker,
                            yahooSymbol: asset.yahooSymbol || asset.ticker,
                            name: asset.name,
                            exchange: asset.exchange || "GLOBAL",
                            type: asset.type || "Asset",
                          })
                        }
                        className="flex flex-col gap-1 text-left group/asset cursor-pointer focus:outline-none"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2 py-0.5 text-[9px] font-black rounded border leading-tight ${asset.colorClass.bg} ${asset.colorClass.text} ${asset.colorClass.border}`}>
                            {asset.ticker}
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover/asset:text-blue-600 dark:group-hover/asset:text-cyan-400 transition-colors">
                            {asset.name}
                          </span>
                        </div>
                        <span className="text-[9px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                          {asset.category}
                        </span>
                      </button>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-slate-655 dark:text-slate-300 align-middle hidden sm:table-cell">
                      {asset.shares < 0 ? `${Math.abs(asset.shares).toLocaleString()} (Short)` : asset.shares.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-slate-600 dark:text-slate-355 align-middle hidden md:table-cell">
                      {posCurrency}{displayAvgCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm font-semibold text-slate-850 dark:text-slate-200 align-middle hidden md:table-cell">
                      {posCurrency}{displayCurrentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm font-bold text-slate-950 dark:text-white align-middle">
                      {posCurrency}{displayMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right align-middle">
                      <div className={`flex flex-col items-end justify-center ${asset.totalGain >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-500'}`}>
                        <span className="text-sm font-semibold flex items-center gap-0.5">
                          {asset.totalGain >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                          {posCurrency}{Math.abs(displayTotalGain).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] font-medium opacity-85">
                          {asset.gainPercent.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right align-middle font-mono hidden sm:table-cell">
                      <div className={`flex flex-col items-end justify-center ${displayDailyGain >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-500'}`}>
                        <span className="text-sm font-semibold flex items-center gap-0.5">
                          {displayDailyGain >= 0 ? '+' : ''}
                          {posCurrency}{displayDailyGain.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] font-medium opacity-85">
                          {displayDailyGain >= 0 ? '+' : ''}{dailyGainPercent.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => {
                          if (Math.abs(asset.shares) > 0.0001) {
                            setCloseTradeAsset({ ...asset, sectionId: asset.sectionId || 'us' });
                            setCloseTradeShares(String(Math.abs(asset.shares)));
                            setCloseTradePrice(String(asset.currentPrice));
                            setIsCloseModalOpen(true);
                          } else {
                            handleDeleteHolding(asset.id, asset.name);
                          }
                        }}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                        title={Math.abs(asset.shares) > 0.0001 ? (asset.shares < 0 ? "Cover short position / Close trade" : "Close trade / Realize profit") : "Remove asset permanently"}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredHoldings.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                    No active holdings found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile Holdings Card List View */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/40">
            {filteredHoldings.map((asset, index) => {
              const posCurrency = asset.sectionId === 'domestic' ? '₹' : '$';
              const displayMarketValue = asset.marketValue;
              const displayTotalGain = asset.totalGain;

              return (
                <div 
                  key={asset.id || `${asset.ticker}-${index}`} 
                  className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() =>
                      openAsset({
                        symbol: asset.ticker,
                        yahooSymbol: asset.yahooSymbol || asset.ticker,
                        name: asset.name,
                        exchange: asset.exchange || "GLOBAL",
                        type: asset.type || "Asset",
                      })
                    }
                    className="flex-1 min-w-0 text-left flex flex-col gap-0.5 focus:outline-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1 py-0.2 text-[7px] font-black rounded border leading-tight shrink-0 ${asset.colorClass.bg} ${asset.colorClass.text} ${asset.colorClass.border}`}>
                        {asset.ticker}
                      </span>
                      <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">
                        {asset.name}
                      </span>
                    </div>
                    <span className="text-[8px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate">
                      {asset.category} · Qty: {asset.shares < 0 ? `${Math.abs(asset.shares)} (Short)` : asset.shares}
                    </span>
                    <span className="text-[8px] font-semibold text-slate-450 dark:text-slate-500 truncate">
                      Avg: {posCurrency}{asset.avgCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} · LTP: {posCurrency}{asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[11px] font-bold text-slate-955 dark:text-white">
                        {posCurrency}{displayMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`text-[9px] font-semibold flex items-center gap-0.5 ${asset.totalGain >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-500'}`}>
                        {asset.totalGain >= 0 ? '+' : ''}{posCurrency}{displayTotalGain.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({asset.totalGain >= 0 ? '+' : ''}{asset.gainPercent.toFixed(1)}%)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (Math.abs(asset.shares) > 0.0001) {
                          setCloseTradeAsset({ ...asset, sectionId: asset.sectionId || 'us' });
                          setCloseTradeShares(String(Math.abs(asset.shares)));
                          setCloseTradePrice(String(asset.currentPrice));
                          setIsCloseModalOpen(true);
                        } else {
                          handleDeleteHolding(asset.id, asset.name);
                        }
                      }}
                      className="flex items-center justify-center p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-rose-550 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all min-w-[28px] min-h-[28px]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredHoldings.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                No active holdings found in this category.
              </div>
            )}
          </div>
        </div>
      </div>


        {!isSandboxMode && <UpcomingEventsSection />}



      {!isSandboxMode && (
        <div className="glass-panel p-6 overflow-hidden shadow-lg transition-all duration-300 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] via-transparent to-blue-500/[0.04] pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-800/60 pb-5">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <PieChart className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Portfolio Allocation</h2>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xl">A concentrated view of how your capital is distributed across markets, with the largest allocation highlighted for faster reading.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full bg-blue-500/10 dark:bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                {allocationData.length} Allocation Buckets
              </span>
              {dominantAllocation && (
                <span className="rounded-full bg-slate-100 dark:bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-white/5">
                  Largest: {dominantAllocation.name}
                </span>
              )}
            </div>
          </div>

          <PortfolioAllocationChart
            data={allocationData}
          />

          <div className="relative mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-3.5">
            <div className="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 sm:p-4 min-w-0">
              <p className="text-[7px] sm:text-[10px] font-bold uppercase tracking-[0.16em] sm:tracking-[0.24em] text-slate-400 dark:text-slate-500 truncate">Portfolio Value</p>
              <p className="mt-1 sm:mt-2 text-xs sm:text-lg font-black text-slate-900 dark:text-white truncate">{displayCurrency}{allocationTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 sm:p-4 min-w-0">
              <p className="text-[7px] sm:text-[10px] font-bold uppercase tracking-[0.16em] sm:tracking-[0.24em] text-slate-400 dark:text-slate-500 truncate">Largest Slice</p>
              <p className="mt-1 sm:mt-2 text-xs sm:text-lg font-black text-slate-900 dark:text-white truncate">{dominantAllocation ? dominantAllocation.name : 'N/A'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 sm:p-4 min-w-0">
              <p className="text-[7px] sm:text-[10px] font-bold uppercase tracking-[0.16em] sm:tracking-[0.24em] text-slate-400 dark:text-slate-500 truncate">Top Weight</p>
              <p className="mt-1 sm:mt-2 text-xs sm:text-lg font-black text-slate-900 dark:text-white truncate">{allocationTotal > 0 && dominantAllocation ? `${((dominantAllocation.value / allocationTotal) * 100).toFixed(0)}%` : '0%'}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL WITH NEW DEBOUNCED SEARCH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-night-950/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Add Asset Position</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-2">Asset Category</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { value: "domestic", label: "Domestic" },
                    { value: "us", label: "US Stock" },
                    { value: "crypto", label: "Crypto" },
                    { value: "metals", label: "Metals" },
                    { value: "other", label: "Other" }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMarketId(opt.value)}
                      className={`py-2.5 px-3 text-xs font-extrabold rounded-xl border transition-all ${
                        marketId === opt.value
                          ? "bg-blue-600 dark:bg-cyan-500 border-blue-600 dark:border-cyan-500 text-white dark:text-night-900 shadow-md shadow-blue-500/10"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Search Asset</label>
                <div className="relative">
                  <input
                    type="text"
                    value={assetSearch}
                    onChange={(e) => {
                      setAssetSearch(e.target.value);
                      setSelectedAsset(null);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-sm rounded-xl outline-none text-slate-900 dark:text-white pr-10 focus:border-blue-500 dark:focus:border-cyan-400 transition-colors"
                    placeholder="e.g. Apple or AAPL"
                    required
                  />
                  {isSearching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />}
                </div>

                {showSuggestions && assetSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-night-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                    {assetSuggestions.map((asset) => (
                      <div
                        key={asset.id}
                        className="px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 flex justify-between items-center border-b border-slate-50 dark:border-white/5 last:border-0"
                        onClick={() => handleSelectAsset(asset)}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{asset.symbol}</span>
                          <span className="text-xs text-slate-500 line-clamp-1">{asset.name}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">{asset.type?.replace('Common ', '')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedAsset && (
                  <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-1.5">
                    ✓ Selected: {selectedAsset.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0"
                    value={shares}
                    onChange={e => setShares(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-sm rounded-xl outline-none text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-cyan-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Average Price ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={cost}
                    onChange={e => setCost(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-sm rounded-xl outline-none text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 py-3 text-sm font-bold text-white dark:text-night-900 mt-2 shadow-md transition-all active:scale-95"
              >
                Log Position
              </button>
            </form>
          </div>
        </div>
      )}

      {isSandboxMode && (
        <PaperTradingLedger
          transactions={virtualTransactions}
          activeCurrency={displayCurrency}
          usdToInrRate={usdToInrRate}
          usdToEurRate={usdToEurRate}
          usdToGbpRate={usdToGbpRate}
          portfolioCurrency={portfolioCurrency}
        />
      )}

      <PaperTradingOrderModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        virtualBalance={virtualBalance * currencyMultiplier}
        activeCurrency={displayCurrency}
        usdToInrRate={usdToInrRate}
        currentHoldings={virtualHoldings}
        onExecuteTrade={handleExecutePaperTrade}
      />

      {/* Close Position Modal */}
      {isCloseModalOpen && closeTradeAsset && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-night-950/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsCloseModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Close Position - {closeTradeAsset.name}</h3>
              <button disabled={isClosingPosition} onClick={() => setIsCloseModalOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleClosePositionSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-2xl space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Current Shares:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {closeTradeAsset.shares < 0 
                      ? `${Math.abs(closeTradeAsset.shares).toLocaleString()} (Short)` 
                      : closeTradeAsset.shares.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Purchase Cost:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {closeTradeAsset.sectionId === 'domestic' ? '₹' : '$'}{closeTradeAsset.avgCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Current Market Price:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {closeTradeAsset.sectionId === 'domestic' ? '₹' : '$'}{closeTradeAsset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Shares to Close</label>
                  <input
                    type="number"
                    step="any"
                    required
                    disabled={isClosingPosition}
                    value={closeTradeShares}
                    onChange={e => setCloseTradeShares(e.target.value)}
                    max={Math.abs(closeTradeAsset.shares)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-sm rounded-xl outline-none text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-cyan-400 transition-colors disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Closing Price ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    disabled={isClosingPosition}
                    value={closeTradePrice}
                    onChange={e => setCloseTradePrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-sm rounded-xl outline-none text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-cyan-400 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Realized Profit/Loss Preview */}
              {(() => {
                const sharesNum = parseFloat(closeTradeShares);
                const priceNum = parseFloat(closeTradePrice);
                if (isNaN(sharesNum) || isNaN(priceNum) || sharesNum <= 0) return null;
                const isShort = closeTradeAsset.shares < 0;
                const pl = isShort 
                  ? (closeTradeAsset.avgCost - priceNum) * sharesNum
                  : (priceNum - closeTradeAsset.avgCost) * sharesNum;
                const isGain = pl >= 0;
                return (
                  <div className={`p-4 rounded-2xl border text-center space-y-1 ${isGain ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                    <span className="text-[10px] font-black uppercase tracking-wider block">Estimated Booked Profit/Loss</span>
                    <span className="text-lg font-black font-mono">
                      {isGain ? '+' : ''}{closeTradeAsset.sectionId === 'domestic' ? '₹' : '$'}{pl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })()}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isClosingPosition}
                  onClick={() => setIsCloseModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-250 dark:border-white/10 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-bold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isClosingPosition}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-night-900 text-xs font-black uppercase shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isClosingPosition && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Execute Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booked P&L History Modal */}
      {isBookedHistoryOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-night-950/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsBookedHistoryOpen(false)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Booked P&L History</h3>
              <button onClick={() => setIsBookedHistoryOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {bookedAssets.map(asset => (
                <div key={asset.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] hover:bg-slate-100/50 dark:hover:bg-white/[0.02] transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded border leading-tight ${getHoldingColorClass(asset.sectionId, asset.ticker).bg} ${getHoldingColorClass(asset.sectionId, asset.ticker).text} ${getHoldingColorClass(asset.sectionId, asset.ticker).border}`}>
                        {asset.ticker}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{asset.name}</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-1 block">
                      {asset.shares === 0 ? "Fully Closed Position" : `${asset.shares} Active Shares`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-black font-mono ${(asset.bookedPL || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-500'}`}>
                      {(asset.bookedPL || 0) >= 0 ? '+' : ''}{asset.posCurrency}{(asset.bookedPL || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => {
                        handleDeleteHolding(asset.id, asset.name);
                        // Delay slightly to allow db refresh before re-filtering
                        setTimeout(() => {
                          loadPortfolioData();
                        }, 500);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                      title={asset.shares > 0 ? "Clear booked P&L history" : "Delete history entry"}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {bookedAssets.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-6">No booked profit or loss transactions yet.</p>
              )}
            </div>

            <button
              onClick={() => setIsBookedHistoryOpen(false)}
              className="w-full mt-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white text-xs font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}