import { useMemo } from "react";

interface Market {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  changePercent?: number;
  region?: string;
}

interface Props {
  markets: Market[];
}

// Using lowercase for safer matching
const SNAPSHOT_TARGETS = [
  "nifty 50",
  "bank nifty",
  "dow jones",
  "nasdaq",
];

export default function GlobalSnapshot({ markets }: Props) {
  // Robust, case-insensitive filtering to ensure we always find the targets
  const snapshotMarkets = useMemo(() => {
    if (!markets || !Array.isArray(markets)) return [];
    
    const foundMarkets = markets.filter((market) => {
      const marketName = (market.name || "").toLowerCase();
      return SNAPSHOT_TARGETS.some((target) => marketName.includes(target));
    });

    // Optional: Sort them to match the order of SNAPSHOT_TARGETS
    return foundMarkets;
  }, [markets]);

  if (snapshotMarkets.length === 0) {
    return null; // Hide cleanly if data isn't ready yet
  }

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between px-2">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Live Market Overview
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Updating
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {snapshotMarkets.map((market) => {
          const changePercent = parseFloat(market.changePercent as any) || 0;
          const change = parseFloat(market.change as any) || 0;
          const price = parseFloat(market.price as any) || 0;
          const isPositive = changePercent >= 0;

          return (
            <div
              key={market.symbol}
              className="
                group relative overflow-hidden rounded-xl bg-slate-50/50 p-4 transition-all duration-300 
                hover:bg-white hover:shadow-md hover:shadow-slate-200/50 
                dark:bg-night-800/50 dark:hover:bg-night-800 dark:hover:shadow-night-900/50
              "
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {market.name}
                </span>
                
                {/* Dynamic mini-icon based on performance */}
                <span className={`shrink-0 rounded-full p-1 ${isPositive ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
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
              </div>

              <div className="mt-3 flex flex-col">
                <div className="text-xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
                  {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                <div
                  className={`mt-0.5 flex items-center gap-1 text-xs font-bold ${
                    isPositive ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  <span>
                    {isPositive ? "+" : ""}
                    {change.toFixed(2)}
                  </span>
                  <span>
                    ({isPositive ? "+" : ""}
                    {changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}