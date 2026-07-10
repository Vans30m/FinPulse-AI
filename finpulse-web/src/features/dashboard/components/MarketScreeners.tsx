import { useState } from "react";
import { TrendingUp, TrendingDown, Activity, AlertCircle } from "lucide-react";
import { useChart } from "../../../context/ChartContext";
import { useMarketScreener } from "../../../hooks/useMarketScreeners";

interface Props {
  marketRegion: "india" | "us";
}

interface Stock {
  symbol: string;
  name: string;
  price: string | number;
  change: string | number;
  changePercent: string | number;
}

type TabId = "Gainers" | "Losers" | "Active";

export default function MarketScreeners({ marketRegion }: Props) {
  const { openAsset } = useChart();
  const [activeTab, setActiveTab] = useState<TabId>("Gainers");

  const screenerType =
    activeTab === "Gainers"
      ? "gainers"
      : activeTab === "Losers"
      ? "losers"
      : "active";

  const {
    data: stocks = [],
    isLoading,
    error,
  } = useMarketScreener(marketRegion, screenerType);

  const tabs = [
    { id: "Gainers", label: "Top Gainers", icon: TrendingUp },
    { id: "Losers", label: "Top Losers", icon: TrendingDown },
    { id: "Active", label: "Most Active", icon: Activity },
  ] as const;

  // --- UX: Skeleton Loading State ---
  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="h-10 w-full bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[190px] shrink-0 glass-card p-4 space-y-3 opacity-60">
              <div className="space-y-2">
                <div className="h-4 w-12 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-24 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-5 w-20 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-16 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- UX: Error State ---
  if (error) {
    return (
      <div className="glass-card p-6 border-rose-500/20 bg-rose-500/5 flex items-center gap-3 text-rose-600 dark:text-rose-400">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">Failed to load market screeners. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2 sm:gap-4 border-b border-slate-200 dark:border-white/10 px-2 dynamic-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 pt-1 text-sm font-medium transition-all relative focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t px-1 ${
                isActive
                  ? "text-blue-600 dark:text-cyan-400 font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon className={`h-4 w-4 transition-transform ${isActive ? "scale-110" : ""}`} />
              <span>{tab.label}</span>

              {isActive && (
                <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-blue-600 dark:bg-cyan-400 rounded-t-full shadow-[0_-2px_10px_rgba(37,99,235,0.2)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Cards List / Empty State */}
      {stocks.length === 0 ? (
        <div className="glass-card p-8 text-center text-slate-400 dark:text-slate-500">
          <p className="text-sm">No assets match this criteria right now.</p>
        </div>
      ) : (
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory custom-scrollbar -mx-2 px-2 mask-linear-edge">
          {stocks.map((stock: Stock) => {
            const isPositive = Number(stock.changePercent) >= 0;
            const currencySymbol = marketRegion === "india" ? "₹" : "$";

            return (
              <button
                key={stock.symbol}
                onClick={() =>
                  openAsset({
                    symbol: stock.symbol,
                    yahooSymbol: stock.symbol,
                    name: stock.name,
                    exchange: marketRegion === "india" ? "NSE" : "NASDAQ",
                    type: "Stock",
                    price: Number(stock.price),
                    change: Number(stock.change),
                    changePercent: Number(stock.changePercent),
                  })
                }
                className="min-w-[190px] shrink-0 snap-start glass-card p-4 text-left hover:border-blue-400/50 dark:hover:border-cyan-500/40 cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div className="mb-4">
                  <span className="text-xs font-bold tracking-wide text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors block uppercase">
                    {stock.symbol.replace(".NS", "")}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-400 block truncate mt-0.5 max-w-[160px]" title={stock.name}>
                    {stock.name}
                  </span>
                </div>

                <div>
                  <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white block">
                    {currencySymbol}
                    {Number(stock.price).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>

                  <div className="flex items-center justify-between gap-1 mt-1.5">
                    <span className={`text-xs font-medium ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {isPositive ? "+" : ""}
                      {Number(stock.change).toFixed(2)}
                    </span>

                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isPositive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                    }`}>
                      {isPositive ? "+" : ""}
                      {Number(stock.changePercent).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}