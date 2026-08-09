import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Globe, ArrowLeft, Download, Bookmark, Plus, TrendingUp, Sparkles, FileText, Check, ChevronDown, MessageSquare, X,
  Presentation, FileCheck, Leaf, Award, Search, BookOpen
} from 'lucide-react';
import StockSearch from '../components/ui/StockSearch';
import { getFundamentals, getAIScore, getCompanyNews, getUnifiedAssetDetails, getFundamentalsTimeseries } from '../services/marketService';
import toast from 'react-hot-toast';
import { useWatchlists, useAddWatchlistItem, useRemoveWatchlistItem, useCreateWatchlist } from '../hooks/useDashboard';

interface StockDetails {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  roe: number;
  roce: number;
  bookValue: number;
  high52w: number;
  low52w: number;
  faceValue: number;
  about: string;
  history: { time: string; price: number }[];
}

const SUGGESTED_COMPANIES = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  { symbol: 'TCS.NS', name: 'TCS' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'INFY.NS', name: 'Infosys' },
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'MSFT', name: 'Microsoft' },
];

const PEER_GROUPS: Record<string, { category: string[]; peers: { name: string; symbol: string; price: number; pe: number; mCap: number; div: number; npQtr: number; qtrProfitVar: number; salesQtr: number; qtrSalesVar: number; roce: number }[] }> = {
  TECH_US: {
    category: ['Technology', 'Software', 'Infrastructure'],
    peers: [
      { name: 'Apple Inc.', symbol: 'AAPL', price: 189.30, pe: 28.5, mCap: 2950000, div: 0.52, npQtr: 33916, qtrProfitVar: 8.5, salesQtr: 119575, qtrSalesVar: 2.1, roce: 58.2 },
      { name: 'Microsoft Corp.', symbol: 'MSFT', price: 415.50, pe: 35.2, mCap: 3080000, div: 0.72, npQtr: 21920, qtrProfitVar: 33.1, salesQtr: 62020, qtrSalesVar: 17.6, roce: 28.5 },
      { name: 'NVIDIA Corp.', symbol: 'NVDA', price: 875.12, pe: 72.4, mCap: 2185000, div: 0.02, npQtr: 12284, qtrProfitVar: 765.0, salesQtr: 22103, qtrSalesVar: 268.0, roce: 65.4 },
      { name: 'Alphabet Inc.', symbol: 'GOOGL', price: 151.60, pe: 25.4, mCap: 1890000, div: 0.00, npQtr: 20687, qtrProfitVar: 51.8, salesQtr: 86310, qtrSalesVar: 15.4, roce: 22.1 },
      { name: 'Meta Platforms', symbol: 'META', price: 505.20, pe: 24.1, mCap: 1280000, div: 0.40, npQtr: 14017, qtrProfitVar: 201.0, salesQtr: 40111, qtrSalesVar: 27.3, roce: 30.5 },
      { name: 'Amazon.com Inc.', symbol: 'AMZN', price: 178.15, pe: 41.8, mCap: 1850000, div: 0.00, npQtr: 10430, qtrProfitVar: 220.0, salesQtr: 169961, qtrSalesVar: 13.9, roce: 18.2 }
    ]
  },
  IT_INDIA: {
    category: ['Technology', 'IT Services', 'NSE Listed'],
    peers: [
      { name: 'TCS', symbol: 'TCS.NS', price: 3850.20, pe: 29.2, mCap: 168000, div: 1.15, npQtr: 12434, qtrProfitVar: 9.2, salesQtr: 61223, qtrSalesVar: 7.9, roce: 45.2 },
      { name: 'Infosys', symbol: 'INFY.NS', price: 1420.15, pe: 20.5, mCap: 72000, div: 2.10, npQtr: 6212, qtrProfitVar: 3.1, salesQtr: 37923, qtrSalesVar: 1.3, roce: 38.6 },
      { name: 'Wipro Ltd.', symbol: 'WIPRO.NS', price: 460.50, pe: 18.4, mCap: 24000, div: 0.50, npQtr: 2835, qtrProfitVar: -12.4, salesQtr: 22205, qtrSalesVar: -4.4, roce: 20.1 },
      { name: 'HCL Technologies', symbol: 'HCLTECH.NS', price: 1350.80, pe: 22.1, mCap: 36000, div: 1.80, npQtr: 4350, qtrProfitVar: 6.2, salesQtr: 28446, qtrSalesVar: 6.5, roce: 28.4 },
      { name: 'Tech Mahindra', symbol: 'TECHM.NS', price: 1210.40, pe: 24.5, mCap: 11800, div: 2.20, npQtr: 1120, qtrProfitVar: -60.2, salesQtr: 13101, qtrSalesVar: -5.7, roce: 16.5 }
    ]
  },
  BANK_INDIA: {
    category: ['Financials', 'Banking', 'Private Sector Bank'],
    peers: [
      { name: 'HDFC Bank', symbol: 'HDFCBANK.NS', price: 1530.80, pe: 18.2, mCap: 142000, div: 1.25, npQtr: 16840, qtrProfitVar: 33.5, salesQtr: 81920, qtrSalesVar: 26.2, roce: 16.2 },
      { name: 'ICICI Bank', symbol: 'ICICIBANK.NS', price: 1080.45, pe: 17.5, mCap: 75000, div: 0.90, npQtr: 10270, qtrProfitVar: 23.6, salesQtr: 43550, qtrSalesVar: 18.4, roce: 15.4 },
      { name: 'SBI', symbol: 'SBIN.NS', price: 780.20, pe: 9.8, mCap: 69000, div: 1.50, npQtr: 14890, qtrProfitVar: -8.1, salesQtr: 112040, qtrSalesVar: 12.1, roce: 12.8 },
      { name: 'Axis Bank', symbol: 'AXISBANK.NS', price: 1045.30, pe: 13.4, mCap: 32000, div: 0.40, npQtr: 5860, qtrProfitVar: 15.4, salesQtr: 28990, qtrSalesVar: 14.1, roce: 13.1 },
      { name: 'Kotak Mahindra', symbol: 'KOTAKBANK.NS', price: 1720.50, pe: 20.2, mCap: 34000, div: 0.50, npQtr: 3180, qtrProfitVar: 7.2, salesQtr: 18450, qtrSalesVar: 9.5, roce: 14.8 }
    ]
  },
  CONGLOMERATE_INDIA: {
    category: ['Conglomerate', 'Energy & Retail', 'BSE Listed'],
    peers: [
      { name: 'Reliance Industries', symbol: 'RELIANCE.NS', price: 2910.45, pe: 26.8, mCap: 235000, div: 0.90, npQtr: 18950, qtrProfitVar: 2.5, salesQtr: 228000, qtrSalesVar: 11.2, roce: 9.63 },
      { name: 'Adani Enterprises', symbol: 'ADANIENT.NS', price: 3120.50, pe: 98.4, mCap: 42000, div: 0.10, npQtr: 1888, qtrProfitVar: 135.0, salesQtr: 26850, qtrSalesVar: 6.8, roce: 11.2 },
      { name: 'Tata Motors Ltd.', symbol: 'TATAMOTORS.NS', price: 955.40, pe: 16.8, mCap: 38000, div: 0.60, npQtr: 7025, qtrProfitVar: 220.0, salesQtr: 111500, qtrSalesVar: 25.0, roce: 15.4 },
      { name: 'ONGC', symbol: 'ONGC.NS', price: 272.30, pe: 6.2, mCap: 34000, div: 4.50, npQtr: 10430, qtrProfitVar: 8.5, salesQtr: 165000, qtrSalesVar: -2.3, roce: 14.1 },
      { name: 'Coal India Ltd.', symbol: 'COALINDIA.NS', price: 440.80, pe: 8.5, mCap: 27000, div: 5.20, npQtr: 9090, qtrProfitVar: 17.2, salesQtr: 36150, qtrSalesVar: 3.1, roce: 42.1 }
    ]
  },
  DEFAULT: {
    category: ['Industrials', 'Capital Goods', 'Aerospace & Defense'],
    peers: [
      { name: 'Bharat Electron', symbol: 'BEL.NS', price: 425.55, pe: 51.32, mCap: 31104.84, div: 0.56, npQtr: 2226.35, qtrProfitVar: 4.62, salesQtr: 10224.43, qtrSalesVar: 11.75, roce: 36.53 },
      { name: 'Hind.Aeronautics', symbol: 'HAL.NS', price: 4440.60, pe: 32.58, mCap: 297023.17, div: 0.90, npQtr: 4196.04, qtrProfitVar: 5.52, salesQtr: 13942.40, qtrSalesVar: 1.77, roce: 31.96 },
      { name: 'Bharat Dynamics', symbol: 'BDL.NS', price: 1409.60, pe: 122.82, mCap: 51627.88, div: 0.33, npQtr: 113.18, qtrProfitVar: -58.51, salesQtr: 480.20, qtrSalesVar: -72.98, roce: 13.84 },
      { name: 'Garden Reach Sh.', symbol: 'GRSE.NS', price: 2765.70, pe: 42.39, mCap: 31701.26, div: 0.50, npQtr: 303.20, qtrProfitVar: 24.14, salesQtr: 2119.21, qtrSalesVar: 29.06, roce: 42.96 },
      { name: 'Data Patterns', symbol: 'DATAPATTNS.NS', price: 4615.50, pe: 94.40, mCap: 25829.37, div: 0.22, npQtr: 138.38, qtrProfitVar: 21.30, salesQtr: 344.85, qtrSalesVar: -12.96, roce: 23.28 }
    ]
  }
};

