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
    if (r.includes("strong buy")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    if (r.includes("buy")) return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    if (r.includes("hold")) return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    if (r.includes("strong sell")) return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    return "bg-orange-500/10 text-orange-400 border-orange-500/30";
  };

  const getRiskColors = (risk: string) => {
    const r = (risk || "").toLowerCase();
    if (r === "low") return "text-emerald-400 bg-emerald-500/10 border border-emerald-500/25";
    if (r === "high") return "text-rose-400 bg-rose-500/10 border border-rose-500/25";
    return "text-amber-400 bg-amber-500/10 border border-amber-500/25";
  };

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-7 rounded-3xl border border-slate-800/80 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:shadow-[0_20px_50px_-12px_rgba(99,102,241,0.15)] relative overflow-hidden group">
      {/* Decorative Radial Glows */}
      <div className="absolute -right-16 -top-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/15 transition-all duration-550" />
      <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header controls */}
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              AI Pick of the Day
            </span>
            <span className="px-2 py-0.5 bg-indigo-500/15 text-indigo-300 text-[10px] font-bold rounded-lg border border-indigo-500/20">
              SCORE {brief.aiScore}
            </span>
          </div>

          <a
            href={`#/stock/${brief.symbol}`}
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = `#/stock/${brief.symbol}`;
            }}
            className="group flex items-baseline gap-2 mt-2"
          >
            <h3 className="text-3xl font-black text-white group-hover:text-indigo-400 transition-colors tracking-tight">
              {brief.symbol}
            </h3>
            <span className="text-sm text-slate-400 truncate max-w-[150px] font-medium group-hover:text-slate-300 transition-colors">
              {brief.company}
            </span>
          </a>
        </div>

        <div className="flex items-center gap-2.5">
          <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-wider ${getRecColors(brief.recommendation)}`}>
            {brief.recommendation}
          </span>
          <button
            onClick={() => fetchPick(true)}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:border-slate-700 hover:bg-slate-900 group"
            title="Generate New Pick"
          >
            <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180" />
          </button>
        </div>
      </div>

      {/* Summary Description */}
      <p className="text-sm text-slate-350 mb-5 leading-relaxed font-normal relative z-10">
        {brief.summary}
      </p>

      {/* Confidence Bar */}
      <div className="mb-6 relative z-10 bg-slate-950/40 p-3 rounded-2xl border border-slate-900">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          <span>AI Target Confidence</span>
          <span className="text-indigo-400 font-extrabold">{brief.confidence}%</span>
        </div>
        <div className="w-full bg-slate-800/60 rounded-full h-2 relative overflow-visible">
          <div
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full relative shadow-[0_0_12px_rgba(99,102,241,0.5)]"
            style={{ width: `${brief.confidence}%` }}
          >
            {/* Glowing active point */}
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-500 shadow-[0_0_10px_#6366f1] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Metrics Parameters Grid */}
      <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-4 mb-4 relative z-10">
        <div className="bg-slate-950/30 p-3 rounded-2xl border border-slate-900/60">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target</span>
          <p className="text-xl font-black text-emerald-400 mt-1">${brief.target.toFixed(2)}</p>
        </div>
        <div className="bg-slate-950/30 p-3 rounded-2xl border border-slate-900/60">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stop Loss</span>
          <p className="text-xl font-black text-rose-400 mt-1">${brief.stopLoss.toFixed(2)}</p>
        </div>
      </div>

      {/* Risk and Holding period info */}
      <div className="grid grid-cols-2 gap-4 pt-2 relative z-10">
        <div className="flex items-center gap-3 bg-slate-950/30 p-3 rounded-2xl border border-slate-900/60">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/15">
            <Calendar className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Holding Period</span>
            <span className="text-xs font-bold text-slate-200">{brief.holdingPeriod}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-slate-950/30 p-3 rounded-2xl border border-slate-900/60">
          <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/15">
            <ShieldAlert className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Risk Profile</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black uppercase leading-tight mt-0.5 inline-block ${getRiskColors(brief.risk)}`}>
              {brief.risk}
            </span>
          </div>
        </div>
      </div>

      {/* Last Updated Timestamp */}
      <div className="mt-5 pt-4 border-t border-slate-900 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400 relative z-10">
        <span>Updated: {new Date(brief.generatedAt).toLocaleDateString()}</span>
        <span className="flex items-center gap-1 text-indigo-400">
          <Sparkles className="h-3 w-3 animate-pulse" />
          Daily Pick
        </span>
      </div>
    </div>
  );
}