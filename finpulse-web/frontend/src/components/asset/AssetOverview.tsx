// import { Landmark, TrendingUp, TrendingDown, Layers, BarChart, RefreshCw } from "lucide-react";

// interface AssetOverviewProps {
//   price: number;
//   open?: number;
//   previousClose?: number;
//   dayHigh?: number;
//   dayLow?: number;
//   fiftyTwoWeekHigh?: number;
//   fiftyTwoWeekLow?: number;
//   volume?: number;
//   marketCap?: number;
//   currency?: string;
//   exchange?: string;
//   assetType?: string;
// }

// export default function AssetOverview({
//   open,
//   previousClose,
//   dayHigh,
//   dayLow,
//   fiftyTwoWeekHigh,
//   fiftyTwoWeekLow,
//   volume,
//   marketCap,
//   currency = "USD",
//   exchange = "GLOBAL",
//   assetType = "Stock"
// }: AssetOverviewProps) {

//   const formatVal = (val?: number, isCap = false) => {
//     if (val === undefined || val === null) return "N/A";
//     if (isCap) {
//       if (assetType === "Index") {
//         if (val >= 1000000000000) return `${(val / 1000000000000).toFixed(2)}T`;
//         if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)}B`;
//         if (val >= 1000000) return `${(val / 1000000).toFixed(2)}M`;
//       } else {
//         if (val >= 1000000000000) return `$${(val / 1000000000000).toFixed(2)}T`;
//         if (val >= 1000000000) return `$${(val / 1000000000).toFixed(2)}B`;
//         if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
//       }
//     }
    
//     const formatted = val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
//     if (assetType === "Index") {
//       return formatted;
//     }
//     if (assetType === "Crypto") {
//       return `$${formatted}`;
//     }
    
//     const symbolMap: Record<string, string> = {
//       INR: "₹",
//       USD: "$",
//       EUR: "€",
//       GBP: "£",
//       JPY: "¥"
//     };
//     const cSymbol = symbolMap[currency] || "";
//     return `${cSymbol}${formatted}`;
//   };

//   const statItems = [
//     { label: "Open Price", value: formatVal(open), icon: <TrendingUp className="h-4 w-4 text-emerald-500" /> },
//     { label: "Previous Close", value: formatVal(previousClose), icon: <TrendingDown className="h-4 w-4 text-rose-500" /> },
//     { label: "Day High", value: formatVal(dayHigh), icon: <TrendingUp className="h-4 w-4 text-emerald-500" /> },
//     { label: "Day Low", value: formatVal(dayLow), icon: <TrendingDown className="h-4 w-4 text-rose-500" /> },
//     { label: "52-Week High", value: formatVal(fiftyTwoWeekHigh), icon: <TrendingUp className="h-4 w-4 text-emerald-600" /> },
//     { label: "52-Week Low", value: formatVal(fiftyTwoWeekLow), icon: <TrendingDown className="h-4 w-4 text-rose-600" /> },
//     { label: "Trading Volume", value: volume ? volume.toLocaleString() : "N/A", icon: <BarChart className="h-4 w-4 text-blue-500" /> },
//     { label: "Market Cap", value: formatVal(marketCap, true), icon: <Layers className="h-4 w-4 text-indigo-500" /> },
//     { label: "Trading Currency", value: currency, icon: <RefreshCw className="h-4 w-4 text-cyan-500" /> },
//     { label: "Exchange Location", value: exchange, icon: <Landmark className="h-4 w-4 text-violet-500" /> },
//   ];

//   return (
//     <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-6 bg-white dark:bg-night-900 shadow-lg">
//       <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
//         📊 Overview Statistics
//       </h3>
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//         {statItems.map((item, idx) => (
//           <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-white/[0.01] rounded-xl border border-slate-100 dark:border-white/5">
//             <div className="flex items-center gap-2">
//               {item.icon}
//               <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{item.label}</span>
//             </div>
//             <span className="text-sm font-extrabold text-slate-850 dark:text-slate-200 font-mono">{item.value}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }


import { useState, useEffect, useRef } from "react";
import { Landmark, TrendingUp, TrendingDown, Layers, BarChart, RefreshCw } from "lucide-react";

interface AssetOverviewProps {
  name: string;
  symbol: string;
  price: number;
  open?: number;
  previousClose?: number;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  volume?: number;
  averageVolume?: number;
  marketCap?: number;
  currency?: string;
  exchange?: string;
  assetType?: string;
}

