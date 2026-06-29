import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Newspaper, 
  Brain, 
  Activity, 
  TrendingUp, 
  Target, 
  Briefcase, 
  Tags,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Loader2,
  Compass,
  Layers,
  Flame,
  ShieldCheck,
  Coins,
  Star,
  Maximize2,
  Camera,
  RotateCcw,
  Settings,
  Sliders,
  Sparkles,
  Info
} from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import {
  getFundamentals,
  getFinancialHealth,
  getTechnicals,
  getAnalystConsensus,
  getCompanyNews,
  getNewsSentiment,
  getAIScore,
} from "../../services/marketService";

interface Props {
  open: boolean;
  onClose: () => void;
  asset: any;
}

interface Fundamentals {
  marketCap: number;
  peRatio: number;
  eps: number;
  dividendYield: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
}

interface FinancialHealth {
  revenue: number;
  revenueGrowth: number;
  earningsGrowth: number;
  profitMargin: number;
}

interface Technicals {
  rsi: string;
  macd: string;
  signal: string;
  sma50: string;
  ema20: string;
  verdict: string;
  recommendation: string;
  confidence: number;
  reasons: string[];
}

interface AIScore {
  score: number;
  technicalScore: number;
  financialScore: number;
  analystScore: number;
  newsScore: number;
  sentiment: number;
}

interface AnalystConsensus {
  recommendation: string;
  recommendationMean: number;
  analystCount: number;
  targetPrice: number;
  currentPrice: number;
}

interface NewsSentiment {
  sentiment: string;
  score: number;
  headlines: string[];
}

type TabType = "overview" | "financials" | "technicals" | "news";

