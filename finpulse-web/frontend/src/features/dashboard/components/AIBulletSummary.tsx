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
            // Do not return early — continue fetching fresh Groq data in background
          }
        }
      }

      const result = await getAIGlobalMarketPulse(forceRefresh);
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
      <div className="bg-white dark:bg-[#111111] p-5 rounded-lg border border-slate-200 dark:border-[#242424] shadow-sm animate-pulse space-y-4">
        <div className="flex items-center space-x-2">
          <span className="h-5 w-16 bg-slate-200 dark:bg-[#1C1C1C] rounded" />
          <span className="h-5 w-32 bg-slate-200 dark:bg-[#1C1C1C] rounded" />
        </div>
        <p className="text-xs text-slate-400 font-medium">AI is generating today's Global Market Pulse...</p>
        <div className="space-y-2.5 pt-2">
          <div className="h-4 bg-slate-100 dark:bg-[#171717] rounded w-full" />
          <div className="h-4 bg-slate-100 dark:bg-[#171717] rounded w-[90%]" />
          <div className="h-4 bg-slate-100 dark:bg-[#171717] rounded w-[95%]" />
        </div>
      </div>
    );
  }

  if (errorMsg && !data) {
    return (
      <div className="bg-white dark:bg-[#111111] p-5 rounded-lg border border-rose-200 dark:border-rose-950 shadow-sm flex flex-col items-center justify-center text-center gap-3">
        <AlertCircle className="h-8 w-8 text-rose-500" />
        <p className="text-xs text-slate-500 dark:text-neutral-400 font-semibold">{errorMsg}</p>
        <button
          onClick={() => fetchPulse(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-md text-xs font-bold transition-colors"
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
      return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
    }
    if (s === "bearish") {
      return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
    }
    return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
  };

  return (
    <div className="bg-white dark:bg-[#111111] p-5 sm:p-6 rounded-lg border border-slate-200 dark:border-[#242424] shadow-sm relative overflow-hidden transition-all duration-200">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200 dark:border-[#242424]">
        <div className="flex items-center space-x-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Global Market Pulse</h3>
        </div>

        {/* Sentiment Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getSentimentColors(pulse.sentiment)}`}>
            {pulse.sentiment}
          </span>
          <button
            onClick={() => fetchPulse(true)}
            className="p-1.5 rounded-md bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#242424] text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
            title="Refresh AI Pulse"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Summary statement */}
      <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 font-normal mb-4 leading-relaxed pl-3 border-l-2 border-emerald-500 italic">
        {pulse.summary}
      </p>

      {/* Bullet Insights */}
      <ul className="space-y-2.5">
        {pulse.insights.slice(0, 5).map((bullet, index) => (
          <li
            key={index}
            className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-neutral-300 transition-colors"
          >
            <span className="shrink-0 flex items-center justify-center h-5 w-5 rounded bg-slate-100 dark:bg-[#1C1C1C] text-slate-800 dark:text-white text-[10px] font-mono font-bold mt-0.5 border border-slate-200 dark:border-[#242424]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="leading-relaxed font-normal">{bullet}</span>
          </li>
        ))}
      </ul>

      {/* Last Updated Timestamp */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#242424] flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-slate-400 dark:text-neutral-500">
        <span>Updated: {new Date(pulse.generatedAt).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}