import { Activity } from "lucide-react";

interface TechnicalData {
  rsi?: string | number;
  macd?: string | number;
  signal?: string | number;
  histogram?: string | number;
  sma50?: string | number;
  ema20?: string | number;
  adx?: string | number;
  bbandsUpper?: string | number;
  bbandsLower?: string | number;
  verdict?: string;
  recommendation?: string;
  confidence?: number;
  reasons?: string[];
}

interface TechnicalCardProps {
  data: TechnicalData | null;
  loading?: boolean;
  price?: number;
  dayHigh?: number;
  dayLow?: number;
  previousClose?: number;
  isIndex?: boolean;
}

export default function TechnicalCard({ 
  data, 
  loading,
  price: propPrice,
  dayHigh,
  dayLow,
  previousClose,
  isIndex = false
}: TechnicalCardProps) {
  if (loading) {
    return (
      <div className="p-6 border border-slate-150 dark:border-white/5 bg-white dark:bg-night-900 rounded-2xl animate-pulse space-y-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-sm text-slate-400 dark:text-slate-500 border border-slate-250 dark:border-white/5 rounded-2xl">
        No technical analysis data available.
      </div>
    );
  }

  const price = propPrice || 0;
  const high = dayHigh || price;
  const low = dayLow || price;
  const close = previousClose || price;

  const hasKeyLevels = price > 0 && high > 0 && low > 0;
  let PP = 0, R1 = 0, S1 = 0, R2 = 0, S2 = 0;
  let keyVerdict = "Neutral";
  let verdictColor = "text-slate-400 bg-slate-500/10 border-slate-500/20";

  if (hasKeyLevels) {
    PP = (high + low + close) / 3;
    R1 = (2 * PP) - low;
    S1 = (2 * PP) - high;
    R2 = PP + (high - low);
    S2 = PP - (high - low);

    if (price > R1) {
      keyVerdict = "Bullish";
      verdictColor = "text-emerald-450 bg-emerald-500/10 border-emerald-500/20";
    } else if (price < S1) {
      keyVerdict = "Bearish";
      verdictColor = "text-rose-455 bg-rose-500/10 border-rose-500/20";
    } else {
      keyVerdict = "Neutral";
      verdictColor = "text-amber-450 bg-amber-500/10 border-amber-500/20";
    }
  }

  const formatNum = (val: number) => {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getVerdictColor = (verdict = "") => {
    const v = verdict.toLowerCase();
    if (v.includes("buy") || v.includes("bullish")) return "text-emerald-600 dark:text-emerald-450 bg-emerald-500/10 border-emerald-500/20";
    if (v.includes("sell") || v.includes("bearish") || v.includes("pullback")) return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    return "text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-white/5";
  };

  const curPrefix = isIndex ? "" : "$";

  return (
    <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-6 bg-white dark:bg-night-900 shadow-lg space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" /> Structural Levels
        </h3>
        <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase border ${getVerdictColor(data.verdict)}`}>
          {data.verdict || "Neutral"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Indicators Sub-Card */}
        <div className="bg-slate-50 dark:bg-[#0c1022]/20 border border-slate-150 dark:border-slate-800/60 rounded-2xl p-5 flex flex-col justify-start space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-200/60 dark:border-slate-850 pb-2">Core Indicators</h4>
          
          <div className="space-y-3.5 text-sm flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center py-1 border-b border-slate-150 dark:border-white/[0.02]">
              <span className="text-slate-500 dark:text-slate-400 font-bold">RSI (14)</span>
              <span className="font-mono font-black text-slate-900 dark:text-white">{data.rsi || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-150 dark:border-white/[0.02]">
              <span className="text-slate-500 dark:text-slate-400 font-bold">MACD Line</span>
              <span className="font-mono font-black text-slate-900 dark:text-white">{data.macd || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-150 dark:border-white/[0.02]">
              <span className="text-slate-500 dark:text-slate-400 font-bold">Signal Line</span>
              <span className="font-mono font-black text-slate-950 dark:text-slate-200">{data.signal || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-150 dark:border-white/[0.02]">
              <span className="text-slate-500 dark:text-slate-400 font-bold">EMA (20)</span>
              <span className="font-mono font-black text-slate-900 dark:text-white">{curPrefix}{data.ema20 || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 dark:text-slate-400 font-bold">SMA (50)</span>
              <span className="font-mono font-black text-slate-900 dark:text-white">{curPrefix}{data.sma50 || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Major Key Levels Sub-Card */}
        {hasKeyLevels ? (
          <div className="bg-slate-50 dark:bg-[#0c1022]/20 border border-slate-150 dark:border-slate-800/60 rounded-2xl p-5 flex flex-col justify-start space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-850 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Major Key Levels</h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${verdictColor}`}>
                {keyVerdict}
              </span>
            </div>
            
            {(() => {
              const minLevel = S2;
              const maxLevel = R2;
              const range = maxLevel - minLevel;
              const getPct = (val: number) => {
                if (!range || range <= 0) return 50;
                return Math.max(0, Math.min(100, ((val - minLevel) / range) * 100));
              };
              const pricePct = getPct(price);

              return (
                <div className="space-y-4 pt-1 flex-1 flex flex-col justify-between">
                  {/* Price Position Gauge */}
                  <div className="p-3 bg-white dark:bg-[#0c1022]/40 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <div className="relative pt-6 pb-2">
                      {/* Current Price Pointer above track */}
                      <div 
                        className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300 ease-out z-10"
                        style={{ left: `${pricePct}%` }}
                      >
                        <span className="bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded text-[10px] font-black font-mono shadow-[0_0_10px_rgba(6,182,212,0.2)] whitespace-nowrap">
                          {curPrefix}{formatNum(price)}
                        </span>
                        {/* Downward triangle indicator */}
                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-cyan-400 mt-0.5" />
                      </div>

                      {/* Horizontal track */}
                      <div className="h-2 w-full rounded-full bg-gradient-to-r from-emerald-500 via-blue-500 to-rose-500 opacity-80 border border-slate-200 dark:border-slate-800 relative" />

                      {/* Tick marks on the track */}
                      <div className="relative flex justify-between text-[9px] font-bold font-mono mt-1 text-slate-450 dark:text-slate-400">
                        <span className="text-emerald-600 dark:text-emerald-455">S2</span>
                        <span className="text-emerald-500 dark:text-emerald-400">S1</span>
                        <span className="text-blue-500 dark:text-blue-400">PP</span>
                        <span className="text-rose-455">R1</span>
                        <span className="text-rose-500 dark:text-rose-400">R2</span>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Levels List */}
                  <div className="space-y-1.5">
                    {[
                      { label: "R2 (Resistance 2)", value: R2, textClass: "text-rose-500 dark:text-rose-455", dotClass: "bg-rose-500", bgClass: "hover:bg-rose-500/5" },
                      { label: "R1 (Resistance 1)", value: R1, textClass: "text-rose-400", dotClass: "bg-rose-400", bgClass: "hover:bg-rose-500/5" },
                      { label: "PP (Pivot Point)", value: PP, textClass: "text-blue-500 dark:text-blue-400", dotClass: "bg-blue-500", bgClass: "bg-blue-500/5 border border-blue-500/10 dark:border-blue-500/20" },
                      { label: "S1 (Support 1)", value: S1, textClass: "text-emerald-500 dark:text-emerald-455", dotClass: "bg-emerald-500", bgClass: "hover:bg-emerald-500/5" },
                      { label: "S2 (Support 2)", value: S2, textClass: "text-emerald-600 dark:text-emerald-400", dotClass: "bg-emerald-600", bgClass: "hover:bg-emerald-500/5" },
                    ].map((lvl, idx) => {
                      const isAbove = price >= lvl.value;
                      return (
                        <div 
                          key={idx} 
                          className={`flex justify-between items-center px-3 py-1 rounded-xl transition-all duration-200 ${lvl.bgClass}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${lvl.dotClass}`} />
                            <span className={`font-sans font-bold text-[11px] ${lvl.textClass}`}>{lvl.label}</span>
                          </div>
                          <div className="flex items-center gap-3 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            <span>{curPrefix}{formatNum(lvl.value)}</span>
                            <span className={`text-[9px] font-sans px-1.5 py-0.2 rounded-full ${isAbove ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-500 dark:text-rose-400"}`}>
                              {isAbove ? "Above" : "Below"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-[#0c1022]/20 border border-slate-150 dark:border-slate-800/60 rounded-2xl p-5 text-center py-12 text-slate-500">
            No price stats available to compute pivot levels.
          </div>
        )}

        {/* AI Verdict Summary Sub-Card */}
        <div className="bg-slate-50 dark:bg-[#0c1022]/20 border border-slate-150 dark:border-slate-800/60 rounded-2xl p-5 flex flex-col justify-start space-y-4">
          <div className="border-b border-slate-200/60 dark:border-slate-850 pb-2">
            <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">AI Verdict Summary</div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div className="text-2xl font-black text-slate-850 dark:text-white flex items-baseline gap-1">
              {data.recommendation || "HOLD"}
              {data.confidence && (
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1 font-sans">
                  ({data.confidence}% confidence)
                </span>
              )}
            </div>

            {data.reasons && data.reasons.length > 0 && (
              <ul className="space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {data.reasons.slice(0, 3).map((r, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
