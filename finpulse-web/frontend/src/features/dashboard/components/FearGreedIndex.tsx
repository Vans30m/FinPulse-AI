import { useEffect, useState, useRef } from "react";
import { AlertCircle, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";
import { getAIFearGreed, type AIFearGreedData } from "../../../services/marketService";

export default function FearGreedIndex({ className = "" }: { className?: string }) {
  const [data, setData] = useState<AIFearGreedData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [animatedScore, setAnimatedScore] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchIndex = async (forceRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (!forceRefresh) {
        const cached = sessionStorage.getItem("fearGreedIndex");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed.score === "number" && parsed.sentiment) {
            setData(parsed);
            animateValue(parsed.score);
            setIsLoading(false);
            return;
          }
        }
      }

      const result = await getAIFearGreed();
      if (!result || typeof result.score !== "number" || !result.sentiment) {
        throw new Error("Invalid schema received from AI Fear & Greed service");
      }

      sessionStorage.setItem("fearGreedIndex", JSON.stringify(result));
      setData(result);
      animateValue(result.score);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("Fear Greed Index error:", err);

      const backup = sessionStorage.getItem("fearGreedIndex");
      if (backup) {
        const parsed = JSON.parse(backup);
        setData(parsed);
        animateValue(parsed.score);
      } else {
        setErrorMsg("Unable to calculate Fear & Greed Index.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const animateValue = (target: number) => {
    const duration = 1200;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.floor(easeOutCubic * target));

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    requestAnimationFrame(update);
  };

  useEffect(() => {
    fetchIndex();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Fear & Greed Index</h3>
            <p className="text-xs text-slate-505 mt-0.5">Calculating Global Fear & Greed Index...</p>
          </div>
          <span className="h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
        </div>
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-56 h-28 border-8 border-slate-100 dark:border-slate-800 border-b-0 rounded-t-full animate-spin" style={{ animationDuration: '3s' }} />
          <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded mt-4 animate-pulse" />
        </div>
      </div>
    );
  }

  if (errorMsg && !data) {
    return (
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-rose-200 dark:border-rose-950 shadow-lg flex flex-col items-center justify-center text-center gap-3">
        <AlertCircle className="h-8 w-8 text-rose-500" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{errorMsg}</p>
        <button
          onClick={() => fetchIndex(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all shadow active:scale-95"
        >
          <RotateCcw className="h-3 w-3" /> Retry Index Calculation
        </button>
      </div>
    );
  }

  const brief = data!;

  const getLabelColors = (sentiment: string) => {
    const s = (sentiment || "").toLowerCase();
    if (s.includes("extreme greed")) return "text-teal-550 dark:text-cyan-400";
    if (s.includes("greed")) return "text-emerald-555 dark:text-emerald-450";
    if (s.includes("neutral")) return "text-amber-500 dark:text-amber-400";
    if (s.includes("extreme fear")) return "text-red-500 dark:text-red-400";
    return "text-orange-500 dark:text-orange-400";
  };

  const getHistoricalLabel = (val: number) => {
    if (val <= 24) return "Extreme Fear";
    if (val <= 44) return "Fear";
    if (val <= 54) return "Neutral";
    if (val <= 74) return "Greed";
    return "Extreme Greed";
  };

  const pathScoreValue = Math.min(100, animatedScore + 1.5);
  const pathAngleRad = Math.PI - (Math.PI * (pathScoreValue / 100));
  const pathX = 50 + 40 * Math.cos(pathAngleRad);
  const pathY = 50 - 40 * Math.sin(pathAngleRad);

  return (
    <div className={`bg-white/70 dark:bg-white/[0.02] p-5 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] shadow-sm transition-all duration-300 flex flex-col ${className}`}>
      {/* Top Header Controls */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-xs sm:text-sm cool-heading uppercase">
              Fear & Greed Index
            </h3>
            <p className="text-[10px] text-slate-550 dark:text-slate-450 mt-0.5">
              Real-time market sentiment and investor psychology analysis.
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchIndex(true)}
          className="p-2 rounded-xl border border-slate-200/50 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-slate-450 hover:text-slate-700 dark:text-slate-350 dark:hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 group"
          title="Refresh Fear & Greed"
        >
          <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180" />
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5 items-stretch">

        {/* Left Column: Gauge Visualization */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 sm:p-5 rounded-2xl bg-slate-50/40 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5">
          {/* ARC Gauge visualization with analog needle pointer */}
          <div className="relative flex flex-col items-center justify-center w-full max-w-[190px] sm:max-w-[280px]">
            <svg className="w-full drop-shadow-2xl" viewBox="0 0 100 55">
              {/* Background Arc */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="7"
                strokeLinecap="round"
                className="dark:stroke-slate-800/80"
              />
              {/* Active colored path */}
              <path
                d={`M 10 50 A 40 40 0 0 1 ${pathX} ${pathY}`}
                fill="none"
                stroke="url(#fearGreedGradient)"
                strokeWidth="7"
                strokeLinecap="round"
              />

              <defs>
                <linearGradient id="fearGreedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />     {/* Red */}
                  <stop offset="25%" stopColor="#f97316" />    {/* Orange */}
                  <stop offset="50%" stopColor="#eab308" />    {/* Yellow */}
                  <stop offset="75%" stopColor="#10b981" />    {/* Green */}
                  <stop offset="100%" stopColor="#0d9488" />   {/* Dark Green */}
                </linearGradient>
              </defs>
            </svg>

            {/* Score & Label Overlay */}
            <div className="absolute bottom-1 sm:bottom-2 text-center flex flex-col items-center">
              <span className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                {animatedScore}
              </span>
              <span className={`text-[8px] sm:text-[10px] font-black tracking-widest uppercase mt-1.5 sm:mt-2 transition-colors duration-500 bg-white dark:bg-[#0c1220] px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-slate-150/80 dark:border-white/10 ${getLabelColors(brief.sentiment)} shadow-inner`}>
                {brief.sentiment}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-[11px] text-center text-slate-550 dark:text-slate-400 italic mt-6 px-2 leading-relaxed font-semibold">
            "{brief.description}"
          </p>
        </div>

        {/* Right Column: AI Strategy, Opportunities/Risks, and History */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">

          {/* Takeaways Section */}
          <div className="p-4 rounded-2xl bg-indigo-500/[0.02] border border-indigo-500/10 space-y-3">
            <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              AI Takeaways & Strategy
            </h4>
            <ul className="space-y-2">
              {brief.investorTakeaways.map((item: string, index: number) => (
                <li key={index} className="text-[11px] flex items-start gap-2 text-slate-805 dark:text-white leading-relaxed font-semibold">
                  <span className="text-indigo-500 dark:text-indigo-400 font-black mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Main Opportunity & Risk Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04] p-4 transition-all duration-300">
              <span className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-450 flex items-center gap-1.5 tracking-wider">
                <TrendingUp className="h-3.5 w-3.5" /> Opportunity
              </span>
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">{brief.opportunity}</p>
            </div>

            <div className="rounded-2xl border border-rose-500/15 bg-rose-500/[0.02] hover:bg-rose-500/[0.04] p-4 transition-all duration-300">
              <span className="text-[10px] uppercase font-black text-rose-600 dark:text-rose-450 flex items-center gap-1.5 tracking-wider">
                <TrendingDown className="h-3.5 w-3.5" /> Monitor Risk
              </span>
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">{brief.risk}</p>
            </div>
          </div>

          {/* Historical indicators */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="flex flex-col bg-slate-50/40 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100/80 dark:border-slate-800/60">
              <span className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-550 tracking-wider">Yesterday</span>
              <span className="font-black text-slate-800 dark:text-slate-200 mt-1 block">
                {brief.yesterday}
              </span>
              <span className={`text-[9px] font-bold mt-0.5 ${getLabelColors(getHistoricalLabel(brief.yesterday))}`}>
                {getHistoricalLabel(brief.yesterday)}
              </span>
            </div>

            <div className="flex flex-col bg-slate-50/40 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100/80 dark:border-slate-800/60">
              <span className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-550 tracking-wider">Last Week</span>
              <span className="font-black text-slate-800 dark:text-slate-200 mt-1 block">
                {brief.lastWeek}
              </span>
              <span className={`text-[9px] font-bold mt-0.5 ${getLabelColors(getHistoricalLabel(brief.lastWeek))}`}>
                {getHistoricalLabel(brief.lastWeek)}
              </span>
            </div>

            <div className="flex flex-col bg-slate-50/40 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100/80 dark:border-slate-800/60">
              <span className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-550 tracking-wider">Last Month</span>
              <span className="font-black text-slate-800 dark:text-slate-200 mt-1 block">
                {brief.lastMonth}
              </span>
              <span className={`text-[9px] font-bold mt-0.5 ${getLabelColors(getHistoricalLabel(brief.lastMonth))}`}>
                {getHistoricalLabel(brief.lastMonth)}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Last Updated Timestamp */}
      <div className="pt-3 mt-5 text-center text-[9px] font-extrabold uppercase tracking-widest text-slate-450 border-t border-slate-100 dark:border-slate-850">
        Updated: {new Date(brief.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}