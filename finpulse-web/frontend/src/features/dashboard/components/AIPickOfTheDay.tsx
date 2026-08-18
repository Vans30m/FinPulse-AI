import { useEffect, useState, useRef } from "react";
import { AlertCircle, RotateCcw, ShieldAlert, Calendar } from "lucide-react";
import { getAIPickOfTheDay, type AIPickOfTheDayData } from "../../../services/marketService";

export default function AIPickOfTheDay({ className = "" }: { className?: string }) {
  const [data, setData] = useState<AIPickOfTheDayData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPick = async (forceRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (!forceRefresh) {
        const cached = sessionStorage.getItem("aiPickOfTheDay");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.symbol && typeof parsed.aiScore === "number") {
            setData(parsed);
            setIsLoading(false);
            return;
          }
        }
      }

      const result = await getAIPickOfTheDay();
      if (!result || !result.symbol || typeof result.aiScore !== "number") {
        throw new Error("Invalid schema received from AI Pick of the Day service");
      }

      sessionStorage.setItem("aiPickOfTheDay", JSON.stringify(result));
      setData(result);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("AI Pick of the Day error:", err);

      const backup = sessionStorage.getItem("aiPickOfTheDay");
      if (backup) {
        setData(JSON.parse(backup));
      } else {
        setErrorMsg("Unable to generate AI Pick of the Day.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPick();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm animate-pulse space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded block" />
            <span className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded block" />
          </div>
          <span className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded block" />
        </div>
        <p className="text-xs text-slate-400 font-medium">AI is scanning thousands of global stocks...</p>
        <div className="h-10 bg-slate-100 dark:bg-slate-800/40 rounded w-full pt-4" />
      </div>
    );
  }

  if (errorMsg && !data) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-rose-200 dark:border-rose-950 shadow-sm flex flex-col items-center justify-center text-center gap-3">
        <AlertCircle className="h-8 w-8 text-rose-500" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{errorMsg}</p>
        <button
          onClick={() => fetchPick(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all shadow active:scale-95"
        >
          <RotateCcw className="h-3 w-3" /> Retry Scan
        </button>
      </div>
    );
  }

  const brief = data!;

  const getCurrencySymbol = (symbol: string) => {
    const sym = (symbol || '').toUpperCase();
    if (sym.endsWith('.NS') || sym.endsWith('.BO')) return '₹';
    if (sym.endsWith('.L')) return '£';
    if (sym.endsWith('.DE')) return '€';
    return '$';
  };

  const cSymbol = getCurrencySymbol(brief.symbol);

  const getRecColors = (rec: string) => {
    const r = (rec || "").toLowerCase();
    if (r.includes("strong buy")) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    if (r.includes("buy")) return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30";
    if (r.includes("hold")) return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    if (r.includes("strong sell")) return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
    return "bg-orange-500/10 text-orange-655 dark:text-orange-400 border-orange-500/30";
  };

  const getRiskColors = (risk: string) => {
    const r = (risk || "").toLowerCase();
    if (r === "low") return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25";
    if (r === "high") return "text-rose-650 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25";
  };

  return (
    <div className={`bg-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-5 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] shadow-sm transition-all duration-300 relative overflow-hidden group ${className}`}>
      {/* Main vertical layout container */}
      <div className="flex flex-col justify-between h-full gap-4 z-10 w-full">
        
        {/* Top Header Controls (Fear & Greed Style) */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm cool-heading uppercase">
                  AI Pick of the Day
                </h3>
                <span className="px-2 py-0.5 bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold rounded-lg">
                  SCORE {brief.aiScore}
                </span>
              </div>
              <p className="text-[10px] text-slate-550 dark:text-slate-450 mt-0.5">
                Daily equity selection based on quantitative analysis.
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchPick(true)}
            className="p-2 rounded-xl border border-slate-200/50 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-slate-450 hover:text-slate-700 dark:text-slate-350 dark:hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 group"
            title="Generate New Pick"
          >
            <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180" />
          </button>
        </div>
        
        {/* Stock Info Row (Below Header) */}
        <div className="flex items-center justify-between mt-1">
          <a
            href={`#/stock/${brief.symbol}`}
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = `#/stock/${brief.symbol}`;
            }}
            className="flex items-baseline gap-2"
          >
            <h3 className="text-2xl font-black text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors tracking-tight">
              {brief.symbol}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {brief.company}
            </span>
          </a>

          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${getRecColors(brief.recommendation)}`}>
            {brief.recommendation}
          </span>
        </div>

        {/* Description text */}
        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs leading-relaxed">
          {brief.summary}
        </p>

        {/* Bottom Section: 2-Column, 2-Row Grid Layout for Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
          {/* Box 1: Target Price & Stop Loss */}
          <div className="bg-slate-50/50 dark:bg-slate-950/30 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-900/60 flex justify-between items-center px-5">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Target Price</span>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-455 mt-0.5">{cSymbol}{brief.target.toFixed(2)}</p>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/10" />
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Stop Loss</span>
              <p className="text-lg font-black text-rose-600 dark:text-rose-455 mt-0.5">{cSymbol}{brief.stopLoss.toFixed(2)}</p>
            </div>
          </div>

          {/* Box 2: Risk & Holding Profile */}
          <div className="bg-slate-550/20 dark:bg-white/[0.02] p-3.5 rounded-2xl border border-slate-200/50 dark:border-white/[0.04] flex justify-between items-center px-5">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">Holding Period</span>
              <span className="text-xs font-bold text-slate-805 dark:text-slate-200 block mt-0.5">{brief.holdingPeriod}</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/10" />
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">Risk Profile</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase leading-tight mt-1 inline-block ${getRiskColors(brief.risk)}`}>
                {brief.risk}
              </span>
            </div>
          </div>

          {/* Box 3: Score & Upside Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50/50 dark:bg-slate-950/30 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-900/60 flex flex-col justify-center px-5">
              <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">AI Score</span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <p className="text-base font-black text-indigo-650 dark:text-indigo-400">{brief.aiScore}</p>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">/100</span>
              </div>
            </div>
            <div className="bg-slate-50/50 dark:bg-slate-950/30 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-900/60 flex flex-col justify-center px-5">
              <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">Potential Upside</span>
              <p className="text-base font-black text-emerald-600 dark:text-emerald-450 mt-0.5">
                +{(((brief.target - brief.stopLoss) / brief.stopLoss) * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Box 4: Confidence Bar (Full Width within column) */}
          <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-900/80 flex flex-col justify-center px-5">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              <span>AI Target Confidence</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{brief.confidence}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800/60 rounded-full h-2 relative overflow-visible">
              <div
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full relative shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                style={{ width: `${brief.confidence}%` }}>
              </div>
            </div>
          </div>
        </div>

        {/* Last Updated Timestamp (Fear & Greed Style) */}
        <div className="pt-3 mt-1 text-center text-[9px] font-extrabold uppercase tracking-widest text-slate-450 border-t border-slate-100 dark:border-slate-850">
          Updated: {new Date(brief.generatedAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}