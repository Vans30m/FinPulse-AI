import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Pin, History } from 'lucide-react';
import { searchAssets } from "../../services/marketService";
import { StockLogo } from '../../utils/logo';

interface StockResult {
  symbol: string;
  yahooSymbol: string;
  name: string;
  exchange: string;
  type: string;
  price?: number;
}

interface StockSearchProps {
  placeholder?: string;
  onSelect: (asset: StockResult) => void;
}

function resolveSymbolType(symbol: string): "Stocks" | "Indices" | "Crypto" | "Forex" | "Commodities" {
  if (!symbol) return "Stocks";
  const upper = symbol.toUpperCase();
  if (upper.endsWith("=X")) return "Forex";
  if (upper.endsWith("-USD")) return "Crypto";
  if (upper.endsWith("=F")) return "Commodities";
  if (upper.startsWith("^") || upper.endsWith(".NS")) return "Indices";
  return "Stocks";
}

export default function StockSearch({
  placeholder = "Search symbols, ideas, scripts...",
  onSelect,
}: StockSearchProps) {
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  // Local Storage lists with sanity checks
  const [recentSearches, setRecentSearches] = useState<StockResult[]>(() => {
    const saved = localStorage.getItem("finpulse-recent-searches");
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter(item => item && item.symbol && item.name) : [];
  });
  const [pinnedAssets, setPinnedAssets] = useState<StockResult[]>(() => {
    const saved = localStorage.getItem("finpulse-pinned-assets");
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter(item => item && item.symbol && item.name) : [];
  });

  // Query Cache
  const [searchCache] = useState<Record<string, StockResult[]>>({});
  
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

  // Update localStorage when lists change
  useEffect(() => {
    localStorage.setItem("finpulse-recent-searches", JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    localStorage.setItem("finpulse-pinned-assets", JSON.stringify(pinnedAssets));
  }, [pinnedAssets]);

  // Debounced Search Logic with Local Caching
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const trimmedQuery = query.trim().toLowerCase();
    
    // Check Cache first
    if (searchCache[trimmedQuery]) {
      setResults(searchCache[trimmedQuery]);
      setIsOpen(true);
      return;
    }

    setIsSearching(true);
    setIsOpen(true);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await searchAssets(query);
        // Enrich data with resolved types and filter out any incomplete ones
        const enriched = (data || [])
          .filter((item: any) => item && item.symbol && item.name)
          .map((item: any) => ({
            ...item,
            type: resolveSymbolType(item.symbol)
          }));
        
        searchCache[trimmedQuery] = enriched;
        setResults(enriched);
      } catch (error) {
        console.error("Search Error:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, searchCache]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleSelect = (result: StockResult) => {
    onSelect(result);
    
    // Add to Recent Searches
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.symbol !== result.symbol);
      return [result, ...filtered].slice(0, 5); // Keep top 5
    });

    clearSearch();
  };

  const handleTogglePin = (e: React.MouseEvent, result: StockResult) => {
    e.stopPropagation();
    setPinnedAssets(prev => {
      const isPinned = prev.some(item => item.symbol === result.symbol);
      if (isPinned) {
        return prev.filter(item => item.symbol !== result.symbol);
      } else {
        return [...prev, result];
      }
    });
  };

  // Grouped and filtered results
  const groupedAndFilteredResults = useMemo(() => {
    const listToProcess = query.trim().length === 0 ? [...pinnedAssets, ...recentSearches] : results;
    
    const groups: Record<string, StockResult[]> = {
      Stocks: [],
      Indices: [],
      Crypto: [],
      Forex: [],
      Commodities: []
    };

    listToProcess.forEach(item => {
      const category = resolveSymbolType(item.symbol);
      if (groups[category]) {
        groups[category].push(item);
      } else {
        groups.Stocks.push(item);
      }
    });

    if (activeFilter === "All") return groups;
    
    // Filtered representation
    return {
      [activeFilter]: groups[activeFilter] || []
    };
  }, [results, activeFilter, query, pinnedAssets, recentSearches]);

  // Total results count check
  const hasResults = useMemo(() => {
    return Object.values(groupedAndFilteredResults).some(arr => arr.length > 0);
  }, [groupedAndFilteredResults]);

  const filterTabs = ["All", "Stocks", "Indices", "Crypto", "Forex", "Commodities"];

  const getLetterAvatarColor = (symbol: string) => {
    const colors = [
      "from-blue-500 to-indigo-600",
      "from-cyan-500 to-blue-600",
      "from-emerald-500 to-teal-600",
      "from-purple-500 to-violet-600",
      "from-rose-500 to-pink-600"
    ];
    return colors[symbol.charCodeAt(0) % colors.length];
  };

  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const navItems = useMemo(() => {
    if (query.trim().length === 0) {
      return [...recentSearches, ...pinnedAssets];
    }
    return Object.values(groupedAndFilteredResults).flat();
  }, [query, recentSearches, pinnedAssets, groupedAndFilteredResults]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || navItems.length === 0) return;

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
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      {/* Search Input Field */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] py-3 pl-11 pr-11 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-night-900 focus:border-blue-500 dark:focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 dark:focus:ring-cyan-400/20 shadow-inner transition-all duration-300"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3.5 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full mt-3 w-full overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-night-900 shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Quick Filters */}
          <div className="flex gap-1.5 border-b border-slate-100 dark:border-slate-800/60 px-4 py-3 overflow-x-auto custom-scrollbar text-[11px] font-extrabold">
            {filterTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  activeFilter === tab
                    ? "bg-blue-600 dark:bg-cyan-500 border-blue-600 dark:border-cyan-400 text-white dark:text-night-950 shadow-sm"
                    : "bg-slate-50 dark:bg-white/[0.01] border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="max-h-96 overflow-y-auto py-2">
            {isSearching ? (
              <div className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500 animate-pulse font-medium">
                Searching global markets...
              </div>
            ) : query.trim().length === 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentSearches.length > 0 && (
                  <div className="space-y-1 py-1 pb-2">
                    <div className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between">
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
                        <div
                          key={`recent-${item.symbol}-${idx}`}
                          onClick={() => handleSelect(item)}
                          className={`flex cursor-pointer items-center justify-between px-4 py-2.5 transition-all group border-b border-transparent hover:border-slate-100 dark:hover:border-slate-800/40 ${
                            isHighlighted ? "bg-slate-100 dark:bg-white/10" : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {/* Logo avatar */}
                            <StockLogo symbol={item.symbol} name={item.name} className="h-8 w-8" imgSizeClass="w-5 h-5" />
                            <div className="flex flex-col truncate">
                              <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                                {item.symbol}
                              </span>
                              <span className="text-xs text-slate-400 dark:text-slate-500 truncate font-medium">
                                {item.name}
                              </span>
                            </div>
                          </div>
                          <span className="flex h-5 items-center rounded-lg bg-slate-100 dark:bg-white/5 px-2 text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                            {item.exchange || "GLOBAL"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {pinnedAssets.length > 0 && (
                  <div className="space-y-1 py-2">
                    <div className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-white/[0.01] flex items-center gap-1.5">
                      <Pin className="h-3.5 w-3.5" /> Pinned Assets
                    </div>
                    {pinnedAssets.map((item, idx) => {
                      const isHighlighted = selectedIndex === recentSearches.length + idx;
                      return (
                        <div
                          key={`pinned-${item.symbol}-${idx}`}
                          onClick={() => handleSelect(item)}
                          className={`flex cursor-pointer items-center justify-between px-4 py-2.5 transition-all group border-b border-transparent hover:border-slate-100 dark:hover:border-slate-800/40 ${
                            isHighlighted ? "bg-slate-100 dark:bg-white/10" : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {/* Logo avatar */}
                            <StockLogo symbol={item.symbol} name={item.name} className="h-8 w-8" imgSizeClass="w-5 h-5" />
                            <div className="flex flex-col truncate">
                              <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                                {item.symbol}
                              </span>
                              <span className="text-xs text-slate-400 dark:text-slate-500 truncate font-medium">
                                {item.name}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="flex h-5 items-center rounded-lg bg-slate-100 dark:bg-white/5 px-2 text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                              {item.exchange || "GLOBAL"}
                            </span>
                            <button
                              onClick={(e) => handleTogglePin(e, item)}
                              className="p-1.5 rounded-lg border border-amber-500/30 text-amber-500 bg-amber-500/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                            >
                              <Pin className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {recentSearches.length === 0 && pinnedAssets.length === 0 && (
                  <div className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500 font-medium">
                    Type to search stocks, crypto, forex, commodities...
                  </div>
                )}
              </div>
            ) : hasResults ? (
              Object.entries(groupedAndFilteredResults).map(([category, items]) => {
                if (items.length === 0) return null;
                return (
                  <div key={category} className="space-y-1 py-1">
                    <div className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-white/[0.01]">
                      {category}
                    </div>
                    {items.map((item, idx) => {
                      const isPinned = pinnedAssets.some(p => p.symbol === item.symbol);
                      const flatIdx = navItems.findIndex(n => n.symbol === item.symbol);
                      const isHighlighted = selectedIndex === flatIdx;
                      return (
                        <div
                          key={`${item.symbol}-${idx}`}
                          onClick={() => handleSelect(item)}
                          className={`flex cursor-pointer items-center justify-between px-4 py-2.5 transition-all group border-b border-transparent hover:border-slate-100 dark:hover:border-slate-800/40 ${
                            isHighlighted ? "bg-slate-100 dark:bg-white/10" : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {/* Logo avatar */}
                            <StockLogo symbol={item.symbol} name={item.name} className="h-8 w-8" imgSizeClass="w-5 h-5" />
                            <div className="flex flex-col truncate">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                                  {item.symbol}
                                </span>
                                {query.length === 0 && (
                                  <History className="h-3 w-3 text-slate-350 dark:text-slate-600" />
                                )}
                              </div>
                              <span className="text-xs text-slate-400 dark:text-slate-500 truncate font-medium">
                                {item.name}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="flex h-5 items-center rounded-lg bg-slate-100 dark:bg-white/5 px-2 text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                              {item.exchange || "GLOBAL"}
                            </span>
                            <button
                              onClick={(e) => handleTogglePin(e, item)}
                              className={`p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-white/10 transition-all ${
                                isPinned
                                  ? "border-amber-500/30 text-amber-500 bg-amber-500/5"
                                  : "border-transparent text-slate-400 dark:text-slate-600"
                              }`}
                            >
                              <Pin className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500 font-medium">
                {query.trim().length === 0
                  ? "Type to search stocks, crypto, forex, commodities..."
                  : `No assets match "${query}"`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}