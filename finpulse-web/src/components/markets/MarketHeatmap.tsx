import { useMemo } from "react";
import { useChart } from "../../context/ChartContext";

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
  const { openAsset } = useChart();

  const handleTileClick = (market: Market) => {
    openAsset({
      symbol: market.symbol,
      yahooSymbol: market.symbol,
      name: market.name,
      exchange: market.region,
      type: "Index",
      price: market.price,
      change: market.change,
      changePercent: market.changePercent,
    });
  };

  // Group markets by asset category/region sections
  const groupedSections = useMemo(() => {
    const groups: Record<string, { label: string; icon: string; items: Market[] }> = {
      india: { label: "India Indices", icon: "🇮🇳", items: [] },
      us: { label: "US Indices", icon: "🇺🇸", items: [] },
      europe: { label: "Europe Indices", icon: "🇪🇺", items: [] },
      japan: { label: "Japan Indices", icon: "🇯🇵", items: [] },
      hongkong: { label: "Hong Kong Indices", icon: "🇭🇰", items: [] },
      taiwan: { label: "Taiwan Indices", icon: "🇹🇼", items: [] },
      southkorea: { label: "South Korea Indices", icon: "🇰🇷", items: [] },
      crypto: { label: "Cryptocurrency", icon: "🪙", items: [] },
      forex: { label: "Forex Pairs", icon: "💱", items: [] },
      commodities: { label: "Commodities", icon: "🛢", items: [] },
      other: { label: "Other Markets", icon: "🌍", items: [] }
    };

    markets.forEach((m) => {
      const regionLower = m.region.toLowerCase();
      if (regionLower === "india") groups.india.items.push(m);
      else if (regionLower === "us" || regionLower === "usa") groups.us.items.push(m);
      else if (regionLower === "europe") groups.europe.items.push(m);
      else if (regionLower === "japan") groups.japan.items.push(m);
      else if (regionLower === "hong kong") groups.hongkong.items.push(m);
      else if (regionLower === "taiwan") groups.taiwan.items.push(m);
      else if (regionLower === "south korea") groups.southkorea.items.push(m);
      else if (regionLower === "crypto") groups.crypto.items.push(m);
      else if (regionLower === "forex") groups.forex.items.push(m);
      else if (regionLower === "commodities") groups.commodities.items.push(m);
      else groups.other.items.push(m);
    });

    // Sort items within each group by changePercent descending
    Object.keys(groups).forEach((key) => {
      groups[key].items.sort(
        (a, b) => (parseFloat(b.changePercent as any) || 0) - (parseFloat(a.changePercent as any) || 0)
      );
    });

    return groups;
  }, [markets]);

  // Refined multi-tier color scale for high contrast
  const getHeatmapStyle = (change: number) => {
    if (change >= 1.5) {
      return "bg-emerald-700 dark:bg-emerald-800 text-white border-emerald-600/40 hover:bg-emerald-650 dark:hover:bg-emerald-750";
    }
    if (change > 0) {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15";
    }
    if (change === 0) {
      return "bg-slate-50 text-slate-400 border-slate-200 dark:bg-white/[0.01] dark:text-slate-500 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/[0.02]";
    }
    if (change <= -1.0) {
      return "bg-rose-700 dark:bg-rose-800 text-white border-rose-600/40 hover:bg-rose-650 dark:hover:bg-rose-750";
    }
    return "bg-rose-50/50 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-50/80 dark:hover:bg-rose-950/15";
  };

  if (!markets || markets.length === 0) return null;

  return (
    <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-night-800 dark:bg-night-900/50 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <span>🌍</span> Global Market Heatmap
        </h2>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
          Sorted by Performance
        </span>
      </div>

      {Object.entries(groupedSections).map(([key, section]) => {
        if (section.items.length === 0) return null;

        return (
          <div key={key} className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-wide uppercase opacity-80">
              <span>{section.icon}</span> {section.label}
              <span className="text-xs font-medium text-slate-400 normal-case">
                ({section.items.length} assets)
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {section.items.map((market) => {
                const change = parseFloat(market.changePercent as any) || 0;
                const isPositive = change > 0;

                return (
                  <div
                    key={market.symbol}
                    onClick={() => handleTileClick(market)}
                    className={`
                      group relative flex aspect-[1.1] cursor-pointer flex-col items-center justify-center 
                      rounded-2xl border p-3 text-center transition-all duration-300 ease-out 
                      hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md
                      ${getHeatmapStyle(change)}
                    `}
                  >
                    {/* Symbol */}
                    <span className="text-[10px] font-black tracking-wider uppercase opacity-75">
                      {market.symbol.replace("=X", "").replace("-USD", "").replace("=F", "")}
                    </span>

                    {/* Market Name */}
                    <h4 className="line-clamp-1 text-xs font-extrabold leading-tight tracking-tight mt-1">
                      {market.name}
                    </h4>

                    {/* Percentage Change */}
                    <span className="text-sm font-black tabular-nums tracking-tighter mt-1.5">
                      {isPositive ? "+" : ""}
                      {change.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}