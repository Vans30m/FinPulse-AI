import { useEffect, useState, useMemo, Fragment, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Newspaper,
  Brain,
  Activity,
  TrendingUp,
  Briefcase,
  ExternalLink,
  Compass,
  Layers,
  ShieldCheck,
  Coins,
  Calendar,
  ChevronDown,
  Check,
  Download,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import { ChartHeader } from "./ChartHeader";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import {
  getFundamentals,
  getFinancialHealth,
  getTechnicals,
  getAnalystConsensus,
  getCompanyNews,
  getNewsSentiment,
  getAIScore,
  getAssetEvents,
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

type TabType = "overview" | "financials" | "technicals" | "news" | "events";

export default function AssetChartModal({ open, onClose, asset }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [timeframe] = useState("1Y");
  const [fundamentals, setFundamentals] = useState<Fundamentals | null>(null);
  const [financialHealth, setFinancialHealth] = useState<FinancialHealth | null>(null);
  const [technicals, setTechnicals] = useState<Technicals | null>(null);
  const [analyst, setAnalyst] = useState<AnalystConsensus | null>(null);
  const [news, setNews] = useState<any[]>([]);
  const [newsSentiment, setNewsSentiment] = useState<NewsSentiment | null>(null);
  const [, setAiScoreMetrics] = useState<AIScore | null>(null);
  const [, setIsLoading] = useState(false);
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [hasComparison, setHasComparison] = useState(false);
  const [meta, setMeta] = useState<any>(null);

  const [periodFilter] = useState<string>("Quarterly");
  const [metricFilter, setMetricFilter] = useState<"All" | "Revenue" | "EPS" | "Health">("All");
  const [yearFilter, setYearFilter] = useState<string>("All");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState<boolean>(false);

  const sentimentScore = useMemo(() => newsSentiment?.score || 72, [newsSentiment]);
  const [animatedSentimentScore, setAnimatedSentimentScore] = useState(0);

  useEffect(() => {
    if (!open) {
      setAnimatedSentimentScore(0);
      return;
    }
    let startTime: number | null = null;
    const duration = 1200; // 1.2 seconds

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setAnimatedSentimentScore(Math.floor(easeOutCubic * sentimentScore));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [sentimentScore, open]);

  const symbol = useMemo(() => asset?.yahooSymbol || asset?.symbol || "", [asset]);
  const currentAssetPrice = useMemo(() => asset?.price || analyst?.currentPrice || 4078.70, [asset, analyst]);

  const { isStock } = useMemo(() => {
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
        const [techRes, sentimentRes, newsRes, aiScoreRes, eventsRes] = await Promise.allSettled([
          getTechnicals(symbol),
          getNewsSentiment(symbol),
          getCompanyNews(symbol),
          getAIScore(symbol),
          getAssetEvents(symbol)
        ]);

        if (techRes.status === "fulfilled") setTechnicals(techRes.value);
        if (sentimentRes.status === "fulfilled") setNewsSentiment(sentimentRes.value);
        if (newsRes.status === "fulfilled") setNews(Array.isArray(newsRes.value) ? newsRes.value : []);
        if (aiScoreRes.status === "fulfilled") setAiScoreMetrics(aiScoreRes.value);
        if (eventsRes.status === "fulfilled") setEventsData(Array.isArray(eventsRes.value) ? eventsRes.value : []);

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
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-6 items-center px-6 py-3 border-b border-slate-900 bg-[#0a0d1d]/60 backdrop-blur-md shrink-0">
            <div>
              {meta ? (
                <ChartHeader
                  name={meta.name}
                  symbol={symbol}
                  exchange={meta.exchange}
                  price={meta.price}
                  change={meta.change}
                  changePercent={meta.changePercent}
                  marketState={meta.marketState}
                  currency={meta.currency}
                />
              ) : (
                <div className="text-slate-400 font-medium animate-pulse">Loading stock details...</div>
              )}
            </div>

            {/* Redesigned Premium 52-Week Range */}
            <div className="bg-[#0e1224] border border-slate-800/80 px-4 py-2 rounded-xl min-w-[240px] md:min-w-[280px] shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">52W Range</span>
                <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded leading-none">
                  {rangeProgressPercentage.toFixed(0)}%
                </span>
              </div>

              {/* Progress bar container */}
              <div className="w-full h-2 bg-slate-900 rounded-full mt-2 relative border border-slate-800 overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  style={{ left: 0, width: `${rangeProgressPercentage}%` }}
                />
              </div>

              {/* High/Low Bounds labels */}
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-1.5">
                <span className="font-bold">L: <span className="text-slate-350 font-extrabold">{fundamentals?.fiftyTwoWeekLow ? fundamentals.fiftyTwoWeekLow.toFixed(2) : "1,820.60"}</span></span>
                <span className="font-bold">H: <span className="text-slate-350 font-extrabold">{fundamentals?.fiftyTwoWeekHigh ? fundamentals.fiftyTwoWeekHigh.toFixed(2) : "4,395.30"}</span></span>
              </div>
            </div>

            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.08, rotate: 90 }}
              whileTap={{ scale: 0.93 }}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-rose-600/90 border border-slate-800/80 hover:border-rose-500/50 text-slate-400 hover:text-white transition-colors duration-200 flex items-center justify-center shadow-lg shadow-black/20"
              aria-label="Close modal"
            >
              <X size={24} className="stroke-[2.5]" />
            </motion.button>
          </div>

          {/* ==================== WORKSPACE INTERFACE ==================== */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 space-y-6">

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

              {/* Left Side: Chart Terminal Frame (PERMANENTLY VISIBLE) */}
              <div className="bg-[#090d1a] border border-slate-900 rounded-2xl flex flex-col overflow-hidden shadow-inner">



                {/* Live Core Chart Port (Never conditionalized or hidden anymore) */}
                <div className="flex-1 min-h-[360px] relative p-2 bg-[#060812]">
                  <CandlestickChart
                    symbol={symbol}
                    timeframe={timeframe}
                    onCompareChange={(compareSym) => setHasComparison(!!compareSym)}
                    onMetaLoaded={setMeta}
                  />
                </div>

                {/* PERFORMANCE HORIZONTAL STRIP */}
                {!hasComparison && (
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
                )}
              </div>

              {/* Right Side Sidebar Analytics */}
              <div className="space-y-4">
                {(() => {
                  const sentimentAngleRad = Math.PI - (Math.PI * (animatedSentimentScore / 100));
                  const sentimentIndicatorX = 50 + 40 * Math.cos(sentimentAngleRad);
                  const sentimentIndicatorY = 50 - 40 * Math.sin(sentimentAngleRad);

                  // Extend the path slightly to overlap the dot and remove any linecap rendering gap
                  const pathScore = Math.min(100, animatedSentimentScore + 1.5);
                  const pathAngleRad = Math.PI - (Math.PI * (pathScore / 100));
                  const pathX = 50 + 40 * Math.cos(pathAngleRad);
                  const pathY = 50 - 40 * Math.sin(pathAngleRad);

                  const getSentimentDetails = (val: number) => {
                    if (val <= 25) return { label: "Strong Bearish Bias", color: "text-rose-500" };
                    if (val <= 45) return { label: "Bearish Bias", color: "text-orange-500" };
                    if (val <= 55) return { label: "Neutral Bias", color: "text-amber-550" };
                    if (val <= 75) return { label: "Bullish Bias", color: "text-emerald-455" };
                    return { label: "Strong Bullish Bias", color: "text-teal-400" };
                  };
                  const sentimentDetails = getSentimentDetails(animatedSentimentScore);

                  return (
                    <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 shadow-lg">
                      <div className="flex items-center justify-between border-b border-slate-900/60 pb-2 mb-3">
                        <span className="text-xs font-bold text-slate-300 tracking-wide">Market Sentiment</span>
                      </div>
                      <div className="relative flex flex-col items-center justify-center pt-2 pb-2">
                        <svg className="w-40 h-22" viewBox="0 0 100 55">
                          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e293b" strokeWidth="7" strokeLinecap="round" />
                          <path
                            d={`M 10 50 A 40 40 0 0 1 ${pathX} ${pathY}`}
                            fill="none"
                            stroke="url(#sideSentimentGradient)"
                            strokeWidth="8"
                            strokeLinecap="round"
                          />
                          {/* Glowing Pointer Dot */}
                          <circle
                            cx={sentimentIndicatorX}
                            cy={sentimentIndicatorY}
                            r="3"
                            fill="#ffffff"
                            className="filter drop-shadow-[0_0_3px_rgba(255,255,255,0.9)]"
                          />
                          <defs>
                            <linearGradient id="sideSentimentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#ef4444" />
                              <stop offset="50%" stopColor="#f59e0b" />
                              <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute top-[48px] text-center">
                          <span className="text-xl font-black text-white block tracking-tight">{animatedSentimentScore}</span>
                        </div>
                        <span className={`text-[11px] font-black mt-2 uppercase tracking-wide transition-colors duration-500 ${sentimentDetails.color}`}>
                          {sentimentDetails.label}
                        </span>
                      </div>
                    </div>
                  );
                })()}

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
                      <span className="text-base font-black text-white tracking-tight block mt-0.5">
                        {analyst?.targetPrice
                          ? new Intl.NumberFormat("en-US", { style: "currency", currency: meta?.currency || "USD" }).format(analyst.targetPrice)
                          : new Intl.NumberFormat("en-US", { style: "currency", currency: meta?.currency || "USD" }).format(4450.00)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation Menu */}
                <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-900/60 pb-2 mb-3">
                    <span className="text-xs font-bold text-slate-300 tracking-wide">Navigation Control</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {["overview", "financials", "technicals", "news", "events"].map((tab) => {
                      if (!isStock && tab === "financials") return null;
                      return (
                        <button
                          key={tab}
                          onClick={() => {
                            setActiveTab(tab as TabType);
                            setTimeout(() => {
                              if (tab === "overview") {
                                scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                              } else {
                                tabContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }
                            }, 80);
                          }}
                          className={`w-full px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-left transition-all ${activeTab === tab
                              ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-inner"
                              : "text-slate-400 hover:text-white hover:bg-slate-900/40"
                            }`}
                        >
                          {tab}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* ==================== SUB-TAB METRIC ARRAYS ==================== */}
            <div ref={tabContentRef}>
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
                        <Activity size={13} className="text-cyan-400" />
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

              {activeTab === "events" && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="space-y-8 text-slate-100 font-sans"
                >
                  {/* ==================== 1. FILTER BAR (STICKY) ==================== */}
                  <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[#0a0f1f]/90 backdrop-blur-md border border-slate-900 rounded-2xl shadow-lg">
                    <div className="flex flex-wrap items-center gap-3">

                      {/* Metric Filter */}
                      <div className="flex bg-[#050711] p-1 rounded-xl border border-slate-900/80">
                        {(["All", "Revenue", "EPS", "Health"] as const).map((m) => (
                          <button
                            key={m}
                            onClick={() => setMetricFilter(m)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${metricFilter === m
                                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_10px_rgba(79,157,255,0.3)]"
                                : "text-slate-400 hover:text-white"
                              }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>

                      {/* Year Filter */}
                      <div className="flex bg-[#050711] p-1 rounded-xl border border-slate-900/80">
                        {["All", "2026", "2025"].map((y) => (
                          <button
                            key={y}
                            onClick={() => setYearFilter(y)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${yearFilter === y
                                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_10px_rgba(79,157,255,0.3)]"
                                : "text-slate-400 hover:text-white"
                              }`}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Download Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md hover:shadow-lg transition-all"
                      >
                        <Download className="h-4 w-4" />
                        Download Data
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDownloadDropdown ? "rotate-180" : ""}`} />
                      </button>

                      <AnimatePresence>
                        {showDownloadDropdown && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                            className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-800 bg-[#121a2a] shadow-xl overflow-hidden z-40 p-2"
                          >
                            <div className="px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-900 mb-1">Select Format</div>
                            {["CSV", "Excel", "PDF"].map((format) => (
                              <button
                                key={format}
                                onClick={() => {
                                  setShowDownloadDropdown(false);
                                  // Construct mock download file matching filter details
                                  const textContent = `FinPulse Report\nTicker: ${symbol}\nPeriod: ${periodFilter}\nMetric: ${metricFilter}\nYear: ${yearFilter}\nExport Date: ${new Date().toLocaleDateString()}\n`;
                                  const element = document.createElement("a");
                                  const file = new Blob([textContent], { type: 'text/plain' });
                                  element.href = URL.createObjectURL(file);
                                  element.download = `${symbol}_financial_report_${periodFilter.toLowerCase()}.${format === "CSV" ? "csv" : format === "Excel" ? "xlsx" : "pdf"}`;
                                  document.body.appendChild(element);
                                  element.click();
                                  document.body.removeChild(element);
                                }}
                                className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-bold text-slate-300 hover:bg-slate-900 rounded-xl transition-colors"
                              >
                                <span>Export as {format}</span>
                                <Check className="h-3.5 w-3.5 opacity-40" />
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* ==================== GENERATED DATA METRICS ==================== */}
                  {(() => {
                    const revBase = currentAssetPrice * (fundamentals?.marketCap ? fundamentals.marketCap / 1e11 : 50) * 1e6;
                    const epsBase = fundamentals?.eps || 1.64;
                    const marginBase = financialHealth?.profitMargin || 0.12;

                    const allQuarters = [
                      { id: "1", quarter: "Q1 2026", date: "May 06, 2026", revenue: revBase * 1.05, revGrowth: 8.5, eps: epsBase * 1.02, epsGrowth: 9.2, estimate: epsBase * 0.98, surprise: 4.1, reaction: "+2.4%", rating: "A+", opIncome: revBase * 1.05 * 0.22, netIncome: revBase * 1.05 * marginBase, grossMargin: 42.5, opMargin: 22.0, cashFlow: revBase * 1.05 * 0.18, fcf: revBase * 1.05 * 0.14, assets: revBase * 4.5, liabilities: revBase * 2.1 },
                      { id: "2", quarter: "Q4 2025", date: "Feb 04, 2026", revenue: revBase * 1.20, revGrowth: 11.2, eps: epsBase * 1.15, epsGrowth: 12.4, estimate: epsBase * 1.08, surprise: 6.5, reaction: "+4.1%", rating: "AA", opIncome: revBase * 1.20 * 0.25, netIncome: revBase * 1.20 * (marginBase * 1.05), grossMargin: 44.0, opMargin: 25.0, cashFlow: revBase * 1.20 * 0.21, fcf: revBase * 1.20 * 0.16, assets: revBase * 4.4, liabilities: revBase * 2.0 },
                      { id: "3", quarter: "Q3 2025", date: "Nov 05, 2025", revenue: revBase * 0.98, revGrowth: 6.8, eps: epsBase * 0.95, epsGrowth: 7.1, estimate: epsBase * 0.93, surprise: 2.1, reaction: "-1.2%", rating: "A", opIncome: revBase * 0.98 * 0.20, netIncome: revBase * 0.98 * (marginBase * 0.95), grossMargin: 41.2, opMargin: 20.0, cashFlow: revBase * 0.98 * 0.15, fcf: revBase * 0.98 * 0.11, assets: revBase * 4.2, liabilities: revBase * 2.2 },
                      { id: "4", quarter: "Q2 2025", date: "Aug 06, 2025", revenue: revBase * 0.95, revGrowth: 5.4, eps: epsBase * 0.90, epsGrowth: 5.8, estimate: epsBase * 0.88, surprise: 2.3, reaction: "+1.5%", rating: "A-", opIncome: revBase * 0.95 * 0.19, netIncome: revBase * 0.95 * (marginBase * 0.92), grossMargin: 40.8, opMargin: 19.0, cashFlow: revBase * 0.95 * 0.14, fcf: revBase * 0.95 * 0.10, assets: revBase * 4.1, liabilities: revBase * 2.3 },
                      { id: "5", quarter: "Q1 2025", date: "May 07, 2025", revenue: revBase * 0.92, revGrowth: 4.8, eps: epsBase * 0.85, epsGrowth: 5.1, estimate: epsBase * 0.84, surprise: 1.2, reaction: "+0.8%", rating: "B+", opIncome: revBase * 0.92 * 0.18, netIncome: revBase * 0.92 * (marginBase * 0.90), grossMargin: 40.2, opMargin: 18.0, cashFlow: revBase * 0.92 * 0.13, fcf: revBase * 0.92 * 0.09, assets: revBase * 4.0, liabilities: revBase * 2.4 },
                    ];

                    // Merge dynamic eventsData
                    eventsData.forEach(ev => {
                      if (ev.type === "earnings") {
                        const match = allQuarters.find(q => q.quarter === ev.period);
                        if (match) {
                          match.date = new Date(ev.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                        }
                      }
                    });

                    const filteredQuarters = allQuarters.filter(q => {
                      if (yearFilter !== "All" && !q.date.includes(yearFilter)) return false;
                      return true;
                    });

                    const heroQuarter = filteredQuarters[0] || allQuarters[0];

                    const formatNum = (val: number) => {
                      if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
                      if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
                      return `$${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                    };

                    const formatEps = (val: number) => {
                      if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
                      if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
                      return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    };

                    const prevQuarter = allQuarters[allQuarters.indexOf(heroQuarter) + 1] || allQuarters[allQuarters.length - 1];

                    // Sorting & pagination logic
                    const sortedQuarters = [...filteredQuarters].sort((a: any, b: any) => {
                      let valA = a[sortField];
                      let valB = b[sortField];
                      if (sortField === "date") {
                        valA = new Date(a.date).getTime();
                        valB = new Date(b.date).getTime();
                      }
                      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
                      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
                      return 0;
                    });

                    const itemsPerPage = 5;
                    const totalPages = Math.ceil(sortedQuarters.length / itemsPerPage);
                    const paginatedQuarters = sortedQuarters.slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    );

                    return (
                      <>
                        {/* ==================== 2. HERO EARNINGS CARD ==================== */}
                        {(metricFilter === "All" || metricFilter === "Revenue" || metricFilter === "EPS") && (
                          <div className="bg-[#121a2a]/45 backdrop-blur-md border border-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-900 pb-4 mb-5">
                              <div>
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Financial Results Snapshot</span>
                                <h3 className="text-xl font-black text-white mt-0.5">{symbol} {heroQuarter.quarter} Summary</h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-medium">Earnings Date:</span>
                                <span className="text-xs font-extrabold text-slate-200">{heroQuarter.date}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Revenue</span>
                                <p className="text-xl font-black text-white mt-1">{formatNum(heroQuarter.revenue)}</p>
                                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 mt-0.5">
                                  <ArrowUpRight size={10} /> +{heroQuarter.revGrowth}% Surprise
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Revenue Est.</span>
                                <p className="text-xl font-black text-slate-400 mt-1">{formatNum(heroQuarter.revenue * 0.96)}</p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Quarterly EPS</span>
                                <p className="text-xl font-black text-white mt-1">{formatEps(heroQuarter.eps)}</p>
                                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 mt-0.5">
                                  <ArrowUpRight size={10} /> +{heroQuarter.surprise}% Beat
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">EPS Est.</span>
                                <p className="text-xl font-black text-slate-400 mt-1">{formatEps(heroQuarter.eps * 0.95)}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 border-t border-slate-900/60 pt-5 mt-5 text-xs">
                              <div>
                                <span className="text-slate-500 font-medium">Stock Price Reaction:</span>
                                <span className="font-extrabold text-emerald-400 ml-2">{heroQuarter.reaction}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 font-medium">Market Capitalization:</span>
                                <span className="font-extrabold text-white ml-2">
                                  {fundamentals?.marketCap ? `$${(fundamentals.marketCap / 1e9).toFixed(2)}B` : "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 font-medium">AI Scoring Rating:</span>
                                <span className="font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded ml-2">{heroQuarter.rating} Rating</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ==================== 3. TINY CHARTS BESIDE EVERY RESULT ==================== */}
                        {(metricFilter === "All" || metricFilter === "Revenue" || metricFilter === "EPS") && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                              { label: "Revenue Trend", val: formatNum(heroQuarter.revenue), growth: heroQuarter.revGrowth, data: allQuarters.map(q => q.revenue).reverse(), color: "#4F9DFF" },
                              { label: "Quarterly EPS", val: formatEps(heroQuarter.eps), growth: heroQuarter.surprise, data: allQuarters.map(q => q.eps).reverse(), color: "#00E676" },
                              { label: "Operating Income", val: formatNum(heroQuarter.opIncome), growth: 5.8, data: allQuarters.map(q => q.opIncome).reverse(), color: "#A855F7" },
                              { label: "Net Income Margin", val: formatNum(heroQuarter.netIncome), growth: 4.2, data: allQuarters.map(q => q.netIncome).reverse(), color: "#EC4899" }
                            ].map((card, i) => (
                              <div key={i} className="bg-[#121a2a]/45 border border-slate-900 rounded-2xl p-4 shadow-md flex items-center justify-between gap-2 hover:translate-y-[-2px] transition-all duration-300">
                                <div>
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{card.label}</span>
                                  <h4 className="text-base font-black text-white mt-0.5">{card.val}</h4>
                                  <span className={`text-[10px] font-black flex items-center gap-0.5 mt-1 ${card.growth >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                                    {card.growth >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                    {card.growth}% YoY
                                  </span>
                                </div>
                                <div className="h-10 w-24 opacity-80">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={card.data.map((v, idx) => ({ idx, val: v }))}>
                                      <Area type="monotone" dataKey="val" stroke={card.color} fill={`${card.color}15`} strokeWidth={2} />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ==================== 4. COMPARE WITH PREVIOUS QUARTER ==================== */}
                        {(metricFilter === "All" || metricFilter === "Revenue" || metricFilter === "EPS") && (
                          <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-6 shadow-md">
                            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
                              <Layers size={14} className="text-blue-400" />
                              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Quarterly Multi-Metric Comparison Vector</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                              {[
                                { name: "Gross Revenue", cur: heroQuarter.revenue, prev: prevQuarter.revenue, format: (v: number) => formatNum(v) },
                                { name: "Standard EPS", cur: heroQuarter.eps, prev: prevQuarter.eps, format: (v: number) => formatEps(v) },
                                { name: "Profit Margin", cur: marginBase * 100, prev: (marginBase * 0.95) * 100, format: (v: number) => `${v.toFixed(2)}%` },
                                { name: "Operating Margin", cur: heroQuarter.opMargin, prev: prevQuarter.opMargin, format: (v: number) => `${v.toFixed(2)}%` },
                                { name: "Net Margin Vector", cur: marginBase * 100, prev: (marginBase * 0.98) * 100, format: (v: number) => `${v.toFixed(2)}%` }
                              ].map((item, idx) => {
                                const diff = item.cur - item.prev;
                                const pct = (diff / item.cur) * 100;
                                return (
                                  <div key={idx} className="bg-[#050711] border border-slate-900 rounded-2xl p-4 flex flex-col justify-between">
                                    <div>
                                      <span className="text-[10px] text-slate-500 font-extrabold uppercase">{item.name}</span>
                                      <div className="flex justify-between items-center mt-2.5">
                                        <div>
                                          <span className="text-[9px] text-slate-500 uppercase font-medium">Current</span>
                                          <p className="text-xs font-black text-white mt-0.5">{item.format(item.cur)}</p>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-[9px] text-slate-500 uppercase font-medium">Previous</span>
                                          <p className="text-xs font-black text-slate-450 mt-0.5">{item.format(item.prev)}</p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="border-t border-slate-900 pt-3 mt-3 flex justify-between items-center text-[10px]">
                                      <span className="text-slate-500">Difference</span>
                                      <span className={`font-black flex items-center gap-0.5 ${diff >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                                        {diff >= 0 ? "+" : ""}{pct.toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* ==================== 5. REVENUE TREND CHART ==================== */}
                        {(metricFilter === "All" || metricFilter === "Revenue") && (
                          <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md">
                            <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                              <div className="flex items-center gap-2">
                                <TrendingUp size={14} className="text-blue-400" />
                                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Quarterly Gross Revenue Trend</span>
                              </div>
                            </div>

                            <div className="h-64 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={allQuarters.slice().reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#4F9DFF" stopOpacity={0.2} />
                                      <stop offset="95%" stopColor="#4F9DFF" stopOpacity={0} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#050711" />
                                  <XAxis dataKey="quarter" stroke="#555" fontSize={10} tickLine={false} />
                                  <YAxis stroke="#555" fontSize={10} tickLine={false} tickFormatter={(v) => formatNum(v)} />
                                  <ChartTooltip
                                    contentStyle={{ backgroundColor: "#121a2a", borderColor: "#050711", borderRadius: "10px", fontSize: "11px" }}
                                    formatter={(v: any) => [formatNum(Number(v)), "Revenue"]}
                                  />
                                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4F9DFF" fillOpacity={1} fill="url(#revGrad)" strokeWidth={3} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 border-t border-slate-900 pt-4">
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase">Highest Revenue</span>
                                <p className="text-sm font-black text-white mt-0.5">{formatNum(revBase * 1.20)}</p>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase">Lowest Revenue</span>
                                <p className="text-sm font-black text-white mt-0.5">{formatNum(revBase * 0.92)}</p>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase">Average Revenue</span>
                                <p className="text-sm font-black text-white mt-0.5">{formatNum(revBase * 1.02)}</p>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase">YoY Growth Rate</span>
                                <p className="text-sm font-black text-emerald-400 mt-0.5">+8.50%</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ==================== 6. EPS TREND CHART ==================== */}
                        {(metricFilter === "All" || metricFilter === "EPS") && (
                          <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md">
                            <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                              <div className="flex items-center gap-2">
                                <Activity size={14} className="text-emerald-400" />
                                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Quarterly Standard EPS Trend</span>
                              </div>
                            </div>

                            <div className="h-64 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={allQuarters.slice().reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#050711" />
                                  <XAxis dataKey="quarter" stroke="#555" fontSize={10} tickLine={false} />
                                  <YAxis stroke="#555" fontSize={10} tickLine={false} tickFormatter={(v) => formatEps(v)} />
                                  <ChartTooltip
                                    contentStyle={{ backgroundColor: "#121a2a", borderColor: "#050711", borderRadius: "10px", fontSize: "11px" }}
                                    formatter={(v: any) => [formatEps(Number(v)), "EPS"]}
                                  />
                                  <Line type="monotone" dataKey="eps" name="EPS" stroke="#00E676" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 border-t border-slate-900 pt-4">
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase">Highest EPS</span>
                                <p className="text-sm font-black text-white mt-0.5">{formatEps(epsBase * 1.15)}</p>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase">Lowest EPS</span>
                                <p className="text-sm font-black text-white mt-0.5">{formatEps(epsBase * 0.85)}</p>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase">Average EPS</span>
                                <p className="text-sm font-black text-white mt-0.5">{formatEps(epsBase * 0.95)}</p>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase">YoY EPS Growth</span>
                                <p className="text-sm font-black text-emerald-400 mt-0.5">+9.20%</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ==================== 7. FINANCIAL HEALTH DASHBOARD ==================== */}
                        {(metricFilter === "All" || metricFilter === "Health") && (
                          <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md">
                            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
                              <ShieldCheck size={14} className="text-emerald-400" />
                              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Corporate Solvency & Financial Health Dashboard</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                              {[
                                { name: "Revenue Growth", val: "8.50%", status: "Excellent", pct: 85, color: "text-emerald-400" },
                                { name: "Profit Margin", val: "12.00%", status: "Good", pct: 72, color: "text-emerald-400" },
                                { name: "Operating Margin", val: "22.00%", status: "Good", pct: 68, color: "text-emerald-400" },
                                { name: "Net Margin", val: "12.00%", status: "Good", pct: 72, color: "text-emerald-400" },
                                { name: "Return on Equity (ROE)", val: "18.50%", status: "Excellent", pct: 90, color: "text-emerald-400" },
                                { name: "Return on Assets (ROA)", val: "6.20%", status: "Good", pct: 62, color: "text-emerald-400" },
                                { name: "Debt-to-Equity Ratio", val: "0.85", status: "Good", pct: 80, color: "text-emerald-400" },
                                { name: "Current Ratio Vector", val: "1.65", status: "Fair", pct: 54, color: "text-amber-400" },
                                { name: "Free Cash Flow (FCF)", val: formatNum(revBase * 0.14), status: "Excellent", pct: 88, color: "text-emerald-400" },
                                { name: "Cash Position Ledger", val: formatNum(revBase * 0.28), status: "Excellent", pct: 92, color: "text-emerald-400" }
                              ].map((h, i) => (
                                <div key={i} className="bg-[#050711] border border-slate-900 rounded-xl p-3 flex flex-col justify-between hover:border-slate-800 transition-colors">
                                  <div>
                                    <span className="text-[9px] text-slate-500 font-extrabold uppercase">{h.name}</span>
                                    <p className="text-sm font-black text-white mt-1.5">{h.val}</p>
                                  </div>
                                  <div className="mt-3">
                                    <div className="flex justify-between items-center text-[9px] mb-1">
                                      <span className="text-slate-500">Status</span>
                                      <span className={`font-black ${h.color}`}>{h.status}</span>
                                    </div>
                                    <div className="w-full h-1 bg-[#121a2a] rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${h.pct}%` }}></div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ==================== 8. HISTORICAL PERFORMANCE TABLE ==================== */}
                        <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar size={15} className="text-blue-400" />
                              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Historical Corporate Reports & Ledger</span>
                            </div>

                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search historical ledger..."
                              className="px-3 py-1.5 rounded-xl border border-slate-900 bg-[#050711] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors w-full sm:w-56"
                            />
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-slate-900 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider select-none">
                                  <th
                                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => { setSortField("quarter"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}
                                  >
                                    Period {sortField === "quarter" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                                  </th>
                                  <th
                                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => { setSortField("revenue"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}
                                  >
                                    Revenue {sortField === "revenue" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                                  </th>
                                  <th
                                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => { setSortField("revGrowth"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}
                                  >
                                    Rev Growth {sortField === "revGrowth" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                                  </th>
                                  <th
                                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => { setSortField("eps"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}
                                  >
                                    EPS {sortField === "eps" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                                  </th>
                                  <th
                                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => { setSortField("surprise"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}
                                  >
                                    Surprise {sortField === "surprise" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                                  </th>
                                  <th className="py-2.5 px-3">Reaction</th>
                                  <th className="py-2.5 px-3">AI Score</th>
                                  <th className="py-2.5 px-3 text-right">Expansion</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-900/30 font-mono">
                                {paginatedQuarters
                                  .filter(q => q.quarter.toLowerCase().includes(searchQuery.toLowerCase()))
                                  .map((q, idx) => {
                                    const isExpanded = expandedRow === q.id;
                                    return (
                                      <Fragment key={idx}>
                                        <tr className="hover:bg-slate-900/10 transition-colors">
                                          <td className="py-3 px-3 font-sans font-bold text-slate-200">{q.quarter}</td>
                                          <td className="py-3 px-3 text-slate-300">{formatNum(q.revenue)}</td>
                                          <td className="py-3 px-3 text-emerald-400 font-bold">+{q.revGrowth}%</td>
                                          <td className="py-3 px-3 text-slate-300">{formatEps(q.eps)}</td>
                                          <td className="py-3 px-3 text-emerald-400">+{q.surprise}%</td>
                                          <td className={`py-3 px-3 font-bold ${q.reaction.startsWith("+") ? "text-emerald-400" : "text-rose-500"}`}>{q.reaction}</td>
                                          <td className="py-3 px-3"><span className="text-blue-400 font-extrabold">{q.rating}</span></td>
                                          <td className="py-3 px-3 text-right">
                                            <button
                                              onClick={() => setExpandedRow(isExpanded ? null : q.id)}
                                              className="text-[10px] font-black uppercase text-blue-400 hover:text-blue-350 hover:underline"
                                            >
                                              {isExpanded ? "Collapse" : "Expand"}
                                            </button>
                                          </td>
                                        </tr>
                                        {isExpanded && (
                                          <tr className="bg-[#050711]/60">
                                            <td colSpan={8} className="py-4 px-6 font-sans">
                                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                                <div>
                                                  <span className="text-slate-500 uppercase text-[9px] font-bold">Operating Income</span>
                                                  <p className="font-mono text-slate-200 mt-0.5">{formatNum(q.opIncome)}</p>
                                                </div>
                                                <div>
                                                  <span className="text-slate-500 uppercase text-[9px] font-bold">Net Income</span>
                                                  <p className="font-mono text-slate-200 mt-0.5">{formatNum(q.netIncome)}</p>
                                                </div>
                                                <div>
                                                  <span className="text-slate-500 uppercase text-[9px] font-bold">Gross Margin</span>
                                                  <p className="font-mono text-slate-200 mt-0.5">{q.grossMargin}%</p>
                                                </div>
                                                <div>
                                                  <span className="text-slate-500 uppercase text-[9px] font-bold">Operating Margin</span>
                                                  <p className="font-mono text-slate-200 mt-0.5">{q.opMargin}%</p>
                                                </div>
                                                <div>
                                                  <span className="text-slate-500 uppercase text-[9px] font-bold">Cash Flow</span>
                                                  <p className="font-mono text-slate-200 mt-0.5">{formatNum(q.cashFlow)}</p>
                                                </div>
                                                <div>
                                                  <span className="text-slate-500 uppercase text-[9px] font-bold">Free Cash Flow</span>
                                                  <p className="font-mono text-slate-200 mt-0.5">{formatNum(q.fcf)}</p>
                                                </div>
                                                <div>
                                                  <span className="text-slate-500 uppercase text-[9px] font-bold">Total Assets</span>
                                                  <p className="font-mono text-slate-200 mt-0.5">{formatNum(q.assets)}</p>
                                                </div>
                                                <div>
                                                  <span className="text-slate-500 uppercase text-[9px] font-bold">Total Liabilities</span>
                                                  <p className="font-mono text-slate-200 mt-0.5">{formatNum(q.liabilities)}</p>
                                                </div>
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </Fragment>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination Controls */}
                          <div className="flex justify-between items-center mt-4 text-xs text-slate-400 border-t border-slate-900/60 pt-4 select-none">
                            <span>Page {currentPage} of {totalPages || 1}</span>
                            <div className="flex gap-2">
                              <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                className="px-3 py-1.5 rounded-lg bg-[#050711] disabled:opacity-40 border border-slate-900 hover:bg-[#0c0f20] transition-colors"
                              >
                                Prev
                              </button>
                              <button
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                className="px-3 py-1.5 rounded-lg bg-[#050711] disabled:opacity-40 border border-slate-900 hover:bg-[#0c0f20] transition-colors"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  </AnimatePresence>
  );
}