export default function AssetOverview({
  name,
  symbol,
  price,
  open,
  previousClose,
  dayHigh,
  dayLow,
  fiftyTwoWeekHigh,
  fiftyTwoWeekLow,
  volume,
  averageVolume,
  marketCap,
  currency = "USD",
  exchange = "GLOBAL",
  assetType = "Stock"
}: AssetOverviewProps) {
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | null>(null);
  const prevPriceRef = useRef(price);

  useEffect(() => {
    if (price > prevPriceRef.current) {
      setPriceDirection("up");
      const timer = setTimeout(() => setPriceDirection(null), 600);
      prevPriceRef.current = price;
      return () => clearTimeout(timer);
    } else if (price < prevPriceRef.current) {
      setPriceDirection("down");
      const timer = setTimeout(() => setPriceDirection(null), 600);
      prevPriceRef.current = price;
      return () => clearTimeout(timer);
    }
  }, [price]);

  const formatVal = (val?: number, isCap = false) => {
    if (val === undefined || val === null) return "N/A";
    if (isCap) {
      if (assetType === "Index") {
        if (val >= 1000000000000) return `${(val / 1000000000000).toFixed(2)}T`;
        if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)}B`;
        if (val >= 1000000) return `${(val / 1000000).toFixed(2)}M`;
      } else {
        if (val >= 1000000000000) return `$${(val / 1000000000000).toFixed(2)}T`;
        if (val >= 1000000000) return `$${(val / 1000000000).toFixed(2)}B`;
        if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
      }
    }
    
    const formatted = val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    if (assetType === "Index") {
      return formatted;
    }
    if (assetType === "Crypto") {
      return `$${formatted}`;
    }
    
    const symbolMap: Record<string, string> = {
      INR: "₹",
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥"
    };
    const cSymbol = symbolMap[currency] || "";
    return `${cSymbol}${formatted}`;
  };

  const formatNum = (val: number) => {
    return Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const hasChange = previousClose !== undefined && previousClose > 0;
  const change = hasChange ? price - previousClose : 0;
  const changePercent = hasChange ? (change / previousClose) * 100 : 0;
  const isPositive = change >= 0;

  const isIndex = assetType === "Index";

  const statItems = [
    { label: "Open Price", value: formatVal(open), icon: <TrendingUp className="h-4 w-4 text-emerald-500" /> },
    { label: "Previous Close", value: formatVal(previousClose), icon: <TrendingDown className="h-4 w-4 text-rose-500" /> },
    { label: "Day High", value: formatVal(dayHigh), icon: <TrendingUp className="h-4 w-4 text-emerald-500" /> },
    { label: "Day Low", value: formatVal(dayLow), icon: <TrendingDown className="h-4 w-4 text-rose-500" /> },
    { label: "52-Week High", value: formatVal(fiftyTwoWeekHigh), icon: <TrendingUp className="h-4 w-4 text-emerald-600" /> },
    { label: "52-Week Low", value: formatVal(fiftyTwoWeekLow), icon: <TrendingDown className="h-4 w-4 text-rose-600" /> },
    ...(!isIndex ? [
      { label: "Trading Volume", value: volume ? volume.toLocaleString() : "N/A", icon: <BarChart className="h-4 w-4 text-blue-500" /> },
      { label: "Market Cap", value: formatVal(marketCap, true), icon: <Layers className="h-4 w-4 text-indigo-500" /> }
    ] : []),
    { label: "Trading Currency", value: currency, icon: <RefreshCw className="h-4 w-4 text-cyan-500" /> },
    { label: "Exchange Location", value: exchange, icon: <Landmark className="h-4 w-4 text-violet-500" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Title Header Card Container */}
      <div className="rounded-lg border border-[#242424] p-5 bg-[#111111] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#1C1C1C] text-[#A3A3A3] mb-2 uppercase tracking-wide">
            {assetType} • {exchange}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5] uppercase">
            {name}
          </h1>
          <p className="text-xs font-mono text-[#A3A3A3] mt-0.5">
            {symbol}
          </p>
        </div>
        
        {/* Index Points / Valuation Display */}
        <div className="text-left md:text-right flex flex-col md:items-end justify-center">
          <div className="flex items-center gap-1.5 justify-start md:justify-end">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
            </span>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">
              {assetType === "Index" ? "Index Points" : "Current Price"}
            </p>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-3xl font-bold font-mono tracking-tight transition-all duration-300 ${
              priceDirection === "up" 
                ? "text-[#22C55E]" 
                : priceDirection === "down" 
                  ? "text-[#EF4444]" 
                  : "text-[#F5F5F5]"
            }`}>
              {formatVal(price)}
            </span>
            {hasChange && (
              <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-bold font-mono ${
                isPositive 
                  ? "bg-[#22C55E]/10 text-[#22C55E]" 
                  : "bg-[#EF4444]/10 text-[#EF4444]"
              }`}>
                {isPositive ? "▲" : "▼"}
                {isPositive ? "+" : "-"}{formatNum(change)} ({isPositive ? "+" : "-"}{Math.abs(changePercent).toFixed(2)}%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Overview Statistics Layout Card Container */}
      <div className="rounded-lg border border-[#242424] p-5 bg-[#111111]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#A3A3A3] mb-4 border-b border-[#242424] pb-2">
          Compact Metric Grid
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {statItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-[#141414] rounded border border-[#242424]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#737373]">{item.label}</span>
              </div>
              <span className="text-xs font-bold text-[#F5F5F5] font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}