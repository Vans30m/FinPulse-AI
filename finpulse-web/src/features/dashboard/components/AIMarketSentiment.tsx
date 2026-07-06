import { useEffect, useState, useRef } from "react";
import { Brain, RotateCcw, AlertCircle, Sparkles, Terminal } from "lucide-react";
import { getAIMarketBrief, type AIMarketBriefData } from "../../../services/marketService";

export default function AIMarketSentiment() {
  const [data, setData] = useState<AIMarketBriefData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchBrief = async (forceRefresh = false) => {
    // Abort active concurrent request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Check cache unless force refreshing
      if (!forceRefresh) {
        const cached = sessionStorage.getItem("marketBrief");
        if (cached) {
          const parsed = JSON.parse(cached);
          // Validate structure
          if (parsed && parsed.marketMood && Array.isArray(parsed.insights)) {
            setData(parsed);
            setIsLoading(false);
            return;
          }
        }
      }

      // 2. Fetch from backend
      const result = await getAIMarketBrief();
      
      // Validate schema
      if (!result || !result.marketMood || !Array.isArray(result.sectorStrength)) {
        throw new Error("Invalid schema received from AI service");
      }

      // Store in session cache
      sessionStorage.setItem("marketBrief", JSON.stringify(result));
      setData(result);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("AI Brief fetch error:", err);
      
      // Use cached backup if available on failure
      const backup = sessionStorage.getItem("marketBrief");
      if (backup) {
        setData(JSON.parse(backup));
      } else {
        setErrorMsg("Unable to generate AI Market Brief.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrief();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0B1220] animate-pulse space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-7 w-7 text-cyan-600 dark:text-cyan-450 animate-bounce" />
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">AI is analyzing global markets...</h2>
              <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded mt-1" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/40" />
          <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/40" />
          <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/40" />
        </div>
        <div className="space-y-2.5">
          <div className="h-8 rounded bg-slate-100 dark:bg-slate-800/40" />
          <div className="h-8 rounded bg-slate-100 dark:bg-slate-800/40" />
        </div>
      </div>
    );
  }

  if (errorMsg && !data) {
    return (
      <div className="rounded-2xl border border-rose-200 dark:border-rose-950 bg-rose-50/20 dark:bg-rose-950/10 p-6 flex flex-col items-center justify-center text-center gap-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Brief Unavailable</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{errorMsg}</p>
        </div>
        <button
          onClick={() => fetchBrief(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Retry Analysis
        </button>
      </div>
    );
  }

  const brief = data!;
  
  // Sort sectors by score descending
  const sortedSectors = [...brief.sectorStrength].sort((a, b) => b.score - a.score);

  // Helper to determine progress bar color
  const getProgressBarStyles = (score: number) => {
    if (score >= 80) return { bg: "bg-emerald-500 dark:bg-emerald-450", text: "text-emerald-600 dark:text-emerald-400" };
    if (score >= 60) return { bg: "bg-cyan-500 dark:bg-cyan-400", text: "text-cyan-600 dark:text-cyan-400" };
    if (score >= 40) return { bg: "bg-yellow-500 dark:bg-yellow-400", text: "text-yellow-600 dark:text-yellow-450" };
    return { bg: "bg-red-500 dark:bg-red-400", text: "text-red-500" };
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0B1220] shadow-sm relative overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Brain className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI Market Brief</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              AI-powered market intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <button
            onClick={() => fetchBrief(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 text-xs font-bold transition-all"
            title="Force refresh analysis"
          >
            <RotateCcw className="h-3 w-3" />
            Refresh AI Analysis
          </button>
          
          <div
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              brief.marketMood === "Bullish"
                ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                : brief.marketMood === "Bearish"
                ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
            }`}
          >
            {brief.marketMood}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800/40">
          <div className="text-xs uppercase text-slate-500 dark:text-slate-400">Market Mood</div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{brief.marketMood}</div>
        </div>

        <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800/40">
          <div className="text-xs uppercase text-slate-500 dark:text-slate-400">Confidence</div>
          <div className="mt-2 text-xl font-bold text-cyan-600 dark:text-cyan-400">
            {brief.confidence}%
          </div>
        </div>

        <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800/40">
          <div className="text-xs uppercase text-slate-500 dark:text-slate-400">Risk Level</div>
          <div className="mt-2 text-xl font-bold text-amber-600 dark:text-amber-400">
            {brief.riskLevel}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
          AI Insights
        </h3>
        <div className="space-y-3">
          {brief.insights.map((item: string, index: number) => (
            <div
              key={index}
              className="rounded-lg bg-slate-50 p-3 text-slate-700 dark:bg-slate-800/30 dark:text-slate-300 border border-slate-100 dark:border-white/[0.02]"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Sector Strength */}
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Sector Strength
          </h3>
          <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">LIVE ANALYSIS</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {sortedSectors.map((sector, index) => {
            const styles = getProgressBarStyles(sector.score);
            return (
              <div
                key={index}
                className="relative group rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/20 hover:border-slate-350 dark:hover:border-slate-700 transition-all cursor-help"
              >
                <div className="mb-2 flex justify-between">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {sector.sector}
                  </span>
                  <span className={`font-semibold ${styles.text}`}>
                    {sector.score}%
                  </span>
                </div>

                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${styles.bg}`}
                    style={{ width: `${sector.score}%` }}
                  />
                </div>

                {/* Custom Tooltip on Hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl bg-slate-900/95 dark:bg-[#080d19]/95 text-white text-xs leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-2xl z-40 border border-slate-200/10 dark:border-slate-800 backdrop-blur-md">
                  <div className="font-bold mb-1 text-cyan-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {sector.sector} Analysis
                  </div>
                  <p className="text-slate-300 font-medium">{sector.reason}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900/95 dark:border-t-[#080d19]/95" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Risk */}
      <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="font-semibold text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
          <AlertCircle className="h-4 w-4" />
          <span>Today's Risk</span>
        </div>
        <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">{brief.todayRisk}</div>
      </div>

      {/* Live Analysis / Summary Box */}
      <div className="mt-6 p-4 rounded-xl bg-slate-900/5 dark:bg-black/20 border border-slate-200/50 dark:border-slate-800/40">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          <Terminal className="h-3.5 w-3.5 text-cyan-500" />
          <span>AI Analyst Market Summary</span>
        </div>
        <p className="mt-2 text-sm text-slate-655 dark:text-slate-300 leading-relaxed font-medium">
          {brief.summary}
        </p>
      </div>

      {/* Footer Meta / Generated Time */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        <span>Generated Time: {new Date(brief.generatedAt).toLocaleString()}</span>
        <span>FinPulse AI Engine</span>
      </div>
    </div>
  );
}