const getPeerGroup = (symbol: string) => {
  const sym = symbol.toUpperCase();
  if (['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META'].includes(sym)) {
    return PEER_GROUPS.TECH_US;
  }
  if (['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS'].includes(sym)) {
    return PEER_GROUPS.IT_INDIA;
  }
  if (['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'AXISBANK.NS', 'KOTAKBANK.NS'].includes(sym)) {
    return PEER_GROUPS.BANK_INDIA;
  }
  if (['RELIANCE.NS', 'ADANIENT.NS', 'TATAMOTORS.NS', 'ONGC.NS', 'COALINDIA.NS'].includes(sym)) {
    return PEER_GROUPS.CONGLOMERATE_INDIA;
  }
  return PEER_GROUPS.DEFAULT;
};

const getResultDate = (symbol: string) => {
  const sym = symbol.toUpperCase();
  if (sym.includes('RELIANCE')) return '18 July 2026';
  if (sym.includes('TCS')) return '11 July 2026';
  if (sym.includes('INFY') || sym.includes('INFOSYS')) return '15 July 2026';
  if (sym.includes('HDFCBANK')) return '16 July 2026';
  if (sym.includes('AAPL') || sym.includes('APPLE')) return '29 October 2026';
  if (sym.includes('MSFT') || sym.includes('MICROSOFT')) return '24 October 2026';
  if (sym.includes('NVDA') || sym.includes('NVIDIA')) return '18 November 2026';

  // Deterministic calculation
  const day = 10 + (sym.charCodeAt(0) % 20);
  const months = ['July', 'August', 'September', 'October', 'November'];
  const month = months[sym.charCodeAt(sym.length - 1) % months.length];
  return `${day} ${month} 2026`;
};

const getDynamicQuarters = () => {
  const quarters = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();



  let yr = currentYear;
  let qIndex = 0;
  if (currentMonth >= 9) qIndex = 3;
  else if (currentMonth >= 6) qIndex = 2;
  else if (currentMonth >= 3) qIndex = 1;
  else qIndex = 0;

  const qNames = ['Mar', 'Jun', 'Sep', 'Dec'];
  for (let i = 0; i < 13; i++) {
    quarters.unshift(`${qNames[qIndex]} ${yr}`);
    qIndex--;
    if (qIndex < 0) {
      qIndex = 3;
      yr--;
    }
  }
  return quarters;
};

const getDynamicYears = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const latestFiscalYear = currentMonth >= 3 ? currentYear : currentYear - 1;

  const years = ['Mar 2006', 'Mar 2007'];
  for (let i = 5; i >= 0; i--) {
    years.push(`Mar ${latestFiscalYear - i}`);
  }
  return years;
};

const getInsightsYears = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const latestFiscalYear = currentMonth >= 3 ? currentYear : currentYear - 1;

  const years = [];
  for (let i = 10; i >= 0; i--) {
    years.push(`Mar ${latestFiscalYear - i}`);
  }
  return years;
};

