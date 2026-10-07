import { TrendingUp, ShieldAlert, Compass } from "lucide-react";

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
    <div className="rounded-lg border border-[#242424] p-5 bg-[#111111] space-y-4">
      <div className="flex items-center justify-between border-b border-[#242424] pb-3">
        <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wide">
          AI Insights Analyst
        </h3>
        <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase border font-mono ${getRecColor(recommendation)}`}>
          {recommendation}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-2.5 bg-[#141414] rounded border border-[#242424] space-y-1">
          <span className="text-[10px] font-bold uppercase text-[#737373]">Trend Alignment</span>
          <div className="text-xs font-bold text-[#F5F5F5] flex items-center gap-1.5 font-mono">
            <TrendingUp className="h-3.5 w-3.5 text-[#22C55E]" />
            {trend}
          </div>
        </div>

        <div className="p-2.5 bg-[#141414] rounded border border-[#242424] space-y-1">
          <span className="text-[10px] font-bold uppercase text-[#737373]">Momentum Velocity</span>
          <div className="text-xs font-bold text-[#F5F5F5] flex items-center gap-1.5 font-mono">
            <Compass className="h-3.5 w-3.5 text-[#A3A3A3]" />
            {momentum}
          </div>
        </div>

        <div className="p-2.5 bg-[#141414] rounded border border-[#242424] space-y-1">
          <span className="text-[10px] font-bold uppercase text-[#737373]">Support Base</span>
          <div className="text-xs font-bold text-[#F5F5F5] font-mono">
            {support ? typeof support === "number" ? `${isIndex ? "" : "$"}${support.toFixed(2)}` : support : "N/A"}
          </div>
        </div>

        <div className="p-2.5 bg-[#141414] rounded border border-[#242424] space-y-1">
          <span className="text-[10px] font-bold uppercase text-[#737373]">Resistance Target</span>
          <div className="text-xs font-bold text-[#F5F5F5] font-mono">
            {resistance ? typeof resistance === "number" ? `${isIndex ? "" : "$"}${resistance.toFixed(2)}` : resistance : "N/A"}
          </div>
        </div>

        <div className="p-2.5 bg-[#141414] rounded border border-[#242424] space-y-1">
          <span className="text-[10px] font-bold uppercase text-[#737373]">Risk Profile</span>
          <div className="text-xs font-bold text-[#F5F5F5] flex items-center gap-1.5 font-mono">
            <ShieldAlert className="h-3.5 w-3.5 text-[#F59E0B]" />
            {risk}
          </div>
        </div>

        <div className="p-2.5 bg-[#141414] rounded border border-[#242424] space-y-1">
          <span className="text-[10px] font-bold uppercase text-[#737373]">Volatility Index</span>
          <div className="text-xs font-bold text-[#F5F5F5] font-mono">
            {volatility}
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-[#141414] border border-[#242424] rounded-md">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#A3A3A3] mb-1.5">Market Analyst Summary</h4>
        <p className="text-xs text-[#A3A3A3] leading-relaxed font-medium">
          {generatedSummary}
        </p>
      </div>
    </div>
  );
}
