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
            // Do not return early — continue fetching fresh data in background
          }
        }
      }

      const result = await getAIPickOfTheDay(forceRefresh);
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
      <div className="bg-white dark:bg-[#111111] p-5 rounded-lg border border-slate-200 dark:border-[#242424] shadow-sm animate-pulse space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="h-4 w-28 bg-slate-200 dark:bg-[#1C1C1C] rounded block" />
            <span className="h-6 w-16 bg-slate-200 dark:bg-[#1C1C1C] rounded block" />
          </div>
          <span className="h-6 w-20 bg-slate-200 dark:bg-[#1C1C1C] rounded block" />
        </div>
        <p className="text-xs text-slate-400 font-medium">AI is scanning global stock markets...</p>
        <div className="h-10 bg-slate-100 dark:bg-[#171717] rounded w-full" />
      </div>
    );
  }

  if (errorMsg && !data) {
    return (
      <div className="bg-white dark:bg-[#111111] p-5 rounded-lg border border-rose-200 dark:border-rose-950 shadow-sm flex flex-col items-center justify-center text-center gap-3">
        <AlertCircle className="h-8 w-8 text-rose-500" />
        <p className="text-xs text-slate-500 dark:text-neutral-400 font-semibold">{errorMsg}</p>
        <button
          onClick={() => fetchPick(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-md text-xs font-bold transition-colors"
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
    if (r.includes("strong buy") || r.includes("buy")) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
    if (r.includes("hold")) return "bg-amber-500/10 text-amber-500 border-amber-500/30";
    return "bg-rose-500/10 text-rose-500 border-rose-500/30";
  };

  const getRiskColors = (risk: string) => {
    const r = (risk || "").toLowerCase();
    if (r === "low") return "text-emerald-500 bg-emerald-500/10 border border-emerald-500/25";
    if (r === "high") return "text-rose-500 bg-rose-500/10 border border-rose-500/25";
    return "text-amber-500 bg-amber-500/10 border border-amber-500/25";
  };

  return (
    <div className={`bg-white dark:bg-[#111111] p-5 sm:p-6 rounded-lg border border-slate-200 dark:border-[#242424] transition-all duration-200 relative overflow-hidden ${className}`}>
      {/* Main vertical layout container */}
      <div className="flex flex-col justify-between h-full gap-4 z-10 w-full">
        
        {/* Top Header Controls */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#242424] pb-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold uppercase text-slate-900 dark:text-white">
                  AI Pick of the Day
                </h3>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-[#1C1C1C] text-slate-700 dark:text-neutral-300 text-[10px] font-mono font-bold rounded border border-slate-200 dark:border-[#242424]">
                  SCORE {brief.aiScore}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                Daily equity selection based on quantitative analysis.
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchPick(true)}
            className="p-1.5 rounded-md border border-slate-200 dark:border-[#242424] bg-slate-50 dark:bg-[#171717] text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
            title="Generate New Pick"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
        
        {/* Stock Info Row */}
        <div className="flex items-center justify-between mt-1">
          <a
            href={`#/stock/${brief.symbol}`}
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = `#/stock/${brief.symbol}`;
            }}
            className="flex items-baseline gap-2"
          >
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white hover:text-emerald-500 transition-colors tracking-tight">
              {brief.symbol}
            </h3>
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
              {brief.company}
            </span>
          </a>

          <span className={`text-[9px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${getRecColors(brief.recommendation)}`}>
            {brief.recommendation}
          </span>
        </div>

        {/* Description text */}
        <p className="text-slate-600 dark:text-neutral-300 font-normal text-xs leading-relaxed">
          {brief.summary}
        </p>

        {/* Bottom Section: Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
          {/* Box 1: Target Price & Stop Loss */}
          <div className="bg-slate-50 dark:bg-[#141414] p-3 rounded-md border border-slate-200 dark:border-[#242424] flex justify-between items-center px-4">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-neutral-500 tracking-wider">Target Price</span>
              <p className="text-base font-bold text-emerald-500 mt-0.5">{cSymbol}{brief.target.toFixed(2)}</p>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-[#242424]" />
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-neutral-500 tracking-wider">Stop Loss</span>
              <p className="text-base font-bold text-rose-500 mt-0.5">{cSymbol}{brief.stopLoss.toFixed(2)}</p>
            </div>
          </div>

          {/* Box 2: Risk & Holding Profile */}
          <div className="bg-slate-50 dark:bg-[#141414] p-3 rounded-md border border-slate-200 dark:border-[#242424] flex justify-between items-center px-4">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-neutral-500 block tracking-wider">Holding Period</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 block mt-0.5">{brief.holdingPeriod}</span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-[#242424]" />
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-neutral-500 block tracking-wider">Risk Profile</span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase leading-tight mt-0.5 inline-block ${getRiskColors(brief.risk)}`}>
                {brief.risk}
              </span>
            </div>
          </div>

          {/* Box 3: Score & Upside Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-[#141414] p-3 rounded-md border border-slate-200 dark:border-[#242424] flex flex-col justify-center px-4">
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-neutral-500 block tracking-wider">AI Score</span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <p className="text-base font-bold text-slate-900 dark:text-white">{brief.aiScore}</p>
                <span className="text-[9px] font-semibold text-slate-400 dark:text-neutral-500">/100</span>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-[#141414] p-3 rounded-md border border-slate-200 dark:border-[#242424] flex flex-col justify-center px-4">
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-neutral-500 block tracking-wider">Potential Upside</span>
              <p className="text-base font-bold text-emerald-500 mt-0.5">
                +{(((brief.target - brief.stopLoss) / brief.stopLoss) * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Box 4: Confidence Bar */}
          <div className="bg-slate-50 dark:bg-[#141414] p-3 rounded-md border border-slate-200 dark:border-[#242424] flex flex-col justify-center px-4">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5">
              <span>AI Target Confidence</span>
              <span className="text-slate-900 dark:text-white font-mono font-bold">{brief.confidence}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-[#202020] rounded-full h-1.5 relative overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${brief.confidence}%` }}>
              </div>
            </div>
          </div>
        </div>

        {/* Last Updated Timestamp */}
        <div className="pt-2 text-center text-[9px] font-mono uppercase tracking-wider text-slate-400 dark:text-neutral-500 border-t border-slate-100 dark:border-[#242424]">
          Updated: {new Date(brief.generatedAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}