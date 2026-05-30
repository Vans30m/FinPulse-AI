import { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, Globe } from 'lucide-react';

interface IndexData {
  name: string;
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
  sparklinePoints: string; // SVG path data points
  type: 'Domestic' | 'Global';
}

const INDICES_DATA: IndexData[] = [
  {
    name: 'NIFTY 50',
    symbol: '^NSEI',
    price: '22,419.55',
    change: '+142.20',
    changePercent: '+0.64%',
    isPositive: true,
    sparklinePoints: '0,40 15,35 30,38 45,25 60,28 75,15 90,18 105,8 120,12 135,2 150,5',
    type: 'Domestic'
  },
  {
    name: 'SENSEX',
    symbol: '^BSESN',
    price: '73,878.15',
    change: '+486.50',
    changePercent: '+0.66%',
    isPositive: true,
    sparklinePoints: '0,38 15,40 30,30 45,35 60,20 75,25 90,12 105,18 120,5 135,10 150,2',
    type: 'Domestic'
  },
  {
    name: 'BANK NIFTY',
    symbol: '^NSEBANK',
    price: '47,286.40',
    change: '-120.15',
    changePercent: '-0.25%',
    isPositive: false,
    sparklinePoints: '0,5 15,12 30,8 45,22 60,18 75,32 90,28 105,42 120,38 135,48 150,45',
    type: 'Domestic'
  },
  {
    name: 'S&P 500',
    symbol: '^GSPC',
    price: '5,222.68',
    change: '+63.20',
    changePercent: '+1.22%',
    isPositive: true,
    sparklinePoints: '0,45 15,38 30,42 45,28 60,30 75,18 90,22 105,12 120,15 135,2 150,4',
    type: 'Global'
  },
  {
    name: 'NASDAQ 100',
    symbol: '^NDX',
    price: '18,156.45',
    change: '+298.10',
    changePercent: '+1.67%',
    isPositive: true,
    sparklinePoints: '0,48 15,40 30,44 45,25 60,28 75,12 90,16 105,4 120,8 135,0 150,2',
    type: 'Global'
  }
];

export default function MarketFeedStream() {
  const [filter, setFilter] = useState<'All' | 'Domestic' | 'Global'>('All');

  const filteredIndices = INDICES_DATA.filter(
    (item) => filter === 'All' || item.type === filter
  );

  return (
    <div className="w-full space-y-4">
      {/* Feed Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Indices Stream</h2>
        </div>
        
        {/* Toggle Pills */}
        <div className="flex gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl self-start">
          {(['All', 'Domestic', 'Global'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                filter === type
                  ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Index Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredIndices.map((index) => (
          <div
            key={index.symbol}
            className="glass-card p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer group"
          >
            {/* Top row: Name and Arrow Link */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                  {index.type}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                  {index.name}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">{index.symbol}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Bottom Row: Financial Figures & Sparkline */}
            <div className="flex items-end justify-between mt-6">
              <div>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {index.price}
                </p>
                
                <div className="flex items-center gap-1.5 mt-1">
                  {index.isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  )}
                  <span className={`text-xs font-semibold ${index.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {index.change} ({index.changePercent})
                  </span>
                </div>
              </div>

              {/* Lightweight SVG Sparkline */}
              <div className="w-[120px] h-[40px] overflow-visible">
                <svg className="w-full h-full">
                  <polyline
                    fill="none"
                    stroke={index.isPositive ? '#10b981' : '#f43f5e'} // Emerald vs Rose matching your theme
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={index.sparklinePoints}
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
