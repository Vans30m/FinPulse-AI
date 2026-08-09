import { Globe } from "lucide-react";

interface AssetHeaderProps {
  name: string;
  symbol: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
  assetType?: string;
  marketState?: string;
}

export default function AssetHeader({
  name,
  symbol,
  exchange,
  price,
  change,
  changePercent,
  currency = "USD",
  assetType = "Stock",
  marketState = "CLOSED"
}: AssetHeaderProps) {
  const isPositive = change >= 0;

  // Dynamic currency symbol formatter
  const formatCurrency = (val: number) => {
    if (assetType === "Index") {
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }
    if (assetType === "Crypto") {
      return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    }
    const symbolMap: Record<string, string> = {
      INR: "₹",
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥"
    };
    const cSymbol = symbolMap[currency] || "";
    return `${cSymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  };

  // Premium letter-avatar color based on first letter of symbol
  const getAvatarColor = () => {
    const colors = [
      "from-blue-500 to-indigo-600 shadow-blue-500/25",
      "from-cyan-500 to-blue-600 shadow-cyan-500/25",
      "from-emerald-500 to-teal-600 shadow-emerald-500/25",
      "from-violet-500 to-purple-600 shadow-violet-500/25",
      "from-rose-500 to-pink-600 shadow-rose-500/25"
    ];
    const index = symbol.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const isMarketOpen = marketState.toUpperCase() === "REGULAR";

  return (
    <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-6 bg-white dark:bg-night-900 shadow-lg relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4.5">
          {/* Logo / Letter Avatar */}
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarColor()} flex items-center justify-center text-white text-xl font-black shadow-lg font-display uppercase shrink-0`}>
            {symbol.slice(0, 2).replace("^", "")}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight leading-none">
                {name}
              </h1>
              <span className="text-xs font-black uppercase tracking-wider bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-xl border border-slate-200/50 dark:border-white/5">
                {assetType}
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 dark:text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="font-mono bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-cyan-500/10">
                  {symbol}
                </span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <div className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                <span>{exchange || "GLOBAL"}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className={`${isMarketOpen ? "text-emerald-600 dark:text-emerald-450" : "text-rose-500"} flex items-center gap-1`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? "bg-emerald-500 animate-ping" : "bg-rose-500"}`} />
                {isMarketOpen ? "Market Open" : "Market Closed"}
              </span>
            </div>
          </div>
        </div>

        {/* Price Block */}
        <div className="flex flex-col sm:flex-row sm:items-center md:items-end justify-between md:flex-col gap-4">
          <div className="text-left md:text-right">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono leading-none tracking-tight">
              {formatCurrency(price)}
            </div>
            <div className={`mt-2 text-sm font-black flex items-center sm:justify-start md:justify-end gap-1.5 ${isPositive ? "text-emerald-600 dark:text-emerald-450" : "text-rose-500"}`}>
              <span>{isPositive ? "+" : ""}{changePercent.toFixed(2)}%</span>
              <span className="opacity-60">({isPositive ? "+" : ""}{change.toFixed(2)})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
