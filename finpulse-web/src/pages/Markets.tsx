import { useState, useMemo, } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useGlobalMarkets } from "../hooks/useGlobalMarkets";
import GlobalSnapshot from "../components/markets/GlobalSnapshot";
import MarketHeatmap from "../components/markets/MarketHeatmap";
import {useNavigate} from "react-router-dom";
import MarketStatusBar from "../features/dashboard/components/MarketStatusBar";

export default function Markets() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const { data: markets = [], isLoading } = useGlobalMarkets();

  const categories = [
    "All", "India", "US", "Europe", "Japan", "Taiwan", "Hong Kong", "South Korea",
  ];

  const REGION_FLAGS = {
    India: "🇮🇳",
    US: "🇺🇸",
    Europe: "🇪🇺",
    Japan: "🇯🇵",
    "Hong Kong": "🇭🇰",
    Taiwan: "🇹🇼",
    "South Korea": "🇰🇷",
  };

  // Safely calculate top gainer and exclude VIX
  const topGainer = useMemo(() => {
    if (!markets.length) return null;
    const nonVixMarkets = markets.filter(
      (m: any) => 
        !m?.name?.toLowerCase().includes("vix") && 
        !m?.symbol?.toLowerCase().includes("vix")
    );
    if (!nonVixMarkets.length) return null;
    return [...nonVixMarkets].sort((a, b) => (parseFloat(b.changePercent) || 0) - (parseFloat(a.changePercent) || 0))[0];
  }, [markets]);

  const topLoser = useMemo(() => {
    if (!markets.length) return null;
    const nonVixMarkets = markets.filter(
      (m: any) => 
        !m?.name?.toLowerCase().includes("vix") && 
        !m?.symbol?.toLowerCase().includes("vix")
    );
    if (!nonVixMarkets.length) return null;
    return [...nonVixMarkets].sort((a, b) => (parseFloat(a.changePercent) || 0) - (parseFloat(b.changePercent) || 0))[0];
  }, [markets]);

  const snapshotMarkets = useMemo(() => {
    if (!markets || !Array.isArray(markets)) return [];
    return markets.filter((m: any) => {
      const searchString = `${m?.name || ""} ${m?.symbol || ""}`.toLowerCase();
      return (
        searchString.includes("nifty") ||
        searchString.includes("banknifty") ||
        searchString.includes("dow") ||
        searchString.includes("nasdaq")
      );
    });
  }, [markets]);

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
      <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
        <div className="h-10 w-48 rounded-lg bg-slate-200 dark:bg-night-800 animate-pulse"></div>
        <div className="h-24 w-full rounded-2xl bg-slate-200 dark:bg-night-800 animate-pulse"></div>
        <div className="flex gap-4">
          <div className="h-20 flex-1 rounded-2xl bg-slate-200 dark:bg-night-800 animate-pulse"></div>
          <div className="h-20 flex-1 rounded-2xl bg-slate-200 dark:bg-night-800 animate-pulse"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-100 dark:bg-night-800/50 animate-pulse"></div>
          ))}
        </div>
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

      {/* 2. Global Snapshot */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-md p-2 shadow-sm dark:border-night-800 dark:bg-night-900/50">
        <GlobalSnapshot markets={snapshotMarkets} />
      </div>

      {/* 3. Top Movers Highlights */}
      <div className="grid gap-4 md:grid-cols-2">
        {topGainer && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm transition-all dark:border-emerald-500/10 dark:from-emerald-500/5 dark:to-night-900">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Top Gainer</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white leading-tight">{topGainer.name}</h3>
            </div>
            <div className="text-right">
              <p className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {Number(topGainer.price).toLocaleString()}
              </p>
              <p className="text-sm font-bold text-emerald-500 mt-0.5">+{Number(topGainer.changePercent).toFixed(2)}%</p>
            </div>
          </div>
        )}
        {topLoser && (
          <div className="flex items-center justify-between rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm transition-all dark:border-rose-500/10 dark:from-rose-500/5 dark:to-night-900">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Top Loser</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white leading-tight">{topLoser.name}</h3>
            </div>
            <div className="text-right">
              <p className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {Number(topLoser.price).toLocaleString()}
              </p>
              <p className="text-sm font-bold text-rose-500 mt-0.5">{Number(topLoser.changePercent).toFixed(2)}%</p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Heatmap */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-night-800 dark:bg-night-900/50">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Market Heatmap</h3>
        <MarketHeatmap markets={markets} />
      </div>

      {/* 5. Control Center (Search removed, elements centrally aligned) */}
      <div className="sticky top-0 z-20 -mx-4 flex flex-col gap-4 border-y border-slate-200/60 bg-slate-50/80 px-4 py-4 backdrop-blur-xl dark:border-night-800 dark:bg-night-900/80 md:mx-0 md:flex-row md:items-center md:justify-between md:rounded-2xl md:border">
        {/* Region Filters */}
        <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-200/50 p-1 dark:bg-night-800/50 w-full md:w-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`
                rounded-lg px-4 py-1.5 text-sm font-semibold transition-all duration-200 flex-1 md:flex-initial text-center
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

      {/* 6. Markets Grid */}
      <div className="space-y-10 pt-2">
        {Object.entries(groupedMarkets).map(([region, regionMarkets]: any) => {
          if (activeCategory !== "All" && activeCategory !== region) return null;
          if (!regionMarkets || regionMarkets.length === 0) return null;

          return (
            <div key={region} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
                  <span className="mr-2 opacity-90">{REGION_FLAGS[region as keyof typeof REGION_FLAGS]}</span>
                  {region}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-night-800"></div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {regionMarkets.map((market: any) => {
                  const changePercent = parseFloat(market.changePercent) || 0;
                  const change = parseFloat(market.change) || 0;
                  const price = parseFloat(market.price) || 0;
                  const isPositive = changePercent >= 0;

                  const mockHistory = Array.from({ length: 15 }).map((_, idx) => ({
                    price: price * (1 + (Math.random() * 0.02 - 0.01) * (15 - idx))
                  }));
                  mockHistory.push({ price });

                  const strokeColor = isPositive ? "#10b981" : "#f43f5e";
                  const gradientId = `gradient-${market.symbol.replace(/\^/g, '')}`;

                  return (
                    <div
                      key={market.symbol}
                      onClick={() =>
                        navigate(
                          `/asset/${encodeURIComponent(market.symbol)}`,
                          { state: { name: market.name } }
                        )
                      }
                      className="
                        relative group cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 
                        backdrop-blur-sm transition-all duration-300 ease-out shadow-sm
                        hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/5 
                        dark:border-night-800 dark:bg-night-900/80 dark:hover:border-night-600
                      "
                    >
                      <div className="flex items-start justify-between gap-3 relative z-10">
                        <div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-1 leading-tight">
                            {market.name}
                          </h3>
                        </div>
                        <span className="shrink-0 rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-night-800 dark:text-slate-400">
                          {market.region}
                        </span>
                      </div>

                      <div className="mt-6 flex items-end justify-between relative z-10">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-baseline gap-1.5">
                            <p className="text-2xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
                              {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>

                          <div
                            className={`flex items-center gap-1.5 text-sm font-semibold mt-0.5 ${
                              isPositive ? "text-emerald-500" : "text-rose-500"
                            }`}
                          >
                            <span className="flex items-center justify-center rounded-full bg-current/10 p-0.5">
                              {isPositive ? (
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                </svg>
                              ) : (
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
                                </svg>
                              )}
                            </span>
                            <span>{Math.abs(change).toFixed(2)}</span>
                            <span>({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)</span>
                          </div>
                        </div>

                        {/* Recharts Sparkline */}
                        <div className="h-14 w-28 opacity-75 group-hover:opacity-100 transition-opacity duration-300">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockHistory}>
                              <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35} />
                                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <Area
                                type="monotone"
                                dataKey="price"
                                stroke={strokeColor}
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill={`url(#${gradientId})`}
                                isAnimationActive={false}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}