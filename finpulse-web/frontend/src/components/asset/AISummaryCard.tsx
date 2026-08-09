import { Sparkles, TrendingUp, ShieldAlert, Compass } from "lucide-react";

interface AISummaryProps {
  symbol: string;
  trend?: string;
  momentum?: string;
  support?: string | number;
  resistance?: string | number;
  risk?: "Low" | "Medium" | "High";
  volatility?: "Low" | "Medium" | "High";
  summary?: string;
  recommendation?: "BUY" | "HOLD" | "SELL" | "STRONG BUY" | "STRONG SELL";
  score?: number;
  isIndex?: boolean;
}

export default function AISummaryCard({
  symbol,
  trend = "Bullish",
  momentum = "Bullish Momentum",
  support,
  resistance,
  risk = "Medium",
  volatility = "Medium",
  summary,
  recommendation = "HOLD",
  isIndex = false
}: AISummaryProps) {

  const getRecColor = (rec: string) => {
    const r = rec.toUpperCase();
    if (r.includes("BUY")) return "text-emerald-600 dark:text-emerald-455 bg-emerald-500/10 border-emerald-500/20";
    if (r.includes("SELL")) return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    return "text-amber-500 bg-amber-500/10 border-amber-500/20";
  };

  const supportStr = support ? (typeof support === "number" ? `${isIndex ? "" : "$"}${support.toFixed(2)}` : support) : "pivots";
  const resistanceStr = resistance ? (typeof resistance === "number" ? `${isIndex ? "" : "$"}${resistance.toFixed(2)}` : resistance) : "highs";
  const generatedSummary = summary || `AI Analysis indicates that ${symbol} is showing solid technical support near ${supportStr}. With strong ${momentum} and a ${trend.toLowerCase()} trend pattern, the asset represents a balanced risk/reward trade setup at current valuations. Momentum gauges suggest a short-term resistance checkpoint near ${resistanceStr}.`;

  return (
    <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-6 bg-white dark:bg-night-900 shadow-lg space-y-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 dark:bg-cyan-500/5 blur-2xl pointer-events-none rounded-full" />
      
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 relative z-10">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" /> AI Insights Analyst
        </h3>
        <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase border ${getRecColor(recommendation)}`}>
          {recommendation}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div className="p-3 bg-slate-50 dark:bg-white/[0.01] rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Trend Alignment</span>
          <div className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            {trend}
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-white/[0.01] rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Momentum Velocity</span>
          <div className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-1.5">
            <Compass className="h-4 w-4 text-blue-500" />
            {momentum}
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-white/[0.01] rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Support Base</span>
          <div className="text-sm font-black text-slate-850 dark:text-white font-mono">
            {support ? typeof support === "number" ? `${isIndex ? "" : "$"}${support.toFixed(2)}` : support : "N/A"}
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-white/[0.01] rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Resistance target</span>
          <div className="text-sm font-black text-slate-850 dark:text-white font-mono">
            {resistance ? typeof resistance === "number" ? `${isIndex ? "" : "$"}${resistance.toFixed(2)}` : resistance : "N/A"}
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-white/[0.01] rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Risk Profile</span>
          <div className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            {risk}
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-white/[0.01] rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Volatility Index</span>
          <div className="text-sm font-black text-slate-850 dark:text-white">
            {volatility}
          </div>
        </div>
      </div>

      <div className="p-4 bg-indigo-500/[0.02] border border-indigo-500/10 rounded-2xl relative z-10">
        <h4 className="text-xs font-black uppercase tracking-wider text-indigo-500 mb-2">Market Analyst Summary</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
          {generatedSummary}
        </p>
      </div>
    </div>
  );
}