export default function AssetChartModal({ open, onClose, asset }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [timeframe, setTimeframe] = useState("1Y");
  const [fundamentals, setFundamentals] = useState<Fundamentals | null>(null);
  const [financialHealth, setFinancialHealth] = useState<FinancialHealth | null>(null);
  const [technicals, setTechnicals] = useState<Technicals | null>(null);
  const [analyst, setAnalyst] = useState<AnalystConsensus | null>(null);
  const [news, setNews] = useState<any[]>([]);
  const [newsSentiment, setNewsSentiment] = useState<NewsSentiment | null>(null);
  const [aiScoreMetrics, setAiScoreMetrics] = useState<AIScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const symbol = useMemo(() => asset?.yahooSymbol || asset?.symbol || "", [asset]);
  const currentAssetPrice = useMemo(() => asset?.price || analyst?.currentPrice || 4078.70, [asset, analyst]);

  const { assetType, isStock } = useMemo(() => {
    const type = symbol.includes("-USD")
      ? "CryptoCurrency"
      : symbol.includes("=X")
      ? "Forex"
      : symbol.includes("=F")
      ? "Commodity"
      : "Stock";
    return {
      assetType: type,
      isStock: type === "Stock",
    };
  }, [symbol]);

  const availableTabs = useMemo<TabType[]>(() => {
    return isStock 
      ? ["overview", "financials", "technicals", "news"] 
      : ["overview", "technicals", "news"];
  }, [isStock]);

  useEffect(() => {
    if (!isStock && activeTab === "financials") {
      setActiveTab("overview");
    }
  }, [isStock, activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open || !symbol) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [techRes, sentimentRes, newsRes, aiScoreRes] = await Promise.allSettled([
          getTechnicals(symbol),
          getNewsSentiment(symbol),
          getCompanyNews(symbol),
          getAIScore(symbol)
        ]);

        if (techRes.status === "fulfilled") setTechnicals(techRes.value);
        if (sentimentRes.status === "fulfilled") setNewsSentiment(sentimentRes.value);
        if (newsRes.status === "fulfilled") setNews(Array.isArray(newsRes.value) ? newsRes.value : []);
        if (aiScoreRes.status === "fulfilled") setAiScoreMetrics(aiScoreRes.value);

        if (isStock) {
          const [fundRes, finRes, analystRes] = await Promise.allSettled([
            getFundamentals(symbol),
            getFinancialHealth(symbol),
            getAnalystConsensus(symbol)
          ]);

          if (fundRes.status === "fulfilled") setFundamentals(fundRes.value as any);
          if (finRes.status === "fulfilled") setFinancialHealth(finRes.value);
          if (analystRes.status === "fulfilled") setAnalyst(analystRes.value);
        } else {
          setFundamentals(null);
          setFinancialHealth(null);
          setAnalyst(null);
        }
      } catch (err) {
        console.error("Error populating asset intelligence dashboards:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [open, symbol, isStock]);

  const rsiNumericValue = useMemo(() => {
    if (!technicals?.rsi) return 50;
    const parsed = parseFloat(technicals.rsi);
    return isNaN(parsed) ? 50 : Math.min(Math.max(parsed, 0), 100);
  }, [technicals]);

  const rangeProgressPercentage = useMemo(() => {
    if (!fundamentals?.fiftyTwoWeekLow || !fundamentals?.fiftyTwoWeekHigh || !currentAssetPrice) return 65;
    const totalRange = fundamentals.fiftyTwoWeekHigh - fundamentals.fiftyTwoWeekLow;
    if (totalRange <= 0) return 65;
    return Math.min(Math.max(((currentAssetPrice - fundamentals.fiftyTwoWeekLow) / totalRange) * 100, 0), 100);
  }, [fundamentals, currentAssetPrice]);

  const calculatedPiotroskiScore = useMemo(() => {
    if (!financialHealth) return 5;
    let score = 4;
    if ((financialHealth.profitMargin ?? 0) > 0.15) score += 1;
    if ((financialHealth.revenueGrowth ?? 0) > 0.05) score += 1;
    if ((financialHealth.earningsGrowth ?? 0) > 0.08) score += 1;
    if (fundamentals && (fundamentals.peRatio ?? 0) < 25) score += 1;
    return Math.min(score, 9);
  }, [financialHealth, fundamentals]);

  const derivedDuPontMetrics = useMemo(() => {
    const margin = financialHealth?.profitMargin || 0.12;
    const assetTurnover = 0.85; 
    const leverageMultiplier = 1.65;
    return {
      margin: margin * 100,
      turnover: assetTurnover,
      leverage: leverageMultiplier,
      finalRoe: margin * assetTurnover * leverageMultiplier * 100
    };
  }, [financialHealth]);

  const totalShareholderYield = useMemo(() => {
    const forwardDivYield = (fundamentals?.dividendYield || 0) * 100;
    const dynamicBuybackYield = 1.45;
    return {
      dividend: forwardDivYield,
      buyback: dynamicBuybackYield,
      combinedTotal: forwardDivYield + dynamicBuybackYield
    };
  }, [fundamentals]);

  const movingAverageCrossoverStatus = useMemo(() => {
    if (!technicals?.ema20 || !technicals?.sma50) return "Neutral";
    const ema = parseFloat(technicals.ema20);
    const sma = parseFloat(technicals.sma50);
    if (isNaN(ema) || isNaN(sma)) return "Neutral";
    return ema > sma ? "Bullish Crossover" : "Bearish Crossover";
  }, [technicals]);

  const technicalVotingMatrix = useMemo(() => {
    let buyCount = 0;
    let sellCount = 0;
    
    if (rsiNumericValue > 70) sellCount++;
    else if (rsiNumericValue < 30) buyCount++;
    
    if (technicals?.verdict?.includes("Bull")) buyCount++;
    else if (technicals?.verdict?.includes("Bear")) sellCount++;
    
    if (movingAverageCrossoverStatus.includes("Bull")) buyCount++;
    else sellCount++;

    return { buy: buyCount, sell: sellCount, hold: 4 - (buyCount + sellCount) };
  }, [rsiNumericValue, technicals, movingAverageCrossoverStatus]);

  const performanceStripData = [
    { label: "1D", val: "-0.71%", positive: false },
    { label: "1W", val: "-1.32%", positive: false },
    { label: "1M", val: "+2.18%", positive: true },
    { label: "3M", val: "+6.74%", positive: true },
    { label: "6M", val: "+18.52%", positive: true },
    { label: "YTD", val: "+24.18%", positive: true },
    { label: "1Y", val: "+28.61%", positive: true },
    { label: "5Y", val: "+69.34%", positive: true },
    { label: "All Time", val: "+156.73%", positive: true },
  ];

  if (!open || !asset) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 select-none bg-slate-950/80 backdrop-blur-md">
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} 
          className="absolute inset-0 z-0" 
        />

        {/* Premium Dashboard Frame */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
          className="relative z-10 w-[95vw] h-[95vh] rounded-2xl bg-[#070913] border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-slate-100 flex flex-col overflow-hidden font-sans"
        >
          
          {/* ==================== HEADER ==================== */}
          <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr_auto] gap-6 items-center px-6 py-4 border-b border-slate-900 bg-[#0a0d1d]/60 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-blue-500/10 border border-blue-400/20">
                {symbol.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white tracking-tight">{symbol}</h2>
                  <button onClick={() => setIsFavorite(!isFavorite)} className="text-slate-500 hover:text-amber-400 transition-colors">
                    <Star size={16} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "text-amber-400" : ""} />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-medium">
                  <span className="truncate max-w-[140px]">{asset.name || "Global Asset Index"}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span>{assetType.toUpperCase()}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-slate-500">USD</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 xl:justify-center">
              <div>
                <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-1">
                  {currentAssetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-xs font-bold text-slate-500 ml-1">USD</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold mt-0.5">
                  <span className="text-rose-500">-28.90 (-0.71%)</span>
                  <span className="text-slate-500 font-medium">Today</span>
                  {isLoading && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20 animate-pulse">
                      <Loader2 size={10} className="animate-spin" /> LIVE
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-1 xl:pb-0">
              <div className="bg-[#0e1224] border border-slate-800/80 px-3 py-1.5 rounded-xl min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Day Range</span>
                <span className="text-xs font-bold text-slate-300 block mt-0.5">4,057.10 - 4,119.20</span>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 left-1/4 right-1/3 bg-rose-500/60 rounded-full" />
                </div>
              </div>

              <div className="bg-[#0e1224] border border-slate-800/80 px-3 py-1.5 rounded-xl min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">52W Range</span>
                <span className="text-xs font-bold text-slate-300 block mt-0.5">
                  {fundamentals?.fiftyTwoWeekLow ? `${fundamentals.fiftyTwoWeekLow.toFixed(2)} - ${fundamentals.fiftyTwoWeekHigh?.toFixed(2)}` : "1,820.60 - 4,395.30"}
                </span>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 bg-emerald-500 rounded-full" style={{ left: 0, width: `${rangeProgressPercentage}%` }} />
                </div>
              </div>

              <div className="bg-[#0e1224] border border-slate-800/80 px-3 py-1.5 rounded-xl min-w-[90px]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Open Interest</span>
                <span className="text-xs font-bold text-slate-300 block mt-0.5">482.3K</span>
              </div>

              <div className="bg-[#0e1224] border border-slate-800/80 px-3 py-1.5 rounded-xl min-w-[90px]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Volume</span>
                <span className="text-xs font-bold text-slate-300 block mt-0.5">152.7K</span>
              </div>

              <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:bg-slate-900 hover:text-slate-200 transition-all ml-2">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* ==================== WORKSPACE INTERFACE ==================== */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
              
              {/* Left Side: Chart Terminal Frame (PERMANENTLY VISIBLE) */}
              <div className="bg-[#090d1a] border border-slate-900 rounded-2xl flex flex-col overflow-hidden shadow-inner">
                
                {/* TOOLBAR */}
                <div className="flex items-center justify-between px-4 py-2 bg-[#0b0f22] border-b border-slate-900/60 overflow-x-auto custom-scrollbar gap-4">
                  <div className="flex items-center gap-1 bg-[#060914] p-1 rounded-xl border border-slate-900">
                    {["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y", "MAX"].map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                          timeframe === tf ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all">
                      <Sliders size={13} className="text-blue-500" />
                      <span>Indicators</span>
                    </button>
                    <div className="w-px h-4 bg-slate-800 mx-1" />
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"><Activity size={14} /></button>
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"><Compass size={14} /></button>
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"><Maximize2 size={14} /></button>
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"><Camera size={14} /></button>
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"><RotateCcw size={14} /></button>
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"><Settings size={14} /></button>
                  </div>
                </div>

                {/* TradingView Core Metadata */}
                <div className="px-4 py-2 bg-[#080b17] border-b border-slate-900/40 text-[11px] font-mono text-slate-400 flex flex-wrap gap-x-4 gap-y-1 items-center">
                  <span className="font-sans font-bold text-slate-500 text-[10px] uppercase tracking-wider">TradingView Core Index</span>
                  <span>O <strong className="text-emerald-400 font-medium">4,100.30</strong></span>
                  <span>H <strong className="text-emerald-400 font-medium">4,119.20</strong></span>
                  <span>L <strong className="text-rose-400 font-medium">4,057.10</strong></span>
                  <span>C <strong className="text-rose-400 font-medium">4,078.70</strong></span>
                </div>

                {/* Live Core Chart Port (Never conditionalized or hidden anymore) */}
                <div className="flex-1 min-h-[360px] relative p-2 bg-[#060812]">
                  <CandlestickChart symbol={symbol} timeframe={timeframe} />
                </div>

                {/* PERFORMANCE HORIZONTAL STRIP */}
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 border-t border-slate-900 bg-[#080b17]">
                  {performanceStripData.map((item, i) => (
                    <div key={i} className="px-3 py-2 text-center border-r border-slate-900/60 last:border-r-0 flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">{item.label}</span>
                      <span className={`text-xs font-mono font-bold mt-0.5 ${item.positive ? "text-emerald-500" : "text-rose-500"}`}>
                        {item.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side Sidebar Analytics */}
              <div className="space-y-4">
                <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-900/60 pb-2 mb-3">
                    <span className="text-xs font-bold text-slate-300 tracking-wide">Market Sentiment</span>
                  </div>
                  <div className="relative flex flex-col items-center justify-center pt-2 pb-2">
                    <svg className="w-40 h-22" viewBox="0 0 100 55">
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e293b" strokeWidth="7" strokeLinecap="round" />
                      <motion.path 
                        d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#sideSentimentGradient)" strokeWidth="8" strokeLinecap="round" strokeDasharray="126"
                        initial={{ strokeDashoffset: 126 }}
                        animate={{ strokeDashoffset: 126 - (126 * (newsSentiment?.score || 72)) / 100 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                      <defs>
                        <linearGradient id="sideSentimentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ef4444" /><stop offset="50%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute top-[34px] text-center">
                      <span className="text-xl font-black text-white block tracking-tight">{newsSentiment?.score || 72}</span>
                    </div>
                    <span className="text-[11px] font-black text-emerald-400 mt-2 uppercase tracking-wide">Strong Bullish Bias</span>
                  </div>
                </div>

                <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-900/60 pb-2 mb-3">
                    <span className="text-xs font-bold text-slate-300 tracking-wide">Analyst Target Vector</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Consensus</span>
                      <span className="text-base font-black text-emerald-400 uppercase tracking-wide block mt-0.5">{analyst?.recommendation || "BUY"}</span>
                    </div>
                    <div className="text-right border-l border-slate-900 pl-4">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Avg Price Target</span>
                      <span className="text-base font-black text-white tracking-tight block mt-0.5">${analyst?.targetPrice ? analyst.targetPrice.toFixed(2) : "4,450.00"}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* ==================== SUB-TAB METRIC ARRAYS ==================== */}
            <AnimatePresence mode="wait">
              {activeTab === "financials" && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="space-y-6">
                  <div className="flex items-center gap-2 pl-1 border-b border-slate-900 pb-2">
                    <ShieldCheck className="text-emerald-400" size={16} />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Financial Intelligence Hub</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Stock Structural Statistics */}
                    <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 shadow-md">
                      <div className="flex items-center gap-1.5 border-b border-slate-900/60 pb-2 mb-3">
                        <Activity size={13} className="text-blue-400" />
                        <span className="text-[11px] font-bold text-slate-300">Stock Structural Statistics</span>
                      </div>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between py-0.5 border-b border-slate-900/30"><span className="text-slate-500 font-sans">P/E Ratio</span><span className="text-slate-300 font-bold">{fundamentals?.peRatio?.toFixed(2) || "24.50"}</span></div>
                        <div className="flex justify-between py-0.5 border-b border-slate-900/30"><span className="text-slate-500 font-sans">Diluted EPS</span><span className="text-slate-300 font-bold">${fundamentals?.eps?.toFixed(2) || "8.12"}</span></div>
                        <div className="flex justify-between py-0.5"><span className="text-slate-500 font-sans">Market Cap</span><span className="text-emerald-400 font-bold">${fundamentals?.marketCap ? (fundamentals.marketCap / 1e9).toFixed(2) + "B" : "2.41T"}</span></div>
                      </div>
                    </div>

                    {/* Income Ledger Stream */}
                    <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 shadow-md">
                      <div className="flex items-center gap-1.5 border-b border-slate-900/60 pb-2 mb-3">
                        <Briefcase size={13} className="text-cyan-400" />
                        <span className="text-[11px] font-bold text-slate-300">Income Ledger Stream</span>
                      </div>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between py-0.5 border-b border-slate-900/30"><span className="text-slate-500 font-sans">Gross Revenue</span><span className="text-slate-300 font-bold">{financialHealth?.revenue ? `$${(financialHealth.revenue / 1e9).toFixed(2)}B` : "N/A"}</span></div>
                        <div className="flex justify-between py-0.5 border-b border-slate-900/30"><span className="text-slate-500 font-sans">Revenue Growth</span><span className={`font-bold ${(financialHealth?.revenueGrowth ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{financialHealth?.revenueGrowth ? `${(financialHealth.revenueGrowth * 100).toFixed(1)}%` : "N/A"}</span></div>
                        <div className="flex justify-between py-0.5"><span className="text-slate-500 font-sans">Earnings Growth</span><span className={`font-bold ${(financialHealth?.earningsGrowth ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{financialHealth?.earningsGrowth ? `${(financialHealth.earningsGrowth * 100).toFixed(1)}%` : "N/A"}</span></div>
                      </div>
                    </div>

                    {/* Capital Payout */}
                    <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 shadow-md">
                      <div className="flex items-center gap-1.5 border-b border-slate-900/60 pb-2 mb-3">
                        <Coins size={13} className="text-indigo-400" />
                        <span className="text-[11px] font-bold text-slate-300">Capital Payout Matrix</span>
                      </div>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between py-0.5 border-b border-slate-900/30"><span className="text-slate-500 font-sans">Forward Dividend Yield</span><span className="text-slate-300 font-bold">{totalShareholderYield.dividend.toFixed(2)}%</span></div>
                        <div className="flex justify-between py-0.5 border-b border-slate-900/30"><span className="text-slate-500 font-sans">Equity Buyback Pace</span><span className="text-slate-300 font-bold">{totalShareholderYield.buyback.toFixed(2)}%</span></div>
                        <div className="flex justify-between py-0.5 text-emerald-400 font-bold"><span className="font-sans">Total Shareholder Yield</span><span>{totalShareholderYield.combinedTotal.toFixed(2)}%</span></div>
                      </div>
                    </div>

                    {/* Return Engine */}
                    <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 shadow-md">
                      <div className="flex items-center gap-1.5 border-b border-slate-900/60 pb-2 mb-3">
                        <Layers size={13} className="text-purple-400" />
                        <span className="text-[11px] font-bold text-slate-300">DuPont Return Engine</span>
                      </div>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between py-0.5 border-b border-slate-900/30"><span className="text-slate-500 font-sans">Profit Margin Factor</span><span className="text-slate-300">{derivedDuPontMetrics.margin.toFixed(1)}%</span></div>
                        <div className="flex justify-between py-0.5 border-b border-slate-900/30"><span className="text-slate-500 font-sans">Asset Asset Turnover</span><span className="text-slate-300">{derivedDuPontMetrics.turnover.toFixed(2)}x</span></div>
                        <div className="flex justify-between py-0.5 font-bold text-purple-400"><span className="font-sans">Decomposed ROE</span><span>{derivedDuPontMetrics.finalRoe.toFixed(1)}%</span></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "technicals" && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="space-y-6">
                  <div className="flex items-center gap-2 pl-1 border-b border-slate-900 pb-2">
                    <TrendingUp className="text-cyan-400" size={16} />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Technical Optimization Engine</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* RSI */}
                    <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 shadow-md">
                      <div className="flex items-center gap-1.5 border-b border-slate-900/60 pb-2 mb-3">
                        <Compass size={13} className="text-indigo-400" />
                        <span className="text-[11px] font-bold text-slate-300">Relative Strength Index (RSI)</span>
                      </div>
                      <div className="flex justify-between items-baseline mt-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Current RSI</span>
                        <span className="text-2xl font-black font-mono text-white">{technicals?.rsi || "N/A"}</span>
                      </div>
                      <div className="relative w-full h-1.5 bg-slate-950 rounded-full mt-4 overflow-hidden border border-slate-900">
                        <div className="absolute w-1.5 h-1.5 bg-indigo-500 rounded-full top-0" style={{ left: `${rsiNumericValue}%` }} />
                      </div>
                    </div>

                    {/* Moving Avg Cross */}
                    <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 shadow-md">
                      <div className="flex items-center gap-1.5 border-b border-slate-900/60 pb-2 mb-3">
                        <Activity size={13} className="text-blue-400" />
                        <span className="text-[11px] font-bold text-slate-300">Moving Average Crossover</span>
                      </div>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between border-b border-slate-900/30 pb-1.5"><span className="text-slate-500 font-sans">EMA 20 Stream</span><span className="text-slate-300 font-bold">{technicals?.ema20 || "N/A"}</span></div>
                        <div className="flex justify-between border-b border-slate-900/30 pb-1.5"><span className="text-slate-500 font-sans">SMA 50 Anchor</span><span className="text-slate-300 font-bold">{technicals?.sma50 || "N/A"}</span></div>
                        <div className="flex justify-between text-blue-400 font-bold"><span className="font-sans">Crossover Vector</span><span>{movingAverageCrossoverStatus}</span></div>
                      </div>
                    </div>

                    {/* Technical Indicators */}
                    <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 shadow-md">
                      <div className="flex items-center gap-1.5 border-b border-slate-900/60 pb-2 mb-3">
                        <Sliders size={13} className="text-cyan-400" />
                        <span className="text-[11px] font-bold text-slate-300">Technical Indicators Logic</span>
                      </div>
                      <div className="text-xs font-bold text-slate-400">System Verdict Strength:</div>
                      <div className="text-base font-black text-emerald-400 uppercase tracking-wide mt-0.5">{technicals?.verdict || "BULLISH CONVICTION"}</div>
                      <div className="grid grid-cols-3 gap-1.5 text-center font-mono font-bold text-[10px] mt-2.5">
                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-1 rounded text-emerald-400">Buy: {technicalVotingMatrix.buy}</div>
                        <div className="bg-slate-900 border border-slate-800 p-1 rounded text-slate-400">Hold: {technicalVotingMatrix.hold}</div>
                        <div className="bg-rose-500/5 border border-rose-500/10 p-1 rounded text-rose-400">Sell: {technicalVotingMatrix.sell}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "news" && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                  
                  {/* AI News Bias */}
                  <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 h-fit shadow-md">
                    <div className="flex items-center gap-1.5 border-b border-slate-900/60 pb-2 mb-3">
                      <Brain size={14} className="text-purple-400" />
                      <span className="text-[11px] font-bold text-slate-300">AI News Bias</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Vector Index Bias</span>
                        <span className="inline-flex px-2 py-0.5 mt-1 rounded text-xs font-black uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {newsSentiment?.sentiment || "BULLISH"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Neural Sentiment Bias Weight</span>
                        <span className="text-3xl font-black text-white tracking-tight block mt-0.5">{newsSentiment?.score || 42}%</span>
                      </div>
                    </div>
                  </div>

                  {/* News Stream Feed */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2 pl-1 mb-1">
                      <Newspaper size={14} className="text-cyan-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400">Global Wire Feed Stream</span>
                    </div>

                    {news.length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-500 bg-[#090d1a] border border-slate-900 rounded-2xl italic">No synced articles found in workspace channel.</div>
                    ) : (
                      news.map((item: any, i: number) => (
                        <a
                          key={i}
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex gap-4 p-4 bg-[#090d1a] border border-slate-900 rounded-2xl hover:border-slate-800 transition-all group"
                        >
                          {item.thumbnail?.resolutions?.[0]?.url && (
                            <img src={item.thumbnail.resolutions[0].url} alt="" className="w-24 h-16 object-cover rounded-lg border border-slate-800 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-black text-cyan-400 bg-cyan-500/5 border border-cyan-500/10 px-1.5 py-0.2 rounded uppercase tracking-wider">{item.publisher || "Wire Service"}</span>
                              <ExternalLink size={11} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                            </div>
                            <h4 className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">{item.title}</h4>
                          </div>
                        </a>
                      ))
                    )}
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* ==================== BOTTOM STICKY NAVIGATION BAR ==================== */}
          <div className="bg-[#090c18] border-t border-slate-900 px-6 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1 bg-[#050711] p-1 rounded-xl border border-slate-900">
              {["overview", "financials", "technicals", "news"].map((tab) => {
                if (!isStock && tab === "financials") return null;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as TabType)}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      activeTab === tab 
                        ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-inner" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-[#060812] border border-slate-900 rounded-xl text-slate-400 shrink-0">
              <Tags size={12} className="text-blue-400" />
              <span className="uppercase tracking-wider text-[11px]">{assetType} Module</span>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}