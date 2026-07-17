import { useEffect, useState, useRef } from "react";
import { Brain, RotateCcw, AlertCircle, Sparkles, Terminal, TrendingDown, Bell } from "lucide-react";
import { getAIMarketBrief, type AIMarketBriefData } from "../../../services/marketService";
import API_BASE_URL from "../../../config/api";

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

  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchBrief();
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/news`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setAlerts(data.slice(0, 3)); // top 3 alerts
          }
        }
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      }
    };
    fetchAlerts();
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
  const strongSectors = sortedSectors.filter(s => s.score >= 60);
  const weakSectors = sortedSectors.filter(s => s.score < 60);

  // Helper to determine progress bar color
  const getProgressBarStyles = (score: number) => {
    if (score >= 80) return { bg: "bg-emerald-500 dark:bg-emerald-450", text: "text-emerald-600 dark:text-emerald-400" };
    if (score >= 60) return { bg: "bg-cyan-500 dark:bg-cyan-400", text: "text-cyan-600 dark:text-cyan-400" };
    if (score >= 40) return { bg: "bg-yellow-500 dark:bg-yellow-400", text: "text-yellow-600 dark:text-yellow-450" };
    return { bg: "bg-red-500 dark:bg-red-400", text: "text-red-500" };
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-gradient-to-br dark:from-night-900 dark:via-night-950 dark:to-night-900 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background ambient glows */}
      <div className="absolute -left-20 -top-20 z-0 h-64 w-64 rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 z-0 h-64 w-64 rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 dark:from-blue-500/20 dark:to-cyan-400/20 text-white dark:text-cyan-400 shadow-lg shadow-blue-500/20 dark:shadow-none">
            <Brain className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              AI Market Brief
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
              Real-time AI-powered global market intelligence
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchBrief(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Force refresh analysis"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Refresh AI
          </button>
        </div>
      </div>

      {/* HERO SECTION: Main Telemetry & High-Level Summary */}
      <div className="relative z-10 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Main Telemetry Indicators (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Market Mood Card */}
          <div className="flex-1 rounded-2xl border border-slate-200/50 dark:border-white/5 bg-slate-50/30 p-5 dark:bg-white/[0.01] shadow-sm flex items-center justify-between hover:border-slate-300 dark:hover:border-white/10 transition-all">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-550">Market Mood</div>
              <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {brief.marketMood}
              </div>
            </div>
            <div className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest border ${
              brief.marketMood === "Bullish"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                : brief.marketMood === "Bearish"
                ? "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-450 dark:border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                : "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-450 dark:border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
            }`}>
              {brief.marketMood === "Bullish" ? "📈 BUY" : brief.marketMood === "Bearish" ? "📉 SELL" : "⚖️ HOLD"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1">
            {/* Confidence Card */}
            <div className="rounded-2xl border border-slate-200/50 dark:border-white/5 bg-slate-50/30 p-5 dark:bg-white/[0.01] shadow-sm hover:border-slate-300 dark:hover:border-white/10 transition-all flex flex-col justify-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-550">Confidence</div>
              <div className="mt-1 text-2xl font-black text-blue-600 dark:text-cyan-400">
                {brief.confidence}%
              </div>
            </div>

            {/* Risk Card */}
            <div className="rounded-2xl border border-slate-200/50 dark:border-white/5 bg-slate-50/30 p-5 dark:bg-white/[0.01] shadow-sm hover:border-slate-300 dark:hover:border-white/10 transition-all flex flex-col justify-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-555">Risk Level</div>
              <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
                {brief.riskLevel}
              </div>
            </div>
          </div>
        </div>

        {/* High-Level AI Summary Panel (7 cols on lg) */}
        <div className="lg:col-span-7 rounded-3xl border border-blue-500/20 dark:border-white/10 bg-gradient-to-tr from-blue-500/[0.03] to-cyan-500/[0.03] dark:from-white/[0.01] dark:to-white/[0.02] p-6 shadow-md flex flex-col justify-center">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-600 dark:text-cyan-400">
            <Terminal className="h-4 w-4 shrink-0" />
            <span>Executive Analyst Summary</span>
          </div>
          <p className="mt-4 text-base sm:text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
            {brief.summary}
          </p>
        </div>
      </div>

      {/* MIDDLE SECTION: Detailed AI Insights Feed */}
      <div className="relative z-10 mt-8">
        <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-555 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-500 dark:text-cyan-400" />
          Detailed Market Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {brief.insights.map((item: string, index: number) => (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.03] p-5 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 dark:from-blue-500/20 dark:to-cyan-400/20 text-white dark:text-cyan-400 text-xs font-black shadow-md shadow-blue-500/10 dark:shadow-none">
                {index + 1}
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM SECTION: 2-Column Layout for Momentum & Threats */}
      <div className="relative z-10 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Column 1: Strong momentum sectors */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-555 flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-emerald-500" />
              Sectors: High Momentum
            </h3>
            <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">📈 BULLISH</span>
          </div>

          <div className="space-y-4">
            {strongSectors.map((sector, index) => {
              const styles = getProgressBarStyles(sector.score);
              return (
                <div
                  key={index}
                  className="relative group rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-white/[0.03] dark:bg-white/[0.01] hover:border-slate-300 dark:hover:border-white/10 transition-all cursor-help"
                >
                  <div className="mb-2 flex justify-between items-center">
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                      {sector.sector}
                    </span>
                    <span className={`text-sm font-extrabold ${styles.text}`}>
                      {sector.score}%
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-slate-200/50 dark:bg-white/5 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${styles.bg} shadow-[0_0_10px_rgba(34,211,238,0.2)]`}
                      style={{ width: `${sector.score}%` }}
                    />
                  </div>

                  {/* Custom Tooltip on Hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-2xl bg-slate-900/95 dark:bg-[#080d19]/95 text-white text-xs leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-2xl z-40 border border-slate-200/10 dark:border-slate-800 backdrop-blur-md">
                    <div className="font-bold mb-1 text-cyan-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 animate-spin" />
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

        {/* Column 2: Moderate/low momentum sectors & Threats */}
        <div className="space-y-6">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-555 flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-amber-500" />
                Sectors: Mod/Low Momentum
              </h3>
              <span className="text-[10px] font-black tracking-widest text-amber-500 uppercase">⚖️ NEUTRAL</span>
            </div>

            <div className="space-y-4">
              {weakSectors.map((sector, index) => {
                const styles = getProgressBarStyles(sector.score);
                return (
                  <div
                    key={index}
                    className="relative group rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-white/[0.03] dark:bg-white/[0.01] hover:border-slate-300 dark:hover:border-white/10 transition-all cursor-help"
                  >
                    <div className="mb-2 flex justify-between items-center">
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                        {sector.sector}
                      </span>
                      <span className={`text-sm font-extrabold ${styles.text}`}>
                        {sector.score}%
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-200/50 dark:bg-white/5 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${styles.bg} shadow-[0_0_10px_rgba(34,211,238,0.2)]`}
                        style={{ width: `${sector.score}%` }}
                      />
                    </div>

                    {/* Custom Tooltip on Hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-2xl bg-slate-900/95 dark:bg-[#080d19]/95 text-white text-xs leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-2xl z-40 border border-slate-200/10 dark:border-slate-800 backdrop-blur-md">
                      <div className="font-bold mb-1 text-cyan-400 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 animate-spin" />
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

          {/* Active Market Threats (Placed under Weak Sectors to cover the gap) */}
          <div className="pt-2">
            <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-555 flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              Active Market Threats
            </h3>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-5 shadow-sm">
              <div className="font-black text-amber-850 dark:text-amber-400 flex items-center gap-2 text-xs uppercase tracking-wider">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>Critical Threat Focus</span>
              </div>
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-350 font-semibold leading-relaxed">
                {brief.todayRisk}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Meta / Generated Time */}
      <div className="relative z-10 mt-8 pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-550">
        <span>Generated: {new Date(brief.generatedAt).toLocaleString()}</span>
        <span>FinPulse AI Engine v1.2</span>
      </div>
    </div>
  );
}