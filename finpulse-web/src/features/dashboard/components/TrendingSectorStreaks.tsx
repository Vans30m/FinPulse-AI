import { useEffect, useState, useRef } from "react";
import { 
  Sparkles, AlertCircle, RotateCcw, Flame, TrendingDown,
  Cpu, Activity, Zap, ShoppingBag, Briefcase, Settings, Layers, Home, Globe, HelpCircle, ShieldAlert
} from "lucide-react";
import { getAISectorMomentum, type AISectorMomentumData } from "../../../services/marketService";

export default function TrendingSectorStreaks() {
  const [data, setData] = useState<AISectorMomentumData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getSectorIcon = (sectorName: string) => {
    const name = (sectorName || "").toLowerCase();
    if (name.includes("tech") || name.includes("information technology")) return <Cpu className="h-4 w-4 text-indigo-500" />;
    if (name.includes("health") || name.includes("medical") || name.includes("healthcare")) return <Activity className="h-4 w-4 text-emerald-500" />;
    if (name.includes("utility") || name.includes("utilities")) return <Zap className="h-4 w-4 text-amber-500 animate-pulse" />;
    if (name.includes("energy")) return <Flame className="h-4 w-4 text-orange-500" />;
    if (name.includes("financial") || name.includes("bank") || name.includes("services")) return <Briefcase className="h-4 w-4 text-blue-500" />;
    if (name.includes("discretionary") || name.includes("consumer discretionary")) return <ShoppingBag className="h-4 w-4 text-pink-500" />;
    if (name.includes("defensive") || name.includes("staples") || name.includes("consumer defensive")) return <ShieldAlert className="h-4 w-4 text-teal-500" />;
    if (name.includes("industrial") || name.includes("industrials")) return <Settings className="h-4 w-4 text-slate-500" />;
    if (name.includes("material") || name.includes("materials")) return <Layers className="h-4 w-4 text-amber-600" />;
    if (name.includes("real estate")) return <Home className="h-4 w-4 text-rose-500" />;
    if (name.includes("communication") || name.includes("telecom") || name.includes("communication services")) return <Globe className="h-4 w-4 text-sky-500" />;
    return <HelpCircle className="h-4 w-4 text-slate-400" />;
  };

  const fetchMomentum = async (forceRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (!forceRefresh) {
        const cached = sessionStorage.getItem("sectorMomentum");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.topRally) && Array.isArray(parsed.topDecline)) {
            setData(parsed);
            setIsLoading(false);
            return;
          }
        }
      }

      const result = await getAISectorMomentum();
      if (!result || !Array.isArray(result.topRally) || !Array.isArray(result.topDecline)) {
        throw new Error("Invalid schema received from AI Sector Momentum service");
      }

      sessionStorage.setItem("sectorMomentum", JSON.stringify(result));
      setData(result);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("Sector Momentum error:", err);

      const backup = sessionStorage.getItem("sectorMomentum");
      if (backup) {
        setData(JSON.parse(backup));
      } else {
        setErrorMsg("Unable to generate sector momentum.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMomentum();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm animate-pulse space-y-4">
        <div className="flex justify-between items-center">
          <span className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <span className="h-5 w-5 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
        <p className="text-xs text-slate-400 font-medium">AI is analyzing global sector rotation...</p>
        <div className="space-y-3 pt-2">
          <div className="h-10 bg-slate-100 dark:bg-slate-800/40 rounded w-full" />
          <div className="h-10 bg-slate-100 dark:bg-slate-800/40 rounded w-full" />
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
          onClick={() => fetchMomentum(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all shadow active:scale-95"
        >
          <RotateCcw className="h-3 w-3" /> Retry Analysis
        </button>
      </div>
    );
  }

  const pulse = data!;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:scale-[1.005]">
      {/* Header controls */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Sector Momentum</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Global rotation index</p>
        </div>
        <button
          onClick={() => fetchMomentum(true)}
          className="p-2 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 hover:text-slate-700 dark:text-slate-350 dark:hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md group"
          title="Refresh Sector Momentum"
        >
          <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Rally Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-105/10 pb-2">
            <Flame className="h-4 w-4 text-orange-500 fill-orange-500 animate-pulse" />
            Top Rallying Sectors
          </h4>
          <div className="space-y-3.5">
            {pulse.topRally.map((item, index) => (
              <div
                key={index}
                className="group relative flex flex-col p-4 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-all hover:border-emerald-500/30 hover:shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
                      {getSectorIcon(item.sector)}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">{item.sector}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block mt-0.5">Score: {item.momentumScore}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 rounded text-[9px] font-black uppercase tracking-wider shrink-0">
                    ▲ {item.days}d Rally
                  </span>
                </div>

                {/* Score bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800/60 rounded-full h-1 mt-3.5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
                    style={{ width: `${item.momentumScore}%` }}
                  />
                </div>

                {/* Reason Explanation */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed font-semibold italic">
                  "{item.reason}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Decline Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-black text-rose-600 dark:text-rose-450 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-105/10 pb-2">
            <TrendingDown className="h-4 w-4 text-rose-500" />
            Top Declining Sectors
          </h4>
          <div className="space-y-3.5">
            {pulse.topDecline.map((item, index) => (
              <div
                key={index}
                className="group relative flex flex-col p-4 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-all hover:border-rose-500/30 hover:shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
                      {getSectorIcon(item.sector)}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">{item.sector}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block mt-0.5">Score: {item.momentumScore}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-455 border border-rose-500/10 rounded text-[9px] font-black uppercase tracking-wider shrink-0">
                    ▼ {item.days}d Decline
                  </span>
                </div>

                {/* Score bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800/60 rounded-full h-1 mt-3.5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-500 to-red-500 rounded-full transition-all duration-1000"
                    style={{ width: `${item.momentumScore}%` }}
                  />
                </div>

                {/* Reason Explanation */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed font-semibold italic">
                  "{item.reason}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Timestamp */}
      <div className="mt-5 pt-3 border-t border-slate-50 dark:border-slate-850 flex items-center justify-between text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
        <span>Updated: {new Date(pulse.generatedAt).toLocaleDateString()}</span>
        <span className="flex items-center gap-1 text-orange-500">
          <Sparkles className="h-2.5 w-2.5" />
          Momentum Analysis
        </span>
      </div>
    </div>
  );
}