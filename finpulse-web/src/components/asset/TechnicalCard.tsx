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
}

export default function TechnicalCard({ data, loading }: TechnicalCardProps) {
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
          <Activity className="h-5 w-5 text-blue-500" /> Technical Gauges
        </h3>
        <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase border ${getVerdictColor(data.verdict)}`}>
          {data.verdict || "Neutral"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Indicators */}
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Core Indicators</h4>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-white/[0.01]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">RSI (14)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{data.rsi || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-white/[0.01]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">MACD Line</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{data.macd || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-white/[0.01]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Signal Line</span>
              <span className="font-mono font-bold text-slate-950 dark:text-slate-200">{data.signal || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-white/[0.01]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">EMA (20)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">${data.ema20 || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">SMA (50)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">${data.sma50 || "N/A"}</span>
            </div>
          </div>
        </div>

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
