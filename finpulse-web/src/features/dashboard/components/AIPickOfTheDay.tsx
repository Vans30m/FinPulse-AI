import { useEffect, useState, useRef } from "react";
import { Sparkles, AlertCircle, RotateCcw, ShieldAlert, Calendar } from "lucide-react";
import { getAIPickOfTheDay, type AIPickOfTheDayData } from "../../../services/marketService";

export default function AIPickOfTheDay() {
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

  const getRecColors = (rec: string) => {
    const r = (rec || "").toLowerCase();
    if (r.includes("strong buy")) return "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    if (r.includes("buy")) return "bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400 border-cyan-500/20";
    if (r.includes("hold")) return "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-450 border-yellow-500/20";
    if (r.includes("strong sell")) return "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-500/20";
    return "bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-500/20";
  };

  const getRiskColors = (risk: string) => {
    const r = (risk || "").toLowerCase();
    if (r === "low") return "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10";
    if (r === "high") return "text-red-500 dark:text-red-450 bg-red-500/10";
    return "text-amber-500 dark:text-amber-400 bg-amber-500/10";
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:scale-[1.005]">
      {/* Header controls */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              AI Pick of the Day
            </span>
            <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[9px] font-black rounded border border-indigo-200/20">
              SCORE {brief.aiScore}
            </span>
          </div>

          <a
            href={`#/stock/${brief.symbol}`}
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = `#/stock/${brief.symbol}`;
            }}
            className="group flex items-baseline gap-1.5 mt-1"
          >
            <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {brief.symbol}
            </h3>
            <span className="text-xs text-slate-400 truncate max-w-[130px] font-semibold">
              {brief.company}
            </span>
          </a>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${getRecColors(brief.recommendation)}`}>
            {brief.recommendation}
          </span>
          <button
            onClick={() => fetchPick(true)}
            className="p-2 rounded-xl border border-slate-200/50 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 hover:text-slate-700 dark:text-slate-350 dark:hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 group"
            title="Generate New Pick"
          >
            <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180" />
          </button>
        </div>
      </div>

      {/* Summary Description */}
      <p className="text-xs text-slate-700 dark:text-slate-200 mb-3 leading-relaxed font-semibold">
        {brief.summary}
      </p>

      {/* Confidence Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-1.5">
          <span>AI Target Confidence</span>
          <span className="text-indigo-500 dark:text-indigo-400">{brief.confidence}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${brief.confidence}%` }}
          />
        </div>
      </div>

      {/* Metrics Parameters Grid */}
      <div className="grid grid-cols-2 gap-2.5 border-t border-slate-100 dark:border-slate-850 pt-3 mb-3">
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-400">Target</span>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">${brief.target.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-400">Stop Loss</span>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">${brief.stopLoss.toFixed(2)}</p>
        </div>
      </div>

      {/* Risk and Holding period info */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Holding Period</span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{brief.holdingPeriod}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-slate-400" />
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Risk Profile</span>
            <span className={`text-[11px] px-2 py-0.5 rounded font-black uppercase leading-tight ${getRiskColors(brief.risk)}`}>
              {brief.risk}
            </span>
          </div>
        </div>
      </div>

      {/* Last Updated Timestamp */}
      <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-850 flex items-center justify-between text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
        <span>Updated: {new Date(brief.generatedAt).toLocaleDateString()}</span>
        <span className="flex items-center gap-1 text-indigo-500">
          <Sparkles className="h-2.5 w-2.5" />
          Daily Pick
        </span>
      </div>
    </div>
  );
}