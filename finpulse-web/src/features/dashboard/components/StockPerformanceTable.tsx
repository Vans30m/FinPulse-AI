import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowUpDown, Search, Table, LayoutGrid, Inbox } from 'lucide-react';

export interface PerformanceData {
  ticker: string;
  name: string;
  colorClass: {
    bg: string;
    text: string;
    border: string;
  };
  price: number;
  change1d: number;
  change1w: number;
  change1m: number;
  change3m: number;
  change1y: number;
}

interface StockPerformanceTableProps {
  customData?: PerformanceData[];
}

type SortKey = 'ticker' | 'price' | 'change1d' | 'change1w' | 'change1m' | 'change3m' | 'change1y';

export default function StockPerformanceTable({ customData }: StockPerformanceTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('change1d');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'heatmap'>('table');

  const activeDataSource = customData || [];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const sortedStocks = [...activeDataSource]
    .filter(
      (stock) =>
        stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

  const renderPercentage = (value: number) => {
    const isPositive = value >= 0;
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-sm font-semibold px-2 py-1 rounded-lg ${
          isPositive
            ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10'
            : 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10'
        }`}
      >
        {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
        {Math.abs(value).toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
      {/* Table Header Section */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Performance Analytics</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compare equity returns across different timeline intervals.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Input Filter */}
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter active pool..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-600 dark:focus:border-blue-400 transition-all"
            />
          </div>

          {/* Premium Segmented Controls View Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/40 dark:border-slate-700/50">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'heatmap' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Heatmap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Dynamic Viewport Engine Wrapper */}
      <div className="relative min-h-[220px]">
        {sortedStocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-8 w-8 text-slate-400 mb-2" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">No active assets evaluated</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1">Add items via the backtest search input bar above.</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6 cursor-pointer hover:text-slate-900 dark:hover:text-white select-none" onClick={() => handleSort('ticker')}>
                    <div className="flex items-center gap-1">Company <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="py-4 px-6 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none" onClick={() => handleSort('price')}>
                    <div className="flex items-center justify-end gap-1">Price <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="py-4 px-6 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none" onClick={() => handleSort('change1d')}>
                    <div className="flex items-center justify-end gap-1">1 Day <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="py-4 px-6 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none" onClick={() => handleSort('change1w')}>
                    <div className="flex items-center justify-end gap-1">1 Week <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="py-4 px-6 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none" onClick={() => handleSort('change1m')}>
                    <div className="flex items-center justify-end gap-1">1 Month <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="py-4 px-6 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none" onClick={() => handleSort('change1y')}>
                    <div className="flex items-center justify-end gap-1">1 Year <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {sortedStocks.map((stock) => (
                  <tr key={stock.ticker} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${stock.colorClass.bg} ${stock.colorClass.text} ${stock.colorClass.border}`}>
                          {stock.ticker}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {stock.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-sm font-medium text-slate-900 dark:text-white">
                      ${stock.price.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right">{renderPercentage(stock.change1d)}</td>
                    <td className="py-4 px-6 text-right">{renderPercentage(stock.change1w)}</td>
                    <td className="py-4 px-6 text-right">{renderPercentage(stock.change1m)}</td>
                    <td className="py-4 px-6 text-right">{renderPercentage(stock.change1y)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* HEATMAP VIEW */
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedStocks.map((stock) => {
              const isPositive = stock.change1y >= 0;
              return (
                <div
                  key={stock.ticker}
                  className={`p-4 rounded-xl flex flex-col justify-between h-28 border border-slate-200/10 shadow-sm transition-transform hover:-translate-y-0.5 ${
                    isPositive 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  <div>
                    <span className="text-sm font-black block">{stock.ticker}</span>
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5">{stock.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono block font-semibold text-slate-800 dark:text-slate-200">${stock.price.toFixed(2)}</span>
                    <span className="text-sm font-bold block mt-0.5">{isPositive ? '+' : ''}{stock.change1y.toFixed(2)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}