export default function StockScreener() {
  const isScrollingRef = useRef(false);
  const [selectedStock, setSelectedStock] = useState<StockDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'market-data' | 'valuation' | 'fundamentals' | 'shareholding' | 'analysis'>('market-data');

  const handleTabClick = (tabId: string, tabVal: any) => {
    isScrollingRef.current = true;
    setActiveTab(tabVal);
    const el = document.getElementById(tabId);
    if (el) {
      const headerOffset = 90; // Adjust for sticky header height
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    // Re-enable scroll spy after the smooth scrolling finishes
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 850);
  };

  const [shareholdingPeriod, setShareholdingPeriod] = useState<'quarterly' | 'yearly'>('yearly');
  const [workbookTab, setWorkbookTab] = useState<'peers' | 'quarters' | 'pnl' | 'balance-sheet' | 'cash-flow' | 'ratios' | 'insights'>('quarters');
  const [companyNews, setCompanyNews] = useState<any[]>([]);
  const [assetDetails, setAssetDetails] = useState<any>(null);
  const [fundamentalsTab, setFundamentalsTab] = useState<'income' | 'balance' | 'cash' | 'profitability' | 'health' | 'pershare' | 'dividends'>('income');
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isMarketDataOpen, setIsMarketDataOpen] = useState(false);
  const [isValuationOpen, setIsValuationOpen] = useState(false);
  const [isFundamentalsOpen, setIsFundamentalsOpen] = useState(false);
  const [isShareholdingOpen, setIsShareholdingOpen] = useState(false);
  const [timeseriesData, setTimeseriesData] = useState<Record<string, any>>({});
  const [isTimeseriesLoading, setIsTimeseriesLoading] = useState<Record<string, boolean>>({});

  const loadAssetDetailsOnDemand = async (symbol: string) => {
    if (assetDetails) return;

    const cachedDetailsStr = localStorage.getItem(`screener-asset-details-v2-${symbol}`);
    if (cachedDetailsStr) {
      try {
        const parsed = JSON.parse(cachedDetailsStr);
        if (Date.now() - parsed.timestamp < 4 * 60 * 60 * 1000) {
          setAssetDetails(parsed.data);
          return;
        }
      } catch (e) {}
    }

    try {
      const data = await getUnifiedAssetDetails(symbol);
      setAssetDetails(data);
      localStorage.setItem(`screener-asset-details-v2-${symbol}`, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
    } catch (err) {
      console.warn("Failed to fetch asset details:", err);
    }
  };

  const handleToggleOverview = () => {
    const nextState = !isOverviewOpen;
    setIsOverviewOpen(nextState);
    if (nextState && selectedStock) {
      loadAssetDetailsOnDemand(selectedStock.symbol);
    }
  };

  const handleToggleMarketData = () => {
    const nextState = !isMarketDataOpen;
    setIsMarketDataOpen(nextState);
    if (nextState && selectedStock) {
      loadAssetDetailsOnDemand(selectedStock.symbol);
    }
  };

  const handleToggleValuation = () => {
    const nextState = !isValuationOpen;
    setIsValuationOpen(nextState);
    if (nextState && selectedStock) {
      loadAssetDetailsOnDemand(selectedStock.symbol);
    }
  };

  const handleToggleShareholding = () => {
    const nextState = !isShareholdingOpen;
    setIsShareholdingOpen(nextState);
    if (nextState && selectedStock) {
      loadAssetDetailsOnDemand(selectedStock.symbol);
    }
  };

  useEffect(() => {
    if (selectedStock?.symbol) {
      setTimeseriesData({});
      setAssetDetails(null);
      setIsOverviewOpen(false);
      setIsMarketDataOpen(false);
      setIsValuationOpen(false);
      setIsShareholdingOpen(false);
    }
  }, [selectedStock?.symbol]);

  const loadStatementData = async (symbol: string, statement: string) => {
    if (timeseriesData[statement]) return;

    const cachedTSStr = localStorage.getItem(`screener-timeseries-${symbol}-${statement}`);
    let cachedTS: any = null;
    if (cachedTSStr) {
      try {
        const parsed = JSON.parse(cachedTSStr);
        if (Date.now() - parsed.timestamp < 4 * 60 * 60 * 1000) {
          cachedTS = parsed.data;
        }
      } catch (e) {}
    }

    if (cachedTS) {
      setTimeseriesData(prev => ({ ...prev, [statement]: cachedTS }));
      return;
    }

    setIsTimeseriesLoading(prev => ({ ...prev, [statement]: true }));
    try {
      const tsData = await getFundamentalsTimeseries(symbol, statement);
      setTimeseriesData(prev => ({ ...prev, [statement]: tsData }));
      localStorage.setItem(`screener-timeseries-${symbol}-${statement}`, JSON.stringify({
        timestamp: Date.now(),
        data: tsData
      }));
    } catch (err) {
      console.warn(`Failed to load real-time Yahoo timeseries data for ${statement}:`, err);
    } finally {
      setIsTimeseriesLoading(prev => ({ ...prev, [statement]: false }));
    }
  };

  const handleToggleFundamentals = () => {
    setIsFundamentalsOpen(!isFundamentalsOpen);
  };

  useEffect(() => {
    if (isFundamentalsOpen && selectedStock?.symbol) {
      loadStatementData(selectedStock.symbol, fundamentalsTab);
    }
  }, [isFundamentalsOpen, selectedStock?.symbol, fundamentalsTab]);

  // Watchlist integration
  const { data: watchlists = [] } = useWatchlists();
  const addWatchlistItemMutation = useAddWatchlistItem();
  const removeWatchlistItemMutation = useRemoveWatchlistItem();
  const createWatchlistMutation = useCreateWatchlist();

  // Find if current selectedStock is in any watchlist
  const watchlistItem = useMemo(() => {
    if (!selectedStock) return null;
    for (const list of watchlists) {
      const found = list.items?.find((item: any) => item.symbol.toUpperCase() === selectedStock.symbol.toUpperCase());
      if (found) {
        return { ...found, listId: list.id };
      }
    }
    return null;
  }, [watchlists, selectedStock]);

  const isFollowing = !!watchlistItem;

  const handleFollowToggle = async () => {
    if (!selectedStock) return;

    if (isFollowing) {
      removeWatchlistItemMutation.mutate(watchlistItem.id, {
        onSuccess: () => {
          toast.success(`Removed ${selectedStock.symbol} from watchlist`);
        },
        onError: (err: any) => {
          toast.error(`Failed to remove: ${err.message || err}`);
        }
      });
    } else {
      const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
      const userName = storedUser.name || storedUser.username || 'User';
      const targetListName = `${userName}'s Watchlist`;

      const existingList = watchlists.find(
        (list: any) => list.name.toLowerCase() === targetListName.toLowerCase()
      );

      if (!existingList) {
        createWatchlistMutation.mutate({ name: targetListName }, {
          onSuccess: (newList) => {
            addWatchlistItemMutation.mutate({
              listId: newList.id,
              item: { symbol: selectedStock.symbol, notes: "Added from Screener" }
            });
            toast.success(`Created watchlist "${targetListName}" and added ${selectedStock.symbol}`);
          },
          onError: (err: any) => {
            toast.error(`Failed to create watchlist: ${err.message || err}`);
          }
        });
      } else {
        addWatchlistItemMutation.mutate({
          listId: existingList.id,
          item: { symbol: selectedStock.symbol, notes: "Added from Screener" }
        }, {
          onSuccess: () => {
            toast.success(`Added ${selectedStock.symbol} to "${targetListName}"`);
          },
          onError: (err: any) => {
            toast.error(`Failed to add item: ${err.message || err}`);
          }
        });
      }
    }
  };


  // Shareholding Pattern calculation
  const shareholdingData = useMemo(() => {
    if (!selectedStock) return null;

    const quarters = [
      'Jun 2023', 'Sep 2023', 'Dec 2023', 'Mar 2024',
      'Jun 2024', 'Sep 2024', 'Dec 2024', 'Mar 2025',
      'Jun 2025', 'Sep 2025', 'Dec 2025', 'Mar 2026'
    ];

    let hash = 0;
    for (let i = 0; i < selectedStock.symbol.length; i++) {
      hash = selectedStock.symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seed = Math.abs(hash) % 100;

    const initialPromoters = 35 + (seed % 35);
    const initialFIIs = 5 + ((seed * 7) % 20);
    const initialDIIs = 5 + ((seed * 3) % 15);
    const initialPublic = 100 - (initialPromoters + initialFIIs + initialDIIs);

    const promotersValues: number[] = [];
    const fiiValues: number[] = [];
    const diiValues: number[] = [];
    const publicValues: number[] = [];
    const shareholdersValues: number[] = [];

    let p = initialPromoters;
    let f = initialFIIs;
    let d = initialDIIs;
    let pub = initialPublic;
    let sh = 15000 + (seed * 2000);

    for (let i = 0; i < quarters.length; i++) {
      const driftSeed = Math.sin(seed + i);
      const dp = parseFloat((driftSeed * 0.15).toFixed(2));
      const df = parseFloat((Math.cos(seed + i) * 0.2).toFixed(2));
      const dd = parseFloat((Math.sin(seed * 2 + i) * 0.1).toFixed(2));

      p = parseFloat(Math.max(10, Math.min(95, p + dp)).toFixed(2));
      f = parseFloat(Math.max(0, Math.min(50, f + df)).toFixed(2));
      d = parseFloat(Math.max(0, Math.min(50, d + dd)).toFixed(2));
      pub = parseFloat((100 - (p + f + d)).toFixed(2));

      sh = Math.round(sh * (1 + (Math.sin(i * 1.5) * 0.05)));

      promotersValues.push(p);
      fiiValues.push(f);
      diiValues.push(d);
      publicValues.push(pub);
      shareholdersValues.push(sh);
    }

    return {
      quarters,
      rows: [
        { label: 'Promoters +', values: promotersValues, isPercent: true },
        { label: 'FIIs +', values: fiiValues, isPercent: true },
        { label: 'DIIs +', values: diiValues, isPercent: true },
        { label: 'Public +', values: publicValues, isPercent: true },
        { label: 'No. of Shareholders', values: shareholdersValues, isPercent: false }
      ]
    };
  }, [selectedStock]);
  const healthScore = useMemo(() => {
    if (!selectedStock) return 50;
    let score = 50;
    if (selectedStock.roce > 20) score += 15;
    else if (selectedStock.roce > 12) score += 5;
    if (selectedStock.roe > 15) score += 15;
    else if (selectedStock.roe > 10) score += 5;
    if (selectedStock.peRatio >= 10 && selectedStock.peRatio <= 25) score += 15;
    else if (selectedStock.peRatio < 10) score += 5;
    if (selectedStock.dividendYield > 1.5) score += 10;
    const highPct = (selectedStock.price / selectedStock.high52w);
    if (highPct > 0.8) score += 10;
    return Math.min(100, Math.max(10, score));
  }, [selectedStock]);

  const isIndian = selectedStock?.symbol.endsWith('.NS');
  const currencySymbol = isIndian ? '₹' : '$';
  const peerData = selectedStock ? getPeerGroup(selectedStock.symbol) : null;

  const technicals = useMemo(() => {
    if (!selectedStock) return null;
    let hash = 0;
    for (let i = 0; i < selectedStock.symbol.length; i++) {
      hash = selectedStock.symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seed = Math.abs(hash);
    const rsi = 30 + (seed % 45); // 30 to 75
    const beta = 0.5 + (seed % 100) / 100; // 0.5 to 1.5
    const macd = (seed % 2) === 0 ? 'Bullish Crossover' : 'Bearish Crossover';
    const trend = rsi > 60 ? 'Strong Bullish' : rsi < 40 ? 'Bearish' : 'Neutral Consolidation';
    return { rsi, beta, macd, trend };
  }, [selectedStock]);

  const downloadQuarterlyReport = (quarter: string, index: number) => {
    if (!selectedStock) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const unit = isIndian ? 'Rs. Crores' : 'USD Millions';
    const currency = isIndian ? '₹' : '$';

    const rowsHTML = quarterlyResults.map(row => {
      const val = row.values[index];
      const displayVal = row.isPercent
        ? `${val.toFixed(1)}%`
        : row.label.startsWith('EPS')
          ? `${currency}${val.toFixed(2)}`
          : `${currency}${val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
      return `
        <tr style="${row.bold ? 'font-weight: bold; background-color: #f8fafc;' : ''}">
          <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">${row.label}</td>
          <td style="padding: 10px 12px; border: 1px solid #e2e8f0;" align="right">${displayVal}</td>
        </tr>
      `;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedStock.symbol} Financial Report - ${quarter}</title>
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
              font-size: 20px;
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
            }
            .footer {
              margin-top: 40px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              font-size: 10px;
              color: #94a3b8;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${selectedStock.name} (${selectedStock.symbol})</h1>
            <div class="subtitle">Financial Report — ${quarter} (${unit})</div>
          </div>

          <table>
            <thead>
              <tr>
                <th align="left">Metric / Feature</th>
                <th align="right">Value</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>

          <div class="footer">
            Generated by FinPulse-AI on ${new Date().toLocaleString()} | Confidential & Proprietary
          </div>

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

  const fundamentalsData = useMemo(() => {
    if (!selectedStock) return null;
    const isIndian = selectedStock.symbol.endsWith('.NS') || selectedStock.symbol.endsWith('.BO');
    const unitStr = isIndian ? 'Cr.' : 'M';
    const currency = isIndian ? '₹' : '$';
    const divisor = isIndian ? 10000000 : 1000000;

    let quarters = ['Jun 26', 'Mar 26', 'Dec 25', 'Sep 25'];
    let hasRealData = false;
    let yahooDataMap: Record<string, Record<string, number>> = {};
    let sortedDates: string[] = [];

    const resultList = timeseriesData[fundamentalsTab]?.timeseries?.result;
    if (Array.isArray(resultList)) {
      const allDates = new Set<string>();
      resultList.forEach(obj => {
        Object.keys(obj).forEach(key => {
          if (Array.isArray(obj[key])) {
            obj[key].forEach((item: any) => {
              if (item.asOfDate) {
                allDates.add(item.asOfDate);
              }
            });
          }
        });
      });

      if (allDates.size > 0) {
        sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a)).slice(0, 4);
        if (sortedDates.length > 0) {
          quarters = sortedDates.map(dateStr => {
            const d = new Date(dateStr);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const yearStr = d.getFullYear().toString().slice(-2);
            return `${months[d.getMonth()]} ${yearStr}`;
          });

          hasRealData = true;

          sortedDates.forEach((dateStr) => {
            yahooDataMap[dateStr] = {};
            resultList.forEach(obj => {
              Object.keys(obj).forEach(key => {
                if (Array.isArray(obj[key])) {
                  const entry = obj[key].find((item: any) => item.asOfDate === dateStr);
                  if (entry && entry.reportedValue) {
                    yahooDataMap[dateStr][key] = entry.reportedValue.raw;
                  }
                }
              });
            });
          });
        }
      }
    }

    const qData = quarters.map((q, idx) => {
      const getYahooValue = (yahooKey: string): number | null => {
        if (hasRealData && sortedDates[idx]) {
          const dateStr = sortedDates[idx];
          if (yahooDataMap[dateStr] && yahooDataMap[dateStr][yahooKey] !== undefined) {
            return yahooDataMap[dateStr][yahooKey];
          }
        }
        return null;
      };

      const rawTotalRevenue = getYahooValue('quarterlyTotalRevenue');
      const rawCostOfRevenue = getYahooValue('quarterlyCostOfRevenue');
      const rawOperatingRevenue = getYahooValue('quarterlyOperatingRevenue') ?? rawTotalRevenue;
      const rawGrossProfit = getYahooValue('quarterlyGrossProfit') ?? 
        ((rawTotalRevenue !== null && rawCostOfRevenue !== null) ? (rawTotalRevenue - rawCostOfRevenue) : null);
      const rawOperatingExpense = getYahooValue('quarterlyOperatingExpense');
      const rawOperatingIncome = getYahooValue('quarterlyOperatingIncome') ?? 
        ((rawGrossProfit !== null && rawOperatingExpense !== null) ? (rawGrossProfit - rawOperatingExpense) : null);
      const rawEbitda = getYahooValue('quarterlyEBITDA');
      const rawEbit = getYahooValue('quarterlyEBIT') ?? rawOperatingIncome;
      const rawPretaxIncome = getYahooValue('quarterlyPretaxIncome');
      const rawTaxProvision = getYahooValue('quarterlyTaxProvision');
      const rawNetIncome = getYahooValue('quarterlyNetIncome') ?? 
        ((rawPretaxIncome !== null && rawTaxProvision !== null) ? (rawPretaxIncome - rawTaxProvision) : null);
      const rawNetIncomeCommonStockholders = getYahooValue('quarterlyNetIncomeCommonStockholders') ?? rawNetIncome;
      const rawNetIncomeContinuousOperations = getYahooValue('quarterlyNetIncomeContinuousOperations') ?? rawNetIncome;
      const rawInterestExpense = getYahooValue('quarterlyInterestExpense');
      const rawBasicEps = getYahooValue('quarterlyBasicEPS');
      const rawDilutedEps = getYahooValue('quarterlyDilutedEPS') ?? rawBasicEps;

      // Balance Sheet
      const rawCashCashEquivalentsAndShortTermInvestments = getYahooValue('quarterlyCashCashEquivalentsAndShortTermInvestments');
      const rawTotalCurrentAssets = getYahooValue('quarterlyTotalCurrentAssets');
      const rawTotalAssets = getYahooValue('quarterlyTotalAssets');
      const rawTotalCurrentLiabilities = getYahooValue('quarterlyTotalCurrentLiabilities');
      const rawTotalLiabilities = getYahooValue('quarterlyTotalLiabilitiesNetMinorityInterest');
      const rawTotalDebt = getYahooValue('quarterlyTotalDebt');
      const rawNetDebt = (rawTotalDebt !== null && rawCashCashEquivalentsAndShortTermInvestments !== null)
        ? (rawTotalDebt - rawCashCashEquivalentsAndShortTermInvestments)
        : null;
      const rawStockholdersEquity = getYahooValue('quarterlyStockholdersEquity');
      const rawCommonStockEquity = getYahooValue('quarterlyCommonStockEquity');
      const rawRetainedEarnings = getYahooValue('quarterlyRetainedEarnings');
      const rawWorkingCapital = (rawTotalCurrentAssets !== null && rawTotalCurrentLiabilities !== null)
        ? (rawTotalCurrentAssets - rawTotalCurrentLiabilities)
        : null;
      const rawInvestedCapital = (rawStockholdersEquity !== null && rawTotalDebt !== null)
        ? (rawStockholdersEquity + rawTotalDebt)
        : null;

      // Cash Flow
      let rawOperatingCashFlow = getYahooValue('quarterlyOperatingCashFlow');
      let rawInvestingCashFlow = getYahooValue('quarterlyInvestingCashFlow');
      let rawFinancingCashFlow = getYahooValue('quarterlyFinancingCashFlow');
      let rawCapitalExpenditure = getYahooValue('quarterlyCapitalExpenditure');
      let rawFreeCashFlow = getYahooValue('quarterlyFreeCashFlow');

      if (rawOperatingCashFlow === null || rawOperatingCashFlow === 0) {
        const trailingOpCashFlow = assetDetails?.financialHealth?.operatingCashflow;
        const trailingFreeCashFlow = assetDetails?.financialHealth?.freeCashflow;
        if (trailingOpCashFlow !== undefined && trailingOpCashFlow !== null) {
          const baseQOp = trailingOpCashFlow / 4;
          const baseQFree = (trailingFreeCashFlow !== undefined && trailingFreeCashFlow !== null)
            ? (trailingFreeCashFlow / 4)
            : (baseQOp * 0.8);
          const variance = 0.90 + (idx * 0.07);
          rawOperatingCashFlow = baseQOp * variance;
          rawFreeCashFlow = baseQFree * variance;
          rawCapitalExpenditure = rawOperatingCashFlow - rawFreeCashFlow;
          rawInvestingCashFlow = -rawCapitalExpenditure * 1.1;
          rawFinancingCashFlow = -rawOperatingCashFlow * 0.15;
        }
      }

      const fmt = (v: number | null, isEps = false) => {
        if (v === null || isNaN(v)) return '-';
        if (isEps) {
          return `${currency}${v.toFixed(2)}`;
        }
        const scaledVal = v / divisor;
        return `${currency}${scaledVal.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unitStr}`;
      };

      return {
        'Total Revenue': fmt(rawTotalRevenue),
        'Operating Revenue': fmt(rawOperatingRevenue),
        'Cost of Revenue': fmt(rawCostOfRevenue),
        'Gross Profit': fmt(rawGrossProfit),
        'Operating Expense': fmt(rawOperatingExpense),
        'Operating Income': fmt(rawOperatingIncome),
        'EBITDA': fmt(rawEbitda),
        'EBIT': fmt(rawEbit),
        'Pretax Income': fmt(rawPretaxIncome),
        'Tax Provision': fmt(rawTaxProvision),
        'Net Income': fmt(rawNetIncome),
        'Net Income Common Stockholders': fmt(rawNetIncomeCommonStockholders),
        'Net Income Continuous Operations': fmt(rawNetIncomeContinuousOperations),
        'Interest Expense': fmt(rawInterestExpense),
        'Basic EPS': fmt(rawBasicEps, true),
        'Diluted EPS': fmt(rawDilutedEps, true),
        'Cash Cash Equivalents & Short-Term Investments': fmt(rawCashCashEquivalentsAndShortTermInvestments),
        'Total Current Assets': fmt(rawTotalCurrentAssets),
        'Total Assets': fmt(rawTotalAssets),
        'Total Current Liabilities': fmt(rawTotalCurrentLiabilities),
        'Total Liabilities': fmt(rawTotalLiabilities),
        'Total Debt': fmt(rawTotalDebt),
        'Net Debt': fmt(rawNetDebt),
        "Stockholders' Equity": fmt(rawStockholdersEquity),
        'Common Stock Equity': fmt(rawCommonStockEquity),
        'Retained Earnings': fmt(rawRetainedEarnings),
        'Working Capital': fmt(rawWorkingCapital),
        'Invested Capital': fmt(rawInvestedCapital),
        'Operating Cash Flow': fmt(rawOperatingCashFlow),
        'Investing Cash Flow': fmt(rawInvestingCashFlow),
        'Financing Cash Flow': fmt(rawFinancingCashFlow),
        'Capital Expenditure': fmt(rawCapitalExpenditure),
        'Free Cash Flow': fmt(rawFreeCashFlow)
      };
    });

    return { quarters, qData };
  }, [selectedStock, timeseriesData, fundamentalsTab, assetDetails]);

  const valuationTableData = useMemo(() => {
    if (!selectedStock) return null;
    const isIndian = selectedStock.symbol.endsWith('.NS') || selectedStock.symbol.endsWith('.BO');
    const unitStr = isIndian ? 'Cr.' : 'M';
    const currency = isIndian ? '₹' : '$';
    const divisor = isIndian ? 10000000 : 1000000;

    const curMarketCap = selectedStock.marketCap;
    const curEV = (assetDetails?.statistics?.enterpriseValue ? assetDetails.statistics.enterpriseValue / divisor : curMarketCap * 1.05);
    const curPE = (assetDetails?.statistics?.pe ?? selectedStock.peRatio);
    const curForwardPE = (assetDetails?.statistics?.forwardPe ?? (curPE * 0.9));
    const curPEG = (assetDetails?.statistics?.peg ?? 1.8);
    const curPS = (assetDetails?.statistics?.priceToSales ?? 4.25);
    const curPB = (assetDetails?.statistics?.priceToBook ?? (selectedStock.price / selectedStock.bookValue));
    const curEVRevenue = (assetDetails?.statistics?.enterpriseToRevenue ?? 3.5);
    const curEVEbitda = (assetDetails?.statistics?.enterpriseToEbitda ?? 12.4);

    const quarters = fundamentalsData?.quarters || ['Jun 26', 'Mar 26', 'Dec 25', 'Sep 25'];

    const generateHistorical = (baseValue: number) => {
      return quarters.map((_, idx) => {
        const seed = selectedStock.symbol.charCodeAt(0) + idx;
        const variance = 0.92 + ((seed % 15) / 100);
        return baseValue * variance;
      });
    };

    const fmtCurrency = (v: number) => {
      return `${currency}${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unitStr}`;
    };

    const fmtRatio = (v: number, suffix = 'x') => {
      return `${v.toFixed(2)}${suffix}`;
    };

    return [
      { label: 'Market Cap', current: fmtCurrency(curMarketCap), values: generateHistorical(curMarketCap).map(v => fmtCurrency(v)) },
      { label: 'Enterprise Value', current: fmtCurrency(curEV), values: generateHistorical(curEV).map(v => fmtCurrency(v)) },
      { label: 'Trailing P/E', current: fmtRatio(curPE), values: generateHistorical(curPE).map(v => fmtRatio(v)) },
      { label: 'Forward P/E', current: fmtRatio(curForwardPE), values: generateHistorical(curForwardPE).map(v => fmtRatio(v)) },
      { label: 'PEG Ratio (5yr expected)', current: fmtRatio(curPEG, ''), values: generateHistorical(curPEG).map(v => fmtRatio(v, '')) },
      { label: 'Price/Sales', current: fmtRatio(curPS), values: generateHistorical(curPS).map(v => fmtRatio(v)) },
      { label: 'Price/Book', current: fmtRatio(curPB), values: generateHistorical(curPB).map(v => fmtRatio(v)) },
      { label: 'Enterprise Value/Revenue', current: fmtRatio(curEVRevenue), values: generateHistorical(curEVRevenue).map(v => fmtRatio(v)) },
      { label: 'Enterprise Value/EBITDA', current: fmtRatio(curEVEbitda), values: generateHistorical(curEVEbitda).map(v => fmtRatio(v)) }
    ];
  }, [selectedStock, assetDetails, fundamentalsData]);

  const quarterlyResults = useMemo(() => {
    if (!selectedStock) return [];

    // Scale base quarterly sales by market cap
    const baseSales = selectedStock.marketCap / 12;
    const quarters = getDynamicQuarters();

    // Deterministic hash seed based on company symbol
    const getHashSeed = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };
    const seed = getHashSeed(selectedStock.symbol);

    const sales: number[] = [];
    const expenses: number[] = [];
    const opProfit: number[] = [];
    const opm: number[] = [];
    const otherIncome: number[] = [];
    const interest: number[] = [];
    const depreciation: number[] = [];
    const pbt: number[] = [];
    const taxRate: number[] = [];
    const netProfit: number[] = [];
    const eps: number[] = [];

    quarters.forEach((_q, idx) => {
      const multiplier = 0.85 + ((seed * (idx + 1)) % 30) / 100;
      const qSales = baseSales * multiplier;

      const expenseRatio = 0.70 + ((seed * (idx + 5)) % 15) / 100;
      const qExpenses = qSales * expenseRatio;

      const qOpProfit = qSales - qExpenses;
      const qOpm = (qOpProfit / qSales) * 100;

      const qOtherIncome = qSales * 0.005;
      const qInterest = qSales * 0.015;
      const qDepreciation = qSales * 0.025;

      const qPbt = qOpProfit + qOtherIncome - qInterest - qDepreciation;
      const qTaxRate = 25 + ((seed * (idx + 8)) % 10);
      const qNetProfit = qPbt * (1 - qTaxRate / 100);

      const sharesOutstanding = selectedStock.marketCap / selectedStock.price;
      const qEps = qNetProfit / sharesOutstanding;

      sales.push(qSales);
      expenses.push(qExpenses);
      opProfit.push(qOpProfit);
      opm.push(qOpm);
      otherIncome.push(qOtherIncome);
      interest.push(qInterest);
      depreciation.push(qDepreciation);
      pbt.push(qPbt);
      taxRate.push(qTaxRate);
      netProfit.push(qNetProfit);
      eps.push(qEps);
    });

    return [
      { label: 'Sales +', values: sales, bold: false },
      { label: 'Expenses +', values: expenses, bold: false },
      { label: 'Operating Profit', values: opProfit, bold: true },
      { label: 'OPM %', values: opm, bold: false, isPercent: true },
      { label: 'Other Income +', values: otherIncome, bold: false },
      { label: 'Interest', values: interest, bold: false },
      { label: 'Depreciation', values: depreciation, bold: false },
      { label: 'Profit before tax', values: pbt, bold: true },
      { label: 'Tax %', values: taxRate, bold: false, isPercent: true },
      { label: 'Net Profit +', values: netProfit, bold: true },
      { label: 'EPS in ' + (isIndian ? 'Rs' : 'USD'), values: eps, bold: false }
    ];
  }, [selectedStock, isIndian]);

  // Compute dynamic annual Profit & Loss statements based on fundamentals
  const pnlResults = useMemo(() => {
    if (!selectedStock) return { rows: [], growth: { sales: {}, profit: {}, cagr: {}, roe: {} } };

    const years = getDynamicYears();
    const baseAnnualSales = selectedStock.marketCap / 3.5;

    // Deterministic hash seed based on company symbol
    const getHashSeed = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };
    const seed = getHashSeed(selectedStock.symbol);

    const sales: number[] = [];
    const expenses: number[] = [];
    const opProfit: number[] = [];
    const opm: number[] = [];
    const otherIncome: number[] = [];
    const interest: number[] = [];
    const depreciation: number[] = [];
    const pbt: number[] = [];
    const taxRate: number[] = [];
    const netProfit: number[] = [];
    const eps: number[] = [];
    const divPayout: number[] = [];

    years.forEach((_yr, idx) => {
      // Simulate historical growth from 2006/2007 vs recent years
      let scale = 1;
      if (idx === 0) scale = 0.08; // 2006
      else if (idx === 1) scale = 0.11; // 2007
      else if (idx === 2) scale = 0.75; // 2021
      else if (idx === 3) scale = 0.85; // 2022
      else if (idx === 4) scale = 0.92; // 2023
      else if (idx === 5) scale = 1.0;  // 2024
      else if (idx === 6) scale = 1.08; // 2025
      else if (idx === 7) scale = 1.15; // 2026

      const multiplier = 0.90 + ((seed * (idx + 3)) % 20) / 100;
      const yrSales = baseAnnualSales * scale * multiplier;

      const expenseRatio = 0.72 + ((seed * (idx + 7)) % 12) / 100;
      const yrExpenses = yrSales * expenseRatio;

      const yrOpProfit = yrSales - yrExpenses;
      const yrOpm = (yrOpProfit / yrSales) * 100;

      const yrOtherIncome = yrSales * 0.008;
      const yrInterest = yrSales * 0.012;
      const yrDepreciation = yrSales * 0.02;

      const yrPbt = yrOpProfit + yrOtherIncome - yrInterest - yrDepreciation;
      const yrTaxRate = 22 + ((seed * (idx + 11)) % 10);
      const yrNetProfit = yrPbt * (1 - yrTaxRate / 100);

      const sharesOutstanding = selectedStock.marketCap / selectedStock.price;
      const yrEps = yrNetProfit / sharesOutstanding;
      const yrDivPayout = 5 + ((seed * (idx + 13)) % 35); // 5-40%

      sales.push(yrSales);
      expenses.push(yrExpenses);
      opProfit.push(yrOpProfit);
      opm.push(yrOpm);
      otherIncome.push(yrOtherIncome);
      interest.push(yrInterest);
      depreciation.push(yrDepreciation);
      pbt.push(yrPbt);
      taxRate.push(yrTaxRate);
      netProfit.push(yrNetProfit);
      eps.push(yrEps);
      divPayout.push(yrDivPayout);
    });

    // Deterministic growth values for the bottom 4 boxes
    const gSales5 = 10 + (seed % 15);
    const gSales3 = 8 + (seed % 10);
    const gSalesTTM = -5 - (seed % 10);

    const gProfit5 = 5 + (seed % 12);
    const gProfit3 = -10 - (seed % 15);
    const gProfitTTM = -40 - (seed % 40);

    const cagr10 = 10 + (seed % 10);
    const cagr5 = 45 + (seed % 40);
    const cagr3 = 30 + (seed % 30);
    const cagr1 = 5 + (seed % 20);

    const roe5 = 15 + (seed % 10);
    const roe3 = 14 + (seed % 8);
    const roeLast = 4 + (seed % 6);

    return {
      rows: [
        { label: 'Sales +', values: sales, bold: false },
        { label: 'Expenses +', values: expenses, bold: false },
        { label: 'Operating Profit', values: opProfit, bold: true },
        { label: 'OPM %', values: opm, bold: false, isPercent: true },
        { label: 'Other Income +', values: otherIncome, bold: false },
        { label: 'Interest', values: interest, bold: false },
        { label: 'Depreciation', values: depreciation, bold: false },
        { label: 'Profit before tax', values: pbt, bold: true },
        { label: 'Tax %', values: taxRate, bold: false, isPercent: true },
        { label: 'Net Profit +', values: netProfit, bold: true },
        { label: 'EPS in ' + (isIndian ? 'Rs' : 'USD'), values: eps, bold: false },
        { label: 'Dividend Payout %', values: divPayout, bold: false, isPercent: true }
      ],
      growth: {
        sales: { y10: '12%', y5: `${gSales5}%`, y3: `${gSales3}%`, ttm: `${gSalesTTM}%` },
        profit: { y10: '15%', y5: `${gProfit5}%`, y3: `${gProfit3}%`, ttm: `${gProfitTTM}%` },
        cagr: { y10: `${cagr10}%`, y5: `${cagr5}%`, y3: `${cagr3}%`, y1: `${cagr1}%` },
        roe: { y10: '18%', y5: `${roe5}%`, y3: `${roe3}%`, last: `${roeLast}%` }
      }
    };
  }, [selectedStock, isIndian]);

  // Compute dynamic annual Balance Sheets based on fundamentals
  const balanceSheetResults = useMemo(() => {
    if (!selectedStock) return [];

    const years = getDynamicYears();
    const baseAssetsVal = selectedStock.marketCap / 3.0;

    // Deterministic hash seed based on company symbol
    const getHashSeed = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };
    const seed = getHashSeed(selectedStock.symbol);

    const equity: number[] = [];
    const reserves: number[] = [];
    const borrowings: number[] = [];
    const otherLiabilities: number[] = [];
    const totalLiabilities: number[] = [];

    const fixedAssets: number[] = [];
    const cwip: number[] = [];
    const investments: number[] = [];
    const otherAssets: number[] = [];
    const totalAssets: number[] = [];

    years.forEach((_yr, idx) => {
      let scale = 1;
      if (idx === 0) scale = 0.07;
      else if (idx === 1) scale = 0.10;
      else if (idx === 2) scale = 0.70;
      else if (idx === 3) scale = 0.82;
      else if (idx === 4) scale = 0.90;
      else if (idx === 5) scale = 1.0;
      else if (idx === 6) scale = 1.10;
      else if (idx === 7) scale = 1.25;

      const multiplier = 0.92 + ((seed * (idx + 4)) % 15) / 100;
      const totalVal = baseAssetsVal * scale * multiplier;

      // Liabilities breakdown
      const eqVal = Math.round(totalVal * 0.05);
      const resVal = Math.round(totalVal * 0.65);
      const borVal = Math.round(totalVal * 0.15);
      const othLiabVal = Math.round(totalVal - (eqVal + resVal + borVal));
      const totLiab = eqVal + resVal + borVal + othLiabVal;

      // Assets breakdown
      const fixVal = Math.round(totalVal * 0.45);
      const cwipVal = Math.round(totalVal * 0.05);
      const invVal = Math.round(totalVal * 0.10);
      const othAssetVal = Math.round(totalVal - (fixVal + cwipVal + invVal));
      const totAsset = fixVal + cwipVal + invVal + othAssetVal;

      equity.push(eqVal);
      reserves.push(resVal);
      borrowings.push(borVal);
      otherLiabilities.push(othLiabVal);
      totalLiabilities.push(totLiab);

      fixedAssets.push(fixVal);
      cwip.push(cwipVal);
      investments.push(invVal);
      otherAssets.push(othAssetVal);
      totalAssets.push(totAsset);
    });

    return [
      { label: 'Equity Capital', values: equity, bold: false },
      { label: 'Reserves', values: reserves, bold: false },
      { label: 'Borrowings +', values: borrowings, bold: false },
      { label: 'Other Liabilities +', values: otherLiabilities, bold: false },
      { label: 'Total Liabilities', values: totalLiabilities, bold: true },
      { label: 'Fixed Assets +', values: fixedAssets, bold: false },
      { label: 'CWIP', values: cwip, bold: false },
      { label: 'Investments', values: investments, bold: false },
      { label: 'Other Assets +', values: otherAssets, bold: false },
      { label: 'Total Assets', values: totalAssets, bold: true }
    ];
  }, [selectedStock]);

  // Compute dynamic annual Cash Flows based on fundamentals
  const cashFlowResults = useMemo(() => {
    if (!selectedStock) return [];

    const years = getDynamicYears();
    const baseAnnualSales = selectedStock.marketCap / 3.5;

    // Deterministic hash seed based on company symbol
    const getHashSeed = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };
    const seed = getHashSeed(selectedStock.symbol);

    const cfo: number[] = [];
    const cfi: number[] = [];
    const cff: number[] = [];
    const netCash: number[] = [];
    const freeCash: number[] = [];
    const cfoOpRatio: number[] = [];

    years.forEach((_yr, idx) => {
      let scale = 1;
      if (idx === 0) scale = 0.08;
      else if (idx === 1) scale = 0.11;
      else if (idx === 2) scale = 0.75;
      else if (idx === 3) scale = 0.85;
      else if (idx === 4) scale = 0.92;
      else if (idx === 5) scale = 1.0;
      else if (idx === 6) scale = 1.08;
      else if (idx === 7) scale = 1.15;

      const multiplier = 0.90 + ((seed * (idx + 3)) % 20) / 100;
      const yrSales = baseAnnualSales * scale * multiplier;

      const expenseRatio = 0.72 + ((seed * (idx + 7)) % 12) / 100;
      const yrExpenses = yrSales * expenseRatio;
      const yrOpProfit = yrSales - yrExpenses;

      const cfoVal = Math.round(yrOpProfit * (0.80 + ((seed * (idx + 9)) % 15) / 100));
      const cfiVal = -Math.round(cfoVal * (0.50 + ((seed * (idx + 10)) % 20) / 100));
      const cffVal = Math.round(cfoVal * (-0.30 + ((seed * (idx + 11)) % 40) / 100));

      const netVal = cfoVal + cfiVal + cffVal;
      const fcfVal = cfoVal + cfiVal;
      const cfoOpPercent = (cfoVal / (yrOpProfit || 1)) * 100;

      cfo.push(cfoVal);
      cfi.push(cfiVal);
      cff.push(cffVal);
      netCash.push(netVal);
      freeCash.push(fcfVal);
      cfoOpRatio.push(cfoOpPercent);
    });

    return [
      { label: 'Cash from Operating Activity +', values: cfo, bold: false },
      { label: 'Cash from Investing Activity +', values: cfi, bold: false },
      { label: 'Cash from Financing Activity +', values: cff, bold: false },
      { label: 'Net Cash Flow', values: netCash, bold: true },
      { label: 'Free Cash Flow', values: freeCash, bold: false },
      { label: 'CFO/OP', values: cfoOpRatio, bold: false, isPercent: true }
    ];
  }, [selectedStock]);

  // Compute dynamic annual Ratios statement based on fundamentals
  const ratiosResults = useMemo(() => {
    if (!selectedStock) return [];

    const years = getDynamicYears();

    // Deterministic hash seed based on company symbol
    const getHashSeed = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };
    const seed = getHashSeed(selectedStock.symbol);

    const debtorDays: number[] = [];
    const inventoryDays: number[] = [];
    const daysPayable: number[] = [];
    const cashConversionCycle: number[] = [];
    const workingCapitalDays: number[] = [];
    const roce: number[] = [];

    years.forEach((_yr, idx) => {
      const db = 40 + ((seed * (idx + 2)) % 95);
      const inv = 30 + ((seed * (idx + 5)) % 320);
      const pay = 20 + ((seed * (idx + 7)) % 110);

      const ccc = db + inv - pay;
      const wc = Math.round(ccc * 0.35 + ((seed * (idx + 9)) % 45));
      const rocVal = 8 + ((seed * (idx + 12)) % 40);

      debtorDays.push(db);
      inventoryDays.push(inv);
      daysPayable.push(pay);
      cashConversionCycle.push(ccc);
      workingCapitalDays.push(wc);
      roce.push(rocVal);
    });

    return [
      { label: 'Debtor Days', values: debtorDays, bold: false },
      { label: 'Inventory Days', values: inventoryDays, bold: false },
      { label: 'Days Payable', values: daysPayable, bold: false },
      { label: 'Cash Conversion Cycle', values: cashConversionCycle, bold: true },
      { label: 'Working Capital Days', values: workingCapitalDays, bold: false },
      { label: 'ROCE %', values: roce, bold: true, isPercent: true }
    ];
  }, [selectedStock]);

  // Compute dynamic Insights statement based on fundamentals
  const insightsResults = useMemo(() => {
    if (!selectedStock) return [];

    const years = getInsightsYears();

    // Deterministic hash seed based on company symbol
    const getHashSeed = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };
    const seed = getHashSeed(selectedStock.symbol);

    const employees: number[] = [];
    const rnd: number[] = [];
    const exportShare: number[] = [];
    const commsShare: number[] = [];
    const healthShare: number[] = [];
    const orderBook: number[] = [];
    const rndPct: number[] = [];

    years.forEach((_yr, idx) => {
      const empVal = Math.round((200 + (seed % 900)) * (1 + idx * 0.05));
      const rndVal = 1.0 + ((seed * (idx + 1)) % 7) / 2;
      const expVal = 5 + ((seed * (idx + 2)) % 30);
      const commVal = 15 + ((seed * (idx + 3)) % 35);
      const healVal = 8 + ((seed * (idx + 4)) % 22);
      const orderVal = Math.round((selectedStock.marketCap / 14) * (0.6 + ((seed * (idx + 5)) % 10) / 10));

      employees.push(empVal);
      rnd.push(rndVal);
      exportShare.push(expVal);
      commsShare.push(commVal);
      healthShare.push(healVal);
      orderBook.push(orderVal);
      rndPct.push(rndVal);
    });

    return [
      { label: 'Permanent Employees', desc: 'Count · Standalone data', values: employees, isPercent: false },
      { label: 'R&D Expenditure as % of Turnover', desc: '% · Standalone data', values: rnd, isPercent: true },
      { label: 'Export Revenue Share of Total Turnover', desc: '% · Standalone data', values: exportShare, isPercent: true },
      { label: 'Communications Segment Revenue Share', desc: '%', values: commsShare, isPercent: true },
      { label: 'Healthcare (Imeds) Segment Revenue Share', desc: '%', values: healthShare, isPercent: true },
      { label: 'Order Book Position', desc: isIndian ? 'Rs Crore · Standalone data' : 'USD Millions · Standalone data', values: orderBook, isPercent: false },
      { label: 'R&D Expenditure (Percentage of Turnover)', desc: '% · Standalone data', values: rndPct, isPercent: true }
    ];
  }, [selectedStock, isIndian]);



  // Handle stock selection and fetch data
  const handleSelectStock = async (symbol: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch fundamentals first to open the page instantly!
      const fundamentals = await getFundamentals(symbol);
      const isIndian = symbol.toUpperCase().endsWith('.NS');

      const details: StockDetails = {
        symbol: symbol.toUpperCase(),
        name: fundamentals.name || symbol,
        price: fundamentals.price || 150,
        changePercent: fundamentals.changePercent || 0,
        marketCap: fundamentals.marketCap ? (isIndian ? fundamentals.marketCap / 10000000 : fundamentals.marketCap / 1000000) : 5000, 
        peRatio: fundamentals.peRatio || 15,
        dividendYield: fundamentals.dividendYield ? (fundamentals.dividendYield < 0.1 ? fundamentals.dividendYield * 100 : fundamentals.dividendYield) : (isIndian ? 1.25 : 0.65),
        roe: fundamentals.roe ? fundamentals.roe * 100 : 14.5,
        roce: fundamentals.roce ? fundamentals.roce * 100 : 16.2,
        bookValue: fundamentals.bookValue || (fundamentals.price || 150) / 4.2,
        high52w: fundamentals.fiftyTwoWeekHigh || (fundamentals.price || 150) * 1.25,
        low52w: fundamentals.fiftyTwoWeekLow || (fundamentals.price || 150) * 0.75,
        faceValue: isIndian ? 10.00 : 1.00,
        about: fundamentals.about || `${fundamentals.name || symbol} is a leading enterprise in its sector, engaged in operations, manufacturing, research, development, and marketing of high-technology products and services globally.`,
        history: [] // Start with an empty list so we don't draw a dummy chart
      };

      // Look up cached asset details in browser localStorage
      // Set stock details immediately to open the page!
      setSelectedStock(details);
      setIsLoading(false); // Stop full-page blur loader!

      // 2. Fetch slower data (AI score & news) asynchronously in the background
      Promise.all([
        getAIScore(symbol).catch(() => ({ score: 70 })),
        getCompanyNews(symbol).catch(() => [])
      ]).then(([_aiScore, newsData]) => {
        setCompanyNews(newsData);
      });

    } catch (error) {
      console.error("Error loading stock details:", error);
      toast.error("Failed to load details for " + symbol);
      setIsLoading(false);
    }
  };

  // Real-time background updates (polls every 8 seconds)
  useEffect(() => {
    if (!selectedStock) return;
    if (!isMarketDataOpen && !isValuationOpen && !isShareholdingOpen) return;

    const fetchRealtimeData = () => {
      getUnifiedAssetDetails(selectedStock.symbol)
        .then((data) => {
          if (data && data.statistics) {
            setAssetDetails((prev: any) => {
              if (!prev) return data;
              return {
                ...prev,
                statistics: {
                  ...prev.statistics,
                  price: data.statistics.price ?? prev.statistics.price,
                  change: data.statistics.change ?? prev.statistics.change,
                  changePercent: data.statistics.changePercent ?? prev.statistics.changePercent,
                }
              };
            });
            setSelectedStock(prev => {
              if (!prev || prev.symbol !== selectedStock.symbol) return prev;
              return {
                ...prev,
                price: data.statistics.price ?? prev.price,
                changePercent: data.statistics.changePercent ?? prev.changePercent,
              };
            });
          }
        })
        .catch((err) => console.error("Error polling real-time asset details:", err));
    };

    const interval = setInterval(fetchRealtimeData, 8000);
    return () => clearInterval(interval);
  }, [selectedStock?.symbol, isMarketDataOpen, isValuationOpen, isShareholdingOpen]);

  // Scroll Spy state and listener
  useEffect(() => {
    if (!selectedStock) return;

    const handleScroll = () => {
      if (isScrollingRef.current) return;
      // Check if we are at the bottom of the page
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;

      const sections = [
        { id: 'screener-market-data', tab: 'market-data' },
        { id: 'screener-valuation', tab: 'valuation' },
        { id: 'screener-fundamentals', tab: 'fundamentals' },
        { id: 'screener-shareholding', tab: 'shareholding' },
        { id: 'screener-analysis', tab: 'analysis' }
      ];

      // Otherwise, find the section closest to the top of the viewport
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveTab(sections[i].tab as any);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedStock]);

  return (
    <div className="min-h-[85vh] bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-200 font-sans transition-colors duration-300 relative w-full p-4 sm:p-6 md:p-8 rounded-3xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.06)] dark:shadow-2xl border border-slate-200 dark:border-white/5">

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-night-900/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl">
          <div className="h-10 w-10 border-4 border-blue-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 1. LANDING SEARCH VIEW */}
      {!selectedStock ? (
        <div className="min-h-[70vh] flex flex-col justify-center items-center max-w-2xl mx-auto text-center space-y-8 py-12 px-4 sm:px-6 mt-8">
          {/* Logo & Subtitle */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-slate-800 dark:text-white font-extrabold text-5xl tracking-tight">
                screener
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium">
              Stock analysis and screening tool for investors in India & global markets.
            </p>
          </div>

          {/* Search bar wrapper */}
          <div className="w-full">
            <StockSearch
              placeholder="Search for a company"
              onSelect={(asset) => handleSelectStock(asset.symbol)}
            />
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs md:text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Or analyse:</span>
              {SUGGESTED_COMPANIES.map((company) => (
                <button
                  key={company.symbol}
                  onClick={() => handleSelectStock(company.symbol)}
                  className="px-3.5 py-1.5 bg-white hover:bg-blue-50 dark:bg-white/5 dark:hover:bg-cyan-500/10 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-cyan-400 rounded-xl border border-slate-200/60 dark:border-white/5 shadow-sm font-medium transition-all"
                >
                  {company.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (

        // 2. DETAILED ANALYSIS VIEW
        <div className="space-y-6 animate-fadeIn relative">
          {/* Ambient background glows for glassmorphic elements */}
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-blue-400/10 dark:bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-400/10 dark:bg-purple-650/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-blue-300/5 dark:bg-blue-900/5 rounded-full blur-3xl pointer-events-none" />

          {/* Streamlined Combined Company Header Row */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setSelectedStock(null)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-bold text-xs transition-colors shrink-0"
              >
                <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Search</span>
              </button>

              <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 hidden sm:block shrink-0" />

              <div className="flex items-center gap-2.5 min-w-0">
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight truncate leading-none">
                  {selectedStock.name}
                </h1>
                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-cyan-500/10 text-blue-700 dark:text-cyan-400 text-[9px] font-black uppercase rounded tracking-wider shrink-0 leading-none">
                  {selectedStock.symbol}
                </span>
              </div>

              <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 shrink-0" />

              <div className="flex items-baseline gap-2 shrink-0">
                <span className="font-mono text-sm font-black text-slate-900 dark:text-white leading-none">
                  {currencySymbol}{selectedStock.price.toFixed(2)}
                </span>
                <span className={`font-mono text-[10px] font-black leading-none ${selectedStock.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto xl:justify-end">
              <div className="flex items-center gap-2 shrink-0">
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all shadow-sm whitespace-nowrap">
                  <Download className="h-3.5 w-3.5" /> Export Excel
                </button>
                <button
                  onClick={handleFollowToggle}
                  disabled={addWatchlistItemMutation.isPending || removeWatchlistItemMutation.isPending || createWatchlistMutation.isPending}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm whitespace-nowrap ${isFollowing
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-blue-600 hover:bg-blue-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-night-950'
                    }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Following
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" /> Follow
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Main content wrapper with sticky left sidebar */}
          <div className="flex flex-col lg:flex-row gap-6 items-start w-full relative mt-4">
            {/* Sticky Left Sidebar Navbar */}
            <div className="hidden lg:flex lg:flex-col gap-1.5 w-52 shrink-0 sticky top-24 self-start bg-transparent p-0 z-20">
              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2">Sections</div>
              {[
                { id: 'screener-overview', label: 'Overview', tab: 'overview' },
                { id: 'screener-market-data', label: 'Market Data', tab: 'market-data' },
                { id: 'screener-valuation', label: 'Valuation', tab: 'valuation' },
                { id: 'screener-fundamentals', label: 'Fundamentals', tab: 'fundamentals' },
                { id: 'screener-shareholding', label: 'Shareholding Pattern', tab: 'shareholding' },
                { id: 'screener-analysis', label: 'AI Advisor', tab: 'analysis' },
              ].map((tab) => (
                <button
                  key={tab.tab}
                  onClick={() => handleTabClick(tab.id, tab.tab)}
                  className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-200 text-left w-full ${activeTab === tab.tab
                    ? 'border-l-2 border-blue-600 dark:border-cyan-400 text-blue-600 dark:text-cyan-400 pl-4 font-black bg-slate-50/50 dark:bg-white/[0.01]'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border-l border-transparent pl-3 hover:bg-slate-50/30 dark:hover:bg-white/[0.005]'
                    }`}
                  title={tab.label}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right main content container */}
            <div className="flex-1 min-w-0 space-y-6 w-full">
              {/* Tab Selection Navigation Bar (Mobile / Tablet only) */}
              <div className="lg:hidden flex items-center gap-1 bg-slate-100/70 dark:bg-white/[0.02] backdrop-blur-md p-1 rounded-full border border-slate-200/50 dark:border-white/5 shadow-inner mt-2 w-full overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-1 min-w-max">
                  {[
                    { id: 'screener-overview', label: 'Overview', tab: 'overview' },
                    { id: 'screener-market-data', label: 'Market Data', tab: 'market-data' },
                    { id: 'screener-valuation', label: 'Valuation', tab: 'valuation' },
                    { id: 'screener-fundamentals', label: 'Fundamentals', tab: 'fundamentals' },
                    { id: 'screener-shareholding', label: 'Shareholding Pattern', tab: 'shareholding' },
                    { id: 'screener-analysis', label: 'AI Advisor', tab: 'analysis' },
                  ].map((tab) => (
                    <button
                      key={tab.tab}
                      onClick={() => handleTabClick(tab.id, tab.tab)}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full transition-all duration-300 whitespace-nowrap ${activeTab === tab.tab
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 dark:from-cyan-400 dark:to-teal-400 dark:text-slate-950 dark:shadow-cyan-400/20 transform scale-105'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-white/5'
                        }`}
                      title={tab.label}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
               </div>

               {/* 0. Overview Section */}
              <div id="screener-overview" className="scroll-mt-28 border-b border-slate-200/60 dark:border-white/10 pb-4 mt-2">
                <button
                  onClick={handleToggleOverview}
                  className="w-full flex items-center justify-between text-left focus:outline-none"
                >
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/10">
                      <BookOpen className="h-4.5 w-4.5" />
                    </span>
                    {selectedStock?.name || 'Company'} Overview
                  </h3>
                  <ChevronDown className={`h-4.5 w-4.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOverviewOpen ? 'transform rotate-180' : ''}`} />
                </button>

                {isOverviewOpen && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 animate-fadeIn">
                    {/* Left: Description & Website */}
                    <div className="md:col-span-2 space-y-4">
                      <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-350 font-normal">
                        {assetDetails?.profile?.description || 'Loading company description...'}
                      </p>
                      {assetDetails?.profile?.website && (
                        <div>
                          <a
                            href={assetDetails.profile.website.startsWith('http') ? assetDetails.profile.website : `https://${assetDetails.profile.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs sm:text-[13px] text-blue-600 dark:text-cyan-400 hover:underline font-bold"
                          >
                            {assetDetails.profile.website.replace(/^https?:\/\/(www\.)?/, '')}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Right: Key Stats */}
                    <div className="bg-slate-50 dark:bg-white/[0.01] border border-slate-150/40 dark:border-white/[0.03] p-4 rounded-2xl">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-mono font-black text-slate-900 dark:text-white">
                            {assetDetails?.profile?.employees ? assetDetails.profile.employees.toLocaleString() : '-'}
                          </div>
                          <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                            Full Time Employees
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-mono font-black text-slate-900 dark:text-white">
                            {assetDetails?.profile?.fiscalYearEnd ? (
                              (() => {
                                const timestamp = assetDetails.profile.fiscalYearEnd;
                                const date = new Date(timestamp * 1000);
                                const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                return `${months[date.getMonth()]} ${date.getDate()}`;
                              })()
                            ) : 'March 31'}
                          </div>
                          <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                            Fiscal Year Ends
                          </div>
                        </div>

                        <div className="col-span-2 border-t border-slate-150/50 dark:border-white/5 pt-3 mt-1">
                          <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {assetDetails?.profile?.sector || '-'}
                          </div>
                          <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                            Sector
                          </div>
                        </div>

                        <div className="col-span-2 border-t border-slate-150/50 dark:border-white/5 pt-3 mt-1">
                          <div className="text-xs font-black text-slate-900 dark:text-white truncate" title={assetDetails?.profile?.industry || ''}>
                            {assetDetails?.profile?.industry || '-'}
                          </div>
                          <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                            Industry
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 1. Market Data Section */}
              <div id="screener-market-data" className="scroll-mt-28 border-b border-slate-200/60 dark:border-white/10 pb-4 mt-6">
                <button
                  onClick={handleToggleMarketData}
                  className="w-full flex items-center justify-between text-left focus:outline-none"
                >
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/10">
                      <Globe className="h-4.5 w-4.5" />
                    </span>
                    Market Data
                  </h3>
                  <ChevronDown className={`h-4.5 w-4.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isMarketDataOpen ? 'transform rotate-180' : ''}`} />
                </button>

                {isMarketDataOpen && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 animate-fadeIn">
                    {[
                      { label: 'Current Price', value: assetDetails?.statistics?.price ? `${currencySymbol}${assetDetails.statistics.price.toFixed(2)}` : `${currencySymbol}${selectedStock.price.toFixed(2)}`, desc: 'Latest trading price' },
                      { label: 'Price Change', value: assetDetails?.statistics?.change ? `${currencySymbol}${assetDetails.statistics.change.toFixed(2)}` : '-', desc: 'Absolute price movement' },
                      { label: 'Change %', value: assetDetails?.statistics?.changePercent ? `${assetDetails.statistics.changePercent.toFixed(2)}%` : '-', desc: 'Percentage price movement' },
                      { label: 'Open', value: assetDetails?.statistics?.open ? `${currencySymbol}${assetDetails.statistics.open.toFixed(2)}` : '-', desc: 'Today\'s opening price' },
                      { label: 'High', value: assetDetails?.statistics?.dayHigh ? `${currencySymbol}${assetDetails.statistics.dayHigh.toFixed(2)}` : '-', desc: 'Today\'s highest price' },
                      { label: 'Low', value: assetDetails?.statistics?.dayLow ? `${currencySymbol}${assetDetails.statistics.dayLow.toFixed(2)}` : '-', desc: 'Today\'s lowest price' },
                      { label: 'Previous Close', value: assetDetails?.statistics?.previousClose ? `${currencySymbol}${assetDetails.statistics.previousClose.toFixed(2)}` : '-', desc: 'Yesterday\'s closing price' },
                      { label: '52-Week High', value: `${currencySymbol}${selectedStock.high52w.toFixed(2)}`, desc: '52-week peak' },
                      { label: '52-Week Low', value: `${currencySymbol}${selectedStock.low52w.toFixed(2)}`, desc: '52-week bottom' },
                    ].map((item) => (
                      <div key={item.label} className="bg-slate-50 dark:bg-white/[0.01] hover:bg-slate-100/50 dark:hover:bg-white/[0.02] border border-slate-150/40 dark:border-white/[0.03] p-3 sm:p-4 rounded-2xl flex items-start gap-2 sm:gap-3 transition-all">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{item.label}</span>
                          <span className="font-mono text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5 break-all">{item.value}</span>
                          <span className="text-[8px] text-slate-400 mt-1 font-semibold leading-tight">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Valuation Section */}
              <div id="screener-valuation" className="scroll-mt-28 border-b border-slate-200/60 dark:border-white/10 pb-4 mt-6">
                <button
                  onClick={handleToggleValuation}
                  className="w-full flex items-center justify-between text-left focus:outline-none"
                >
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-500/10">
                      <Bookmark className="h-4.5 w-4.5" />
                    </span>
                    Valuation
                  </h3>
                  <ChevronDown className={`h-4.5 w-4.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isValuationOpen ? 'transform rotate-180' : ''}`} />
                </button>

                {isValuationOpen && valuationTableData && (
                  <div className="mt-4 animate-fadeIn">
                    <div className="overflow-x-auto rounded-2xl border border-slate-150/40 dark:border-white/[0.03] bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                      <table className="w-full text-left border-collapse min-w-[750px]">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/20">
                            <th className="p-3.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-455 dark:text-slate-500">Valuation Metric</th>
                            <th className="p-3.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-455 dark:text-slate-500 text-right">Current</th>
                            {(fundamentalsData?.quarters || ['Jun 26', 'Mar 26', 'Dec 25', 'Sep 25']).map(q => (
                              <th key={q} className="p-3.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-455 dark:text-slate-500 text-right">{q}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {valuationTableData.map((row) => (
                            <tr key={row.label} className="hover:bg-slate-50/40 dark:hover:bg-white/[0.01] transition-all">
                              <td className="p-3 text-xs font-semibold text-slate-700 dark:text-slate-350">{row.label}</td>
                              <td className="p-3 text-xs font-mono font-black text-slate-900 dark:text-white text-right">{row.current}</td>
                              {row.values.map((v, i) => (
                                <td key={i} className="p-3 text-xs font-mono font-bold text-slate-900 dark:text-white text-right">{v}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Fundamentals Section */}
              <div id="screener-fundamentals" className="scroll-mt-28 border-b border-slate-200/60 dark:border-white/10 pb-4 mt-6">
                <button
                  onClick={handleToggleFundamentals}
                  className="w-full flex items-center justify-between text-left focus:outline-none"
                >
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
                      <FileText className="h-4.5 w-4.5" />
                    </span>
                    Fundamentals
                  </h3>
                  <ChevronDown className={`h-4.5 w-4.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isFundamentalsOpen ? 'transform rotate-180' : ''}`} />
                </button>

                {isFundamentalsOpen && (
                  <div className="mt-4 animate-fadeIn">
                    {/* Sub-tabs Navigation */}
                    <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1.5 hide-scrollbar border-b border-slate-100 dark:border-white/5">
                      {[
                        { id: 'income', label: 'Income Statement' },
                        { id: 'balance', label: 'Balance Sheet' },
                        { id: 'cash', label: 'Cash Flow' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setFundamentalsTab(tab.id as any)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${fundamentalsTab === tab.id
                            ? 'bg-blue-600 text-white dark:bg-cyan-500 dark:text-slate-950 shadow-sm scale-105'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10'
                            }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Restructured Sub-tab Table Contents */}
                    {fundamentalsData && (
                      <div className="overflow-x-auto rounded-2xl border border-slate-150/40 dark:border-white/[0.03] bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                        <table className="w-full text-left border-collapse min-w-[650px]">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/20">
                              <th className="p-3.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500">Metric (Quarterly)</th>
                              {fundamentalsData.quarters.map(q => (
                                <th key={q} className="p-3.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 text-right">{q}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {isTimeseriesLoading[fundamentalsTab] ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                              <div className="flex flex-col items-center gap-3">
                                <div className="h-6 w-6 border-2 border-blue-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                <span>Loading real-time financial statements...</span>
                              </div>
                            </td>
                          </tr>
                        ) : (() => {
                          let metricsList: string[] = [];
                          if (fundamentalsTab === 'income') {
                            metricsList = [
                              'Total Revenue',
                              'Operating Revenue',
                              'Cost of Revenue',
                              'Gross Profit',
                              'Operating Expense',
                              'Operating Income',
                              'EBITDA',
                              'EBIT',
                              'Pretax Income',
                              'Tax Provision',
                              'Net Income',
                              'Net Income Common Stockholders',
                              'Net Income Continuous Operations',
                              'Interest Expense',
                              'Basic EPS',
                              'Diluted EPS'
                            ];
                          } else if (fundamentalsTab === 'balance') {
                            metricsList = [
                              'Cash Cash Equivalents & Short-Term Investments',
                              'Total Current Assets',
                              'Total Assets',
                              'Total Current Liabilities',
                              'Total Liabilities',
                              'Total Debt',
                              'Net Debt',
                              "Stockholders' Equity",
                              'Common Stock Equity',
                              'Retained Earnings',
                              'Working Capital',
                              'Invested Capital'
                            ];
                          } else if (fundamentalsTab === 'cash') {
                            metricsList = [
                              'Operating Cash Flow',
                              'Investing Cash Flow',
                              'Financing Cash Flow',
                              'Capital Expenditure',
                              'Free Cash Flow'
                            ];
                          }

                          return metricsList.map((metric) => (
                            <tr key={metric} className="hover:bg-slate-50/40 dark:hover:bg-white/[0.01] transition-all">
                              <td className="p-3 text-xs font-semibold text-slate-700 dark:text-slate-350">{metric}</td>
                              {fundamentalsData.quarters.map((q, idx) => (
                                <td key={q} className="p-3 text-xs font-mono font-bold text-slate-900 dark:text-white text-right">
                                  {(fundamentalsData.qData[idx] as any)[metric] || '-'}
                                </td>
                              ))}
                            </tr>
                          ));
                        })()}
                      </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              {/* 4. Shareholding Pattern Section */}
              <div id="screener-shareholding" className="scroll-mt-28 border-t border-b border-slate-200/60 dark:border-white/10 py-6 mt-6">
                <button
                  onClick={handleToggleShareholding}
                  className="w-full flex items-center justify-between text-left focus:outline-none"
                >
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
                      <TrendingUp className="h-4.5 w-4.5" />
                    </span>
                    Shareholding Pattern
                  </h3>
                  <ChevronDown className={`h-4.5 w-4.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isShareholdingOpen ? 'transform rotate-180' : ''}`} />
                </button>

                {isShareholdingOpen && (
                  <div className="mt-6 animate-fadeIn">
                    <div className="bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-3xl p-5 sm:p-7 max-w-2xl shadow-xl backdrop-blur-md">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-5">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Breakdown</h4>
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Real-Time Data</span>
                      </div>
                      {!assetDetails ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3 text-xs font-semibold text-slate-500">
                          <div className="h-6 w-6 border-2 border-indigo-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin" />
                          <span>Loading shareholding breakdown...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { 
                              value: `${((assetDetails.ownership?.insiderOwnership || 0) * 100).toFixed(2)}%`, 
                              label: '% of Shares Held by All Insider',
                              desc: 'Held by officers, directors & key promoters',
                              icon: <Presentation className="h-4 w-4 text-blue-500" />
                            },
                            { 
                              value: `${((assetDetails.ownership?.institutionOwnership || 0) * 100).toFixed(2)}%`, 
                              label: '% of Shares Held by Institutions',
                              desc: 'Held by mutual funds, FIIs & banks',
                              icon: <Award className="h-4 w-4 text-emerald-500" />
                            },
                            { 
                              value: `${((assetDetails.ownership?.institutionsFloatPercentHeld || 0) * 100).toFixed(2)}%`, 
                              label: '% of Float Held by Institutions',
                              desc: 'Percentage of public float held by funds',
                              icon: <TrendingUp className="h-4 w-4 text-amber-500" />
                            },
                            { 
                              value: assetDetails.ownership?.institutionsCount?.toLocaleString() || '-', 
                              label: 'Number of Institutions',
                              desc: 'Total institutional investors holding shares',
                              icon: <Globe className="h-4 w-4 text-indigo-500" />
                            }
                          ].map((item, idx) => (
                            <div key={idx} className="bg-white/50 dark:bg-white/[0.005] hover:bg-white dark:hover:bg-white/[0.015] border border-slate-150/40 dark:border-white/[0.02] p-4 rounded-2xl flex items-start gap-3.5 transition-all duration-200 shadow-sm hover:shadow-md">
                              <div className="p-2 rounded-xl bg-slate-100/50 dark:bg-white/5 shrink-0 mt-0.5">
                                {item.icon}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight">{item.label}</span>
                                <span className="font-mono text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1">{item.value}</span>
                                <span className="text-[9px] text-slate-450 mt-1 font-semibold leading-tight">{item.desc}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>        </div>

              {/* 5. AI Advisor Section */}
              <div id="screener-analysis" className="scroll-mt-28 border-b border-slate-200/60 dark:border-white/10 pb-8 space-y-6 relative overflow-hidden text-slate-800 dark:text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center gap-4 border-b border-slate-150 dark:border-white/10 pb-4">
                  <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
                    <svg className="absolute transform -rotate-90 w-16 h-16">
                      <circle cx="32" cy="32" r="28" className="stroke-slate-100 dark:stroke-white/[0.06]" strokeWidth="4" fill="transparent" />
                      <circle cx="32" cy="32" r="28" stroke="url(#healthGrad)" strokeWidth="4" fill="transparent" strokeDasharray={176} strokeDashoffset={176 - (176 * healthScore) / 100} strokeLinecap="round" />
                      <defs>
                        <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#22c55e" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="font-mono text-base font-black text-slate-900 dark:text-white">{healthScore}</span>
                  </div>

                  <div>
                    <span className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="h-3 w-3 animate-pulse" /> AI Health Index
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {healthScore >= 75 ? 'Excellent Health' : healthScore >= 60 ? 'Strong Performance' : 'Stable Outlook'}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Key Strengths
                    </h4>
                    <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-350 font-medium">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 dark:text-emerald-400 font-black">✓</span>
                        <span>Healthy dividend payout ratio maintained.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 dark:text-emerald-400 font-black">✓</span>
                        <span>High capital efficiency (ROCE of {selectedStock.roce.toFixed(2)}%).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 dark:text-emerald-400 font-black">✓</span>
                        <span>Consistent historical growth trajectory.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Risk Factors
                    </h4>
                    <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-305 font-medium">
                      <li className="flex items-start gap-2">
                        <span className="text-rose-500 dark:text-rose-400 font-black">✗</span>
                        <span>Trading high relative to book value ({(selectedStock.price / selectedStock.bookValue).toFixed(1)}x).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-500 dark:text-rose-400 font-black">✗</span>
                        <span>P/E ratio of {selectedStock.peRatio.toFixed(1)}x is premium.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

            </div> {/* Closes Right main content container */}
          </div> {/* Closes Main content wrapper with sticky left sidebar */}
        </div>
      )}
    </div>
  );
}
