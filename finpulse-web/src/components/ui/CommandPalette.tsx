import { useState, useEffect } from 'react';
import { Search, X, Building2, Coins, PieChart, TrendingUp, Loader2 } from 'lucide-react';

interface SearchResult {
  id: string;
  symbol: string;
  name: string;
  type: string;
  exchange: string;
  source?: string;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'Stocks', 'Crypto', 'Currencies', 'Commodities'];

  // 1. Keyboard Shortcut Listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 2. The Debounced API Call
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Set a timer to wait 300ms after the user stops typing
    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Search fetch failed:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    // Cleanup function cancels the timer if the user keeps typing
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (!isOpen) return null;

  // Helper function to assign icons based on Finnhub's asset types
  const renderIcon = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('crypto')) return <Coins className="h-4 w-4 text-amber-500" />;
    if (t.includes('currency') || t.includes('fx') || t.includes('forex')) return <Coins className="h-4 w-4 text-emerald-500" />;
    if (t.includes('stock') || t.includes('equity')) return <Building2 className="h-4 w-4 text-blue-500" />;
    if (t.includes('etp') || t.includes('etf') || t.includes('fund') || t.includes('future') || t.includes('commodity')) return <PieChart className="h-4 w-4 text-purple-500" />;
    return <TrendingUp className="h-4 w-4 text-slate-500" />;
  };

  const filteredResults = results.filter((item) => {
    if (activeTab === 'All') return true;
    const t = item.type?.toLowerCase() || '';
    if (activeTab === 'Crypto' && t.includes('crypto')) return true;
    if (activeTab === 'Stocks' && (t.includes('stock') || t.includes('equity'))) return true;
    if (activeTab === 'Currencies' && (t.includes('currency') || t.includes('fx') || t.includes('forex'))) return true;
    if (activeTab === 'Commodities' && (t.includes('future') || t.includes('commodity') || t.includes('metal'))) return true;
    return false;
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 sm:px-0">
      
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-night-950/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Search Input Area */}
        <div className="flex items-center border-b border-slate-100 dark:border-white/5 px-4">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search global stocks, ETFs, or symbols..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent px-4 py-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
          />
          {isLoading && <Loader2 className="h-4 w-4 text-blue-500 animate-spin mr-3" />}
          <button 
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* TradingView-Style Asset Tabs */}
        <div className="flex gap-2 px-4 py-2 border-b border-slate-100 dark:border-white/5 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white dark:bg-cyan-500 dark:text-night-950'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Results Area */}
        <div className="max-h-[50vh] overflow-y-auto p-2 custom-scrollbar">
          {!query ? (
            <div className="py-14 text-center text-sm text-slate-500">
              Start typing to search global markets.
            </div>
          ) : filteredResults.length === 0 && !isLoading ? (
            <div className="py-14 text-center text-sm text-slate-500">
              No {activeTab !== 'All' ? activeTab.toLowerCase() : ''} results found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              {filteredResults.map((item) => (
                <button
                  key={item.id}
                  className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5 group"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 shadow-sm group-hover:scale-105 transition-transform">
                      {renderIcon(item.type)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                        {item.symbol}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.name}
                      </p>
                    </div>
                  </div>
                  
                  {/* Asset Class Badge - TradingView Style */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase text-slate-400 font-medium tracking-wider">
                      {(() => {
                        const t = item.type.toLowerCase();
                        if (t.includes('crypto')) return 'crypto spot';
                        if (t.includes('currency') || t.includes('fx')) return 'forex/cfd';
                        if (t.includes('future') || t.includes('commodity')) return 'futures';
                        if (t.includes('stock') || t.includes('equity')) return 'stock';
                        if (t.includes('etp') || t.includes('fund') || t.includes('etf')) return 'fund etf';
                        return item.type.replace('Common ', '');
                      })()}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {item.exchange}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}