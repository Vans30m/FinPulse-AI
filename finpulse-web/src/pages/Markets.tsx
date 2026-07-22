import { useState, useMemo } from "react";
import { useGlobalMarkets } from "../hooks/useGlobalMarkets";
import MarketStatusBar from "../features/dashboard/components/MarketStatusBar";
import { Search, X, Activity, Filter, ChevronDown } from "lucide-react";
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
        rounded-2xl border p-2 sm:p-3 text-center transition-all duration-300 ease-out 
        hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md
        ${getHeatmapStyle(changePercent)}
      `}
    >
      {/* Symbol */}
      <span className="text-[8px] sm:text-[10px] font-black tracking-wider uppercase opacity-75 truncate max-w-full block px-0.5">
        {market.symbol.split('.')[0].replace("=X", "").replace("-USD", "").replace("=F", "")}
      </span>

      {/* Market Name */}
      <h4 className="line-clamp-2 text-[10px] sm:text-xs font-extrabold leading-tight tracking-tight mt-1 px-1 break-words">
        {market.name}
      </h4>

      {/* Price */}
      <span className="text-[9px] sm:text-[10px] font-bold opacity-80 mt-1.5 tabular-nums">
        {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>

      {/* Percentage Change */}
      <span className="text-[10px] sm:text-xs font-black tabular-nums tracking-tighter mt-1">
        {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
      </span>
    </div>
  );
}

export default function Markets() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<Record<string, "all" | "gainers" | "losers">>({});
  const { data: markets = [], isLoading } = useGlobalMarkets();

  const countries = [
    { name: "India", flag: "🇮🇳" },
    { name: "US", flag: "🇺🇸" },
    { name: "Europe", flag: "🇪🇺" },
    { name: "Japan", flag: "🇯🇵" },
    { name: "Taiwan", flag: "🇹🇼" },
    { name: "Hong Kong", flag: "🇭🇰" },
    { name: "South Korea", flag: "🇰🇷" },
    { name: "Canada", flag: "🇨🇦" },
    { name: "Australia", flag: "🇦🇺" },
    { name: "China", flag: "🇨🇳" },
    { name: "Brazil", flag: "🇧🇷" },
    { name: "Mexico", flag: "🇲🇽" },
    { name: "Singapore", flag: "🇸🇬" }
  ];

  const activeCountry = countries.find(c => c.name === activeCategory);
  const isCountryActive = countries.some(c => c.name === activeCategory);

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
      <div className="sticky top-16 md:top-[72px] z-20 -mx-4 flex flex-col gap-4 border-y border-slate-200/60 bg-slate-50/80 px-4 py-4 backdrop-blur-xl dark:border-night-800 dark:bg-night-900/80 md:mx-0 md:flex-row md:items-center md:justify-between md:rounded-2xl md:border">
        {/* Region Filters */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full md:w-auto py-1">
          {/* All */}
          <button
            onClick={() => {
              setActiveCategory("All");
              setIsDropdownOpen(false);
            }}
            className={`
              text-xs md:text-sm transition-all duration-200 whitespace-nowrap
              ${activeCategory === "All"
                ? "bg-white text-slate-900 shadow-sm border-transparent dark:bg-white dark:text-slate-950 font-bold px-4 py-2 rounded-full flex items-center gap-1.5 border"
                : "bg-slate-100/50 hover:bg-slate-100 border-slate-200 dark:bg-night-800/40 dark:border-night-700/50 hover:dark:bg-night-800/85 text-slate-600 dark:text-slate-300 font-bold px-4 py-2 rounded-full flex items-center gap-1.5 border transition-all duration-200"
              }
            `}
          >
            <span>🌐</span> All
          </button>

          {/* Countries Indices Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`
                text-xs md:text-sm transition-all duration-200 whitespace-nowrap
                ${["All", "Crypto", "Forex", "Commodities"].includes(activeCategory)
                  ? "bg-slate-100/50 hover:bg-slate-100 border-slate-200 dark:bg-night-800/40 dark:border-night-700/50 hover:dark:bg-night-800/85 text-slate-600 dark:text-slate-300 font-bold px-4 py-2 rounded-full flex items-center gap-1.5 border transition-all duration-200"
                  : "bg-white text-slate-900 shadow-sm border-transparent dark:bg-white dark:text-slate-950 font-bold px-4 py-2 rounded-full flex items-center gap-1.5 border"
                }
              `}
            >
              <span>{activeCountry ? activeCountry.flag : "🌍"}</span>
              <span>{activeCountry ? activeCountry.name : "Countries Indices"}</span>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Crypto */}
          <button
            onClick={() => {
              setActiveCategory("Crypto");
              setIsDropdownOpen(false);
            }}
            className={`
              text-xs md:text-sm transition-all duration-200 whitespace-nowrap
              ${activeCategory === "Crypto"
                ? "bg-white text-slate-900 shadow-sm border-transparent dark:bg-white dark:text-slate-950 font-bold px-4 py-2 rounded-full flex items-center gap-1.5 border"
                : "bg-slate-100/50 hover:bg-slate-100 border-slate-200 dark:bg-night-800/40 dark:border-night-700/50 hover:dark:bg-night-800/85 text-slate-600 dark:text-slate-300 font-bold px-4 py-2 rounded-full flex items-center gap-1.5 border transition-all duration-200"
              }
            `}
          >
            <span>🪙</span> Crypto
          </button>

          {/* Forex */}
          <button
            onClick={() => {
              setActiveCategory("Forex");
              setIsDropdownOpen(false);
            }}
            className={`
              text-xs md:text-sm transition-all duration-200 whitespace-nowrap
              ${activeCategory === "Forex"
                ? "bg-white text-slate-900 shadow-sm border-transparent dark:bg-white dark:text-slate-950 font-bold px-4 py-2 rounded-full flex items-center gap-1.5 border"
                : "bg-slate-100/50 hover:bg-slate-100 border-slate-200 dark:bg-night-800/40 dark:border-night-700/50 hover:dark:bg-night-800/85 text-slate-600 dark:text-slate-300 font-bold px-4 py-2 rounded-full flex items-center gap-1.5 border transition-all duration-200"
              }
            `}
          >
            <span>💱</span> Forex
          </button>

          {/* Commodities & Metals */}
          <button
            onClick={() => {
              setActiveCategory("Commodities");
              setIsDropdownOpen(false);
            }}
            className={`
              text-xs md:text-sm transition-all duration-200 whitespace-nowrap
              ${activeCategory === "Commodities"
                ? "bg-white text-slate-900 shadow-sm border-transparent dark:bg-white dark:text-slate-950 font-bold px-4 py-2 rounded-full flex items-center gap-1.5 border"
                : "bg-slate-100/50 hover:bg-slate-100 border-slate-200 dark:bg-night-800/40 dark:border-night-700/50 hover:dark:bg-night-800/85 text-slate-600 dark:text-slate-300 font-bold px-4 py-2 rounded-full flex items-center gap-1.5 border transition-all duration-200"
              }
            `}
          >
            <span>🛢</span> Commodities & Metals
          </button>
        </div>

        {/* Dropdown Overlay (placed outside the scrollable area to prevent clipping) */}
        {isDropdownOpen && (
          <>
            {/* Backdrop overlay */}
            <div className="fixed inset-0 z-20" onClick={() => setIsDropdownOpen(false)} />
            <div className="absolute left-10 md:left-24 top-[48px] md:top-[56px] z-30 w-52 max-h-60 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-2 shadow-lg dark:border-night-700 dark:bg-night-900 custom-scrollbar">
              {countries.map((country) => (
                <button
                  key={country.name}
                  onClick={() => {
                    setActiveCategory(country.name);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left rounded-xl px-3 py-2 text-xs font-semibold transition-all flex items-center gap-2 ${activeCategory === country.name
                      ? "bg-slate-100 dark:bg-night-800 text-slate-950 dark:text-white"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5"
                    }`}
                >
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Sorting tab buttons (instead of select dropdown) */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-200/50 p-1 dark:bg-night-800/50 w-full md:w-auto overflow-x-auto scrollbar-none">
          {[
            { value: "default", label: "Default" },
            { value: "gainers", label: "Top Gainers" },
            { value: "losers", label: "Top Losers" }
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`
                flex-1 md:flex-initial rounded-lg px-4 py-1.5 text-xs md:text-sm font-semibold transition-all duration-200 text-center whitespace-nowrap
                ${sortBy === opt.value
                  ? "bg-white text-slate-900 shadow-sm dark:bg-night-700 dark:text-white"
                  : "text-slate-600 hover:bg-white/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-night-700/50 dark:hover:text-white"
                }
              `}
            >
              {opt.label}
            </button>
          ))}
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
                  <h2 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
                    <span className="mr-2 opacity-90">{REGION_FLAGS[region as keyof typeof REGION_FLAGS]}</span>
                    {region} {region === "Crypto" || region === "Forex" || region === "Commodities" ? "" : "Indices"}
                    <span className="ml-2 text-[10px] md:text-xs font-semibold text-slate-400 dark:text-slate-500 normal-case">
                      ({regionMarkets.length} assets)
                    </span>
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-night-800"></div>
                </div>

                {/* Local Filter Button Group: All / Gainers / Losers */}
                <div className="flex items-center gap-1 rounded-xl bg-slate-200/50 p-1 dark:bg-night-800/50">
                  {[
                    { value: "all", label: "All" },
                    { value: "gainers", label: "Gainers" },
                    { value: "losers", label: "Losers" }
                  ].map((opt) => {
                    const isActive = (localFilters[region] || "all") === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setLocalFilters(prev => ({ ...prev, [region]: opt.value as any }))}
                        className={`
                          rounded-lg px-3 py-1 text-xs font-bold transition-all duration-200 text-center whitespace-nowrap
                          ${isActive
                            ? "bg-white text-slate-900 shadow-sm dark:bg-night-700 dark:text-white"
                            : "text-slate-600 hover:bg-white/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-night-700/50 dark:hover:text-white"
                          }
                        `}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(() => {
                const currentFilter = localFilters[region] || "all";
                let filteredMarkets = [...regionMarkets];

                if (currentFilter === "gainers") {
                  filteredMarkets = filteredMarkets
                    .filter((m: any) => (parseFloat(m.changePercent) || 0) > 0)
                    .sort((a: any, b: any) => (parseFloat(b.changePercent) || 0) - (parseFloat(a.changePercent) || 0));
                } else if (currentFilter === "losers") {
                  filteredMarkets = filteredMarkets
                    .filter((m: any) => (parseFloat(m.changePercent) || 0) < 0)
                    .sort((a: any, b: any) => (parseFloat(a.changePercent) || 0) - (parseFloat(b.changePercent) || 0));
                }

                if (filteredMarkets.length === 0) {
                  return (
                    <div className="rounded-2xl border border-slate-200/60 bg-white/50 dark:border-night-800 dark:bg-night-900/50 p-8 text-center text-slate-400 dark:text-slate-500">
                      No assets found matching this filter.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
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