import { useState } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

// 1. Define the Data Types
type Stock = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
};

// 2. Mock Data representing your curated lists
const SCREENER_DATA: Record<string, Stock[]> = {
  'Gainers': [
    { symbol: 'RELIANCE', name: 'Reliance Ind.', price: '₹2,954.20', change: '+42.10', changePercent: '+1.45%', isPositive: true },
    { symbol: 'TCS', name: 'Tata Consultancy', price: '₹4,120.50', change: '+85.20', changePercent: '+2.11%', isPositive: true },
    { symbol: 'ZOMATO', name: 'Zomato Ltd.', price: '₹184.30', change: '+12.40', changePercent: '+7.21%', isPositive: true },
    { symbol: 'TATAMOTORS', name: 'Tata Motors', price: '₹1,024.15', change: '+34.80', changePercent: '+3.52%', isPositive: true },
    { symbol: 'JIOFIN', name: 'Jio Financial', price: '₹378.90', change: '+18.10', changePercent: '+5.02%', isPositive: true },
  ],
  'Losers': [
    { symbol: 'HDFCBANK', name: 'HDFC Bank', price: '₹1,432.10', change: '-24.50', changePercent: '-1.68%', isPositive: false },
    { symbol: 'INFY', name: 'Infosys', price: '₹1,489.00', change: '-42.10', changePercent: '-2.75%', isPositive: false },
    { symbol: 'PAYTM', name: 'One97 Comm.', price: '₹412.30', change: '-18.90', changePercent: '-4.38%', isPositive: false },
    { symbol: 'ITC', name: 'ITC Limited', price: '₹421.50', change: '-5.20', changePercent: '-1.22%', isPositive: false },
    { symbol: 'WIPRO', name: 'Wipro Limited', price: '₹482.10', change: '-8.40', changePercent: '-1.71%', isPositive: false },
  ],
  'Active': [
    { symbol: 'HDFCBANK', name: 'HDFC Bank', price: '₹1,432.10', change: '-24.50', changePercent: '-1.68%', isPositive: false },
    { symbol: 'RELIANCE', name: 'Reliance Ind.', price: '₹2,954.20', change: '+42.10', changePercent: '+1.45%', isPositive: true },
    { symbol: 'SBIN', name: 'State Bank', price: '₹765.40', change: '+12.30', changePercent: '+1.63%', isPositive: true },
    { symbol: 'ICICIBANK', name: 'ICICI Bank', price: '₹1,084.20', change: '+8.90', changePercent: '+0.83%', isPositive: true },
    { symbol: 'TATAPOWER', name: 'Tata Power', price: '₹418.50', change: '+15.20', changePercent: '+3.77%', isPositive: true },
  ]
};

export default function MarketScreeners() {
  const [activeTab, setActiveTab] = useState<'Gainers' | 'Losers' | 'Active'>('Gainers');

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