import React from "react";

interface ChartHeaderProps {
  name: string;
  symbol: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  marketState?: string;
  currency?: string;
}

export const ChartHeader: React.FC<ChartHeaderProps> = ({
  name,
  symbol,
  exchange,
  price,
  change,
  changePercent,
  marketState,
  currency = "USD",
}) => {
  const isPositive = change >= 0;
  
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(val);
  };

  const isMarketOpen = marketState?.toUpperCase() === "REGULAR" || marketState?.toUpperCase() === "OPEN";

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/60">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{name}</h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {exchange}
          </span>
        </div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono mt-0.5">{symbol}</p>
      </div>

      <div className="flex items-baseline md:items-center gap-4 md:text-right">
        <div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {formatCurrency(price)}
          </div>
          <div className={`text-xs font-bold font-mono mt-0.5 ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
            {isPositive ? "+" : ""}{change.toFixed(2)} ({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200/60 dark:border-slate-800/80 bg-slate-50 dark:bg-white/[0.02]">
          <span className={`h-2 w-2 rounded-full ${isMarketOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
          <span className="text-slate-600 dark:text-slate-300">
            {isMarketOpen ? "Market Open" : "Market Closed"}
          </span>
        </div>
      </div>
    </div>
  );
};