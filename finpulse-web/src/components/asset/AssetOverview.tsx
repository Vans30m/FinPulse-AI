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
  marketCap,
  currency = "USD",
  exchange = "GLOBAL",
  assetType = "Stock"
}: AssetOverviewProps) {

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

  const statItems = [
    { label: "Open Price", value: formatVal(open), icon: <TrendingUp className="h-4 w-4 text-emerald-500" /> },
    { label: "Previous Close", value: formatVal(previousClose), icon: <TrendingDown className="h-4 w-4 text-rose-500" /> },
    { label: "Day High", value: formatVal(dayHigh), icon: <TrendingUp className="h-4 w-4 text-emerald-500" /> },
    { label: "Day Low", value: formatVal(dayLow), icon: <TrendingDown className="h-4 w-4 text-rose-500" /> },
    { label: "52-Week High", value: formatVal(fiftyTwoWeekHigh), icon: <TrendingUp className="h-4 w-4 text-emerald-600" /> },
    { label: "52-Week Low", value: formatVal(fiftyTwoWeekLow), icon: <TrendingDown className="h-4 w-4 text-rose-600" /> },
    { label: "Trading Volume", value: volume ? volume.toLocaleString() : "N/A", icon: <BarChart className="h-4 w-4 text-blue-500" /> },
    { label: "Market Cap", value: formatVal(marketCap, true), icon: <Layers className="h-4 w-4 text-indigo-500" /> },
    { label: "Trading Currency", value: currency, icon: <RefreshCw className="h-4 w-4 text-cyan-500" /> },
    { label: "Exchange Location", value: exchange, icon: <Landmark className="h-4 w-4 text-violet-500" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Title Header Card Container */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-6 bg-white dark:bg-night-900 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mb-2">
            {assetType} • {exchange}
          </span>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {name}
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
            {symbol}
          </p>
        </div>
        
        {/* Index Points / Valuation Display */}
        <div className="text-left md:text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {assetType === "Index" ? "Index Points" : "Current Price"}
          </p>
          <p className="text-4xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
            {formatVal(price)}
          </p>
        </div>
      </div>

      {/* Overview Statistics Layout Card Container */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-6 bg-white dark:bg-night-900 shadow-lg">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          📊 Overview Statistics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {statItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-white/[0.01] rounded-xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                {item.icon}
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{item.label}</span>
              </div>
              <span className="text-sm font-extrabold text-slate-850 dark:text-slate-200 font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}