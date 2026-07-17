import { useState, useMemo } from "react";
import { useGlobalMarkets } from "../hooks/useGlobalMarkets";
import MarketStatusBar from "../features/dashboard/components/MarketStatusBar";
import { Search, X, Activity } from "lucide-react";
import { useChart } from "../context/ChartContext";

function MarketHeatmapTile({ market }: { market: any }) {
  const { openAsset } = useChart();
  const changePercent = parseFloat(market.changePercent) || 0;
  const change = parseFloat(market.change) || 0;
  const price = parseFloat(market.price) || 0;
  const isPositive = changePercent >= 0;

  const getHeatmapStyle = (val: number) => {
    if (val >= 1.5) {
      return "bg-emerald-700 dark:bg-emerald-800 text-white border-emerald-600/40 hover:bg-emerald-650 dark:hover:bg-emerald-750";
    }
    if (val > 0) {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15";
    }
    if (val === 0) {
      return "bg-slate-50 text-slate-400 border-slate-200 dark:bg-white/[0.01] dark:text-slate-500 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/[0.02]";
    }
    if (val <= -1.0) {
      return "bg-rose-700 dark:bg-rose-800 text-white border-rose-600/40 hover:bg-rose-650 dark:hover:bg-rose-750";
    }
    return "bg-rose-50/50 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-50/80 dark:hover:bg-rose-950/15";
  };

  return (
    <div
      onClick={() =>
        openAsset({
          symbol: market.symbol,
          yahooSymbol: market.symbol,
          name: market.name,
          exchange: market.region,
          type: market.region === "Crypto" ? "Crypto" : market.region === "Forex" ? "Forex" : market.region === "Commodities" ? "Commodities" : "Index",
          price: price,
          change: change,
          changePercent: changePercent,
        })
      }
      className={`
        group relative flex aspect-[1.1] cursor-pointer flex-col items-center justify-center 
        rounded-2xl border p-3 text-center transition-all duration-300 ease-out 
        hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md
        ${getHeatmapStyle(changePercent)}
      `}
    >
      {/* Symbol */}
      <span className="text-[10px] font-black tracking-wider uppercase opacity-75">
        {market.symbol.replace("=X", "").replace("-USD", "").replace("=F", "")}
      </span>

      {/* Market Name */}
      <h4 className="line-clamp-2 text-xs font-extrabold leading-tight tracking-tight mt-1 px-1">
        {market.name}
      </h4>

      {/* Price */}
      <span className="text-[10px] font-bold opacity-80 mt-1.5 tabular-nums">
        {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>

      {/* Percentage Change */}
      <span className="text-xs font-black tabular-nums tracking-tighter mt-1">
        {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
      </span>
    </div>
  );
}

export default function Markets() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const { data: markets = [], isLoading } = useGlobalMarkets();

  const categories = [
    "All", "India", "US", "Europe", "Japan", "Taiwan", "Hong Kong", "South Korea", "Canada", "Australia", "China", "Brazil", "Mexico", "Singapore", "Crypto", "Forex", "Commodities"
  ];

  const REGION_FLAGS = {
    India: "🇮🇳",
    US: "🇺🇸",
    Europe: "🇪🇺",
    Japan: "🇯🇵",
    "Hong Kong": "🇭🇰",
    Taiwan: "🇹🇼",
    "South Korea": "🇰🇷",
    Canada: "🇨🇦",
    Australia: "🇦🇺",
    China: "🇨🇳",
    Brazil: "🇧🇷",
    Mexico: "🇲🇽",
    Singapore: "🇸🇬",
    Crypto: "🪙",
    Forex: "💱",
    Commodities: "🛢"
  };

  const groupedMarkets = useMemo(() => {
    if (!markets || !Array.isArray(markets)) return {};

    const groups: any = {
      India: markets.filter((m: any) => m.region === "India"),
      US: markets.filter((m: any) => m.region === "US"),
      Europe: markets.filter((m: any) => m.region === "Europe"),
      Japan: markets.filter((m: any) => m.region === "Japan"),
      "Hong Kong": markets.filter((m: any) => m.region === "Hong Kong"),
      Taiwan: markets.filter((m: any) => m.region === "Taiwan"),
      "South Korea": markets.filter((m: any) => m.region === "South Korea"),
      Canada: markets.filter((m: any) => m.region === "Canada"),
      Australia: markets.filter((m: any) => m.region === "Australia"),
      China: markets.filter((m: any) => m.region === "China"),
      Brazil: markets.filter((m: any) => m.region === "Brazil"),
      Mexico: markets.filter((m: any) => m.region === "Mexico"),
      Singapore: markets.filter((m: any) => m.region === "Singapore"),
      Crypto: markets.filter((m: any) => m.region === "Crypto"),
      Forex: markets.filter((m: any) => m.region === "Forex"),
      Commodities: markets.filter((m: any) => m.region === "Commodities"),
    };

    Object.keys(groups).forEach((region) => {
      groups[region].sort((a: any, b: any) => {
        const aChange = parseFloat(a.changePercent) || 0;
        const bChange = parseFloat(b.changePercent) || 0;
        if (sortBy === "gainers") return bChange - aChange;
        if (sortBy === "losers") return aChange - bChange;
        return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0); 
      });
    });
    
    return groups;
  }, [markets, sortBy]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Activity className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      {/* 1. Header & Live Indicator */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Global Markets
          </h1>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-1 ring-1 ring-emerald-500/20 dark:bg-emerald-500/10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Live
            </span>
          </div>
        </div>
        <p className="text-base text-slate-500 dark:text-slate-400">
          Track major market indices and global economic health.
        </p>
      </div>

      {/* Market Status */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm dark:border-night-800 dark:bg-night-900/80">
        <MarketStatusBar />
      </div>

      {/* Control Center */}
      <div className="sticky top-0 z-20 -mx-4 flex flex-col gap-4 border-y border-slate-200/60 bg-slate-50/80 px-4 py-4 backdrop-blur-xl dark:border-night-800 dark:bg-night-900/80 md:mx-0 md:flex-row md:items-center md:justify-between md:rounded-2xl md:border">
        {/* Region Filters */}
        <div className="overflow-x-auto w-full md:w-auto scrollbar-none">
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-200/50 p-1 dark:bg-night-800/50 min-w-max">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`
                  rounded-lg px-4 py-1.5 text-sm font-semibold transition-all duration-200 text-center whitespace-nowrap
                  ${
                    activeCategory === category
                      ? "bg-white text-slate-900 shadow-sm dark:bg-night-700 dark:text-white"
                      : "text-slate-600 hover:bg-white/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-night-700/50 dark:hover:text-white"
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Sorting Dropdown */}
        <div className="w-full md:w-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none hover:border-slate-300 focus:ring-2 focus:ring-cyan-500 dark:border-night-700 dark:bg-night-800 dark:text-slate-300 dark:hover:border-night-600"
          >
            <option value="default">Sort: Default</option>
            <option value="gainers">Top Gainers</option>
            <option value="losers">Top Losers</option>
          </select>
        </div>
      </div>

      {/* Markets Grid */}
      <div className="space-y-10 pt-2">
        {Object.entries(groupedMarkets).map(([region, regionMarkets]: any) => {
          if (activeCategory !== "All" && activeCategory !== region) return null;
          if (!regionMarkets || regionMarkets.length === 0) return null;

          return (
            <div key={region} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
                    <span className="mr-2 opacity-90">{REGION_FLAGS[region as keyof typeof REGION_FLAGS]}</span>
                    {region} {region === "Crypto" || region === "Forex" || region === "Commodities" ? "" : "Indices"}
                    <span className="ml-2 text-xs font-semibold text-slate-400 dark:text-slate-500 normal-case">
                      ({regionMarkets.length} assets)
                    </span>
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-night-800"></div>
                </div>

                {/* Country-specific Search Bar */}
                <div className="relative w-full sm:w-72 group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Search className={`h-4 w-4 transition-colors duration-300 ${searchQueries[region] ? "text-blue-600 dark:text-cyan-400" : "text-slate-400 dark:text-slate-500"}`} />
                  </span>
                  <input
                    type="text"
                    placeholder={`Search ${region} assets...`}
                    value={searchQueries[region] || ""}
                    onChange={(e) => setSearchQueries(prev => ({ ...prev, [region]: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-white/5 py-2.5 pl-10 pr-10 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none shadow-sm transition-all duration-300 hover:bg-slate-200/40 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:bg-white dark:focus:bg-night-950 focus:border-blue-600 dark:focus:border-cyan-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-cyan-400/10 focus:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                  />
                  {searchQueries[region] && (
                    <button
                      onClick={() => setSearchQueries(prev => ({ ...prev, [region]: "" }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-7 w-7 rounded-xl text-slate-400 hover:bg-slate-200/80 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {(() => {
                const query = (searchQueries[region] || "").toLowerCase().trim();
                const filteredMarkets = regionMarkets.filter((market: any) =>
                  (market.name || "").toLowerCase().includes(query) ||
                  (market.symbol || "").toLowerCase().includes(query)
                );

                if (filteredMarkets.length === 0) {
                  return (
                    <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:border-night-800 dark:bg-night-900/50 p-8 text-center text-slate-400 dark:text-slate-500">
                      No assets match "{query}" in this section.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                    {filteredMarkets.map((market: any) => (
                      <MarketHeatmapTile
                        key={market.symbol}
                        market={market}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}