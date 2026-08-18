import { useEffect, useState, useRef } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { getAIGlobalMarketPulse, type AIGlobalMarketPulseData } from "../../../services/marketService";

export default function AIBulletSummary() {
  const [data, setData] = useState<AIGlobalMarketPulseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPulse = async (forceRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (!forceRefresh) {
        const cached = sessionStorage.getItem("globalMarketPulse");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.sentiment && Array.isArray(parsed.insights)) {
            setData(parsed);
            setIsLoading(false);
            return;
          }
        }
      }

      const result = await getAIGlobalMarketPulse();
      if (!result || !result.sentiment || !Array.isArray(result.insights)) {
        throw new Error("Invalid schema received from AI Global Market Pulse");
      }

      sessionStorage.setItem("globalMarketPulse", JSON.stringify(result));
      setData(result);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("Global Market Pulse error:", err);

      const backup = sessionStorage.getItem("globalMarketPulse");
      if (backup) {
        setData(JSON.parse(backup));
      } else {
        setErrorMsg("Unable to generate Global Market Pulse.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPulse();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm animate-pulse space-y-4">
        <div className="flex items-center space-x-2">
          <span className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
          <span className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <p className="text-xs text-slate-400 font-medium">AI is generating today's Global Market Pulse...</p>
        <div className="space-y-2.5 pt-2">
          <div className="h-4 bg-slate-100 dark:bg-slate-800/40 rounded w-full" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800/40 rounded w-[90%]" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800/40 rounded w-[95%]" />
        </div>
      </div>
    );
  }

  if (errorMsg && !data) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-rose-200 dark:border-rose-950 shadow-sm flex flex-col items-center justify-center text-center gap-3">
        <AlertCircle className="h-8 w-8 text-rose-500" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{errorMsg}</p>
        <button
          onClick={() => fetchPulse(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all shadow active:scale-95"
        >
          <RotateCcw className="h-3 w-3" /> Retry Analysis
        </button>
      </div>
    );
  }

  const pulse = data!;

  const getSentimentColors = (sentiment: string) => {
    const s = (sentiment || "").toLowerCase();
    if (s === "bullish") {
      return "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400";
    }
    if (s === "bearish") {
      return "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-450";
    }
    return "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400";
  };

  return (
    <div className="bg-white/70 dark:bg-white/[0.02] p-5 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] shadow-sm relative overflow-hidden transition-all duration-300">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/60 dark:border-white/10">
        <div className="flex items-center space-x-2">
          <h3 className="text-base cool-heading">Global Market Pulse</h3>
        </div>

        {/* Sentiment Badge */}
        <div className="flex items-center gap-2.5">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getSentimentColors(pulse.sentiment)}`}>
            {pulse.sentiment}
          </span>
          <button
            onClick={() => fetchPulse(true)}
            className="p-2 rounded-xl bg-white/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm group"
            title="Refresh AI Pulse"
          >
            <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180" />
          </button>
        </div>
      </div>

      {/* Summary statement */}
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mb-5 leading-relaxed pl-3 border-l-2 border-indigo-500 italic">
        {pulse.summary}
      </p>

      {/* Bullet Insights */}
      <ul className="space-y-3">
        {pulse.insights.slice(0, 5).map((bullet, index) => (
          <li
            key={index}
            className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 transition-all duration-300"
          >
            <span className="shrink-0 flex items-center justify-center h-5 w-5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black mt-0.5">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="leading-relaxed font-medium">{bullet}</span>
          </li>
        ))}
      </ul>

      {/* Last Updated Timestamp */}
      <div className="mt-5 pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
        <span>Updated: {new Date(pulse.generatedAt).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}