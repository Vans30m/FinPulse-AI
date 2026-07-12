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
}

export default function TechnicalCard({ 
  data, 
  loading,
  price: propPrice,
  dayHigh,
  dayLow,
  previousClose
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
        {/* Core Indicators */}
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Core Indicators</h4>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-slate-55 dark:border-white/[0.01]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">RSI (14)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{data.rsi || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-55 dark:border-white/[0.01]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">MACD Line</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{data.macd || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-55 dark:border-white/[0.01]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Signal Line</span>
              <span className="font-mono font-bold text-slate-950 dark:text-slate-200">{data.signal || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-55 dark:border-white/[0.01]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">EMA (20)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">${data.ema20 || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">SMA (50)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">${data.sma50 || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Major Key Levels */}
        {hasKeyLevels ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Major Key Levels</h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${verdictColor}`}>
                {keyVerdict}
              </span>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-white/[0.01]">
                <span className="text-rose-455 font-bold">R2 (Resistance 2)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatNum(R2)} <span className="text-[10px] text-slate-500">({price >= R2 ? "▲ Above" : "▼ Below"})</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-white/[0.01]">
                <span className="text-rose-400 font-bold">R1 (Resistance 1)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatNum(R1)} <span className={`text-[10px] ${price >= R1 ? "text-emerald-450" : "text-rose-455"}`}>({price >= R1 ? "▲ Above" : "▼ Below"})</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-white/[0.01] bg-blue-500/5 px-2 rounded-lg">
                <span className="text-blue-400 font-bold">PP (Pivot Point)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatNum(PP)} <span className={`text-[10px] ${price >= PP ? "text-emerald-450" : "text-rose-455"}`}>({price >= PP ? "▲ Above" : "▼ Below"})</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-white/[0.01]">
                <span className="text-emerald-400 font-bold">S1 (Support 1)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatNum(S1)} <span className={`text-[10px] ${price >= S1 ? "text-emerald-455" : "text-rose-455"}`}>({price >= S1 ? "▲ Above" : "▼ Below"})</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-emerald-455 font-bold">S2 (Support 2)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatNum(S2)} <span className="text-[10px] text-slate-500">({price >= S2 ? "▲ Above" : "▼ Below"})</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center py-6 text-slate-500">
            No price stats available to compute pivot levels.
          </div>
        )}

        {/* AI Recommendation Summary */}
        <div className="bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">AI Verdict Summary</div>
            <div className="text-2xl font-black text-slate-850 dark:text-white flex items-baseline gap-1">
              {data.recommendation || "HOLD"}
              {data.confidence && (
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1">
                  ({data.confidence}% confidence)
                </span>
              )}
            </div>
          </div>

          {data.reasons && data.reasons.length > 0 && (
            <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {data.reasons.slice(0, 3).map((r, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
