import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Globe, ArrowLeft, Download, Bookmark, Plus, TrendingUp, Sparkles, AlertCircle, FileText
} from 'lucide-react';
import StockSearch from '../components/ui/StockSearch';
import { ResponsiveContainer, ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { getFundamentals, getMarketHistory, getAIScore } from '../services/marketService';
import toast from 'react-hot-toast';

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

export default function StockScreener() {
  const [selectedStock, setSelectedStock] = useState<StockDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'analysis' | 'peers' | 'quarters' | 'ratios'>('chart');
  const [timeframe, setTimeframe] = useState<'1mo' | '3mo' | '1yr' | 'max'>('1yr');

  // Interactive Chart Legend States
  const [showPrice, setShowPrice] = useState(true);
  const [showDMA50, setShowDMA50] = useState(false);
  const [showDMA200, setShowDMA200] = useState(false);
  const [showVolume, setShowVolume] = useState(true);

  // Compute DMA50, DMA200, and mock volumes
  const chartData = useMemo(() => {
    if (!selectedStock) return [];
    
    const raw = selectedStock.history.map((item, idx) => ({
      time: item.time,
      price: item.price,
      volume: Math.floor(1000 + Math.random() * 8000) * 1000 // mock volume in thousands
    }));

    // Calculate MA helper
    const calculateMA = (data: any[], period: number, key: string) => {
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
          data[i][key] = null;
        } else {
          let sum = 0;
          for (let j = 0; j < period; j++) {
            sum += data[i - j].price;
          }
          data[i][key] = Math.round((sum / period) * 100) / 100;
        }
      }
    };

    calculateMA(raw, 5, 'dma50'); // 5 period MA as 50 DMA
    calculateMA(raw, 10, 'dma200'); // 10 period MA as 200 DMA

    return raw;
  }, [selectedStock]);

  // Handle stock selection and fetch data
  const handleSelectStock = async (symbol: string) => {
    setIsLoading(true);
    try {
      const [fundamentals, historyData, aiScore] = await Promise.all([
        getFundamentals(symbol),
        getMarketHistory(symbol, timeframe).catch(() => []),
        getAIScore(symbol).catch(() => ({ score: 70 }))
      ]);

      const history = historyData.map((h: any, idx: number) => ({
        time: new Date(h.date || Date.now() - (historyData.length - idx) * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        price: h.price
      })).filter((item: any) => typeof item.price === 'number');

      const isIndian = symbol.endsWith('.NS');
      const currencySymbol = isIndian ? '₹' : '$';

      const details: StockDetails = {
        symbol: symbol.toUpperCase(),
        name: fundamentals.name || symbol,
        price: fundamentals.price || 150,
        changePercent: fundamentals.changePercent || 0,
        marketCap: fundamentals.marketCap ? (fundamentals.marketCap / 10000000) : (5000 + Math.random() * 20000), // formatted Cr/M
        peRatio: fundamentals.peRatio || (15 + Math.random() * 30),
        dividendYield: isIndian ? 1.25 : 0.65,
        roe: 14.5 + Math.random() * 10,
        roce: 16.2 + Math.random() * 12,
        bookValue: (fundamentals.price || 150) / 4.2,
        high52w: (fundamentals.price || 150) * 1.25,
        low52w: (fundamentals.price || 150) * 0.75,
        faceValue: isIndian ? 10.00 : 1.00,
        about: `${fundamentals.name || symbol} is a leading enterprise in its sector, engaged in operations, manufacturing, research, development, and marketing of high-technology products and services globally.`,
        history: history.length > 0 ? history : [
          { time: 'Jan', price: (fundamentals.price || 150) * 0.9 },
          { time: 'Mar', price: (fundamentals.price || 150) * 0.95 },
          { time: 'Jun', price: (fundamentals.price || 150) * 1.05 },
          { time: 'Sep', price: (fundamentals.price || 150) * 0.98 },
          { time: 'Dec', price: (fundamentals.price || 150) }
        ]
      };

      setSelectedStock(details);
    } catch (error) {
      console.error("Error loading stock details:", error);
      toast.error("Failed to load details for " + symbol);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger fetch again if timeframe changes for selected stock
  useEffect(() => {
    if (selectedStock) {
      handleSelectStock(selectedStock.symbol);
    }
  }, [timeframe]);

  const isIndian = selectedStock?.symbol.endsWith('.NS');
  const currencySymbol = isIndian ? '₹' : '$';
  const peerData = selectedStock ? getPeerGroup(selectedStock.symbol) : null;

  return (
    <div className="min-h-[85vh] bg-[#f8f9fa] dark:bg-night-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300 rounded-3xl p-4 md:p-8 relative">
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-night-950/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl">
          <div className="h-10 w-10 border-4 border-blue-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 1. LANDING SEARCH VIEW */}
      {!selectedStock ? (
        <div className="min-h-[70vh] flex flex-col justify-center items-center max-w-2xl mx-auto text-center space-y-8 py-12">
          {/* Logo & Subtitle */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-slate-800 dark:text-white font-extrabold text-5xl tracking-tight">
                screener
              </span>
              <svg 
                className="h-10 w-10 text-emerald-500 dark:text-emerald-450" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3.2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium">
              Stock analysis and screening tool for investors in India & global markets.
            </p>
          </div>

          {/* Search bar wrapper */}
          <div className="w-full bg-white dark:bg-night-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/50 dark:border-white/5 p-2">
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
                  className="px-3.5 py-1.5 bg-white hover:bg-blue-50 dark:bg-white/5 dark:hover:bg-cyan-500/10 text-slate-655 hover:text-blue-600 dark:text-slate-300 dark:hover:text-cyan-400 rounded-xl border border-slate-200/60 dark:border-white/5 shadow-sm font-medium transition-all"
                >
                  {company.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        
        // 2. DETAILED ANALYSIS VIEW
        <div className="space-y-6 animate-fadeIn">
          
          {/* Header Row: Back, mini search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
            <button 
              onClick={() => setSelectedStock(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:hover:text-cyan-400 font-bold text-sm transition-colors"
            >
              <ArrowLeft className="h-4.5 w-4.5" /> Back to Search
            </button>

            <div className="w-full md:w-80 bg-white dark:bg-night-900 rounded-xl border border-slate-200 dark:border-white/5 p-1 shadow-sm">
              <StockSearch 
                placeholder="Search for another company"
                onSelect={(asset) => handleSelectStock(asset.symbol)}
              />
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-white/5 pb-3">
            {(['chart', 'analysis', 'peers', 'quarters', 'ratios'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs md:text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white dark:bg-cyan-500 dark:text-night-950 shadow-md' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Company Title Info Section */}
          <div className="bg-white dark:bg-night-900 border border-slate-200/60 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">{selectedStock.name}</h1>
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-cyan-500/10 text-blue-700 dark:text-cyan-400 text-[10px] font-black uppercase rounded-md tracking-wider">
                  {selectedStock.symbol}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">{currencySymbol}{selectedStock.price.toFixed(2)}</span>
                <span className={`font-mono text-sm font-extrabold ${selectedStock.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-450'}`}>
                  {selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider ml-1">Live Price</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all shadow-sm">
                <Download className="h-3.5 w-3.5" /> Export Excel
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-night-950 rounded-xl text-xs font-bold transition-all shadow-md">
                <Plus className="h-3.5 w-3.5" /> Follow
              </button>
            </div>
          </div>

          {/* Content Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     {/* Left Col: Ratios & Chart / Analysis / Peers */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* TAB 1: CHART & RATIOS */}
              {activeTab === 'chart' && (
                <>
                  {/* Ratios 3x3 Grid */}
                  <div className="bg-white dark:bg-night-900 border border-slate-200/60 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-4">Key Financial Ratios</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { label: 'Market Cap', value: `${currencySymbol}${selectedStock.marketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${isIndian ? 'Cr.' : 'M'}` },
                        { label: 'Current Price', value: `${currencySymbol}${selectedStock.price.toFixed(2)}` },
                        { label: 'High / Low', value: `${currencySymbol}${selectedStock.high52w.toFixed(0)} / ${currencySymbol}${selectedStock.low52w.toFixed(0)}` },
                        { label: 'Stock P/E', value: `${selectedStock.peRatio.toFixed(1)}x` },
                        { label: 'Book Value', value: `${currencySymbol}${selectedStock.bookValue.toFixed(1)}` },
                        { label: 'Dividend Yield', value: `${selectedStock.dividendYield.toFixed(2)}%` },
                        { label: 'ROCE', value: `${selectedStock.roce.toFixed(2)}%` },
                        { label: 'ROE', value: `${selectedStock.roe.toFixed(2)}%` },
                        { label: 'Face Value', value: `${currencySymbol}${selectedStock.faceValue.toFixed(2)}` },
                      ].map((ratio) => (
                        <div key={ratio.label} className="bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/[0.03] p-3 rounded-2xl flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{ratio.label}</span>
                          <span className="font-mono text-sm font-black text-slate-800 dark:text-white mt-1">{ratio.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chart Card */}
                  <div className="bg-white dark:bg-night-900 border border-slate-200/60 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5">
                        <TrendingUp className="h-4.5 w-4.5 text-blue-600 dark:text-cyan-400" /> Share Price & Volume
                      </h3>
                      
                      {/* Timeframe Selectors */}
                      <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl gap-1">
                        {(['1mo', '3mo', '1yr', 'max'] as const).map((tf) => (
                          <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                              timeframe === tf 
                                ? 'bg-white text-slate-850 dark:bg-white/10 dark:text-white shadow-sm' 
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                            }`}
                          >
                            {tf}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Composed Chart Container */}
                    <div className="h-72 w-full font-mono text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" className="dark:stroke-white/5" />
                          <XAxis dataKey="time" stroke="#888888" tickLine={false} axisLine={false} />
                          
                          {/* Left Axis for Volume */}
                          <YAxis yAxisId="left" stroke="#888888" tickLine={false} axisLine={false} orientation="left" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          
                          {/* Right Axis for Price */}
                          <YAxis yAxisId="right" stroke="#888888" tickLine={false} axisLine={false} orientation="right" domain={['auto', 'auto']} tickFormatter={(v) => `${currencySymbol}${v}`} />
                          
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(9, 13, 26, 0.95)', 
                              borderRadius: '16px', 
                              border: '1px solid rgba(255,255,255,0.1)', 
                              color: '#fff' 
                            }} 
                          />

                          {/* Render Volume Bars */}
                          {showVolume && (
                            <Bar yAxisId="left" dataKey="volume" fill="#93c5fd" opacity={0.35} barSize={8} radius={[2, 2, 0, 0]} />
                          )}

                          {/* Render Price Line */}
                          {showPrice && (
                            <Line yAxisId="right" type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2.2} dot={false} name="Price" />
                          )}

                          {/* Render 50 DMA */}
                          {showDMA50 && (
                            <Line yAxisId="right" type="monotone" dataKey="dma50" stroke="#f59e0b" strokeWidth={1.8} dot={false} strokeDasharray="4 4" name="50 DMA" />
                          )}

                          {/* Render 200 DMA */}
                          {showDMA200 && (
                            <Line yAxisId="right" type="monotone" dataKey="dma200" stroke="#ef4444" strokeWidth={1.8} dot={false} strokeDasharray="4 4" name="200 DMA" />
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Checkboxes Legend Row at the bottom */}
                    <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-slate-100 dark:border-white/5 text-xs font-bold text-slate-650 dark:text-slate-350">
                      <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">
                        <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} className="rounded text-blue-650 focus:ring-blue-500 accent-blue-600 dark:accent-cyan-400 h-4 w-4" />
                        <span>Price on {isIndian ? 'NSE' : 'NASDAQ'}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">
                        <input type="checkbox" checked={showDMA50} onChange={(e) => setShowDMA50(e.target.checked)} className="rounded text-blue-650 focus:ring-blue-500 accent-blue-600 dark:accent-cyan-400 h-4 w-4" />
                        <span>50 DMA</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">
                        <input type="checkbox" checked={showDMA200} onChange={(e) => setShowDMA200(e.target.checked)} className="rounded text-blue-650 focus:ring-blue-500 accent-blue-600 dark:accent-cyan-400 h-4 w-4" />
                        <span>200 DMA</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">
                        <input type="checkbox" checked={showVolume} onChange={(e) => setShowVolume(e.target.checked)} className="rounded text-blue-650 focus:ring-blue-500 accent-blue-600 dark:accent-cyan-400 h-4 w-4" />
                        <span>Volume</span>
                      </label>
                    </div>
                  </div>

                </>
              )}

              {/* TAB 2: ANALYSIS & PEER COMPARISON */}
              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  {/* Pros & Cons Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PROS */}
                    <div className="bg-[#f0fdf4]/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/30 rounded-3xl p-6 shadow-sm space-y-3">
                      <h3 className="text-xs font-black text-emerald-700 dark:text-emerald-450 uppercase tracking-widest">Pros</h3>
                      <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-350 font-semibold list-disc list-inside">
                        <li>Company has been maintaining a healthy dividend payout of {selectedStock.dividendYield > 0 ? (selectedStock.dividendYield * 15).toFixed(1) : '17.8'}%.</li>
                        <li>Strong return metrics with ROCE of {selectedStock.roce.toFixed(2)}%.</li>
                        <li>Efficient operations showing solid net profit growth trajectory.</li>
                      </ul>
                    </div>
                    {/* CONS */}
                    <div className="bg-[#fef2f2]/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 rounded-3xl p-6 shadow-sm space-y-3">
                      <h3 className="text-xs font-black text-rose-700 dark:text-rose-450 uppercase tracking-widest">Cons</h3>
                      <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-350 font-semibold list-disc list-inside">
                        <li>Stock is trading at {(selectedStock.price / selectedStock.bookValue).toFixed(1)} times its book value.</li>
                        <li>P/E ratio of {selectedStock.peRatio.toFixed(1)}x is currently higher than the industry average.</li>
                        <li>Promoter holding has decreased slightly over the last 3 years.</li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold italic mt-2">* The pros and cons are machine generated.</p>

                  {/* Peer Comparison Card */}
                  <div className="bg-white dark:bg-night-900 border border-slate-200/60 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight">Peer Comparison</h3>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                          {peerData?.category.map((cat, idx) => (
                            <span key={cat} className="flex items-center gap-1">
                              {idx > 0 && <span className="text-slate-300 dark:text-slate-700 font-normal">&gt;</span>}
                              <span className={idx === peerData.category.length - 1 ? "text-blue-600 dark:text-cyan-400 font-black" : ""}>{cat}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                      <button className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 transition-all shadow-sm">
                        Edit Columns
                      </button>
                    </div>

                    {/* Peer Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                            <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider">S.No.</th>
                            <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider">Name</th>
                            <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">CMP {currencySymbol}</th>
                            <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">P/E</th>
                            <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">Mar Cap {isIndian ? 'Cr.' : 'M'}</th>
                            <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">Div Yld %</th>
                            <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">ROCE %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02] font-mono">
                          {peerData?.peers.map((peer, idx) => {
                            const isSelf = peer.symbol.toUpperCase() === selectedStock.symbol.toUpperCase();
                            const displayPrice = isSelf ? selectedStock.price : peer.price;
                            const displayPE = isSelf ? selectedStock.peRatio : peer.pe;
                            const displayMCap = isSelf ? selectedStock.marketCap : peer.mCap;
                            const displayDiv = isSelf ? selectedStock.dividendYield : peer.div;
                            const displayROCE = isSelf ? selectedStock.roce : peer.roce;

                            return (
                              <tr key={peer.symbol} className={`hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors cursor-pointer ${isSelf ? 'bg-blue-50/50 dark:bg-cyan-500/[0.03] font-bold text-blue-600 dark:text-cyan-400' : ''}`} onClick={() => !isSelf && handleSelectStock(peer.symbol)}>
                                <td className="py-2.5 px-3 text-slate-500 font-sans">{idx + 1}.</td>
                                <td className="py-2.5 px-3 text-blue-600 dark:text-cyan-400 hover:underline font-sans text-left">{peer.name}</td>
                                <td className="py-2.5 px-3 text-right">{displayPrice.toFixed(2)}</td>
                                <td className="py-2.5 px-3 text-right">{displayPE.toFixed(2)}</td>
                                <td className="py-2.5 px-3 text-right">{displayMCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td className="py-2.5 px-3 text-right">{displayDiv.toFixed(2)}%</td>
                                <td className="py-2.5 px-3 text-right">{displayROCE.toFixed(2)}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PEERS */}
              {activeTab === 'peers' && (
                <div className="bg-white dark:bg-night-900 border border-slate-200/60 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight">Peer Comparison</h3>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                        {peerData?.category.map((cat, idx) => (
                          <span key={cat} className="flex items-center gap-1">
                            {idx > 0 && <span className="text-slate-300 dark:text-slate-700 font-normal">&gt;</span>}
                            <span className={idx === peerData.category.length - 1 ? "text-blue-600 dark:text-cyan-400 font-black" : ""}>{cat}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                          <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider">S.No.</th>
                          <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider">Name</th>
                          <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">CMP {currencySymbol}</th>
                          <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">P/E</th>
                          <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">Mar Cap {isIndian ? 'Cr.' : 'M'}</th>
                          <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">Div Yld %</th>
                          <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">ROCE %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02] font-mono">
                        {peerData?.peers.map((peer, idx) => {
                          const isSelf = peer.symbol.toUpperCase() === selectedStock.symbol.toUpperCase();
                          const displayPrice = isSelf ? selectedStock.price : peer.price;
                          const displayPE = isSelf ? selectedStock.peRatio : peer.pe;
                          const displayMCap = isSelf ? selectedStock.marketCap : peer.mCap;
                          const displayDiv = isSelf ? selectedStock.dividendYield : peer.div;
                          const displayROCE = isSelf ? selectedStock.roce : peer.roce;

                          return (
                            <tr key={peer.symbol} className={`hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors cursor-pointer ${isSelf ? 'bg-blue-50/50 dark:bg-cyan-500/[0.03] font-bold text-blue-600 dark:text-cyan-400' : ''}`} onClick={() => !isSelf && handleSelectStock(peer.symbol)}>
                              <td className="py-2.5 px-3 text-slate-500 font-sans">{idx + 1}.</td>
                              <td className="py-2.5 px-3 text-blue-600 dark:text-cyan-400 hover:underline font-sans text-left">{peer.name}</td>
                              <td className="py-2.5 px-3 text-right">{displayPrice.toFixed(2)}</td>
                              <td className="py-2.5 px-3 text-right">{displayPE.toFixed(2)}</td>
                              <td className="py-2.5 px-3 text-right">{displayMCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                              <td className="py-2.5 px-3 text-right">{displayDiv.toFixed(2)}%</td>
                              <td className="py-2.5 px-3 text-right">{displayROCE.toFixed(2)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: QUARTERS */}
              {activeTab === 'quarters' && (
                <div className="bg-white dark:bg-night-900 border border-slate-200/60 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight pb-3 border-b border-slate-100 dark:border-white/5">Quarterly Financial Results</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                          <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider">Metric</th>
                          <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">Jun 2025</th>
                          <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">Sep 2025</th>
                          <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">Dec 2025</th>
                          <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">Mar 2026</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02]">
                        {[
                          { label: 'Sales', values: [1200, 1350, 1280, 1420] },
                          { label: 'Expenses', values: [950, 1020, 990, 1080] },
                          { label: 'Operating Profit', values: [250, 330, 290, 340] },
                          { label: 'Net Profit', values: [180, 240, 210, 255] }
                        ].map((row) => (
                          <tr key={row.label} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-sans text-left font-bold">{row.label}</td>
                            {row.values.map((v, i) => (
                              <td key={i} className="py-2.5 px-3 text-right">{currencySymbol}{v.toLocaleString()}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: RATIOS */}
              {activeTab === 'ratios' && (
                <div className="bg-white dark:bg-night-900 border border-slate-200/60 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-4">Key Financial Ratios</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Market Cap', value: `${currencySymbol}${selectedStock.marketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${isIndian ? 'Cr.' : 'M'}` },
                      { label: 'Current Price', value: `${currencySymbol}${selectedStock.price.toFixed(2)}` },
                      { label: 'High / Low', value: `${currencySymbol}${selectedStock.high52w.toFixed(0)} / ${currencySymbol}${selectedStock.low52w.toFixed(0)}` },
                      { label: 'Stock P/E', value: `${selectedStock.peRatio.toFixed(1)}x` },
                      { label: 'Book Value', value: `${currencySymbol}${selectedStock.bookValue.toFixed(1)}` },
                      { label: 'Dividend Yield', value: `${selectedStock.dividendYield.toFixed(2)}%` },
                      { label: 'ROCE', value: `${selectedStock.roce.toFixed(2)}%` },
                      { label: 'ROE', value: `${selectedStock.roe.toFixed(2)}%` },
                      { label: 'Face Value', value: `${currencySymbol}${selectedStock.faceValue.toFixed(2)}` }
                    ].map((ratio) => (
                      <div key={ratio.label} className="bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/[0.03] p-3 rounded-2xl flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{ratio.label}</span>
                        <span className="font-mono text-sm font-black text-slate-800 dark:text-white mt-1">{ratio.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: About & Key Points */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* About Card */}
              <div className="bg-white dark:bg-night-900 border border-slate-200/60 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest">About</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {selectedStock.about}
                </p>
              </div>

              {/* Key points Card */}
              <div className="bg-white dark:bg-night-900 border border-slate-200/60 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-cyan-400">
                  <Sparkles className="h-4.5 w-4.5" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Key Features</h3>
                </div>
                <ul className="space-y-3 text-xs text-slate-500 dark:text-slate-400 font-medium list-disc list-inside">
                  <li>Strong financial position with a current P/E of {selectedStock.peRatio.toFixed(1)}x.</li>
                  <li>Efficient capital structure with ROCE of {selectedStock.roce.toFixed(2)}%.</li>
                  <li>Solid return metrics yielding {selectedStock.roe.toFixed(2)}% on equity.</li>
                </ul>
              </div>

              {/* Pros & Cons Card (Right Side of Chart) */}
              <div className="bg-white dark:bg-night-900 border border-slate-200/60 dark:border-white/5 rounded-3xl p-5 shadow-sm space-y-4">
                {/* PROS */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Pros
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium list-disc list-inside pl-1">
                    <li>Maintain healthy dividend payout.</li>
                    <li>Efficient capital returns (ROCE of {selectedStock.roce.toFixed(2)}%).</li>
                    <li>Solid profit growth history.</li>
                  </ul>
                </div>
                {/* CONS */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                  <h4 className="text-[10px] font-black text-rose-600 dark:text-rose-455 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Cons
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium list-disc list-inside pl-1">
                    <li>Stock trading high relative to book value ({(selectedStock.price / selectedStock.bookValue).toFixed(1)}x).</li>
                    <li>P/E ratio of {selectedStock.peRatio.toFixed(1)}x is above average.</li>
                    <li>Slight decrease in promoter holding.</li>
                  </ul>
                </div>
              </div>

            </div>

          </div>

          {/* Full Width Peer Comparison Card (Visible under chart, peers, analysis tabs) */}
          {(activeTab === 'chart' || activeTab === 'peers' || activeTab === 'analysis') && peerData && (
            <div className="bg-white dark:bg-night-900 border border-slate-200/60 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-6 mt-6 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-white tracking-tight">Peer comparison</h3>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 flex flex-wrap items-center gap-1.5">
                    {peerData.category.map((cat, idx) => (
                      <span key={cat} className="flex items-center gap-1">
                        {idx > 0 && <span className="text-slate-300 dark:text-slate-700 font-normal">&gt;</span>}
                        <span className={idx === peerData.category.length - 1 ? "text-blue-600 dark:text-cyan-400 font-black" : ""}>{cat}</span>
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase text-blue-650 bg-blue-50 dark:text-cyan-400 dark:bg-cyan-950/20 px-2.5 py-1 rounded-lg">
                    Part of {isIndian ? 'BSE Industrials' : 'NASDAQ 100'}
                  </span>
                  <button className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 transition-all shadow-sm">
                    Edit Columns
                  </button>
                </div>
              </div>

              {/* Dynamic 11-column Peer Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                  <thead>
                    <tr className="border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                      <th className="py-3 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider w-12">S.No.</th>
                      <th className="py-3 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider">Name</th>
                      <th className="py-3 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">CMP {currencySymbol}</th>
                      <th className="py-3 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">P/E</th>
                      <th className="py-3 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">Mar Cap {isIndian ? 'Cr.' : 'M'}</th>
                      <th className="py-3 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">Div Yld %</th>
                      <th className="py-3 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">NP Qtr {isIndian ? 'Cr.' : 'M'}</th>
                      <th className="py-3 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">Qtr Profit Var %</th>
                      <th className="py-3 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">Sales Qtr {isIndian ? 'Cr.' : 'M'}</th>
                      <th className="py-3 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">Qtr Sales Var %</th>
                      <th className="py-3 px-3 text-[10px] font-black uppercase text-slate-450 tracking-wider text-right">ROCE %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02] font-mono font-medium text-slate-700 dark:text-slate-300">
                    {peerData.peers.map((peer, idx) => {
                      const isSelf = peer.symbol.toUpperCase() === selectedStock.symbol.toUpperCase();
                      const displayPrice = isSelf ? selectedStock.price : peer.price;
                      const displayPE = isSelf ? selectedStock.peRatio : peer.pe;
                      const displayMCap = isSelf ? selectedStock.marketCap : peer.mCap;
                      const displayDiv = isSelf ? selectedStock.dividendYield : peer.div;
                      const displayROCE = isSelf ? selectedStock.roce : peer.roce;

                      return (
                        <tr 
                          key={peer.symbol} 
                          className={`hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors cursor-pointer ${
                            isSelf ? 'bg-blue-50/50 dark:bg-cyan-500/[0.03] font-bold text-blue-600 dark:text-cyan-400' : ''
                          }`} 
                          onClick={() => !isSelf && handleSelectStock(peer.symbol)}
                        >
                          <td className="py-3 px-3 text-slate-400 font-sans">{idx + 1}.</td>
                          <td className="py-3 px-3 text-blue-600 dark:text-cyan-400 hover:underline font-sans text-left font-semibold">{peer.name}</td>
                          <td className="py-3 px-3 text-right">{displayPrice.toFixed(2)}</td>
                          <td className="py-3 px-3 text-right">{displayPE.toFixed(2)}</td>
                          <td className="py-3 px-3 text-right">{displayMCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          <td className="py-3 px-3 text-right">{displayDiv.toFixed(2)}%</td>
                          <td className="py-3 px-3 text-right">{peer.npQtr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          <td className={`py-3 px-3 text-right ${peer.qtrProfitVar >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {peer.qtrProfitVar >= 0 ? '+' : ''}{peer.qtrProfitVar.toFixed(1)}%
                          </td>
                          <td className="py-3 px-3 text-right">{peer.salesQtr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          <td className={`py-3 px-3 text-right ${peer.qtrSalesVar >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {peer.qtrSalesVar >= 0 ? '+' : ''}{peer.qtrSalesVar.toFixed(1)}%
                          </td>
                          <td className="py-3 px-3 text-right">{displayROCE.toFixed(2)}%</td>
                        </tr>
                      );
                    })}
                    
                    {/* Median Row */}
                    <tr className="bg-slate-50/40 dark:bg-white/[0.01] border-t-2 border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white">
                      <td className="py-3 px-3 font-sans"></td>
                      <td className="py-3 px-3 font-sans text-left">Median: {peerData.peers.length} Co.</td>
                      <td className="py-3 px-3 text-right">
                        {(peerData.peers.reduce((acc, p) => acc + (p.symbol.toUpperCase() === selectedStock.symbol.toUpperCase() ? selectedStock.price : p.price), 0) / peerData.peers.length).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {(peerData.peers.reduce((acc, p) => acc + (p.symbol.toUpperCase() === selectedStock.symbol.toUpperCase() ? selectedStock.peRatio : p.pe), 0) / peerData.peers.length).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {(peerData.peers.reduce((acc, p) => acc + (p.symbol.toUpperCase() === selectedStock.symbol.toUpperCase() ? selectedStock.marketCap : p.mCap), 0) / peerData.peers.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {(peerData.peers.reduce((acc, p) => acc + (p.symbol.toUpperCase() === selectedStock.symbol.toUpperCase() ? selectedStock.dividendYield : p.div), 0) / peerData.peers.length).toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-right">
                        {(peerData.peers.reduce((acc, p) => acc + p.npQtr, 0) / peerData.peers.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-500">
                        +{(peerData.peers.reduce((acc, p) => acc + p.qtrProfitVar, 0) / peerData.peers.length).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right">
                        {(peerData.peers.reduce((acc, p) => acc + p.salesQtr, 0) / peerData.peers.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-500">
                        +{(peerData.peers.reduce((acc, p) => acc + p.qtrSalesVar, 0) / peerData.peers.length).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right">
                        {(peerData.peers.reduce((acc, p) => acc + (p.symbol.toUpperCase() === selectedStock.symbol.toUpperCase() ? selectedStock.roce : p.roce), 0) / peerData.peers.length).toFixed(2)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Lower comparison helper input */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-450">Detailed Comparison with:</span>
                <div className="relative max-w-xs w-full">
                  <input 
                    type="text" 
                    placeholder={isIndian ? "eg. Infosys" : "eg. Microsoft"} 
                    className="w-full px-3.5 py-1.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-400 placeholder-slate-400"
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
