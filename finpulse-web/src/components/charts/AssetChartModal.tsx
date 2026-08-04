import { useEffect, useState, useMemo, useRef } from "react";
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
  ArrowDownRight,
  Users,
  Scissors,
  DollarSign
} from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import { ChartHeader } from "./ChartHeader";
import { getUnifiedAssetDetails } from "../../services/marketService";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  asset: any;
}

type TabType =
  | "overview"
  | "analysts"
  | "sentiment"
  | "events"
  | "ownership"
  | "technicals"
  | "performance"
  | "news";

// Helpers for Calendar Events and Forecast UI
const parseDateParts = (dateVal: any) => {
  if (!dateVal) return null;
  const dateObj = new Date(dateVal);
  if (isNaN(dateObj.getTime())) return null;
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = dateObj.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
  const year = dateObj.getFullYear();
  return { day, month, year };
};

export default function AssetChartModal({ open, onClose, asset }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);

  const symbol = useMemo(() => asset?.yahooSymbol || asset?.symbol || "", [asset]);

  const assetType = useMemo(() => {
    const upper = symbol.toUpperCase();
    if (upper.endsWith("-USD")) return "Crypto";
    if (upper.endsWith("=X")) return "Forex";
    if (upper.endsWith("=F")) return "Commodities";
    return "Stock";
  }, [symbol]);

  const isSpecialAsset = assetType === "Crypto" || assetType === "Forex" || assetType === "Commodities";

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const upper = symbol.toUpperCase();
    const special = upper.endsWith("-USD") || upper.endsWith("=X") || upper.endsWith("=F");
    return special ? "sentiment" : "overview";
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [hasComparison, setHasComparison] = useState(false);
  const [timeframe, setTimeframe] = useState("1Y");

  // Position, SL, TP States
  const [activePosition, setActivePosition] = useState<any | null>(null);
  const [slInput, setSlInput] = useState("");
  const [tpInput, setTpInput] = useState("");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closeType, setCloseType] = useState<"full" | "partial">("full");
  const [closeQtyInput, setCloseQtyInput] = useState("");

  const isSymbolMatch = (t1: string, t2: string) => {
    if (!t1 || !t2) return false;
    const clean = (s: string) => s.toUpperCase().split('.')[0].split('=')[0].split('-')[0];
    return t1.toUpperCase() === t2.toUpperCase() || clean(t1) === clean(t2);
  };

  const loadActivePosition = () => {
    try {
      const stored = localStorage.getItem('finpulse_virtual_holdings');
      if (stored) {
        const holdings = JSON.parse(stored);
        const pos = holdings.find((h: any) => isSymbolMatch(h.ticker, symbol));
        if (pos && Math.abs(pos.shares) > 0.0001) {
          setActivePosition(pos);
        } else {
          setActivePosition(null);
        }
      } else {
        setActivePosition(null);
      }
    } catch (err) {
      console.error(err);
      setActivePosition(null);
    }
  };

  useEffect(() => {
    loadActivePosition();
  }, [symbol, open]);

  useEffect(() => {
    if (activePosition) {
      setSlInput(activePosition.sl ? String(activePosition.sl) : "");
      setTpInput(activePosition.tp ? String(activePosition.tp) : "");
    } else {
      setSlInput("");
      setTpInput("");
    }
  }, [activePosition]);

  const handleSaveSlTp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol) return;

    try {
      const stored = localStorage.getItem('finpulse_virtual_holdings');
      if (stored) {
        const holdings = JSON.parse(stored);
        const updated = holdings.map((h: any) => {
          if (isSymbolMatch(h.ticker, symbol)) {
            return {
              ...h,
              sl: slInput ? parseFloat(slInput) : undefined,
              tp: tpInput ? parseFloat(tpInput) : undefined
            };
          }
          return h;
        });
        localStorage.setItem('finpulse_virtual_holdings', JSON.stringify(updated));
        toast.success("Stop Loss / Take Profit updated successfully!");
        loadActivePosition();
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      toast.error("Failed to update SL/TP");
    }
  };

  const handleClosePosition = () => {
    if (!activePosition || !symbol) return;
    setCloseType("full");
    setCloseQtyInput(String(Math.abs(activePosition.shares)));
    setShowCloseConfirm(true);
  };

  const executeClosePosition = (sharesToClose: number) => {
    if (!activePosition || !symbol) return;

    try {
      const currentPrice = meta?.price || activePosition.avgCost;
      const isShort = activePosition.shares < 0;

      const pnl = isShort
        ? (activePosition.avgCost - currentPrice) * sharesToClose
        : (currentPrice - activePosition.avgCost) * sharesToClose;

      const holdings = JSON.parse(localStorage.getItem('finpulse_virtual_holdings') || '[]');
      const nextHoldings = holdings.map((h: any) => {
        if (isSymbolMatch(h.ticker, symbol)) {
          const isShortPos = h.shares < 0;
          const currentAbsShares = Math.abs(h.shares);
          const remainingAbs = Math.max(0, currentAbsShares - sharesToClose);
          const remainingShares = isShortPos ? -remainingAbs : remainingAbs;
          return {
            ...h,
            shares: remainingShares,
            bookedPL: (h.bookedPL || 0) + pnl
          };
        }
        return h;
      }).filter((h: any) => Math.abs(h.shares) > 0.0001 || (h.bookedPL || 0) !== 0);

      const isDomestic = symbol.endsWith('.NS') || symbol.endsWith('.BO');
      const usdToInrRate = 83.45;
      const cashImpactUSD = isDomestic ? (sharesToClose * currentPrice) / usdToInrRate : (sharesToClose * currentPrice);

      const currentBalance = parseFloat(localStorage.getItem('finpulse_virtual_balance') || '100000');
      const nextBalance = isShort ? currentBalance - cashImpactUSD : currentBalance + cashImpactUSD;

      const newTx = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        type: isShort ? 'BUY' as const : 'SELL' as const,
        symbol: activePosition.ticker,
        name: activePosition.name,
        shares: sharesToClose,
        price: currentPrice,
        totalValue: sharesToClose * currentPrice
      };

      const transactions = JSON.parse(localStorage.getItem('finpulse_virtual_transactions') || '[]');
      const nextTxs = [...transactions, newTx];

      localStorage.setItem('finpulse_virtual_holdings', JSON.stringify(nextHoldings));
      localStorage.setItem('finpulse_virtual_balance', nextBalance.toString());
      localStorage.setItem('finpulse_virtual_transactions', JSON.stringify(nextTxs));

      toast.success(`Position closed successfully! Realized P&L: ${isDomestic ? '₹' : '$'}${pnl.toFixed(2)}`);
      setShowCloseConfirm(false);
      setActivePosition(null);
      loadActivePosition();
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      toast.error("Failed to close position");
    }
  };

  useEffect(() => {
    if (isSpecialAsset) {
      setActiveTab("sentiment");
    } else {
      setActiveTab("overview");
    }
  }, [symbol, isSpecialAsset, open]);

  const availableTabs = useMemo(() => {
    const allTabs = [
      { id: "overview", label: "Overview", icon: Layers },
      { id: "analysts", label: "Analyst Targets", icon: Compass },
      { id: "sentiment", label: "Stock Sentiment", icon: Brain },
      { id: "ownership", label: "Ownership", icon: Users },
      { id: "events", label: "Calendar Events", icon: Calendar },
      { id: "technicals", label: "Structural Levels", icon: Activity },
      { id: "performance", label: "Performance", icon: TrendingUp },
      { id: "news", label: "News Feed", icon: Newspaper }
    ];
    if (isSpecialAsset) {
      return allTabs.filter(tab =>
        tab.id !== "overview" &&
        tab.id !== "analysts" &&
        tab.id !== "ownership" &&
        tab.id !== "events"
      );
    }
    return allTabs;
  }, [isSpecialAsset]);

  useEffect(() => {
    if (!open || !symbol) return;

    const loadDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const unifiedData = await getUnifiedAssetDetails(symbol);
        setData(unifiedData);

        const newMeta = {
          name: unifiedData.profile?.name || asset?.name || symbol,
          exchange: unifiedData.quote?.exchangeName || asset?.exchange || "GLOBAL",
          price: unifiedData.statistics?.price || asset?.price || 0,
          change: unifiedData.statistics?.change || asset?.change || 0,
          changePercent: unifiedData.statistics?.changePercent || asset?.changePercent || 0,
          marketState: unifiedData.quote?.marketState || "CLOSED",
          currency: unifiedData.quote?.currency || "USD",
          performance: unifiedData.statistics?.performance || null
        };
        setMeta(newMeta);
      } catch (err: any) {
        console.error("Failed to load unified asset details:", err);
        setError("Failed to load asset details from Yahoo Finance.");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [open, symbol]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Format currency helpers
  const formatVal = (val: any, isCurrency = false, isPercent = false) => {
    if (val === undefined || val === null || val === "Not Available") return "N/A";
    const num = Number(val);
    if (isNaN(num)) return val;

    const getCurrencySymbol = (code: string) => {
      try {
        return (0).toLocaleString("en-US", {
          style: "currency",
          currency: code,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).replace(/\d/g, "").trim();
      } catch {
        return "$";
      }
    };
    const currencySymbol = getCurrencySymbol(meta?.currency || "USD");

    if (isPercent) {
      return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
    }

    if (isCurrency) {
      if (Math.abs(num) >= 1e12) {
        return `${currencySymbol}${(num / 1e12).toFixed(2)}T`;
      }
      if (Math.abs(num) >= 1e9) {
        return `${currencySymbol}${(num / 1e9).toFixed(2)}B`;
      }
      if (Math.abs(num) >= 1e6) {
        return `${currencySymbol}${(num / 1e6).toFixed(2)}M`;
      }
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: meta?.currency || "USD"
      }).format(num);
    }

    if (Math.abs(num) >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (Math.abs(num) >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (Math.abs(num) >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString();
  };

  const renderCalendarCard = (dateVal: any, title: string, subtitle: string, color: 'blue' | 'purple') => {
    const parts = parseDateParts(dateVal);
    const colorClasses = color === 'blue'
      ? {
        bg: 'bg-blue-500/10 border-blue-500/20',
        header: 'bg-blue-500 text-white',
        text: 'text-blue-400',
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]'
      }
      : {
        bg: 'bg-purple-500/10 border-purple-500/20',
        header: 'bg-purple-500 text-white',
        text: 'text-purple-400',
        glow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]'
      };

    return (
      <div className="flex items-center gap-4 bg-[#0c1022] p-4 rounded-xl border border-slate-900 hover:border-slate-800 transition-all duration-300">
        {parts ? (
          <div className={`w-12 h-14 rounded-lg overflow-hidden flex flex-col items-center justify-between border border-slate-800 shrink-0 ${colorClasses.glow}`}>
            <div className={`w-full py-0.5 text-[8px] font-black text-center uppercase tracking-wider ${colorClasses.header}`}>
              {parts.month}
            </div>
            <div className="flex-1 flex items-center justify-center bg-[#070b19] w-full text-base font-black text-white font-mono leading-none">
              {parts.day}
            </div>
            <div className="w-full text-[8px] text-slate-500 text-center pb-0.5 bg-[#070b19] font-bold">
              {parts.year}
            </div>
          </div>
        ) : (
          <div className="w-12 h-14 rounded-lg bg-[#070b19] border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
            <span className="text-xs font-bold font-mono">N/A</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">
            {title}
          </span>
          <span className="text-sm font-black text-slate-100 mt-1 block truncate">
            {parts
              ? new Date(dateVal).toLocaleDateString(undefined, { dateStyle: 'long' })
              : "Not Scheduled"}
          </span>
          <span className="text-[9px] text-slate-500 font-bold block mt-0.5">
            {subtitle}
          </span>
        </div>
      </div>
    );
  };

  const renderRangeTrack = (title: string, value: any, low: any, high: any, isCurrency = true) => {
    const avgNum = value !== undefined && value !== null && value !== "Not Available" ? Number(value) : null;
    const lowNum = low !== undefined && low !== null && low !== "Not Available" ? Number(low) : null;
    const highNum = high !== undefined && high !== null && high !== "Not Available" ? Number(high) : null;

    const showBar = avgNum !== null && lowNum !== null && highNum !== null && (highNum - lowNum) > 0;

    let percentage = 50;
    if (showBar) {
      percentage = ((avgNum - lowNum) / (highNum - lowNum)) * 100;
      percentage = Math.max(0, Math.min(100, percentage));
    }

    return (
      <div className="bg-[#0c1022] p-5 rounded-2xl border border-slate-900 hover:border-slate-800 transition-all duration-300 flex flex-col justify-between h-full">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">{title}</span>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              {formatVal(value, isCurrency)}
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              Average
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {showBar ? (
            <>
              {/* Range track bar */}
              <div className="relative h-2 bg-slate-950 rounded-full border border-slate-900/60 overflow-visible">
                <div
                  className="absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r from-blue-500/20 to-emerald-500/30 border-r border-emerald-500/50"
                  style={{ width: `${percentage}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.6)] flex items-center justify-center transition-all duration-300 hover:scale-125 cursor-pointer"
                  style={{ left: `${percentage}%` }}
                  title={`Average: ${formatVal(value, isCurrency)}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
              <div className="flex justify-between text-[9px] font-bold text-slate-500 pt-1">
                <div className="flex flex-col items-start">
                  <span className="uppercase text-[8px] text-slate-650 tracking-wider">Low Target</span>
                  <span className="font-mono text-slate-350 mt-0.5">{formatVal(low, isCurrency)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="uppercase text-[8px] text-slate-650 tracking-wider">High Target</span>
                  <span className="font-mono text-slate-350 mt-0.5">{formatVal(high, isCurrency)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="pt-2 text-center text-[10px] text-slate-600 font-bold">
              Range forecasts not available
            </div>
          )}
        </div>
      </div>
    );
  };

  // Derive dynamic sentiment
  const sentiment = useMemo(() => {
    if (!data) return { score: 50, label: "Neutral", reasons: ["No coverage available"] };
    if (data.sentiment) {
      return {
        score: Number(data.sentiment.score ?? 50),
        label: String(data.sentiment.label ?? "Neutral"),
        reasons: Array.isArray(data.sentiment.reasons) ? data.sentiment.reasons : ["No coverage available"]
      };
    }
    let score = 50;
    const reasons: string[] = [];

    const recMean = Number(data.analysts?.recommendationMean);
    if (recMean > 0) {
      if (recMean <= 2) {
        score += 15;
        reasons.push("Strong analyst consensus buy rating");
      } else if (recMean >= 4) {
        score -= 15;
        reasons.push("Analyst consensus sell rating");
      }
    }

    const price = Number(data.statistics?.price);
    const dma50 = Number(data.statistics?.fiftyDayAverage);
    const dma200 = Number(data.statistics?.twoHundredDayAverage);

    if (price > 0 && dma200 > 0) {
      if (price > dma200) {
        score += 10;
        reasons.push("Trading above long-term 200 DMA");
      } else {
        score -= 10;
        reasons.push("Trading below long-term 200 DMA");
      }
    }

    if (price > 0 && dma50 > 0) {
      if (price > dma50) {
        score += 10;
        reasons.push("Trading above short-term 50 DMA");
      } else {
        score -= 10;
        reasons.push("Trading below short-term 50 DMA");
      }
    }

    const margin = Number(data.financialHealth?.profitMargin);
    if (margin > 0.15) {
      score += 10;
      reasons.push("Healthy profit margin above 15%");
    }

    const label = score >= 65 ? "Bullish" : score <= 35 ? "Bearish" : "Neutral";
    return { score: Math.min(Math.max(score, 0), 100), label, reasons };
  }, [data]);

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

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
          className="relative z-10 w-[95vw] h-[95vh] rounded-2xl bg-[#070913] border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-slate-100 flex flex-col overflow-hidden font-sans"
        >
          {/* ==================== HEADER ==================== */}
          <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 md:gap-6 items-center pl-4 pr-14 md:px-6 py-3 border-b border-slate-900 bg-[#0a0d1d]/60 backdrop-blur-md shrink-0">
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

            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.08, rotate: 90 }}
              whileTap={{ scale: 0.93 }}
              className="absolute top-3 right-3 md:relative md:top-auto md:right-auto p-2 md:p-2.5 rounded-xl bg-slate-900/90 hover:bg-rose-600/90 border border-slate-800/80 hover:border-rose-500/50 text-slate-400 hover:text-white transition-colors duration-200 flex items-center justify-center shadow-lg shadow-black/20 z-10"
              aria-label="Close modal"
            >
              <X size={20} className="stroke-[2.5] md:w-6 md:h-6" />
            </motion.button>
          </div>

          {/* ==================== WORKSPACE INTERFACE ==================== */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400 text-sm text-center">
                {error}
              </div>
            )}            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
              {/* Left Side: Chart Terminal Frame */}
              <div className="bg-[#090d1a]/80 border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl hover:border-slate-700/50 transition-all duration-300">
                {/* Live Core Chart Port */}
                <div className="flex-1 min-h-[400px] relative p-3 bg-gradient-to-b from-[#060812] to-[#0a0d24] rounded-t-2xl">
                  <CandlestickChart
                    symbol={symbol}
                    timeframe={timeframe}
                    onCompareChange={(compareSym) => setHasComparison(!!compareSym)}
                    onMetaLoaded={setMeta}
                  />
                </div>
              </div>

              {/* Right Side Sidebar Analytics */}
              <div className="space-y-4">
                {/* Tab Navigation Menu */}
                <div className="bg-gradient-to-br from-[#090d1a]/90 to-[#0c102b]/95 border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-3">
                    <span className="text-xs font-bold text-slate-350 tracking-wide">Navigation Control</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:flex lg:flex-col gap-1.5">
                    {availableTabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id as TabType);
                            setTimeout(() => {
                              tabContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }, 80);
                          }}
                          className={`px-2 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 ${isActive
                            ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-md shadow-blue-500/5 font-extrabold"
                            : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent"
                            }`}
                        >
                          <tab.icon size={13} className="shrink-0" />
                          <span className="text-[9px] sm:text-xs truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {activePosition && (() => {
              const currentPrice = meta?.price || data?.statistics?.price || activePosition.avgCost || 0;
              const isShort = activePosition.shares < 0;
              const qty = Math.abs(activePosition.shares);
              
              // Determine dynamic currency symbol based on asset properties
              const currencyCode = meta?.currency || data?.quote?.currency || (symbol.toUpperCase().endsWith('.NS') || symbol.toUpperCase().endsWith('.BO') ? 'INR' : 'USD');
              const curSym = currencyCode.toUpperCase() === 'INR' ? '₹' : '$';
              
              // Calculate Unrealized P&L
              const pnl = isShort 
                ? (activePosition.avgCost - currentPrice) * qty
                : (currentPrice - activePosition.avgCost) * qty;
                
              const pnlPercent = activePosition.avgCost > 0 
                ? (isShort
                    ? ((activePosition.avgCost - currentPrice) / activePosition.avgCost) * 100
                    : ((currentPrice - activePosition.avgCost) / activePosition.avgCost) * 100)
                : 0;
                
              const isProfit = pnl >= 0;
              const pnlColorClass = isProfit ? "text-emerald-400" : "text-rose-400";
              const pnlBgClass = isProfit ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20";
              const pnlSign = isProfit ? "+" : "";

              return (
                <div className="bg-gradient-to-br from-[#0e122b]/95 via-[#0b0e24]/98 to-[#090d1f]/99 border border-slate-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md hover:border-slate-700/50 transition-all duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_2.5fr_2.5fr_1.3fr] gap-6 items-center">
                    
                    {/* Section 1: Header */}
                    <div className="flex flex-col justify-center md:border-r border-slate-800/60 md:pr-4 h-full">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Active Position</span>
                      <div className="mt-2">
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded border tracking-wider inline-block ${isShort
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/25 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                          }`}>
                          {isShort ? 'SHORT' : 'LONG'}
                        </span>
                      </div>
                    </div>

                    {/* Section 2: Stats & P&L */}
                    <div className="grid grid-cols-3 gap-3 md:border-r border-slate-800/60 md:pr-4 h-full items-center">
                      <div className="bg-[#070914]/80 border border-slate-900/65 p-2 rounded-xl text-center">
                        <span className="text-[8px] text-slate-500 uppercase tracking-wider block mb-0.5 font-mono">Quantity</span>
                        <span className="text-xs font-black text-slate-100 font-mono">{qty.toLocaleString()}</span>
                      </div>
                      <div className="bg-[#070914]/80 border border-slate-900/65 p-2 rounded-xl text-center font-mono">
                        <span className="text-[8px] text-slate-500 uppercase tracking-wider block mb-0.5">Entry Price</span>
                        <span className="text-xs font-black text-slate-100">{curSym}{activePosition.avgCost.toFixed(2)}</span>
                      </div>
                      <div className={`border p-2 rounded-xl text-center font-mono transition-all ${pnlBgClass}`}>
                        <span className="text-[8px] text-slate-500 uppercase tracking-wider block mb-0.5">Unrealized P&L</span>
                        <span className={`text-[10px] font-black block leading-tight ${pnlColorClass}`}>
                          {pnlSign}{curSym}{pnl.toFixed(2)}<br />
                          <span className="text-[8px] opacity-90">{pnlSign}{pnlPercent.toFixed(2)}%</span>
                        </span>
                      </div>
                    </div>

                    {/* Section 3: SL / TP Form */}
                    <form onSubmit={handleSaveSlTp} className="flex flex-col sm:flex-row items-end gap-3 md:border-r border-slate-800/60 md:pr-4 h-full justify-center">
                      <div className="flex-1 w-full grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] text-slate-500 uppercase tracking-wider block mb-1 font-mono">Stop Loss</label>
                          <input
                            type="number"
                            step="any"
                            placeholder="None"
                            value={slInput}
                            onChange={e => setSlInput(e.target.value)}
                            className="w-full bg-[#05070e] border border-slate-850 px-2 py-1.5 text-xs rounded-xl outline-none text-slate-200 focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 font-mono transition-all placeholder-slate-600"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-slate-500 uppercase tracking-wider block mb-1 font-mono">Take Profit</label>
                          <input
                            type="number"
                            step="any"
                            placeholder="None"
                            value={tpInput}
                            onChange={e => setTpInput(e.target.value)}
                            className="w-full bg-[#05070e] border border-slate-850 px-2 py-1.5 text-xs rounded-xl outline-none text-slate-200 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 font-mono transition-all placeholder-slate-600"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="sm:w-auto w-full px-4 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-850 hover:from-slate-850 hover:to-slate-800 border border-slate-800 text-[8px] font-black uppercase tracking-wider text-slate-350 hover:text-white transition-all shadow-md shrink-0 h-[32px]"
                      >
                        Update
                      </button>
                    </form>

                    {/* Section 4: Close Button */}
                    <div className="flex justify-center w-full">
                      <button
                        onClick={handleClosePosition}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-650 to-rose-600 hover:from-rose-600 hover:to-rose-550 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-500/15 transition-all active:scale-98"
                      >
                        Close Position
                      </button>
                    </div>

                  </div>
                </div>
              );
            })()}

            {/* ==================== SUB-TAB METRIC ARRAYS ==================== */}
            <div ref={tabContentRef} className="pt-4 border-t border-slate-900">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-2xl" />
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {/* OVERVIEW TAB */}
                  {activeTab === "overview" && data && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="space-y-6"
                    >
                      <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 sm:p-6 shadow-md">
                        <h3 className="text-sm font-black uppercase text-slate-300 border-b border-slate-900 pb-3 mb-4">
                          Company Profile
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-450">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-black">Sector</span>
                            <span className="text-sm font-bold text-slate-350 mt-1 block truncate" title={data.profile.sector}>{data.profile.sector}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-black">Industry</span>
                            <span className="text-sm font-bold text-slate-350 mt-1 block truncate" title={data.profile.industry}>{data.profile.industry}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-black">Country</span>
                            <span className="text-sm font-bold text-slate-350 mt-1 block truncate" title={data.profile.country}>{data.profile.country}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-black">Employees</span>
                            <span className="text-sm font-bold text-slate-350 mt-1 block font-mono">{formatVal(data.profile.employees)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-black">CEO</span>
                            <span className="text-sm font-bold text-slate-350 mt-1 block truncate" title={data.profile.ceo}>{data.profile.ceo}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-black">Website</span>
                            {data.profile.website !== "Not Available" ? (
                              <a
                                href={data.profile.website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 mt-1 truncate max-w-full"
                              >
                                <span className="truncate">Visit Site</span>
                                <ExternalLink size={12} className="shrink-0" />
                              </a>
                            ) : (
                              <span className="text-sm font-bold text-slate-350 mt-1 block">N/A</span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mt-5 pt-5 border-t border-slate-900/60 text-justify">
                          {data.profile.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Statistics Grid */}
                        <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 sm:p-6 shadow-md space-y-4">
                          <h4 className="text-xs font-black uppercase text-slate-300 border-b border-slate-900 pb-2">
                            Key Ratios & Statistics
                          </h4>
                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-6 gap-y-2 text-xs font-mono">
                            <div className="flex justify-between py-1 border-b border-slate-900/40">
                              <span className="text-slate-500">Market Cap</span>
                              <span className="text-slate-300 font-bold">{formatVal(data.statistics.marketCap, true)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-900/40">
                              <span className="text-slate-500">EV</span>
                              <span className="text-slate-300 font-bold">{formatVal(data.statistics.enterpriseValue, true)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-900/40">
                              <span className="text-slate-500">Shares Out.</span>
                              <span className="text-slate-300 font-bold">{formatVal(data.statistics.sharesOutstanding)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-900/40">
                              <span className="text-slate-500">PE Ratio</span>
                              <span className="text-slate-300 font-bold">{formatVal(data.statistics.pe)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-900/40">
                              <span className="text-slate-500">Forward PE</span>
                              <span className="text-slate-300 font-bold">{formatVal(data.statistics.forwardPe)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-900/40">
                              <span className="text-slate-500">PEG Ratio</span>
                              <span className="text-slate-300 font-bold">{formatVal(data.statistics.peg)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-900/40">
                              <span className="text-slate-500">Beta</span>
                              <span className="text-slate-300 font-bold">{formatVal(data.statistics.beta)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-900/40">
                              <span className="text-slate-500">Div. Yield</span>
                              <span className="text-slate-300 font-bold">{formatVal(data.statistics.dividendYield * 100, false, true)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Financial Health Grid */}
                        <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 sm:p-6 shadow-md space-y-4">
                          <h4 className="text-xs font-black uppercase text-slate-300 border-b border-slate-900 pb-2">
                            Financial Condition
                          </h4>
                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-6 gap-y-2 text-xs font-mono">
                            <div className="flex justify-between py-1 border-b border-slate-900/40">
                              <span className="text-slate-500">Total Cash</span>
                              <span className="text-slate-300 font-bold">{formatVal(data.financialHealth.cash, true)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-900/40">
                              <span className="text-slate-500">Total Debt</span>
                              <span className="text-slate-300 font-bold">{formatVal(data.financialHealth.debt, true)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-900/40">
                              <span className="text-slate-500">Revenue</span>
                              <span className="text-slate-300 font-bold">{formatVal(data.financialHealth.revenue, true)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-900/40">
                              <span className="text-slate-500">EBITDA</span>
                              <span className="text-slate-300 font-bold">{formatVal(data.financialHealth.ebitda, true)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-900/40">
                              <span className="text-slate-500">Oper. Margin</span>
                              <span className="text-slate-300 font-bold">{formatVal(data.financialHealth.operatingMargin * 100, false, true)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-900/40">
                              <span className="text-slate-500">Prof. Margin</span>
                              <span className="text-slate-300 font-bold">{formatVal(data.financialHealth.profitMargin * 100, false, true)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}


                  {/* ANALYST TARGETS */}
                  {activeTab === "analysts" && data && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Panel 1: Rating Metrics & Consensus Gauge */}
                        <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
                          <h4 className="text-xs font-black uppercase text-slate-350 border-b border-slate-900 pb-2 mb-6 tracking-wider">
                            Analyst Recommendation Rating
                          </h4>

                          <div className="flex items-center justify-between mb-8">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Consensus Rating</span>
                              <span className="text-3xl font-black text-white mt-1 block capitalize font-sans">
                                {data.analysts.recommendationKey}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Mean Score (1-5)</span>
                              <span className="text-3xl font-black text-emerald-400 mt-1 block font-mono">
                                {typeof data.analysts.recommendationMean === 'number'
                                  ? data.analysts.recommendationMean.toFixed(2)
                                  : data.analysts.recommendationMean}
                              </span>
                            </div>
                          </div>

                          {/* Consensus Gauge Track */}
                          {typeof data.analysts.recommendationMean === 'number' && (
                            <div className="space-y-4 mb-6">
                              <div className="relative h-2 bg-gradient-to-r from-emerald-500 via-yellow-500 to-rose-500 rounded-full w-full">
                                {/* Glowing Pointer */}
                                <div
                                  className="absolute -top-1.5 -ml-2.5 w-5 h-5 bg-white border-2 border-slate-950 rounded-full shadow-lg shadow-white/30 flex items-center justify-center transition-all duration-500"
                                  style={{ left: `${Math.max(0, Math.min(100, ((data.analysts.recommendationMean - 1) / 4) * 100))}%` }}
                                >
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                </div>
                              </div>
                              <div className="flex justify-between text-[9px] text-slate-500 font-black uppercase tracking-wider">
                                <span>Strong Buy (1.0)</span>
                                <span>Hold (3.0)</span>
                                <span>Strong Sell (5.0)</span>
                              </div>
                            </div>
                          )}

                          <div className="bg-[#0c1022] p-4 rounded-xl border border-slate-900/60 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Coverage Pool</span>
                              <span className="text-slate-300 text-xs mt-0.5 block font-sans">Based on professional analyst evaluations</span>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-black text-white font-mono">{data.analysts.numberOfAnalysts}</span>
                              <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Analysts</span>
                            </div>
                          </div>
                        </div>

                        {/* Panel 2: Price Targets Spectrum */}
                        <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
                          <h4 className="text-xs font-black uppercase text-slate-350 border-b border-slate-900 pb-2 mb-6 tracking-wider">
                            Price Target Thresholds
                          </h4>

                          {/* Price Targets Grid */}
                          <div className="grid grid-cols-4 gap-2 mb-8">
                            <div className="bg-[#0c1022] p-3 rounded-xl border border-slate-800/40 text-center">
                              <span className="text-[9px] text-slate-500 uppercase font-black block">Low</span>
                              <span className="text-xs font-black font-mono text-white block mt-1">
                                {formatVal(data.analysts.targetLow, true)}
                              </span>
                            </div>
                            <div className="bg-[#0c1022] p-3 rounded-xl border border-slate-800/40 text-center">
                              <span className="text-[9px] text-slate-500 uppercase font-black block">Median</span>
                              <span className="text-xs font-black font-mono text-white block mt-1">
                                {formatVal(data.analysts.targetMedian, true)}
                              </span>
                            </div>
                            <div className="bg-[#0c1022] p-3 rounded-xl border border-slate-800/40 text-center">
                              <span className="text-[9px] text-slate-500 uppercase font-black block">Mean</span>
                              <span className="text-xs font-black font-mono text-white block mt-1">
                                {formatVal(data.analysts.targetMeanPrice, true)}
                              </span>
                            </div>
                            <div className="bg-[#0c1022] p-3 rounded-xl border border-slate-800/40 text-center">
                              <span className="text-[9px] text-slate-500 uppercase font-black block">High</span>
                              <span className="text-xs font-black font-mono text-white block mt-1">
                                {formatVal(data.analysts.targetHigh, true)}
                              </span>
                            </div>
                          </div>

                          {/* Price Target spectrum visualization */}
                          {(() => {
                            const low = Number(data.analysts.targetLow);
                            const high = Number(data.analysts.targetHigh);
                            const current = Number(data.statistics.price);
                            const median = Number(data.analysts.targetMedian);

                            if (isNaN(low) || isNaN(high) || isNaN(current) || low === 0 || high === 0) return null;

                            // Calculate percentage positions
                            const minVal = Math.min(low, current) * 0.95;
                            const maxVal = Math.max(high, current) * 1.05;
                            const range = maxVal - minVal;

                            const getPct = (val: number) => ((val - minVal) / range) * 100;

                            const currentPct = getPct(current);
                            const lowPct = getPct(low);
                            const medianPct = getPct(median);
                            const highPct = getPct(high);

                            return (
                              <div className="relative h-24 w-full mt-10">
                                {/* Track bar */}
                                <div className="absolute top-12 left-0 right-0 h-1.5 bg-slate-800 rounded-full" />

                                {/* Target range highlight track */}
                                <div
                                  className="absolute top-12 h-1.5 bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-emerald-500/40 rounded-full"
                                  style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
                                />

                                {/* Low Marker Anchor & Label */}
                                <div className="absolute top-0 flex flex-col items-center -translate-x-1/2" style={{ left: `${lowPct}%` }}>
                                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider">Low</span>
                                  <span className="text-[10px] font-black text-slate-300 font-mono mt-0.5">{formatVal(low, true)}</span>
                                  <div className="w-0.5 h-3.5 bg-blue-500/40 my-0.5" />
                                  <div className="w-3.5 h-3.5 bg-blue-500 border-2 border-slate-900 rounded-full shadow-md shadow-blue-500/30" />
                                </div>

                                {/* Median Marker Anchor & Label */}
                                <div className="absolute top-0 flex flex-col items-center -translate-x-1/2" style={{ left: `${medianPct}%` }}>
                                  <span className="text-[9px] font-black text-purple-400 uppercase tracking-wider">Median</span>
                                  <span className="text-[10px] font-black text-slate-300 font-mono mt-0.5">{formatVal(median, true)}</span>
                                  <div className="w-0.5 h-3.5 bg-purple-500/40 my-0.5" />
                                  <div className="w-3.5 h-3.5 bg-purple-500 border-2 border-slate-900 rounded-full shadow-md shadow-purple-500/30" />
                                </div>

                                {/* High Marker Anchor & Label */}
                                <div className="absolute top-0 flex flex-col items-center -translate-x-1/2" style={{ left: `${highPct}%` }}>
                                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">High</span>
                                  <span className="text-[10px] font-black text-slate-300 font-mono mt-0.5">{formatVal(high, true)}</span>
                                  <div className="w-0.5 h-3.5 bg-emerald-500/40 my-0.5" />
                                  <div className="w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-md shadow-emerald-500/30" />
                                </div>

                                {/* Current Price Pointer */}
                                <div className="absolute top-12 flex flex-col items-center -translate-x-1/2 z-10" style={{ left: `${currentPct}%` }}>
                                  <div className="w-2.5 h-4 bg-white border border-slate-950 shadow-md shadow-white/50 rounded-full" />
                                  <div className="w-0.5 h-3.5 bg-white/70 my-0.5" />
                                  <span className="text-[9px] font-black text-slate-900 bg-white px-1.5 py-0.5 rounded uppercase shadow-md leading-none tracking-wider mt-0.5">Current</span>
                                  <span className="text-[10px] font-black text-white font-mono mt-0.5">{formatVal(current, true)}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* MARKET SENTIMENT */}
                  {activeTab === "sentiment" && data && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md flex flex-col items-center justify-center">
                          <span className="text-xs font-black uppercase text-slate-500">Sentiment Score</span>
                          <span className="text-5xl font-black text-white mt-4 font-mono">{sentiment.score}%</span>
                          <span className={`text-sm font-black uppercase mt-3 tracking-wide ${sentiment.label === "Bullish" ? "text-emerald-400" : sentiment.label === "Bearish" ? "text-rose-400" : "text-amber-500"
                            }`}>
                            {sentiment.label}
                          </span>
                        </div>

                        <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md col-span-2 space-y-4">
                          <h4 className="text-xs font-black uppercase text-slate-300 border-b border-slate-900 pb-2">
                            Sentiment Analysis Parameters
                          </h4>
                          <ul className="space-y-3 text-xs text-slate-300">
                            {sentiment.reasons.map((reason: string, i: number) => (
                              <li key={i} className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {/* OWNERSHIP TAB */}
                  {activeTab === "ownership" && data && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 sm:p-6 shadow-md space-y-6"
                    >
                      <h3 className="text-xs font-black uppercase text-slate-350 border-b border-slate-900 pb-3 tracking-wider">
                        Share Ownership Breakdown
                      </h3>

                      {(() => {
                        const inst = Number(data.ownership.institutionOwnership) * 100 || 0;
                        const insider = Number(data.ownership.insiderOwnership) * 100 || 0;
                        const retail = Math.max(0, 100 - (inst + insider));
                        const instFloat = Number(data.ownership.institutionsFloatPercentHeld) * 100 || 0;
                        const instCount = data.ownership.institutionsCount || "N/A";

                        return (
                          <div className="space-y-6">
                            {/* Visual Progress Bar Chart */}
                            <div className="space-y-2.5">
                              <div className="flex justify-between items-center text-[10px] text-slate-450 uppercase font-black tracking-wider">
                                <span>Holding Distribution</span>
                                <span>Total: 100%</span>
                              </div>
                              <div className="w-full bg-slate-950 rounded-full h-3 flex overflow-hidden border border-slate-900">
                                {inst > 0 && (
                                  <div style={{ width: `${inst}%` }} className="bg-cyan-500 h-full transition-all duration-500" title={`Institutions: ${inst.toFixed(2)}%`} />
                                )}
                                {insider > 0 && (
                                  <div style={{ width: `${insider}%` }} className="bg-purple-500 h-full transition-all duration-500" title={`Insiders: ${insider.toFixed(2)}%`} />
                                )}
                                {retail > 0 && (
                                  <div style={{ width: `${retail}%` }} className="bg-emerald-500 h-full transition-all duration-500" title={`Retail/Public: ${retail.toFixed(2)}%`} />
                                )}
                              </div>

                              {/* Legend */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 bg-cyan-500 inline-block rounded-full" />
                                  Inst. ({inst.toFixed(1)}%)
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 bg-purple-500 inline-block rounded-full" />
                                  Insiders ({insider.toFixed(1)}%)
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 bg-emerald-500 inline-block rounded-full" />
                                  Retail ({retail.toFixed(1)}%)
                                </span>
                              </div>
                            </div>

                            {/* Detailed Statistics Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                              <div className="bg-[#0c1022] p-4 rounded-xl border border-slate-900 flex flex-col justify-between min-h-[90px]">
                                <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider leading-none">Institutions</span>
                                <span className="text-lg sm:text-2xl font-black text-white font-mono mt-2">{inst > 0 ? `${inst.toFixed(2)}%` : "N/A"}</span>
                              </div>

                              <div className="bg-[#0c1022] p-4 rounded-xl border border-slate-900 flex flex-col justify-between min-h-[90px]">
                                <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider leading-none">Insiders</span>
                                <span className="text-lg sm:text-2xl font-black text-white font-mono mt-2">{insider > 0 ? `${insider.toFixed(2)}%` : "N/A"}</span>
                              </div>

                              <div className="bg-[#0c1022] p-4 rounded-xl border border-slate-900 flex flex-col justify-between min-h-[90px]">
                                <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider leading-none">Retail/Public</span>
                                <span className="text-lg sm:text-2xl font-black text-white font-mono mt-2">{retail > 0 ? `${retail.toFixed(2)}%` : "N/A"}</span>
                              </div>

                              <div className="bg-[#0c1022] p-4 rounded-xl border border-slate-900 flex flex-col justify-between min-h-[90px]">
                                <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider leading-none">Float & Count</span>
                                <span className="text-[10px] font-black text-slate-350 font-mono mt-1.5 block leading-tight">
                                  Float: {instFloat > 0 ? `${instFloat.toFixed(1)}%` : "N/A"}<br />
                                  Holders: {instCount}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                  {/* CALENDAR EVENTS TAB */}
                  {activeTab === "events" && data && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md space-y-6"
                    >
                      <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase text-slate-350 tracking-wider">
                          Calendar Events & Estimates Forecasts
                        </h3>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                          Powered by Yahoo Finance
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Col 1: Date Timeline / Cards */}
                        <div className="lg:col-span-1 space-y-4">
                          <h4 className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Upcoming Schedule</h4>

                          <div className="space-y-4">
                            {renderCalendarCard(
                              data.events.earnings?.earningsDate?.[0],
                              "Upcoming Earnings Date",
                              "Projected release of financial results",
                              "blue"
                            )}
                            {renderCalendarCard(
                              data.events.exDividendDate,
                              "Ex-Dividend Date",
                              "Cut-off date for next dividend eligibility",
                              "purple"
                            )}
                          </div>
                        </div>

                        {/* Col 2: EPS Estimates */}
                        <div className="lg:col-span-1">
                          {renderRangeTrack(
                            "Earnings Per Share (EPS) Estimate",
                            data.events.earnings?.earningsAverage,
                            data.events.earnings?.earningsLow,
                            data.events.earnings?.earningsHigh,
                            true
                          )}
                        </div>

                        {/* Col 3: Revenue Estimates */}
                        <div className="lg:col-span-1">
                          {renderRangeTrack(
                            "Revenue Estimate Forecast",
                            data.events.earnings?.revenueAverage,
                            data.events.earnings?.revenueLow,
                            data.events.earnings?.revenueHigh,
                            true
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {/* TECHNICALS TAB */}
                  {activeTab === "technicals" && data && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="space-y-6"
                    >
                      {/* Consensus Verdict & Indicator counts */}
                      {(() => {
                        const price = meta?.price || Number(data.statistics?.price) || 0;
                        const rsi = Number(data.technicals?.rsi) || 50;
                        const macd = Number(data.technicals?.macd) || 0;
                        const macdSignal = Number(data.technicals?.macdSignal) || 0;

                        let buyCount = 0;
                        let sellCount = 0;
                        let neutralCount = 0;

                        // RSI
                        if (rsi < 30) buyCount++;
                        else if (rsi > 70) sellCount++;
                        else neutralCount++;

                        // MAs
                        const mas = [
                          { name: "20", ema: Number(data.technicals?.ema20), sma: Number(data.technicals?.sma20) },
                          { name: "50", ema: Number(data.technicals?.ema50), sma: Number(data.technicals?.sma50) },
                          { name: "100", ema: Number(data.technicals?.ema100), sma: Number(data.technicals?.sma100) },
                          { name: "200", ema: Number(data.technicals?.ema200), sma: Number(data.technicals?.sma200) }
                        ];

                        let maBuyCount = 0;
                        let maSellCount = 0;
                        mas.forEach(ma => {
                          if (ma.sma && price) {
                            if (price > ma.sma) {
                              buyCount++;
                              maBuyCount++;
                            } else {
                              sellCount++;
                              maSellCount++;
                            }
                          }
                          if (ma.ema && price) {
                            if (price > ma.ema) {
                              buyCount++;
                              maBuyCount++;
                            } else {
                              sellCount++;
                              maSellCount++;
                            }
                          }
                        });
                        const maVerdict = maBuyCount > maSellCount ? "Bullish" : maBuyCount < maSellCount ? "Bearish" : "Neutral";
                        const maVerdictBadge = maVerdict === "Bullish" ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" : maVerdict === "Bearish" ? "text-rose-400 border-rose-500/20 bg-rose-500/5" : "text-slate-400 border-slate-800 bg-slate-800/10";

                        // MACD
                        if (macd !== 0 || macdSignal !== 0) {
                          if (macd > macdSignal) buyCount++;
                          else sellCount++;
                        }

                        let high = Number(data.statistics?.dayHigh) || Number(data.statistics?.fiftyTwoWeekHigh) || price;
                        let low = Number(data.statistics?.dayLow) || Number(data.statistics?.fiftyTwoWeekLow) || price;
                        const close = Number(data.statistics?.previousClose) || price;

                        // Create realistic spreads (+-2%) if high/low values are identical/missing to prevent overlapping graphics
                        if (high === low && price > 0) {
                          high = price * 1.02;
                          low = price * 0.98;
                        }

                        const hasKeyLevels = price > 0 && high > 0 && low > 0;
                        let PP = 0, R1 = 0, S1 = 0, R2 = 0, S2 = 0;
                        let keyVerdict = "Neutral";
                        let verdictBadgeColor = "text-slate-400 bg-slate-500/10 border-slate-500/20";

                        if (hasKeyLevels) {
                          PP = (high + low + close) / 3;
                          R1 = (2 * PP) - low;
                          S1 = (2 * PP) - high;
                          R2 = PP + (high - low);
                          S2 = PP - (high - low);

                          if (price > R1) {
                            keyVerdict = "Bullish";
                            verdictBadgeColor = "text-emerald-450 bg-emerald-500/10 border-emerald-500/20";
                          } else if (price < S1) {
                            keyVerdict = "Bearish";
                            verdictBadgeColor = "text-rose-455 bg-rose-500/10 border-rose-500/20";
                          } else {
                            keyVerdict = "Neutral";
                            verdictBadgeColor = "text-amber-450 bg-amber-500/10 border-amber-500/20";
                          }
                        }

                        let summaryVerdict = "NEUTRAL";
                        let verdictColor = "bg-gradient-to-r from-slate-950 to-slate-900 border-slate-850 text-slate-350";
                        let verdictGlow = "shadow-slate-500/5";

                        if (buyCount > sellCount + 2) {
                          summaryVerdict = "STRONG BUY";
                          verdictColor = "bg-gradient-to-r from-emerald-950/20 via-[#070e17] to-[#040810] border-emerald-500/20 text-emerald-400";
                          verdictGlow = "shadow-emerald-500/5";
                        } else if (buyCount > sellCount) {
                          summaryVerdict = "BUY";
                          verdictColor = "bg-gradient-to-r from-cyan-950/20 via-[#070e17] to-[#040810] border-cyan-500/20 text-cyan-400";
                          verdictGlow = "shadow-cyan-500/5";
                        } else if (sellCount > buyCount + 2) {
                          summaryVerdict = "STRONG SELL";
                          verdictColor = "bg-gradient-to-r from-rose-955/20 via-[#070e17] to-[#040810] border-rose-500/20 text-rose-400";
                          verdictGlow = "shadow-rose-500/5";
                        } else if (sellCount > buyCount) {
                          summaryVerdict = "SELL";
                          verdictColor = "bg-gradient-to-r from-orange-955/20 via-[#070e17] to-[#040810] border-orange-500/20 text-orange-400";
                          verdictGlow = "shadow-orange-500/5";
                        }

                        const totalVerdict = buyCount + sellCount + neutralCount || 1;
                        const buyPct = (buyCount / totalVerdict) * 100;
                        const neutralPct = (neutralCount / totalVerdict) * 100;
                        const sellPct = (sellCount / totalVerdict) * 100;

                        return (
                          <div className="space-y-6">
                            {/* Summary Verdict Banner */}
                            <div className={`border rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-lg ${verdictColor} ${verdictGlow}`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">Consensus Verdict</span>
                                  <h4 className="text-xl sm:text-2xl font-black mt-1.5 tracking-tight font-sans">{summaryVerdict}</h4>
                                </div>
                                <div className="flex items-center gap-5 sm:gap-6 bg-black/30 px-4 py-2 rounded-xl border border-slate-900">
                                  <div className="text-center">
                                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Buy</span>
                                    <span className="text-base font-black text-emerald-450 font-mono block mt-0.5">{buyCount}</span>
                                  </div>
                                  <div className="text-center border-l border-slate-800 pl-5 sm:pl-6">
                                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Neutral</span>
                                    <span className="text-base font-black text-slate-400 font-mono block mt-0.5">{neutralCount}</span>
                                  </div>
                                  <div className="text-center border-l border-slate-800 pl-5 sm:pl-6">
                                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Sell</span>
                                    <span className="text-base font-black text-rose-400 font-mono block mt-0.5">{sellCount}</span>
                                  </div>
                                </div>
                              </div>
                              {/* 3-segment Consensus rating progress bar */}
                              <div className="space-y-1">
                                <div className="w-full bg-slate-950 rounded-full h-2 flex overflow-hidden border border-slate-900">
                                  {buyPct > 0 && <div style={{ width: `${buyPct}%` }} className="bg-emerald-500 h-full transition-all" title={`Buy: ${buyCount}`} />}
                                  {neutralPct > 0 && <div style={{ width: `${neutralPct}%` }} className="bg-slate-500 h-full transition-all" title={`Neutral: ${neutralCount}`} />}
                                  {sellPct > 0 && <div style={{ width: `${sellPct}%` }} className="bg-rose-500 h-full transition-all" title={`Sell: ${sellCount}`} />}
                                </div>
                                <div className="flex justify-between text-[8px] text-slate-550 font-bold uppercase tracking-wider">
                                  <span>Bullish ({buyPct.toFixed(0)}%)</span>
                                  <span>Neutral ({neutralPct.toFixed(0)}%)</span>
                                  <span>Bearish ({sellPct.toFixed(0)}%)</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Oscillators */}
                              <div className="col-span-1">
                                <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 sm:p-6 shadow-md space-y-6 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
                                  <h4 className="text-xs font-black uppercase text-slate-300 border-b border-slate-900 pb-3 tracking-wider">
                                    Oscillators
                                  </h4>

                                  {/* RSI (14) */}
                                  <div className="space-y-2.5">
                                    <div className="flex justify-between text-xs font-mono">
                                      <span className="text-slate-450 font-sans font-bold">RSI (14)</span>
                                      <span className={`font-black ${rsi < 30 ? "text-emerald-450" : rsi > 70 ? "text-rose-455" : "text-slate-200"}`}>
                                        {rsi.toFixed(2)} ({rsi < 30 ? "Oversold" : rsi > 70 ? "Overbought" : "Neutral"})
                                      </span>
                                    </div>
                                    {/* Upgraded slider bar track with indicator region highlights */}
                                    <div className="relative w-full bg-slate-950 rounded-full h-3 border border-slate-900/60 overflow-hidden">
                                      <div className="absolute left-0 w-[30%] h-full bg-emerald-500/10" />
                                      <div className="absolute left-[30%] w-[40%] h-full bg-slate-500/[0.03]" />
                                      <div className="absolute left-[70%] w-[30%] h-full bg-rose-500/10" />
                                      <div
                                        style={{ left: `${Math.min(97, Math.max(3, rsi))}%` }}
                                        className="absolute -translate-x-1/2 top-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee] border-2 border-[#090d1a] ring-2 ring-cyan-400/20"
                                      />
                                    </div>
                                    <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                                      <span>Oversold (30)</span>
                                      <span>Neutral</span>
                                      <span>Overbought (70)</span>
                                    </div>
                                  </div>

                                  {/* MACD */}
                                  <div className="space-y-3.5 pt-3.5 border-t border-slate-900/60">
                                    <div className="flex justify-between text-xs font-mono">
                                      <span className="text-slate-450 font-sans font-bold">MACD Crossover</span>
                                      <span className={`font-black uppercase text-[10px] px-1.5 py-0.5 rounded ${macd > macdSignal ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-455 border border-rose-500/20"}`}>
                                        {macd > macdSignal ? "Bullish" : "Bearish"}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-center font-mono">
                                      <div className="bg-[#070b16] p-3 rounded-xl border border-slate-900/80 flex flex-col justify-between min-h-[55px]">
                                        <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">Value</span>
                                        <span className="text-sm font-black text-slate-200 block mt-1">{macd.toFixed(3)}</span>
                                      </div>
                                      <div className="bg-[#070b16] p-3 rounded-xl border border-slate-900/80 flex flex-col justify-between min-h-[55px]">
                                        <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">Signal</span>
                                        <span className="text-sm font-black text-slate-200 block mt-1">{macdSignal.toFixed(3)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Moving Averages */}
                              <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 sm:p-6 shadow-md col-span-1 space-y-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
                                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                                  <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider">
                                    Moving Averages (MAs)
                                  </h4>
                                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase border ${maVerdictBadge}`}>
                                    {maVerdict}
                                  </span>
                                </div>

                                <div className="overflow-x-auto custom-scrollbar">
                                  <table className="w-full text-xs font-mono text-left">
                                    <thead>
                                      <tr className="border-b border-slate-900 text-[10px] text-slate-550 uppercase font-black tracking-wider">
                                        <th className="pb-3 font-sans">Period</th>
                                        <th className="pb-3 text-center">Simple (SMA)</th>
                                        <th className="pb-3 text-right">Exponential (EMA)</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-900/40">
                                      {mas.map((ma, i) => {
                                        const smaDiff = ma.sma ? ((price - ma.sma) / ma.sma) * 100 : 0;
                                        const emaDiff = ma.ema ? ((price - ma.ema) / ma.ema) * 100 : 0;

                                        return (
                                          <tr key={i} className="hover:bg-white/[0.01] transition-colors duration-150">
                                            <td className="py-3 font-sans font-black text-slate-400 whitespace-nowrap pr-3">
                                              MA {ma.name}
                                            </td>
                                            <td className="py-3 text-center whitespace-nowrap px-3">
                                              <div className="inline-flex flex-col items-center">
                                                <span className="text-slate-200 font-bold">{formatVal(ma.sma, true)}</span>
                                                {ma.sma > 0 && (
                                                  <span className={`inline-flex items-center gap-0.5 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md mt-1.5 leading-none ${price >= ma.sma ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-455"}`}>
                                                    {price >= ma.sma ? "▲ Above" : "▼ Below"} {Math.abs(smaDiff).toFixed(1)}%
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="py-3 text-right whitespace-nowrap pl-3">
                                              <div className="inline-flex flex-col items-end">
                                                <span className="text-slate-200 font-bold">{formatVal(ma.ema, true)}</span>
                                                {ma.ema > 0 && (
                                                  <span className={`inline-flex items-center gap-0.5 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md mt-1.5 leading-none ${price >= ma.ema ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-455"}`}>
                                                    {price >= ma.ema ? "▲ Above" : "▼ Below"} {Math.abs(emaDiff).toFixed(1)}%
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>

                            {/* Major Key Levels (Structural Levels) - Rendered full-width below oscillators and MAs */}
                            {hasKeyLevels ? (
                              <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-4 sm:p-6 shadow-md space-y-4 w-full">
                                <div className="flex justify-between items-center border-b border-slate-900/60 pb-3">
                                  <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider">
                                    Major Key Levels (Structural Levels)
                                  </h4>
                                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase border ${verdictBadgeColor}`}>
                                    {keyVerdict}
                                  </span>
                                </div>

                                {(() => {
                                  const minLevel = S2;
                                  const maxLevel = R2;
                                  const range = maxLevel - minLevel || 1;
                                  const getPct = (val: number) => {
                                    return Math.max(0, Math.min(100, ((val - minLevel) / range) * 100));
                                  };
                                  const pricePct = getPct(price);

                                  return (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center pt-2">
                                      {/* Price Ladder Visual Gauge */}
                                      <div className="col-span-1 flex flex-col items-center justify-center p-3 bg-[#0c1022]/40 rounded-xl border border-slate-900/60 h-full min-h-[250px] relative">
                                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider mb-2">Price Alignment</span>
                                        {/* Prominent Current Price Pulsing Badge */}
                                        <div className="mb-4 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2.5 py-1 rounded-lg text-xs font-black font-mono shadow-sm flex items-center gap-1.5 z-10">
                                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                          <span>Current: {formatVal(price, true)}</span>
                                        </div>
                                        <div className="relative w-full px-6 h-36 flex items-center justify-center">
                                          {/* Vertical track */}
                                          <div className="absolute top-0 bottom-0 w-[3px] rounded-full bg-gradient-to-t from-emerald-500/30 via-blue-500/20 to-rose-500/30 border border-slate-900/40" />

                                          {/* Ticks/Labels - Centered Layout */}
                                          {[
                                            { label: "R2", value: R2, color: "text-rose-400" },
                                            { label: "R1", value: R1, color: "text-rose-455" },
                                            { label: "PP", value: PP, color: "text-blue-400" },
                                            { label: "S1", value: S1, color: "text-emerald-455" },
                                            { label: "S2", value: S2, color: "text-emerald-400" },
                                          ].map((lvl, idx) => {
                                            const pct = getPct(lvl.value);
                                            return (
                                              <div
                                                key={idx}
                                                className="absolute left-0 right-0 h-0 flex items-center justify-center pointer-events-none"
                                                style={{ bottom: `${pct}%` }}
                                              >
                                                {/* Left label */}
                                                <span className={`absolute right-[56%] font-mono text-[9px] font-bold w-12 text-right ${lvl.color}`}>{lvl.label}</span>

                                                {/* Center crossing tick line */}
                                                <div className="w-3.5 h-[1px] bg-slate-700 z-10" />

                                                {/* Right price value */}
                                                <span className="absolute left-[56%] font-mono text-[9px] text-slate-500 w-16 text-left">{formatVal(lvl.value, true)}</span>
                                              </div>
                                            );
                                          })}

                                          {/* Current Price Pointer */}
                                          <div
                                            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-all duration-500 ease-out z-10 w-12"
                                            style={{ bottom: `${pricePct}%` }}
                                          >
                                            <div className="w-full h-[2px] bg-cyan-400 shadow-[0_0_8px_#22d3ee] relative flex items-center justify-center">
                                              <div className="absolute w-2 h-2 rounded-full bg-cyan-400 border border-slate-950 animate-ping" />
                                              <div className="absolute w-2 h-2 rounded-full bg-cyan-400 border border-slate-950" />
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Detailed Levels List */}
                                      <div className="col-span-2 space-y-2.5">
                                        {[
                                          { label: "R2 (Resistance 2)", value: R2, textClass: "text-rose-400", borderClass: "border-l-4 border-l-rose-500/70", bgClass: "border border-slate-900 bg-[#070b16]/80 hover:bg-[#0c1022]" },
                                          { label: "R1 (Resistance 1)", value: R1, textClass: "text-rose-455", borderClass: "border-l-4 border-l-rose-500/40", bgClass: "border border-slate-900 bg-[#070b16]/80 hover:bg-[#0c1022]" },
                                          { label: "PP (Pivot Point)", value: PP, textClass: "text-blue-400", borderClass: "border-l-4 border-l-blue-500", bgClass: "border border-blue-500/20 bg-blue-500/5 shadow-md shadow-blue-500/5" },
                                          { label: "S1 (Support 1)", value: S1, textClass: "text-emerald-455", borderClass: "border-l-4 border-l-emerald-500/40", bgClass: "border border-slate-900 bg-[#070b16]/80 hover:bg-[#0c1022]" },
                                          { label: "S2 (Support 2)", value: S2, textClass: "text-emerald-400", borderClass: "border-l-4 border-l-emerald-500/70", bgClass: "border border-slate-900 bg-[#070b16]/80 hover:bg-[#0c1022]" },
                                        ].map((lvl, idx) => {
                                          const isAbove = price >= lvl.value;
                                          return (
                                            <div
                                              key={idx}
                                              className={`flex justify-between items-center px-4 py-2.5 rounded-xl transition-all duration-250 ${lvl.bgClass} ${lvl.borderClass}`}
                                            >
                                              <span className={`font-sans font-bold text-xs ${lvl.textClass}`}>{lvl.label}</span>
                                              <div className="flex items-center gap-3 font-mono text-xs font-bold text-slate-200 whitespace-nowrap">
                                                <span>{formatVal(lvl.value, true)}</span>
                                                <span className={`text-[9px] font-sans font-bold px-2 py-0.5 rounded-full ${isAbove ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                                                  {isAbove ? "Above" : "Below"}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : (
                              <div className="bg-[#090d1a] border border-slate-900 rounded-2xl p-6 shadow-md text-center text-xs text-slate-500 py-8 w-full">
                                No price data available to compute pivot levels.
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}

                  {/* PERFORMANCE COMPARISON TAB */}
                  {activeTab === "performance" && meta && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="space-y-6"
                    >
                      {/* Performance Summary Banner */}
                      {(() => {
                        const p1y = meta.performance?.["1Y"];
                        const p5y = meta.performance?.["5Y"];
                        const pAll = meta.performance?.["All Time"];

                        const primaryGrowth = p5y ?? p1y ?? pAll ?? 0;

                        return (
                          <div className={`border rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md transition-all duration-300 ${primaryGrowth >= 0
                            ? "bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/20"
                            : "bg-gradient-to-r from-rose-500/10 via-red-500/5 to-transparent border-rose-500/20"
                            }`}>
                            <div className="space-y-1 w-full md:w-auto">
                              <span className="text-[10px] text-slate-505 uppercase font-black tracking-wider block">Return Analysis</span>
                              <h4 className="text-lg sm:text-xl font-black text-slate-200">
                                {primaryGrowth >= 20
                                  ? "Exceptional Long-Term Growth"
                                  : primaryGrowth >= 0
                                    ? "Steady Wealth Growth"
                                    : "Undergoing Asset Consolidation"}
                              </h4>
                              <p className="text-xs text-slate-400 max-w-xl leading-relaxed mt-1">
                                This asset has delivered a cumulative return of <span className={`font-bold ${primaryGrowth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{primaryGrowth >= 0 ? "+" : ""}{primaryGrowth.toFixed(1)}%</span> over the multi-year cycle.
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full md:w-auto shrink-0 font-mono">
                              <div className="bg-[#0c1022] p-4 rounded-xl border border-slate-900 text-center min-w-[100px]">
                                <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">1-Year Return</span>
                                <span className={`text-base font-black block mt-1 ${p1y >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                  {p1y != null ? `${p1y >= 0 ? "+" : ""}${p1y.toFixed(2)}%` : "N/A"}
                                </span>
                              </div>
                              <div className="bg-[#0c1022] p-4 rounded-xl border border-slate-900 text-center min-w-[100px]">
                                <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">5-Year Return</span>
                                <span className={`text-base font-black block mt-1 ${p5y >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                  {p5y != null ? `${p5y >= 0 ? "+" : ""}${p5y.toFixed(2)}%` : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Return Horizon Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                        {[
                          { label: "1D", key: "1D" },
                          { label: "1W", key: "1W" },
                          { label: "3M", key: "3M" },
                          { label: "6M", key: "6M" },
                          { label: "YTD", key: "YTD" },
                          { label: "1Y", key: "1Y" },
                          { label: "5Y", key: "5Y" },
                          { label: "All Time", key: "All Time" }
                        ].map((item, idx) => {
                          const val = meta.performance?.[item.key];
                          const hasVal = val !== undefined && val !== null;
                          const isPositive = val >= 0;

                          const borderClass = hasVal
                            ? isPositive
                              ? "border-l-4 border-l-emerald-500 border-slate-900/60 bg-emerald-500/[0.01] hover:border-emerald-500/30 hover:bg-emerald-500/[0.03]"
                              : "border-l-4 border-l-rose-500 border-slate-900/60 bg-rose-500/[0.01] hover:border-rose-500/30 hover:bg-rose-500/[0.03]"
                            : "border-l-4 border-l-slate-800 border-slate-900 bg-slate-950/20 text-slate-655";

                          return (
                            <div
                              key={idx}
                              className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between h-24 relative overflow-hidden group ${borderClass}`}
                            >
                              {/* Period label */}
                              <div className="flex justify-between items-center z-10">
                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">{item.label}</span>
                                {hasVal && (
                                  <span className={`text-[10px] font-bold ${isPositive ? "text-emerald-450" : "text-rose-455"}`}>
                                    {isPositive ? "▲" : "▼"}
                                  </span>
                                )}
                              </div>

                              {/* Visual bar/track of performance magnitude */}
                              {hasVal && (
                                <div className="w-full bg-slate-950/80 rounded-full h-1 my-1 overflow-hidden border border-slate-900">
                                  <div
                                    className={`h-full rounded-full ${isPositive ? "bg-emerald-500" : "bg-rose-500"}`}
                                    style={{ width: `${Math.min(100, Math.abs(val) * (item.key === "1D" || item.key === "1W" ? 10 : 1))}%` }}
                                  />
                                </div>
                              )}

                              {/* Value */}
                              <div className="z-10 mt-auto">
                                <span className={`text-sm font-mono font-black block tracking-tight ${hasVal ? (isPositive ? "text-emerald-400" : "text-rose-400") : "text-slate-600"
                                  }`}>
                                  {hasVal ? `${isPositive ? "+" : ""}${val.toFixed(2)}%` : "N/A"}
                                </span>
                              </div>

                              {/* Ambient Card Glow */}
                              {hasVal && (
                                <div className={`absolute -right-6 -bottom-6 w-16 h-16 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-all duration-300 ${isPositive ? "bg-emerald-400" : "bg-rose-400"
                                  }`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* NEWS TAB */}
                  {activeTab === "news" && data && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="w-full"
                    >
                      {(() => {
                        const newsItems = (data.news || []).slice(0, 10);

                        const renderNewsTable = (items: any[]) => (
                          <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-[#090d1a] shadow-md">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-slate-900 bg-[#0c1022]">
                                  <th className="px-4 py-3 text-[10px] uppercase font-black tracking-wider text-slate-500 w-20">Image</th>
                                  <th className="px-4 py-3 text-[10px] uppercase font-black tracking-wider text-slate-500">Headline</th>
                                  <th className="px-4 py-3 text-[10px] uppercase font-black tracking-wider text-slate-500 w-16 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-900/60">
                                {items.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-950/40 transition-colors">
                                    <td className="px-4 py-3 align-middle w-20">
                                      <img
                                        src={item.thumbnail?.resolutions?.[0]?.url || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=200&q=80"}
                                        alt="News thumbnail"
                                        className="w-16 h-11 rounded-lg object-cover border border-slate-900 shadow-sm shrink-0 bg-slate-950"
                                      />
                                    </td>
                                    <td className="px-4 py-3.5 align-middle space-y-1">
                                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider block">
                                        {item.publisher || "General News"}
                                      </span>
                                      <h4 className="text-xs font-bold text-slate-200 line-clamp-1 leading-snug">
                                        {item.title}
                                      </h4>
                                      <p className="text-[10px] text-slate-400 line-clamp-1 font-normal leading-relaxed">
                                        {item.summary || item.title}
                                      </p>
                                    </td>
                                    <td className="px-4 py-3.5 align-middle text-center">
                                      <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-all"
                                        title="Read Article"
                                      >
                                        <ExternalLink size={12} className="stroke-[2.5]" />
                                      </a>
                                    </td>
                                  </tr>
                                ))}
                                {items.length === 0 && (
                                  <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-xs text-slate-500">
                                      No articles found.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        );

                        return (
                          <div className="w-full space-y-3">
                            <h4 className="text-[10px] text-slate-500 uppercase font-black tracking-wider pl-1">Latest Coverage</h4>
                            {renderNewsTable(newsItems)}
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Custom Close Confirmation Popup */}
          <AnimatePresence>
            {showCloseConfirm && activePosition && (() => {
              const currentPrice = meta?.price || activePosition.avgCost;
              const isShort = activePosition.shares < 0;
              const isDomestic = symbol.endsWith('.NS') || symbol.endsWith('.BO');
              const totalShares = Math.abs(activePosition.shares);

              // Parse input quantity to close
              let sharesToClose = totalShares;
              if (closeType === "partial") {
                const parsed = parseFloat(closeQtyInput);
                sharesToClose = isNaN(parsed) ? 0 : parsed;
              }

              // Calculate estimated P&L
              const pnl = isShort
                ? (activePosition.avgCost - currentPrice) * sharesToClose
                : (currentPrice - activePosition.avgCost) * sharesToClose;

              const currencySymbol = isDomestic ? '₹' : '$';

              const isValid = sharesToClose > 0.0001 && sharesToClose <= totalShares;

              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[100000] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 10 }}
                    transition={{ type: "spring", duration: 0.4 }}
                    className="w-full max-w-md bg-[#0a0d1d] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-100"
                  >
                    <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                        Close Position - {symbol}
                      </h3>
                      <button
                        onClick={() => setShowCloseConfirm(false)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Position Details */}
                      <div className="grid grid-cols-2 gap-3 bg-[#070913] p-3 rounded-xl border border-slate-900 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Position Size</span>
                          <span className="text-slate-200 font-bold">{totalShares.toLocaleString()} shares</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Type</span>
                          <span className={`font-bold ${isShort ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {isShort ? 'SHORT' : 'LONG'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Entry Price</span>
                          <span className="text-slate-200 font-bold">{currencySymbol}{activePosition.avgCost.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Current Price</span>
                          <span className="text-slate-200 font-bold">{currencySymbol}{currentPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Close Type Selection */}
                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                          How would you like to close?
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCloseType("full");
                              setCloseQtyInput(String(totalShares));
                            }}
                            className={`py-2 rounded-xl text-xs font-bold transition-all border ${closeType === "full"
                              ? "bg-rose-600/10 text-rose-450 border-rose-500/30"
                              : "bg-slate-900/40 text-slate-400 border-slate-900/60 hover:bg-slate-900/80"
                              }`}
                          >
                            Close Full Position
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCloseType("partial");
                              setCloseQtyInput(String(Math.min(totalShares, Math.ceil(totalShares / 2))));
                            }}
                            className={`py-2 rounded-xl text-xs font-bold transition-all border ${closeType === "partial"
                              ? "bg-rose-600/10 text-rose-450 border-rose-500/30"
                              : "bg-slate-900/40 text-slate-400 border-slate-900/60 hover:bg-slate-900/80"
                              }`}
                          >
                            Partial Close
                          </button>
                        </div>
                      </div>

                      {/* Quantity Input for Partial Close */}
                      {closeType === "partial" && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider">
                              Quantity to Close
                            </label>
                            <button
                              type="button"
                              onClick={() => setCloseQtyInput(String(totalShares))}
                              className="text-[9px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider"
                            >
                              Use Max
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              value={closeQtyInput}
                              onChange={(e) => setCloseQtyInput(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-900 px-3 py-2 text-sm rounded-xl outline-none text-slate-200 focus:border-rose-500 font-mono"
                              placeholder="0.00"
                            />
                          </div>
                          {!isValid && closeQtyInput !== "" && (
                            <span className="text-[10px] text-rose-400 block font-medium">
                              Please enter a valid quantity between 0.0001 and {totalShares.toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Estimated P&L and Balance Impact */}
                      {isValid && (
                        <div className="p-3 rounded-xl bg-[#0d1226] border border-blue-900/20 text-xs space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Estimated Realized P&L:</span>
                            <span className={`font-mono font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {pnl >= 0 ? '+' : ''}{currencySymbol}{pnl.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Shares to Close:</span>
                            <span className="font-mono text-slate-250 font-bold">{sharesToClose.toLocaleString()} / {totalShares.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowCloseConfirm(false)}
                        className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-black uppercase tracking-wider text-slate-350 hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (isValid) {
                            executeClosePosition(sharesToClose);
                          }
                        }}
                        disabled={!isValid}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${isValid
                          ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/10 active:scale-95"
                          : "bg-slate-900 text-slate-650 cursor-not-allowed border border-slate-900/60"
                          }`}
                      >
                        Confirm Close
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}