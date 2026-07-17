import { useEffect, useState, useRef } from "react";
import { Sparkles, AlertCircle, RotateCcw } from "lucide-react";
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
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:scale-[1.005]">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Global Market Pulse</h3>
        </div>

        {/* Sentiment Badge */}
        <div className="flex items-center gap-2.5">
          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${getSentimentColors(pulse.sentiment)}`}>
            {pulse.sentiment}
          </span>
          <button
            onClick={() => fetchPulse(true)}
            className="p-2 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 hover:text-slate-700 dark:text-slate-350 dark:hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md group"
            title="Refresh AI Pulse"
          >
            <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180" />
          </button>
        </div>
      </div>

      {/* Summary statement */}
      <p className="text-xs text-slate-500 dark:text-slate-450 font-bold mb-4 italic leading-relaxed">
        "{pulse.summary}"
      </p>

      {/* Bullet Insights */}
      <ul className="space-y-3.5 border-t border-slate-100 dark:border-slate-850 pt-4">
        {pulse.insights.slice(0, 5).map((bullet, index) => (
          <li
            key={index}
            className="flex items-start space-x-3 text-sm text-slate-655 dark:text-slate-300 transition-all duration-300 animate-fadeIn"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <span className="text-indigo-500 dark:text-indigo-400 font-extrabold mt-0.5">•</span>
            <span className="leading-relaxed font-medium">{bullet}</span>
          </li>
        ))}
      </ul>

      {/* Last Updated Timestamp */}
      <div className="mt-5 pt-3 border-t border-slate-50 dark:border-slate-850 flex items-center justify-between text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
        <span>Updated: {new Date(pulse.generatedAt).toLocaleTimeString()}</span>
        <span className="flex items-center gap-1">
          <Sparkles className="h-2.5 w-2.5 text-indigo-500" />
          Live Pulse
        </span>
      </div>
    </div>
  );
}