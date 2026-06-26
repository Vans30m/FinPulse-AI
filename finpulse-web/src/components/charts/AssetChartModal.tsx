import { useEffect, useState, useMemo } from "react";
import { 
  X, 
  Newspaper, 
  Brain, 
  Activity, 
  TrendingUp, 
  Target, 
  Briefcase, 
  PieChart, 
  Tags,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import TimeframeSelector from "./TimeframeSelector";
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

export default function AssetChartModal({ open, onClose, asset }: Props) {
  const [timeframe, setTimeframe] = useState("1Y");
  const [fundamentals, setFundamentals] = useState<Fundamentals | null>(null);
  const [financialHealth, setFinancialHealth] = useState<FinancialHealth | null>(null);
  const [technicals, setTechnicals] = useState<Technicals | null>(null);
  const [analyst, setAnalyst] = useState<AnalystConsensus | null>(null);
  const [news, setNews] = useState<any[]>([]);
  const [newsSentiment, setNewsSentiment] = useState<NewsSentiment | null>(null);
  const [aiScoreMetrics, setAiScoreMetrics] = useState<AIScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Deriving asset profile cleanly using useMemo
  const symbol = useMemo(() => asset?.yahooSymbol || asset?.symbol || "", [asset]);

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

  // Modal accessibility: Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // UX Feature: Freeze parent/background document scrolling when modal is open
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

  // Handle data fetching lifecycle Orchestration
  useEffect(() => {
    if (!open || !symbol) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Parallel load global modules
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

        // Conditional stock-only fundamentals loader
        if (isStock) {
          const [fundRes, finRes, analystRes] = await Promise.allSettled([
            getFundamentals(symbol),
            getFinancialHealth(symbol),
            getAnalystConsensus(symbol)
          ]);

          if (fundRes.status === "fulfilled") setFundamentals(fundRes.value);
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

  if (!open || !asset) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-6 lg:p-8 animate-fade-in">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 z-[99998] bg-slate-950/75 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Main Container - Adjusted sizes to prevent overflowing or looking too constrained */}
      <div className="relative z-[99999] w-full max-w-6xl h-full max-h-[85vh] rounded-2xl bg-white dark:bg-[#090D1A] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800/80 shadow-2xl transition-all duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-[#090D1A] shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 flex items-center justify-center text-cyan-500 font-bold text-lg border border-cyan-500/20">
              {asset.symbol.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
                  {asset.symbol}
                </h2>
                {isLoading && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-500 dark:text-amber-400 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Syncing Data
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">{asset.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-700 dark:hover:text-slate-300 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Viewport Scroll Space */}
        <div className="flex-1 overflow-y-auto w-full custom-scrollbar space-y-6 p-6 bg-slate-50/50 dark:bg-[#060912]">
          
          {/* Chart Core Control Center Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-[#0D1326] p-2 rounded-xl border border-slate-100 dark:border-slate-800/40">
              <TimeframeSelector selected={timeframe} onChange={setTimeframe} />
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/20">
                <Tags size={14} className="text-indigo-500" />
                <span className="text-slate-600 dark:text-slate-300">{assetType} Module</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
              {/* Candlestick Segment Container - Added min-height to elevate visual size hierarchy */}
              <div className="bg-white dark:bg-[#0D1326] rounded-2xl border border-slate-100 dark:border-slate-800/40 p-4 shadow-sm min-h-[360px] flex flex-col justify-between">
                <CandlestickChart symbol={symbol} timeframe={timeframe} />
              </div>

              {/* Aggregated Real-time Corporate Streaming News Ecosystem */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800/40 bg-white dark:bg-[#0D1326] flex flex-col overflow-hidden h-full max-h-[360px] shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/40 flex items-center justify-between bg-white dark:bg-[#0D1326] shrink-0">
                  <div className="flex items-center gap-2">
                    <Newspaper className="text-cyan-500" size={16} />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Market Sentiment Streams</h3>
                  </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto pr-2 space-y-2.5 custom-scrollbar bg-slate-50/30 dark:bg-slate-950/20">
                  {news.length === 0 ? (
                    <div className="text-slate-400 dark:text-slate-600 text-center py-20 flex flex-col items-center gap-2">
                      <Newspaper size={28} className="opacity-20" />
                      <p className="text-xs font-medium">No active streaming news channels</p>
                    </div>
                  ) : (
                    news.slice(0, 5).map((item: any, index: number) => (
                      <a
                        key={item.uuid || item.link || index}
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex flex-col rounded-xl border border-slate-100 dark:border-slate-800/40 bg-white dark:bg-[#090D1A] p-3 hover:border-cyan-500/30 dark:hover:border-cyan-500/20 hover:shadow-sm transition-all duration-200"
                      >
                        {item.thumbnail?.resolutions?.[0]?.url && (
                          <img
                            src={item.thumbnail.resolutions[0].url}
                            alt=""
                            className="w-full h-24 object-cover rounded-lg mb-2.5 opacity-95 group-hover:opacity-100 transition-opacity"
                          />
                        )}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="inline-flex px-1.5 py-0.5 rounded bg-cyan-500/5 dark:bg-cyan-500/10 text-[9px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                            {item.publisher || "Global Wire"}
                          </span>
                          <ExternalLink size={10} className="text-slate-300 dark:text-slate-600 group-hover:text-cyan-500 transition-colors" />
                        </div>
                        <div className="font-semibold text-xs leading-snug text-slate-700 dark:text-slate-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
                          {item.title}
                        </div>
                        <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium self-end">
                          {item.providerPublishTime ? new Date(item.providerPublishTime).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : ""}
                        </div>
                      </a>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Core Analytical Financial Metrics Dashboard Grid */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 px-1">
              <Info size={12} className="text-slate-400" />
              Intelligence Metrics Indicators Matrix
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              
              {/* Natural Language AI News Processing Metrics */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800/40 bg-white dark:bg-[#0D1326] p-4 shadow-sm flex flex-col justify-between min-h-[130px]">
                <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800/20 pb-2">
                  <Brain className="text-cyan-500" size={16} />
                  <h3 className="font-bold text-xs text-slate-600 dark:text-slate-400">AI News Bias</h3>
                </div>
                {newsSentiment ? (
                  <div className="mt-2.5 flex flex-col justify-between flex-1">
                    <div>
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                        newsSentiment.sentiment === "Bullish"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : newsSentiment.sentiment === "Bearish"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                        {newsSentiment.sentiment}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Model Weighting</span>
                      <span className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{newsSentiment.score}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 animate-pulse mt-4 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                    Running vector pipeline...
                  </div>
                )}
              </div>

              {/* Quant Verdict Engine Panel */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800/40 bg-white dark:bg-[#0D1326] p-4 shadow-sm flex flex-col justify-between sm:col-span-2 lg:col-span-1 xl:col-span-1 min-h-[130px]">
                <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800/20 pb-2">
                  <Activity className="text-blue-500" size={16} />
                  <h3 className="font-bold text-xs text-slate-600 dark:text-slate-400">Technical Indicators</h3>
                </div>
                {technicals ? (
                  <div className="mt-2.5 flex flex-col justify-between flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        technicals.verdict?.includes("Bull")
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : technicals.verdict?.includes("Bear")
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                        {technicals.verdict}
                      </span>
                      <span className="text-lg font-black text-blue-500">{technicals.confidence}%</span>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500" style={{ width: `${technicals.confidence}%` }} />
                      </div>
                      <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 block text-right">Signal Confidence Strength</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 animate-pulse mt-4 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                    Parsing telemetry data...
                  </div>
                )}
              </div>

              {/* FinPulse Core AI Scoring Engine */}
              <div className="rounded-2xl border border-purple-500/10 bg-gradient-to-b from-purple-500/[0.02] to-transparent dark:border-purple-500/20 dark:bg-purple-500/[0.01] p-4 shadow-sm flex flex-col justify-between min-h-[130px]">
                <div className="flex items-center gap-2 border-b border-purple-500/5 dark:border-purple-500/10 pb-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300">FinPulse AI Core</h3>
                </div>
                {aiScoreMetrics ? (
                  <div className="mt-2.5 flex flex-col justify-between flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">{aiScoreMetrics.score}</span>
                      <span className="text-[10px] font-semibold text-slate-400">/100</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/40 text-[10px]">
                      <span className="text-slate-400">Verdict Matrix:</span>
                      <span className={`font-bold ${
                        aiScoreMetrics.score >= 85 ? "text-emerald-500" :
                        aiScoreMetrics.score >= 70 ? "text-cyan-400" :
                        aiScoreMetrics.score >= 55 ? "text-amber-400" : "text-rose-400"
                      }`}>
                        {aiScoreMetrics.score >= 85 ? "STRONG BUY" : aiScoreMetrics.score >= 70 ? "BUY" : aiScoreMetrics.score >= 55 ? "HOLD" : "SELL"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 animate-pulse mt-4 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
                    Compiling weights network...
                  </div>
                )}
              </div>

              {/* AI Strategic Action Recommendations Panel */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800/40 bg-white dark:bg-[#0D1326] p-4 shadow-sm flex flex-col justify-between min-h-[130px]">
                <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800/20 pb-2">
                  <CheckCircle2 className="text-emerald-500" size={16} />
                  <h3 className="font-bold text-xs text-slate-600 dark:text-slate-400">Automated Directives</h3>
                </div>
                {technicals ? (
                  <div className="mt-2.5 flex flex-col justify-between flex-1">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight line-clamp-1">
                      {technicals.recommendation || "Neutral Engine"}
                    </div>
                    
                    <div className="mt-1.5 space-y-1 max-h-[44px] overflow-y-auto custom-scrollbar">
                      {technicals.reasons?.slice(0, 2).map((reason, idx) => (
                        <div key={idx} className="text-[10px] text-slate-500 dark:text-slate-400 flex items-start gap-1 leading-tight">
                          <ChevronRight size={10} className="text-cyan-500 mt-0.5 shrink-0" />
                          <span className="truncate">{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 animate-pulse mt-4 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Drafting summaries...
                  </div>
                )}
              </div>

              {/* Institutional Consensus Matrix */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800/40 bg-white dark:bg-[#0D1326] p-4 shadow-sm flex flex-col justify-between min-h-[130px]">
                <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800/20 pb-2">
                  <Target className="text-rose-500" size={16} />
                  <h3 className="font-bold text-xs text-slate-600 dark:text-slate-400">Street Consensus</h3>
                </div>
                {analyst ? (
                  <div className="mt-2.5 flex flex-col justify-center flex-1 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Target price</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">${analyst.targetPrice?.toFixed(2) || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-baseline border-t border-slate-50 dark:border-slate-800/30 pt-1.5">
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Target Upside</span>
                      <span className="text-xs font-bold text-emerald-500 bg-emerald-500/5 px-1.5 py-0.5 rounded">
                        {analyst.currentPrice && analyst.targetPrice
                          ? (((analyst.targetPrice - analyst.currentPrice) / analyst.currentPrice) * 100).toFixed(1)
                          : "0.0"}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 leading-relaxed italic">
                    Institutional index mappings restricted for asset group.
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Mathematical & Structural Ledger Framework Segment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            {/* Mathematical Aggregated Historical Oscillator Stats */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800/40 bg-white dark:bg-[#0D1326] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-50 dark:border-slate-800/20 pb-2.5">
                <TrendingUp className="text-slate-400 dark:text-slate-500" size={16} />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">Oscillator Telemetry</h3>
              </div>
              {technicals ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800/10 pb-1.5">
                    <span className="text-slate-400 font-medium">Relative Strength Index</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{technicals.rsi}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800/10 pb-1.5">
                    <span className="text-slate-400 font-medium">MACD Output</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{technicals.macd}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Exponential MA (20)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{technicals.ema20}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Simple MA (50)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{technicals.sma50}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 animate-pulse py-4">De-referencing indicator arrays...</div>
              )}
            </div>

            {/* Fundamental Financial Health Framework */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800/40 bg-white dark:bg-[#0D1326] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-50 dark:border-slate-800/20 pb-2.5">
                <Briefcase className="text-slate-400 dark:text-slate-500" size={16} />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">Financial Performance</h3>
              </div>
              {financialHealth ? (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800/10 pb-2">
                    <span className="text-slate-400 font-medium">Gross Annual revenue</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {financialHealth.revenue ? `$${(financialHealth.revenue / 1_000_000_000).toFixed(1)}B` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-slate-400 font-medium">Calculated Profit Margin</span>
                    <span className="font-bold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-md">
                      {(financialHealth.profitMargin * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-4 italic">Corporate income statements unassigned to node configuration.</div>
              )}
            </div>

            {/* Multi-tier Fundamental Evaluation Framework */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800/40 bg-white dark:bg-[#0D1326] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-50 dark:border-slate-800/20 pb-2.5">
                <PieChart className="text-slate-400 dark:text-slate-500" size={16} />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">Capital Foundations</h3>
              </div>
              {fundamentals ? (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800/10 pb-2">
                    <span className="text-slate-400 font-medium">Net Market Capitalization</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {fundamentals.marketCap ? `$${(fundamentals.marketCap / 1_000_000_000).toFixed(1)}B` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-slate-400 font-medium">Price/Earnings Premium Ratio</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800/40">
                      {fundamentals.peRatio ? fundamentals.peRatio.toFixed(2) : "N/A"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-4 italic">Asset class fundamentals core ledger excluded.</div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

