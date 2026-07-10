import { useState, useEffect } from 'react';
import { Search, X, Coins, PieChart, TrendingUp, Loader2, History } from 'lucide-react';
import { useChart } from "../../context/ChartContext";
import { StockLogo } from '../../utils/logo';
import API_BASE_URL from "../../config/api";

interface SearchResult {
  symbol: string;
  yahooSymbol: string;
  name: string;
  exchange: string;
  type: string;
}

export default function CommandPalette() {
  const { openAsset } = useChart();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  // Local Storage recent searches
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>(() => {
    try {
      const saved = localStorage.getItem("finpulse-recent-searches");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter(item => item && item.symbol && item.name) : [];
    } catch {
      return [];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("finpulse-recent-searches", JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Load recent searches when palette opens
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem("finpulse-recent-searches");
        const parsed = saved ? JSON.parse(saved) : [];
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.filter(item => item && item.symbol && item.name));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen]);

  const handleSelect = (item: SearchResult) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(r => r.symbol !== item.symbol);
      return [item, ...filtered].slice(0, 5); // Keep top 5
    });

    openAsset({
      symbol: item.symbol,
      yahooSymbol: item.yahooSymbol,
      name: item.name,
      exchange: item.exchange,
      type: item.type,
    });

    setIsOpen(false);
    setQuery('');
  };

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
        const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
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

  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const filteredResults = results
    .filter((item) => item && item.symbol && item.name)
    .filter((item) => {
      if (activeTab === 'All') return true;
      const t = item.type?.toLowerCase() || '';
      if (activeTab === 'Crypto' && t.includes('crypto')) return true;
      if (activeTab === 'Stocks' && (t.includes('stock') || t.includes('equity'))) return true;
      if (activeTab === 'Currencies' && (t.includes('currency') || t.includes('fx') || t.includes('forex'))) return true;
      if (activeTab === 'Commodities' && (t.includes('future') || t.includes('commodity') || t.includes('metal'))) return true;
      return false;
    });

  const navItems = query ? filteredResults : recentSearches;

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query, isOpen]);

  if (!isOpen) return null;

  // Helper function to assign icons based on Finnhub's asset types
  const renderIcon = (type: string, symbol: string, name: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('stock') || t.includes('equity')) {
      return <StockLogo symbol={symbol} name={name} className="h-10 w-10" imgSizeClass="w-6 h-6" />;
    }

    let iconElement = <TrendingUp className="h-4 w-4 text-slate-500" />;
    if (t.includes('crypto')) iconElement = <Coins className="h-4 w-4 text-amber-500" />;
    else if (t.includes('currency') || t.includes('fx') || t.includes('forex')) iconElement = <Coins className="h-4 w-4 text-emerald-500" />;
    else if (t.includes('etp') || t.includes('etf') || t.includes('fund') || t.includes('future') || t.includes('commodity')) iconElement = <PieChart className="h-4 w-4 text-purple-500" />;

    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 shadow-sm">
        {iconElement}
      </div>
    );
  };


  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (navItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % navItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + navItems.length) % navItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < navItems.length) {
        handleSelect(navItems[selectedIndex]);
      }
    }
  };

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
            onKeyDown={handleInputKeyDown}
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
              className={`whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${activeTab === tab
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
            recentSearches.length > 0 ? (
              <div className="space-y-1">
                <div className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" /> Recent Searches
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setRecentSearches([]); }} 
                    className="text-[9px] hover:text-red-500 transition-colors uppercase font-bold"
                  >
                    Clear All
                  </button>
                </div>
                {recentSearches.map((item, idx) => {
                  const isHighlighted = selectedIndex === idx;
                  return (
                    <button
                      key={`recent-${item.symbol}-${idx}`}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors group ${
                        isHighlighted ? "bg-slate-50 dark:bg-white/10" : "hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                      onClick={() => handleSelect(item)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="group-hover:scale-105 transition-transform">
                          {renderIcon(item.type, item.symbol, item.name)}
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
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase text-slate-400 font-medium tracking-wider">
                          {item.type.replace('Common ', '').toLowerCase()}
                        </span>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {item.exchange}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-14 text-center text-sm text-slate-500">
                Start typing to search global markets.
              </div>
            )
          ) : filteredResults.length === 0 && !isLoading ? (
            <div className="py-14 text-center text-sm text-slate-500">
              No {activeTab !== 'All' ? activeTab.toLowerCase() : ''} results found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              {filteredResults.map((item, idx) => {
                const isHighlighted = selectedIndex === idx;
                return (
                  <button
                    key={`${item.symbol}-${item.exchange}`}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors group ${
                      isHighlighted ? "bg-slate-50 dark:bg-white/10" : "hover:bg-slate-50 dark:hover:bg-white/5"
                    }`}
                    onClick={() => handleSelect(item)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="group-hover:scale-105 transition-transform">
                        {renderIcon(item.type, item.symbol, item.name)}
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
              );})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}