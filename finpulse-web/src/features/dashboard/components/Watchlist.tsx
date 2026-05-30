import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';

interface WatchlistItem {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
  sentiment?: 'Bullish' | 'Bearish' | 'Neutral';
}

interface WatchlistProps {
  initialData: WatchlistItem[];
}

export default function Watchlist({ initialData }: WatchlistProps) {
  // Separate search states for Symbol and Name
  const [symbolSearch, setSymbolSearch] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  
  // Sort state
  const [sortField, setSortField] = useState<'symbol' | 'price'>('symbol');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Handle multi-column filtering
  const filteredData = initialData.filter((item) => {
    const matchesSymbol = item.symbol.toLowerCase().includes(symbolSearch.toLowerCase());
    const matchesName = item.name.toLowerCase().includes(nameSearch.toLowerCase());
    return matchesSymbol && matchesName;
  });

  const handleSort = (field: 'symbol' | 'price') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="w-full glass-card overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-900 shadow-xl transition-colors duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
              
              {/* SYMBOL SECTION WITH EMBEDDED FILTER */}
              <th className="p-4 min-w-[150px]">
                <div className="flex flex-col gap-1.5">
                  <button 
                    onClick={() => handleSort('symbol')}
                    className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors self-start"
                  >
                    Symbol
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter symbol..."
                      value={symbolSearch}
                      onChange={(e) => setSymbolSearch(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-white/5 pl-8 pr-2 py-1 text-xs rounded-md border border-transparent focus:border-blue-500 dark:focus:border-cyan-500 focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </th>

              {/* NAME SECTION WITH EMBEDDED FILTER */}
              <th className="p-4 min-w-[200px]">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Company Name
                  </span>
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter name..."
                      value={nameSearch}
                      onChange={(e) => setNameSearch(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-white/5 pl-8 pr-2 py-1 text-xs rounded-md border border-transparent focus:border-blue-500 dark:focus:border-cyan-500 focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </th>

              {/* PRICE SECTION */}
              <th className="p-4 text-right">
                <button 
                  onClick={() => handleSort('price')}
                  className="flex items-center justify-end gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors w-full"
                >
                  Price
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>

              {/* CHANGE SECTION */}
              <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Change
              </th>

              {/* SENTIMENT SECTION */}
              <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                AI Sentiment
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr 
                  key={item.symbol} 
                  className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                >
                  {/* Symbol */}
                  <td className="p-4 font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                    {item.symbol}
                  </td>
                  
                  {/* Name */}
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                    {item.name}
                  </td>
                  
                  {/* Price */}
                  <td className="p-4 text-right font-semibold text-slate-900 dark:text-white">
                    {item.price}
                  </td>
                  
                  {/* Change */}
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-medium ${item.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {item.change}
                      </span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                        item.isPositive 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' 
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                      }`}>
                        {item.changePercent}
                      </span>
                    </div>
                  </td>

                  {/* Sentiment */}
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.sentiment === 'Bullish'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : item.sentiment === 'Bearish'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400'
                        : 'bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-400'
                    }`}>
                      {item.sentiment === 'Bullish' && <TrendingUp className="h-3 w-3" />}
                      {item.sentiment === 'Bearish' && <TrendingDown className="h-3 w-3" />}
                      {item.sentiment || 'Neutral'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  No stocks match your specific header filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
