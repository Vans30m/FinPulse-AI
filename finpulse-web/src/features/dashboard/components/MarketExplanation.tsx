import { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, Terminal, RotateCcw, Sparkles } from "lucide-react";
import { getAIMarketDrivers, type AIMarketDriversData } from "../../../services/marketService";

export default function MarketExplanation() {
  const [data, setData] = useState<AIMarketDriversData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchDrivers = async (forceRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (!forceRefresh) {
        const cached = sessionStorage.getItem("marketDrivers");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.question && Array.isArray(parsed.analysis)) {
            setData(parsed);
            setIsLoading(false);
            return;
          }
        }
      }

      const result = await getAIMarketDrivers();
      if (!result || !result.question || !Array.isArray(result.analysis)) {
        throw new Error("Invalid schema received from AI market-drivers service");
      }

      sessionStorage.setItem("marketDrivers", JSON.stringify(result));
      setData(result);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("AI Drivers error:", err);

      const backup = sessionStorage.getItem("marketDrivers");
      if (backup) {
        setData(JSON.parse(backup));
      } else {
        setErrorMsg("Unable to generate market analysis.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0B1220] animate-pulse space-y-6">
        <div className="flex items-center gap-3">
          <BrainAnimatedIcon />
          <div>
            <h2 className="text-xl font-bold text-slate-850 dark:text-white">AI is analyzing global market drivers...</h2>
            <div className="flex items-center gap-1 mt-1">
              <span className="h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
              <span className="text-xs text-slate-400 font-mono">Running neural network evaluation...</span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-8 bg-slate-100 dark:bg-slate-800/40 rounded w-full" />
          <div className="h-8 bg-slate-100 dark:bg-slate-800/40 rounded w-[95%]" />
          <div className="h-8 bg-slate-100 dark:bg-slate-800/40 rounded w-[90%]" />
        </div>
      </div>
    );
  }

  if (errorMsg && !data) {
    return (
      <div className="rounded-2xl border border-rose-200 dark:border-rose-950 bg-rose-50/20 dark:bg-rose-950/10 p-6 flex flex-col items-center justify-center text-center gap-4">
        <AlertTriangle className="h-10 w-10 text-rose-500" />
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Heuristic Pipeline Interrupted</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{errorMsg}</p>
        </div>
        <button
          onClick={() => fetchDrivers(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Retry Analysis
        </button>
      </div>
    );
  }

  const brief = data!;
  
  const isPositive = brief.bullishFactors.length >= brief.bearishFactors.length;

  const cardBgClass = isPositive
    ? "bg-gradient-to-br from-emerald-50/30 to-teal-50/10 dark:from-emerald-950/20 dark:to-teal-950/10 border-emerald-500/30 dark:border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.03)]"
    : "bg-gradient-to-br from-rose-50/30 to-red-50/10 dark:from-rose-950/20 dark:to-red-950/10 border-rose-500/30 dark:border-rose-500/20 shadow-[0_0_15px_rgba(239,68,68,0.03)]";
  
  const textClass = isPositive
    ? "text-emerald-900 dark:text-emerald-300"
    : "text-rose-900 dark:text-rose-300";

  const titleTextClass = isPositive
    ? "text-emerald-950 dark:text-white"
    : "text-rose-950 dark:text-white";

  const descriptionTextClass = isPositive
    ? "text-emerald-700/80 dark:text-slate-450"
    : "text-rose-700/80 dark:text-slate-450";

  const getImpactColors = (impact: string) => {
    const imp = (impact || "").toLowerCase();
    if (imp === "high") {
      return { border: "border-red-500/25", bg: "bg-red-500/5", text: "text-red-700 dark:text-red-400" };
    }
    if (imp === "medium") {
      return { border: "border-yellow-500/25", bg: "bg-yellow-500/5", text: "text-yellow-700 dark:text-yellow-400" };
    }
    return { border: "border-green-500/25", bg: "bg-green-500/5", text: "text-green-700 dark:text-green-400" };
  };

  const hasMacro = brief.macroEvent && brief.macroEvent.title && brief.macroEvent.title.toLowerCase() !== "none";
  const macroColors = hasMacro ? getImpactColors(brief.macroEvent.impact) : { border: "border-slate-200/50 dark:border-slate-800", bg: "bg-slate-50 dark:bg-white/[0.01]", text: "text-slate-500" };

  return (
    <div className={`rounded-2xl border p-6 transition-all duration-300 ${cardBgClass} ${textClass}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isPositive ? (
            <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400 animate-bounce-slow" />
          ) : (
            <TrendingDown className="h-6 w-6 text-rose-600 dark:text-rose-450 animate-bounce-slow" />
          )}
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${titleTextClass}`}>
              Where Are Markets Moving?
            </h2>
            <p className={`text-sm ${descriptionTextClass}`}>
              AI-generated drivers based on market sentiment
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchDrivers(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 text-xs font-bold transition-all w-fit self-end sm:self-auto"
          title="Force refresh analysis"
        >
          <RotateCcw className="h-3 w-3" />
          Refresh AI Analysis
        </button>
      </div>

      <div className="mt-5 p-4 rounded-xl bg-slate-900/10 dark:bg-black/30 border border-slate-200/40 dark:border-slate-800/40 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          <Terminal className="h-3.5 w-3.5 text-blue-500 dark:text-cyan-400" />
          <span>Command to AI</span>
        </div>
        <p className="text-sm font-semibold text-slate-850 dark:text-slate-200 italic mb-3">
          "{brief.question}"
        </p>

        <div className="space-y-2 border-t border-slate-200/40 dark:border-slate-850/50 pt-3">
          <ul className="space-y-2.5">
            {brief.analysis.map((item: string, index: number) => (
              <li
                key={index}
                className="text-sm flex items-start gap-2.5 text-slate-700 dark:text-slate-300 font-medium transition-all duration-300 animate-fadeIn"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <span className="text-cyan-500 dark:text-cyan-400 font-black mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 relative group">
        {hasMacro ? (
          <div className={`rounded-xl border ${macroColors.border} ${macroColors.bg} p-4 flex items-start gap-3 transition-colors cursor-help`}>
            <AlertTriangle className={`h-5 w-5 ${macroColors.text} shrink-0 mt-0.5`} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${macroColors.text}`}>Key Macro Event</h4>
                <span className={`px-2 py-0.5 text-[9px] font-black rounded border uppercase leading-tight ${macroColors.border} ${macroColors.text}`}>
                  {brief.macroEvent.impact} Impact
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-750 dark:text-slate-200 font-bold">{brief.macroEvent.title}</p>
            </div>

            <div className="absolute bottom-full left-4 mb-2 w-72 p-3.5 rounded-xl bg-slate-900/95 dark:bg-[#080d19]/95 text-white text-xs leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-2xl z-40 border border-slate-250/10 dark:border-slate-800 backdrop-blur-md">
              <div className="font-bold mb-1 text-amber-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Macro Catalyst Details
              </div>
              <p className="text-slate-300 font-medium">{brief.macroEvent.description}</p>
              <div className="absolute top-full left-8 border-[6px] border-transparent border-t-slate-900/95 dark:border-t-[#080d19]/95" />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/50 dark:border-slate-800/40 bg-slate-50/50 dark:bg-white/[0.01] p-4 text-xs font-medium text-slate-500">
            No major macro event today.
          </div>
        )}
      </div>

      <div className="mt-4 p-3.5 rounded-xl bg-slate-900/5 dark:bg-black/15 border border-slate-200/50 dark:border-slate-800/40">
        <p className="text-xs text-slate-750 dark:text-slate-300 leading-relaxed font-semibold">
          {brief.summary}
        </p>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        <span>Generated Time: {new Date(brief.generatedAt).toLocaleString()}</span>
        <span>FinPulse Market Insights</span>
      </div>
    </div>
  );
}

function BrainAnimatedIcon() {
  return (
    <div className="relative h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400">
      <BrainCircuitIcon className="h-6 w-6 animate-pulse" />
      <span className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping" />
    </div>
  );
}

function BrainCircuitIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M9 14h6" />
      <path d="M12 9v10" />
    </svg>
  );
}