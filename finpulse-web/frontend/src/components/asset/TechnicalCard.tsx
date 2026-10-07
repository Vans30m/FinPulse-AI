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
    <div className="rounded-lg border border-[#242424] p-5 bg-[#111111] space-y-4">
      <div className="flex items-center justify-between border-b border-[#242424] pb-3">
        <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wide flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#A3A3A3]" /> Structural Technical Levels
        </h3>
        <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase border font-mono ${getVerdictColor(data.verdict)}`}>
          {data.verdict || "Neutral"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Core Indicators Sub-Card */}
        <div className="bg-[#141414] border border-[#242424] rounded-md p-4 flex flex-col justify-start space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#A3A3A3] border-b border-[#242424] pb-2">Core Indicators</h4>
          
          <div className="space-y-2 text-xs flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center py-1 border-b border-[#242424]">
              <span className="text-[#A3A3A3] font-medium">RSI (14)</span>
              <span className="font-mono font-bold text-[#F5F5F5]">{data.rsi || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#242424]">
              <span className="text-[#A3A3A3] font-medium">MACD Line</span>
              <span className="font-mono font-bold text-[#F5F5F5]">{data.macd || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#A3A3A3] font-medium">Signal Line</span>
              <span className="font-mono font-bold text-[#F5F5F5]">{data.signal || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Major Key Levels Sub-Card */}
        {hasKeyLevels ? (
          <div className="bg-[#141414] border border-[#242424] rounded-md p-4 flex flex-col justify-start space-y-3">
            <div className="flex justify-between items-center border-b border-[#242424] pb-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#A3A3A3]">Major Key Levels</h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border font-mono ${verdictColor}`}>
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
                <div className="space-y-3 pt-1 flex-1 flex flex-col justify-between">
                  {/* Price Position Gauge */}
                  <div className="p-2.5 bg-[#0D0D0D] rounded border border-[#242424]">
                    <div className="relative pt-6 pb-2">
                      {/* Current Price Pointer above track */}
                      <div 
                        className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300 ease-out z-10"
                        style={{ left: `${pricePct}%` }}
                      >
                        <span className="bg-[#1C1C1C] text-[#F5F5F5] border border-[#2A2A2A] px-1.5 py-0.5 rounded text-[10px] font-bold font-mono whitespace-nowrap">
                          {curPrefix}{formatNum(price)}
                        </span>
                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-[#F5F5F5] mt-0.5" />
                      </div>

                      {/* Horizontal track */}
                      <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-[#22C55E] via-[#A3A3A3] to-[#EF4444] opacity-80 border border-[#242424] relative" />

                      {/* Tick marks on the track */}
                      <div className="relative flex justify-between text-[9px] font-bold font-mono mt-1 text-[#737373]">
                        <span className="text-[#22C55E]">S2</span>
                        <span className="text-[#22C55E]">S1</span>
                        <span className="text-[#A3A3A3]">PP</span>
                        <span className="text-[#EF4444]">R1</span>
                        <span className="text-[#EF4444]">R2</span>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Levels List */}
                  <div className="space-y-1">
                    {[
                      { label: "R2 (Resistance 2)", value: R2, textClass: "text-[#EF4444]", dotClass: "bg-[#EF4444]", bgClass: "hover:bg-[#EF4444]/5" },
                      { label: "R1 (Resistance 1)", value: R1, textClass: "text-[#EF4444]", dotClass: "bg-[#EF4444]", bgClass: "hover:bg-[#EF4444]/5" },
                      { label: "PP (Pivot Point)", value: PP, textClass: "text-[#A3A3A3]", dotClass: "bg-[#A3A3A3]", bgClass: "bg-[#1C1C1C]/40 border border-[#242424]" },
                      { label: "S1 (Support 1)", value: S1, textClass: "text-[#22C55E]", dotClass: "bg-[#22C55E]", bgClass: "hover:bg-[#22C55E]/5" },
                      { label: "S2 (Support 2)", value: S2, textClass: "text-[#22C55E]", dotClass: "bg-[#22C55E]", bgClass: "hover:bg-[#22C55E]/5" },
                    ].map((lvl, idx) => {
                      const isAbove = price >= lvl.value;
                      return (
                        <div 
                          key={idx} 
                          className={`flex justify-between items-center px-2.5 py-1 rounded transition-all duration-150 ${lvl.bgClass}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${lvl.dotClass}`} />
                            <span className={`font-mono text-[11px] font-medium ${lvl.textClass}`}>{lvl.label}</span>
                          </div>
                          <div className="flex items-center gap-2.5 font-mono text-[11px] font-bold text-[#F5F5F5]">
                            <span>{curPrefix}{formatNum(lvl.value)}</span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${isAbove ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-[#EF4444]/10 text-[#EF4444]"}`}>
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
          <div className="bg-[#141414] border border-[#242424] rounded-md p-4 text-center py-8 text-[#A3A3A3] text-xs">
            No price stats available to compute pivot levels.
          </div>
        )}

        {/* AI Verdict Summary Sub-Card */}
        <div className="bg-[#141414] border border-[#242424] rounded-md p-4 flex flex-col justify-start space-y-3">
          <div className="border-b border-[#242424] pb-2">
            <div className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider">AI Verdict Summary</div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-3">
            <div className="text-xl font-bold text-[#F5F5F5] flex items-baseline gap-1 font-mono uppercase">
              {data.recommendation || "HOLD"}
              {data.confidence && (
                <span className="text-xs font-medium text-[#737373] ml-1 font-mono">
                  ({data.confidence}% confidence)
                </span>
              )}
            </div>

            {data.reasons && data.reasons.length > 0 && (
              <ul className="space-y-1.5 text-xs text-[#A3A3A3]">
                {data.reasons.slice(0, 3).map((r, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A3A3A3] shrink-0" />
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
