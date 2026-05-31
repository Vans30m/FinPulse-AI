import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowUpDown, Search } from 'lucide-react';

interface PerformanceData {
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

const initialStocksData: PerformanceData[] = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    colorClass: { bg: 'bg-slate-100 dark:bg-slate-800/60', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300/50' },
    price: 178.52,
    change1d: 1.24,
    change1w: -0.45,
    change1m: 3.12,
    change3m: -2.15,
    change1y: 14.82,
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    colorClass: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200/50 dark:border-blue-900/50' },
    price: 415.60,
    change1d: 0.85,
    change1w: 2.11,
    change1m: 5.43,
    change3m: 8.92,
    change1y: 28.41,
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    colorClass: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200/50 dark:border-emerald-900/50' },
    price: 875.12,
    change1d: 3.62,
    change1w: 5.84,
    change1m: 14.22,
    change3m: 38.51,
    change1y: 212.35,
  },
  {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    colorClass: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200/50 dark:border-rose-900/50' },
    price: 175.34,
    change1d: -2.18,
    change1w: -4.32,
    change1m: -8.15,
    change3m: -18.42,
    change1y: -12.04,
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com, Inc.',
    colorClass: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200/50 dark:border-amber-900/50' },
    price: 174.42,
    change1d: 0.41,
    change1w: 1.05,
    change1m: 4.88,
    change3m: 11.23,
    change1y: 41.65,
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    colorClass: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200/50 dark:border-purple-900/50' },
    price: 151.60,
    change1d: -0.12,
    change1w: 1.87,
    change1m: 6.15,
    change3m: 5.24,
    change1y: 34.18,
  },
];

type SortKey = 'ticker' | 'price' | 'change1d' | 'change1w' | 'change1m' | 'change3m' | 'change1y';

export default function StockPerformanceTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('change1d');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const sortedStocks = [...initialStocksData]
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
    <div className="w-full bg-white dark:bg-night-950 border border-slate-200 dark:border-white/10 rounded-3xl shadow-xl overflow-hidden">
      {/* Table Header Section */}
      <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Multi-Period Performance</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compare equity returns across different timeline intervals.
          </p>
        </div>

        {/* Search Input Filter */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by name or ticker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-white/10 outline-none focus:border-blue-600 dark:focus:border-cyan-400 transition-colors"
          />
        </div>
      </div>

      {/* Table Wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-4 px-6 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('ticker')}>
                <div className="flex items-center gap-1">Company <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th className="py-4 px-6 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('price')}>
                <div className="flex items-center justify-end gap-1">Price <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th className="py-4 px-6 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('change1d')}>
                <div className="flex items-center justify-end gap-1">1 Day <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th className="py-4 px-6 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('change1w')}>
                <div className="flex items-center justify-end gap-1">1 Week <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th className="py-4 px-6 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('change1m')}>
                <div className="flex items-center justify-end gap-1">1 Month <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th className="py-4 px-6 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('change3m')}>
                <div className="flex items-center justify-end gap-1">3 Month <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th className="py-4 px-6 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('change1y')}>
                <div className="flex items-center justify-end gap-1">1 Year <ArrowUpDown className="h-3 w-3" /></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {sortedStocks.map((stock) => (
              <tr key={stock.ticker} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors group">
                {/* Name & Unique Color Ticker Badge */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-xs font-bold tracking-wide rounded-lg border ${stock.colorClass.bg} ${stock.colorClass.text} ${stock.colorClass.border}`}>
                      {stock.ticker}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                        {stock.name}
                      </span>
                    </div>
                  </div>
                </td>
                {/* Last Price */}
                <td className="py-4 px-6 text-right font-mono text-sm font-medium text-slate-900 dark:text-white">
                  ${stock.price.toFixed(2)}
                </td>
                {/* Multi-Period Percentage Fields */}
                <td className="py-4 px-6 text-right">{renderPercentage(stock.change1d)}</td>
                <td className="py-4 px-6 text-right">{renderPercentage(stock.change1w)}</td>
                <td className="py-4 px-6 text-right">{renderPercentage(stock.change1m)}</td>
                <td className="py-4 px-6 text-right">{renderPercentage(stock.change3m)}</td>
                <td className="py-4 px-6 text-right">{renderPercentage(stock.change1y)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}