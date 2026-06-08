import { useState } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import {
  useChart,
}
from "../../../context/ChartContext";

// 1. Define the Data Types
type Stock = {
  symbol: string;
  yahooSymbol: string;
  exchange: string;
  type: string;

  name: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
};

// 2. Mock Data representing your curated lists
const SCREENER_DATA: Record<string, Stock[]> = {
  'Gainers': [
    {
  symbol: "RELIANCE",
  yahooSymbol: "RELIANCE.NS",
  exchange: "NSE",
  type: "equity",

  name: "Reliance Ind.",
  price: "₹2,954.20",
  change: "+42.10",
  changePercent: "+1.45%",
  isPositive: true
},
  {
  symbol: "AAPL",
  yahooSymbol: "AAPL",
  exchange: "NASDAQ",
  type: "equity",

  name: "Apple Inc.",
  price: "$150.25",
  change: "+2.15",
  changePercent: "+1.45%",
  isPositive: true
},
{
  symbol: "BTCUSD",
  yahooSymbol: "BTC-USD",
  exchange: "CRYPTO",
  type: "crypto",

  name: "Bitcoin",
  price: "$61,234.56",
  change: "+1,234.56",
  changePercent: "+2.05%",
  isPositive: true
},
{
  symbol: "XAUUSD",
  yahooSymbol: "GC=F",
  exchange: "COMEX",
  type: "commodity",

  name: "Gold",
  price: "$1,800.75",
  change: "+15.25",
  changePercent: "+0.85%",
  isPositive: true
}
  ],
  'Losers': [
    {
  symbol: "XAUUSD",
  yahooSymbol: "GC=F",
  exchange: "COMEX",
  type: "commodity",

  name: "Gold",
  price: "$1,800.75",
  change: "+15.25",
  changePercent: "+0.85%",
  isPositive: true},
  ],
  'Active': [
    {
  symbol: "XAUUSD",
  yahooSymbol: "GC=F",
  exchange: "COMEX",
  type: "commodity",

  name: "Gold",
  price: "$1,800.75",
  change: "+15.25",
  changePercent: "+0.85%",
  isPositive: true},
  ]
};

export default function MarketScreeners() {

  const { openChart } =
    useChart();

  const [activeTab, setActiveTab] =
    useState<
      'Gainers' |
      'Losers' |
      'Active'
    >('Gainers');

  const tabs = [
    { id: 'Gainers', label: 'Top Gainers', icon: TrendingUp },
    { id: 'Losers', label: 'Top Losers', icon: TrendingDown },
    { id: 'Active', label: 'Most Active', icon: Activity },
  ] as const;

  return (
    <div className="w-full space-y-4">
      {/* 3. The Tabs (Groww Style) */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-white/10 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors relative ${
                isActive 
                  ? 'text-blue-600 dark:text-cyan-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {isActive && (
                <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-blue-600 dark:bg-cyan-400 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* 4. The Horizontally Scrolling Container */}
      {/* snap-x and custom-scrollbar make it feel like a native mobile app */}
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory custom-scrollbar -mx-2 px-2">
        {SCREENER_DATA[activeTab].map((stock) => (
          <div 
            key={stock.symbol}
onClick={() =>
  openChart({
    symbol: stock.symbol,
    yahooSymbol:
      stock.yahooSymbol,

    name: stock.name,

    exchange:
      stock.exchange,

    type:
      stock.type,
  })
}
            className="min-w-[160px] sm:min-w-[180px] shrink-0 snap-start glass-card p-4 hover:border-blue-300 dark:hover:border-cyan-500/50 cursor-pointer group transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                  {stock.symbol}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate w-24">
                  {stock.name}
                </p>
              </div>
            </div>

            <div>
              <p className="text-base font-semibold text-slate-900 dark:text-white">
                {stock.price}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium ${stock.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {stock.change}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center ${
                  stock.isPositive 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' 
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                }`}>
                  {stock.changePercent}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}