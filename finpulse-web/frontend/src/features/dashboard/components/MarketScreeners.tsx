import { useState } from "react";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useChart } from "../../../context/ChartContext";
import { useMarketScreener } from "../../../hooks/useMarketScreeners";

interface Stock {
  symbol: string;
  name: string;
  price: string | number;
  change: string | number;
  changePercent: string | number;
}

type TabId = "Gainers" | "Losers";

export default function MarketScreeners() {
  const { openAsset } = useChart();
  const [activeTab, setActiveTab] = useState<TabId>("Gainers");

  const screenerType = activeTab === "Gainers" ? "gainers" : "losers";

  const {
    data: globalStocks = [],
    isLoading,
    error,
  } = useMarketScreener("global", screenerType);

  const tabs = [
    { id: "Gainers", label: "Global Top Gainers", icon: TrendingUp },
    { id: "Losers", label: "Global Top Losers", icon: TrendingDown },
  ] as const;

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="h-9 w-full bg-slate-100 dark:bg-[#111111] rounded-md animate-pulse border border-slate-200 dark:border-[#242424]" />
        <div className="space-y-3">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="min-w-[165px] sm:min-w-[185px] shrink-0 bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#242424] rounded-md p-4 space-y-3">
                <div className="space-y-2">
                  <div className="h-4 w-12 bg-slate-200 dark:bg-[#1C1C1C] rounded animate-pulse" />
                  <div className="h-3 w-24 bg-slate-200 dark:bg-[#1C1C1C] rounded animate-pulse" />
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-5 w-20 bg-slate-200 dark:bg-[#1C1C1C] rounded animate-pulse" />
                  <div className="h-4 w-16 bg-slate-200 dark:bg-[#1C1C1C] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md border border-rose-500/20 bg-rose-500/5 flex items-center gap-3 text-rose-500">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <p className="text-xs font-medium">Failed to load market screeners. Please try again later.</p>
      </div>
    );
  }

  const renderScreenerList = (stocks: Stock[]) => {
    if (stocks.length === 0) {
      return (
        <div className="p-6 rounded-md border border-slate-200 dark:border-[#242424] bg-white dark:bg-[#111111] text-center text-slate-400 dark:text-neutral-500">
          <p className="text-xs">No assets match this criteria right now.</p>
        </div>
      );
    }

    return (
      <div className="flex overflow-x-auto gap-3 pt-1 pb-3 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:-mx-2 sm:px-2">
        {stocks.map((stock: Stock) => {
          const isPositive = Number(stock.changePercent) >= 0;

          return (
            <button
              key={stock.symbol}
              onClick={() =>
                openAsset({
                  symbol: stock.symbol,
                  yahooSymbol: stock.symbol,
                  name: stock.name,
                  exchange: "Global",
                  type: "Stock",
                  price: Number(stock.price),
                  change: Number(stock.change),
                  changePercent: Number(stock.changePercent),
                })
              }
              className="min-w-[160px] sm:min-w-[185px] shrink-0 snap-start rounded-md border border-slate-200 dark:border-[#242424] bg-white dark:bg-[#111111] p-3 sm:p-3.5 text-left hover:border-slate-300 dark:hover:border-[#2A2A2A] hover:bg-slate-50 dark:hover:bg-[#141414] cursor-pointer group transition-colors flex flex-col justify-between"
            >
              <div className="mb-2">
                <span className="text-xs font-bold tracking-wide text-slate-900 dark:text-white block uppercase">
                  {stock.symbol}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-neutral-400 block truncate mt-0.5 max-w-[135px]" title={stock.name}>
                  {stock.name}
                </span>
              </div>

              <div>
                <span className="text-sm font-bold font-mono tracking-tight text-slate-900 dark:text-white block">
                  $
                  {Number(stock.price).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>

                <div className="flex items-center justify-between gap-1 mt-1">
                  <span className={`text-xs font-semibold ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                    {isPositive ? "+" : "-"}{" "}
                    {Math.abs(Number(stock.change)).toFixed(2)}
                  </span>

                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                  }`}>
                    {isPositive ? "+" : ""}{Number(stock.changePercent).toFixed(2)}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full space-y-3">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#242424]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 pb-2 pt-1 text-xs font-semibold transition-all relative focus:outline-none rounded-t px-2 uppercase tracking-wide ${
                isActive
                  ? "text-slate-900 dark:text-white font-bold"
                  : "text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-slate-900 dark:bg-white rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {renderScreenerList(globalStocks)}
    </div>
  );
}