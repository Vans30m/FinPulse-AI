import { useState, useEffect, useRef } from 'react';
import { Search, X, Building2 } from 'lucide-react';

// 1. Define the data structure matching your screenshot
interface StockResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

// 2. Mock Data (Based on your Wipro example)
const MOCK_DB: StockResult[] = [
  { symbol: 'WIPRO', name: 'Wipro Limited', type: 'stock', exchange: 'NSE' },
  { symbol: 'WIPRO', name: 'WIPRO FUTURES', type: 'futures', exchange: 'NSE' },
  { symbol: 'WIPRO', name: 'Wipro Limited', type: 'stock', exchange: 'BSE' },
  { symbol: 'WIT', name: 'Wipro Limited', type: 'dr', exchange: 'NYSE' },
  { symbol: 'WIT5204970', name: 'Wipro IT Services LLC 1.5% 23-JUN-2026', type: 'bond corporate', exchange: 'FINRA' },
  { symbol: 'WIOA', name: 'Wipro Limited Sponsored ADR', type: 'dr', exchange: 'GETTEX' },
  { symbol: 'WIPR', name: 'WIPRO', type: 'futures', exchange: 'BSE' },
];

export default function StockSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown if user clicks outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Search Logic
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    setIsOpen(true);

    // This setTimeout acts as our "Debounce" AND simulates network latency
    const delayDebounceFn = setTimeout(() => {
      // TODO: Replace this with your actual API call (e.g., AlphaVantage or FastAPI backend)
      const filteredResults = MOCK_DB.filter(
        (item) =>
          item.symbol.toLowerCase().includes(query.toLowerCase()) ||
          item.name.toLowerCase().includes(query.toLowerCase())
      );
      
      setResults(filteredResults);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleSelect = (result: StockResult) => {
    console.log('Selected:', result);
    // TODO: Navigate to stock detail page or add to watchlist
    clearSearch();
  };

  return (
    <div className="relative w-full max-w-lg" ref={searchRef}>
      {/* Search Input Field */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-5 w-5 text-slate-500 dark:text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          placeholder="Search symbols, ideas, scripts..."
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-800/80 py-2.5 pl-10 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:border-blue-600/50 dark:focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-blue-600/50 dark:focus:ring-cyan-400/50 transition-all"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-night-900 shadow-2xl z-50">
          
          {/* Fake Tabs to match TradingView UI */}
          <div className="flex gap-4 border-b border-slate-200 dark:border-white/5 px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="text-slate-900 dark:text-white border-b-2 border-blue-600 dark:border-cyan-400 pb-2 -mb-3">Symbols</span>
            <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer">Ideas</span>
            <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer">People</span>
          </div>

          <div className="max-h-96 overflow-y-auto py-2">
            {isSearching ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                Searching markets...
              </div>
            ) : results.length > 0 ? (
              results.map((item, index) => (
                <div
                  key={`${item.symbol}-${index}`}
                  onClick={() => handleSelect(item)}
                  className="flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  {/* Left Side: Icon, Symbol, Name */}
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white dark:bg-night-800 border border-slate-200 dark:border-white/10">
                      <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.symbol}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.name}</span>
                    </div>
                  </div>

                  {/* Right Side: Type and Exchange */}
                  <div className="flex flex-shrink-0 items-center gap-3 pl-4">
                    <span className="text-[10px] lowercase text-slate-500">{item.type}</span>
                    <span className="flex h-5 items-center rounded bg-slate-200 dark:bg-white/10 px-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-300">
                      {item.exchange}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                No symbols found for "{query}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}