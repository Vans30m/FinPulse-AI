import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Market {
  symbol: string;
  name: string;
  region: string;
  currency?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  dayHigh?: number;
  dayLow?: number;
  yearHigh?: number;
  yearLow?: number;
}

interface Props {
  markets: Market[];
}

export default function MarketHeatmap({ markets }: Props) {
  // State tracking which market object is clicked and open for detailed chart review
  const [activeMarket, setActiveMarket] = useState<Market | null>(null);
  const navigate = useNavigate();

  // 1. Auto-sort markets from highest gainer to biggest loser
  const sortedMarkets = useMemo(() => {
    return [...markets].sort(
      (a, b) => (parseFloat(b.changePercent as any) || 0) - (parseFloat(a.changePercent as any) || 0)
    );
  }, [markets]);

  // 2. Refined, multi-tier color scale for high UI contrast
  const getHeatmapStyle = (change: number) => {
    if (change >= 1.5) return "bg-emerald-600 text-white border-emerald-500/50 hover:shadow-emerald-600/40";
    if (change >= 0.5) return "bg-emerald-500 text-white border-emerald-400/50 hover:shadow-emerald-500/40";
    if (change > 0) return "bg-emerald-400 text-emerald-950 border-emerald-300/50 hover:shadow-emerald-400/40";
    if (change === 0) return "bg-slate-100 text-slate-500 border-slate-200 dark:bg-night-800 dark:text-slate-400 dark:border-night-700 hover:shadow-slate-500/10";
    if (change <= -1.5) return "bg-rose-600 text-white border-rose-500/50 hover:shadow-rose-600/40";
    if (change <= -0.5) return "bg-rose-500 text-white border-rose-400/50 hover:shadow-rose-500/40";
    return "bg-rose-400 text-rose-950 border-rose-300/50 hover:shadow-rose-400/40";
  };

  if (!markets || markets.length === 0) return null;

  return (
    <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-night-800 dark:bg-night-900/50">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          🌍 Global Market Heatmap
        </h2>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Sorted by Performance
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {sortedMarkets.map((market) => {
          const change = parseFloat(market.changePercent as any) || 0;
          const isPositive = change > 0;

          return (
            <div
              key={market.symbol}
              onClick={() => setActiveMarket(market)} // Launches the detail panel matching this market instance
              className={`
                group relative flex aspect-square cursor-pointer flex-col items-center justify-center 
                rounded-2xl border p-3 text-center transition-all duration-300 ease-out 
                hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg
                ${getHeatmapStyle(change)}
              `}
            >
              {/* Region Label */}
              <span className="mb-1 text-[10px] font-bold uppercase tracking-widest opacity-80">
                {market.region}
              </span>

              {/* Market Name */}
              <h3 className="line-clamp-2 text-sm font-extrabold leading-tight tracking-tight">
                {market.name}
              </h3>

              {/* Percentage Change */}
              <div className="mt-2 flex items-center gap-0.5">
                <span className="text-base font-black tabular-nums tracking-tighter">
                  {isPositive ? "+" : ""}
                  {change.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}