import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Plus, Trash2,
  Download, Star, Pin, Info, Search, Sparkles, X, Activity
} from "lucide-react";
import {
  useWatchlists, useCreateWatchlist, useAddWatchlistItem, useRemoveWatchlistItem,
  useUpdateWatchlistItem, useDeleteWatchlist, useWatchlistAIRankings
} from "../../../hooks/useDashboard";
import AIRankingCard from "./AIRankingCard";
import toast from "react-hot-toast";
import API_BASE_URL from "../../../config/api";
import { useChart } from "../../../context/ChartContext";
import { pageCache } from "../../../utils/cache";
import PageLoader from "../../../components/ui/PageLoader";

export default function Watchlist() {
  const { openAsset } = useChart();
  const { data: watchlistsData, isLoading } = useWatchlists();
  
  // Cache check for instant load
  const cachedData = pageCache.get('watchlists');
  const [showLoader, setShowLoader] = useState(!cachedData && isLoading);

  useEffect(() => {
    if (watchlistsData) {
      pageCache.set('watchlists', watchlistsData);
    }
  }, [watchlistsData]);

  useEffect(() => {
    if (!isLoading) {
      setShowLoader(false);
    }
  }, [isLoading]);

  const watchlists = useMemo(() => {
    const activeData = watchlistsData || cachedData;
    return Array.isArray(activeData) ? activeData : [];
  }, [watchlistsData, cachedData]);

  const createListMutation = useCreateWatchlist();
  const deleteListMutation = useDeleteWatchlist();
  const addItemMutation = useAddWatchlistItem();
  const removeItemMutation = useRemoveWatchlistItem();
  const updateItemMutation = useUpdateWatchlistItem();

  const [activeListId, setActiveListId] = useState<string>("");

  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newAssetSymbol, setNewAssetSymbol] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAssetInfo, setSelectedAssetInfo] = useState<any>(null);

  // Search and filter states (fully functional now!)
  const [searchQuery] = useState("");
  const [showOnlyFavorites] = useState(false);
  const [showOnlyPinned] = useState(false);
  const [sortField] = useState<string>("position");
  const [sortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (watchlists.length > 0) {
      if (!activeListId) {
        setActiveListId(watchlists[0].id);
      }
    }
  }, [watchlists, activeListId]);

  useEffect(() => {
    const term = newAssetSymbol.trim();
    if (!term) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/search?q=${term}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error("Search failed:", err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [newAssetSymbol]);

  useEffect(() => {
    if (!showSuggestions) return;
    const handleClick = () => setShowSuggestions(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showSuggestions]);

  const activeWatchlist = useMemo(() => {
    return watchlists.find((w) => w.id === activeListId) || watchlists[0] || { id: "", name: "Default List", items: [], watchlistTags: [] };
  }, [watchlists, activeListId]);


  const handleCreateWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createListMutation.mutate({ name: newListName.trim() }, {
      onSuccess: (data) => {
        setActiveListId(data.id);
        setNewListName("");
        setIsCreatingList(false);
        toast.success("Watchlist created successfully!");
      },
      onError: (err: any) => {
        toast.error(`Failed to create watchlist: ${err.message || err}`);
      }
    });
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const symbol = selectedAssetInfo?.symbol || newAssetSymbol.trim().toUpperCase();
    if (!symbol) return;
    if (!activeListId) {
      toast.error("Please select or create a watchlist first!");
      return;
    }
    addItemMutation.mutate({ listId: activeListId, item: { symbol, notes: "Added to watchlist" } }, {
      onSuccess: () => {
        setNewAssetSymbol("");
        setSelectedAssetInfo(null);
        toast.success(`Added ${symbol} to watchlist!`);
      },
      onError: (err: any) => {
        toast.error(`Failed to add stock: ${err.message || err}`);
      }
    });
  };

  const handleSelectSuggestion = (s: any) => {
    setNewAssetSymbol("");
    setSelectedAssetInfo(null);
    setShowSuggestions(false);

    if (!activeListId) {
      toast.error("Please select or create a watchlist first!");
      return;
    }

    addItemMutation.mutate({ listId: activeListId, item: { symbol: s.symbol, notes: "Added to watchlist" } }, {
      onSuccess: () => {
        toast.success(`Added ${s.symbol} to watchlist!`);
      },
      onError: (err: any) => {
        toast.error(`Failed to add stock: ${err.message || err}`);
      }
    });
  };

  const handleRemoveAsset = (itemId: string) => removeItemMutation.mutate(itemId);

  const handleToggleFavorite = (itemId: string, currentFav: boolean) => {
    updateItemMutation.mutate({ itemId, data: { favorite: !currentFav } });
  };

  const handleTogglePin = (itemId: string, currentPin: boolean) => {
    updateItemMutation.mutate({ itemId, data: { pinned: !currentPin } });
  };

  const handleDeleteWatchlist = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the watchlist "${name}"?`)) {
      deleteListMutation.mutate(id, {
        onSuccess: () => {
          toast.success(`Deleted watchlist "${name}"`);
          if (activeListId === id) {
            const remaining = watchlists.filter((w) => w.id !== id);
            if (remaining.length > 0) {
              setActiveListId(remaining[0].id);
            } else {
              setActiveListId("");
            }
          }
        },
        onError: (err: any) => {
          toast.error(`Failed to delete watchlist: ${err.message || err}`);
        }
      });
    }
  };

  const handleExportCSV = () => {
    const items = activeWatchlist.items || [];
    const headers = "Symbol,Notes,Pinned,Favorite\n";
    const rows = items.map((i: any) => `${i.symbol},"${i.notes || ''}",${i.pinned},${i.favorite}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${activeWatchlist.name || 'watchlist'}.csv`; a.click();
  };

  const processedItems = useMemo(() => {
    const items = [...(activeWatchlist.items || [])];
    let filtered = items.filter((item: any) => {
      const q = searchQuery.toLowerCase();
      const symbolMatch = item.symbol.toLowerCase().includes(q);
      const nameMatch = (item.name || "").toLowerCase().includes(q);
      const favMatch = !showOnlyFavorites || item.favorite;
      const pinMatch = !showOnlyPinned || item.pinned;
      return (symbolMatch || nameMatch) && favMatch && pinMatch;
    });

    filtered.sort((a: any, b: any) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortField === "price" || sortField === "changePercent") {
        valA = parseFloat(String(a.price || "0").replace(/[^0-9.-]+/g, ""));
        valB = parseFloat(String(b.price || "0").replace(/[^0-9.-]+/g, ""));
      }
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      return sortDirection === "asc" ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
    });
    return filtered;
  }, [activeWatchlist.items, searchQuery, showOnlyFavorites, showOnlyPinned, sortField, sortDirection]);

  const getAvatarColor = (sym: string) => {
    const colors = ["from-blue-500 to-indigo-600", "from-cyan-500 to-blue-600", "from-emerald-500 to-teal-600", "from-violet-500 to-purple-600", "from-rose-500 to-pink-600"];
    return colors[sym.charCodeAt(0) % colors.length];
  };

  // Lazy AI rankings — fetched from a dedicated endpoint after the main watchlist loads
  const { data: aiRankingsData, isLoading: aiRankingsLoading, isError: aiRankingsError } = useWatchlistAIRankings(activeListId);

  const rankedAssets = useMemo(() => {
    if (!Array.isArray(aiRankingsData)) return [];
    return aiRankingsData
      .slice(0, 5)
      .map((item) => ({ symbol: item.symbol, score: item.score, verdict: item.reason }));
  }, [aiRankingsData]);

  const stats = useMemo(() => {
    const items = activeWatchlist?.items || [];
    let gainers = 0, losers = 0, sumChange = 0;
    if (Array.isArray(items)) {
      items.forEach((item: any) => {
        const change = parseFloat(String(item.changePercent || "0").replace(/[^0-9.-]+/g, ""));
        if (change > 0) gainers++; else if (change < 0) losers++;
        sumChange += change;
      });
    }
    const totalCount = Array.isArray(items) ? items.length : 0;
    return { total: totalCount, gainers, losers, avgChange: `${(sumChange / (totalCount || 1)).toFixed(2)}%` };
  }, [activeWatchlist]);

  if (showLoader) {
    return <PageLoader title="Security Watchlists" message="Analyzing watchlists and active tickers..." />;
  }

  return (
    <div className="w-full space-y-4 md:space-y-6">
      {/* HEADER SECTION WITH EXPLANATORY LABELS */}
      <div className="flex flex-col gap-1 p-1">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          Your Watchlists
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full dark:bg-blue-900/40 dark:text-blue-300">
            Realtime Trackers
          </span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl hidden md:block">
          Create custom watchlists to organize your investments, toggle favorites, pin important assets, view live price changes, add research notes, and see automated AI rankings.
        </p>
      </div>

      {/* STATS OVERVIEW SECTION */}
      <div>
        <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <Info className="h-3.5 w-3.5" />
          <span>Watchlist Analytics Overview</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <div className="rounded-2xl md:rounded-3xl p-3.5 md:p-5 bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-xl">
            <p className="text-[10px] md:text-xs opacity-75 uppercase font-bold">Total Assets</p>
            <h2 className="text-xl md:text-3xl font-black mt-1 md:mt-2">{stats.total}</h2>
          </div>
          <div className="rounded-2xl md:rounded-3xl p-3.5 md:p-5 bg-white/70 dark:bg-night-900/70 border border-slate-200 dark:border-white/10 backdrop-blur-xl">
            <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase flex items-center gap-1">
              Gainers <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            </p>
            <h2 className="text-xl md:text-3xl font-black mt-1 md:mt-2 text-emerald-500">{stats.gainers}</h2>
          </div>
          <div className="rounded-2xl md:rounded-3xl p-3.5 md:p-5 bg-white/70 dark:bg-night-900/70 border border-slate-200 dark:border-white/10 backdrop-blur-xl">
            <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase flex items-center gap-1">
              Losers <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
            </p>
            <h2 className="text-xl md:text-3xl font-black mt-1 md:mt-2 text-rose-500">{stats.losers}</h2>
          </div>
          <div className="rounded-2xl md:rounded-3xl p-3.5 md:p-5 bg-white/70 dark:bg-night-900/70 border border-slate-200 dark:border-white/10 backdrop-blur-xl">
            <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Avg Return</p>
            <h2 className="text-xl md:text-3xl font-black mt-1 md:mt-2 text-slate-800 dark:text-white">{stats.avgChange}</h2>
          </div>
        </div>
      </div>

      {/* WATCHLIST SWITCHER & CONTROLS */}
      <div className="relative z-30 bg-white/70 dark:bg-night-900/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-4 md:p-5 rounded-3xl shadow-xl flex flex-col gap-4">
        <div className="flex flex-row justify-between items-center gap-3 w-full">
          {/* List selection */}
          <div className="flex-1 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2">
              {isCreatingList ? (
                <form onSubmit={handleCreateWatchlist} className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Name..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    className="bg-slate-100 dark:bg-night-800 border dark:border-white/10 px-3 py-1.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-28 text-slate-900 dark:text-white"
                  />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all">Save</button>
                  <button type="button" onClick={() => setIsCreatingList(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-[10px] px-1">Cancel</button>
                </form>
              ) : (
                <div className="flex items-center gap-1.5">
                  {watchlists.map((list) => (
                    <div
                      key={list.id}
                      onClick={() => setActiveListId(list.id)}
                      className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all duration-200 cursor-pointer border whitespace-nowrap ${activeListId === list.id
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent text-white shadow-sm"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
                        }`}
                    >
                      <span>{list.name}</span>
                      <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-black ${activeListId === list.id ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                        }`}>
                        {list.items?.length || 0}
                      </span>
                      {watchlists.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteWatchlist(e, list.id, list.name)}
                          className={`p-0.5 rounded transition-colors ${activeListId === list.id ? "text-white/60 hover:text-white" : "text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                            }`}
                          title={`Delete watchlist "${list.name}"`}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setIsCreatingList(true)}
                    className="p-2 rounded-xl bg-blue-55 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all border border-transparent shrink-0"
                    title="Create custom watchlist"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Export & Actions */}
          <div className="shrink-0">
            <button
              onClick={handleExportCSV}
              className="p-2.5 md:px-4 md:py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Download watchlist items as CSV file"
            >
              <Download className="h-3.5 w-3.5" /> <span className="hidden md:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* ADD ASSET SEARCH BAR */}
        <div className="relative pt-3 border-t border-slate-100 dark:border-white/5 w-full">
          <form onSubmit={handleAddAsset} className="w-full">
            <div className="relative w-full">
              <input
                type="text"
                value={newAssetSymbol}
                onChange={(e) => {
                  setNewAssetSymbol(e.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full bg-slate-100 dark:bg-night-800/50 border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 pl-9 text-slate-800 dark:text-white"
                placeholder="e.g. AAPL, Reliance, BTC..."
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          </form>

          {/* Auto Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-night-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-[100] max-w-md max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
              {suggestions.map((s) => (
                <div
                  key={s.symbol}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectSuggestion(s);
                  }}
                  className="p-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer flex justify-between items-center transition-all"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white text-xs">{s.symbol}</span>
                    <span className="text-[10px] text-slate-400 ml-2">{s.name}</span>
                  </div>
                  <span className="text-[9px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-500 px-2 py-0.5 rounded">
                    {s.exchange}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* STOCK CARDS LIST */}
      <div>
        <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Active Watchlist Stocks ({processedItems.length})</span>
        </div>

        {processedItems.length === 0 ? (
          <div className="text-center py-12 bg-white/40 dark:bg-night-900/40 rounded-3xl border border-slate-200 dark:border-white/10 backdrop-blur-xl">
            <Star className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">No assets found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add some tickers in the box above or clear your active filters to see the watchlist stock items.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {processedItems.map((item: any) => {
                const isPositive = parseFloat(String(item.changePercent || "0").replace(/[^0-9.-]+/g, "")) >= 0;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="group rounded-3xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-night-900/70 backdrop-blur-xl p-3.5 md:p-5 shadow-lg hover:shadow-xl hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top bar with symbol, title, delete and pin buttons */}
                      <div className="flex justify-between items-start gap-3">
                        <div
                          className="flex items-center gap-2 md:gap-3 cursor-pointer"
                          onClick={() => openAsset({
                            symbol: item.symbol,
                            yahooSymbol: item.symbol,
                            name: item.name || "Stock Asset",
                            exchange: "NSE",
                            type: "Stock",
                          })}
                          title="Click to view detailed asset profile page"
                        >
                          <div className={`w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br ${getAvatarColor(item.symbol)} flex items-center justify-center text-white text-xs md:text-sm font-black uppercase shadow-inner`}>
                            {item.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-sm md:text-base text-slate-800 dark:text-white flex items-center gap-1.5">
                              {item.symbol}
                              {item.pinned && <span title="Pinned item"><Pin className="h-3 w-3 text-blue-500 fill-blue-500" /></span>}
                            </h3>
                            <p className="text-[10px] md:text-xs text-slate-400 truncate max-w-[100px] md:max-w-[140px]">{item.name || "Stock Asset"}</p>
                          </div>
                        </div>

                        {/* Control buttons - minimum 44x44px touch targets */}
                        <div className="flex items-center gap-0.5">
                          {/* Pin Toggle */}
                          <button
                            onClick={() => handleTogglePin(item.id, item.pinned)}
                            className={`w-11 h-11 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors ${item.pinned ? "text-blue-500" : "text-slate-400"
                              }`}
                            title={item.pinned ? "Unpin stock from top" : "Pin stock to top"}
                          >
                            <Pin className={`h-4 w-4 ${item.pinned ? "fill-blue-500" : ""}`} />
                          </button>

                          {/* Favorite Toggle */}
                          <button
                            onClick={() => handleToggleFavorite(item.id, item.favorite)}
                            className={`w-11 h-11 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors ${item.favorite ? "text-amber-500" : "text-slate-400"
                              }`}
                            title={item.favorite ? "Remove from Favorites" : "Mark as Favorite"}
                          >
                            <Star className={`h-4 w-4 ${item.favorite ? "fill-amber-500 text-amber-500" : ""}`} />
                          </button>

                          {/* Delete Item */}
                          <button
                            onClick={() => handleRemoveAsset(item.id)}
                            className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Remove stock from watchlist"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Price & Change details */}
                    <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold tracking-wider">Live Price:</span>
                        <span className="text-base md:text-xl font-black text-slate-800 dark:text-white">{item.price || "$0.00"}</span>
                      </div>
                      <span className={`text-xs font-bold flex items-center ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                        {isPositive ? "+" : ""}{item.changePercent || "0.00%"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* AI RANKINGS CARD */}
      <AIRankingCard
        assets={rankedAssets}
        isLoading={aiRankingsLoading}
        isError={aiRankingsError}
        stockCount={(activeWatchlist.items || []).length}
      />
    </div>
  );
}