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
  // Filters
  const [search, setSearch] = useState('');
  const [changeFilter, setChangeFilter] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<'name' | 'price' | 'change' | 'sentiment'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Apply all filters
  const filteredData = initialData.filter((item) => {
    const q = search.toLowerCase();
    const companyOrSymbol =
      item.name.toLowerCase().includes(q) || item.symbol.toLowerCase().includes(q);

    // "Change" filter (Bullish/Bearish)
    const matchesChange =
      changeFilter === '' ||
      (changeFilter === 'Bullish' && item.isPositive) ||
      (changeFilter === 'Bearish' && !item.isPositive);

    // AI Sentiment filter (Bullish/Bearish/Neutral)
    const matchesSentiment =
      sentimentFilter === '' || (item.sentiment || 'Neutral') === sentimentFilter;

    return companyOrSymbol && matchesChange && matchesSentiment;
  });

  // Sorting logic
  const sortedData = [...filteredData].sort((a, b) => {
    let result = 0;
    switch (sortField) {
      case 'name':
        result = a.name.localeCompare(b.name);
        break;
      case 'price':
        result = parseFloat(a.price) - parseFloat(b.price);
        break;
      case 'change':
        result = parseFloat(a.change) - parseFloat(b.change);
        break;
      case 'sentiment':
        result = (a.sentiment || 'Neutral').localeCompare(b.sentiment || 'Neutral');
        break;
      default:
        result = 0;
    }
    return sortDirection === 'asc' ? result : -result;
  });

  const handleSort = (
    field: 'name' | 'price' | 'change' | 'sentiment'
  ) => {
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

              {/* COMPANY NAME */}
              <th className="p-4 min-w-[200px] align-top">
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    Company Name
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search by company or symbol..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-night-800 dark:text-white pl-8 pr-2 py-1 text-xs rounded-md border border-transparent focus:border-blue-500 dark:focus:border-cyan-500 focus:outline-none text-slate-900"
                    />
                  </div>
                </div>
              </th>

              {/* PRICE */}
              <th className="p-4 min-w-[120px] align-top">
                <div className="flex flex-col gap-1.5">
                  <button 
                    onClick={() => handleSort('price')}
                    className="flex items-center gap-1 justify-start text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    Price
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                  {/* No price filter, spacer for alignment */}
                  <div style={{height: "28px"}}></div>
                </div>
              </th>

              {/* CHANGE */}
              <th className="p-4 min-w-[110px] align-top">
                <div className="flex flex-col gap-1.5">
                  <button 
                    onClick={() => handleSort('change')}
                    className="flex items-center gap-1 justify-start text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    Change
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                  <select
                    value={changeFilter}
                    onChange={(e) => setChangeFilter(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-night-800 dark:text-white pl-3 pr-2 py-1 text-xs rounded-md border border-transparent focus:border-blue-500 dark:focus:border-cyan-500 focus:outline-none text-slate-900"
                  >
                    <option value="">All</option>
                    <option value="Bullish">Bullish</option>
                    <option value="Bearish">Bearish</option>
                  </select>
                </div>
              </th>

              {/* SENTIMENT */}
              <th className="p-4 min-w-[130px] align-top">
                <div className="flex flex-col gap-1.5">
                  <button 
                    onClick={() => handleSort('sentiment')}
                    className="flex items-center gap-1 justify-start text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    AI Sentiment
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                  <select
                    value={sentimentFilter}
                    onChange={(e) => setSentimentFilter(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-night-800 dark:text-white pl-3 pr-2 py-1 text-xs rounded-md border border-transparent focus:border-blue-500 dark:focus:border-cyan-500 focus:outline-none text-slate-900"
                  >
                    <option value="">All</option>
                    <option value="Bullish">Bullish</option>
                    <option value="Bearish">Bearish</option>
                    <option value="Neutral">Neutral</option>
                  </select>
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {sortedData.length > 0 ? (
              sortedData.map((item) => (
                <tr 
                  key={item.symbol} 
                  className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                >
                  {/* Name */}
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300 font-bold group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                    {item.name}{' '}
                    <span className="font-normal text-xs text-slate-400 dark:text-slate-500">
                      ({item.symbol})
                    </span>
                  </td>
                  {/* Price (EMPHASIZED) */}
                  <td className="p-4">
                    <span className="text-lg font-extrabold text-blue-700 dark:text-cyan-300 bg-slate-50 dark:bg-cyan-900/20 rounded px-2 py-1 tracking-wide">
                      {item.price}
                    </span>
                  </td>
                  {/* Change */}
                  <td className="p-4 text-sm">
                    <div className="flex flex-col items-end">
                      <span className={`font-medium ${item.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {item.isPositive ? 'Bullish' : 'Bearish'}
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
                <td colSpan={4} className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  No stocks match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}