import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Plus, Trash2, FolderPlus, X, ChevronDown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChart } from "../../../context/ChartContext";
import { getStockSentiment } from "../../../services/marketService";
import AIRankingCard
from "./AIRankingCard";

// ==========================================
// INTERFACES
// ==========================================
interface WatchlistItem {
  id: string;
  symbol: string;
  yahooSymbol?: string;
  exchange?: string;
  type?: string;
  name: string;
  price: string;
  change: string; // Changed to string to match your mock data ("1.20", etc.)
  changePercent: string;
  isPositive: boolean;
  sentiment?: "Bullish" | "Bearish" | "Neutral";
  aiScore?: number;
  aiReason?: string;
}

interface WatchlistData {
  id: string;
  name: string;
  items: WatchlistItem[];
}

const defaultWatchlists: WatchlistData[] = [
  {
    id: "list-1",
    name: "Main Portfolio",
    items: [
      { id: "AAPL", symbol: "AAPL", name: "Apple Inc.", price: "$175.43", change: "1.20", changePercent: "+0.68%", isPositive: true },
      { id: "MSFT", symbol: "MSFT", name: "Microsoft Corp.", price: "$312.10", change: "-2.40", changePercent: "-0.76%", isPositive: false },
    ],
  },
  {
    id: "list-2",
    name: "Crypto Watch",
    items: [
      { id: "BTCUSD", symbol: "BTC/USD", name: "Bitcoin", price: "$64,230.00", change: "1200.00", changePercent: "+1.90%", isPositive: true },
    ],
  },
];

export default function Watchlist() {
  const navigate = useNavigate();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [watchlists, setWatchlists] = useState<WatchlistData[]>(defaultWatchlists);
  const [activeListId, setActiveListId] = useState<string>(defaultWatchlists[0].id);

  const loadAISentiment = async () => {
    const updatedLists = await Promise.all(
      watchlists.map(async (list) => {
        const items = await Promise.all(
          list.items.map(async (item) => {
            try {
              const ai = await getStockSentiment(item.symbol);
              return {
                ...item,
                aiScore: ai.score,
                aiReason: ai.reason,
              };
            } catch {
              return item;
            }
          })
        );

        return {
          ...list,
          items,
        };
      })
    );

    setWatchlists(updatedLists);
  };

  useEffect(() => {
    loadAISentiment();
  }, []);

  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isAddingAsset, setIsAddingAsset] = useState(false);

  const [newAssetSymbol, setNewAssetSymbol] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAssetInfo, setSelectedAssetInfo] = useState<{
    symbol: string;
    yahooSymbol: string;
    name: string;
    exchange: string;
    type: string;
  } | null>(null);

  // Filter/Sort States
  let search = "";
  let changeFilter = "";
  const [sentimentFilter, setSentimentFilter] = useState<"Bullish" | "Bearish" | "">("");
  const sortField: string = "name";
  const sortDirection: string = "asc";

  const { openChart } = useChart();

  // ==========================================
  // DEBOUNCED SEARCH EFFECT
  // ==========================================
  useEffect(() => {
    if (!newAssetSymbol.trim() || !showSuggestions) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(newAssetSymbol)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Search fetch failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [newAssetSymbol, showSuggestions]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const activeWatchlist = watchlists.find((w) => w.id === activeListId) || watchlists[0];

  const handleCreateWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    const newList: WatchlistData = {
      id: `list-${Date.now()}`,
      name: newListName.trim(),
      items: [],
    };

    setWatchlists([...watchlists, newList]);
    setActiveListId(newList.id);
    setNewListName("");
    setIsCreatingList(false);
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetSymbol.trim()) return;

    const assetName = selectedAssetInfo?.name || `${newAssetSymbol.toUpperCase()} (Pending Data)`;

    const mockNewAsset: WatchlistItem = {
      id: selectedAssetInfo?.yahooSymbol || newAssetSymbol.toUpperCase(),
      symbol: selectedAssetInfo?.symbol || newAssetSymbol.toUpperCase(),
      yahooSymbol: selectedAssetInfo?.yahooSymbol || newAssetSymbol.toUpperCase(),
      exchange: selectedAssetInfo?.exchange || "GLOBAL",
      type: selectedAssetInfo?.type || "Asset",
      name: assetName,
      price: "$0.00",
      change: "0.00",
      changePercent: "0.00%",
      isPositive: true,
    };

    setWatchlists(
      watchlists.map((list) => {
        if (list.id === activeListId) {
          if (list.items.find((i) => i.symbol === mockNewAsset.symbol)) return list;
          return { ...list, items: [...list.items, mockNewAsset] };
        }
        return list;
      })
    );

    setNewAssetSymbol("");
    setSelectedAssetInfo(null);
    setIsAddingAsset(false);
  };

  const handleRemoveAsset = (assetId: string) => {
    setWatchlists(
      watchlists.map((list) => {
        if (list.id === activeListId) {
          return { ...list, items: list.items.filter((item) => item.id !== assetId) };
        }
        return list;
      })
    );
  };

  const handleDeleteWatchlist = () => {
    if (watchlists.length === 1) return;
    const filteredLists = watchlists.filter((w) => w.id !== activeListId);
    setWatchlists(filteredLists);
    setActiveListId(filteredLists[0].id);
  };

  // ==========================================
  // FILTERING & SORTING LOGIC
  // ==========================================
  const filteredData = activeWatchlist.items.filter((item) => {
    const q = search.toLowerCase();
    const companyOrSymbol = item.name.toLowerCase().includes(q) || item.symbol.toLowerCase().includes(q);
    const matchesChange = changeFilter === "" || (changeFilter === "Bullish" && item.isPositive) || (changeFilter === "Bearish" && !item.isPositive);
    const matchesSentiment = sentimentFilter === "" || (item.sentiment || "Neutral") === sentimentFilter;
    return companyOrSymbol && matchesChange && matchesSentiment;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let result = 0;
    switch (sortField) {
      case "name":
        result = a.name.localeCompare(b.name);
        break;
      case "price":
        result = parseFloat(a.price.replace(/[^0-9.-]+/g, "")) - parseFloat(b.price.replace(/[^0-9.-]+/g, ""));
        break;
      case "change":
        result = parseFloat(a.change) - parseFloat(b.change);
        break;
      case "sentiment":
        result = (a.sentiment || "Neutral").localeCompare(b.sentiment || "Neutral");
        break;
      default:
        result = 0;
    }
    return sortDirection === "asc" ? result : -result;
  });

  const rankedAssets =
  [...activeWatchlist.items]
    .filter(
      (item) =>
        item.aiScore !== undefined
    )
    .sort(
      (a, b) =>
        (b.aiScore || 0) -
        (a.aiScore || 0)
    )
    .slice(0, 5)
    .map((item) => ({
      symbol: item.symbol,
      score: item.aiScore || 0,
      verdict:
        item.aiReason ||
        "No analysis available",
    }));

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => setSentimentFilter("")}
          className={`cursor-pointer rounded-3xl p-5 text-white transition-all
            ${sentimentFilter === "" ? "bg-gradient-to-br from-blue-600 to-cyan-500 ring-2 ring-blue-300" : "bg-gradient-to-br from-blue-600 to-cyan-500 opacity-80 hover:opacity-100"}`}
        >
          <p className="text-sm opacity-80">Total Assets</p>
          <h2 className="text-3xl font-bold">{activeWatchlist.items.length}</h2>
        </div>

        <div
          onClick={() => setSentimentFilter(sentimentFilter === "Bullish" ? "" : "Bullish")}
          className={`cursor-pointer rounded-3xl backdrop-blur-xl p-5 border transition-all
            ${sentimentFilter === "Bullish" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "bg-white/70 dark:bg-night-900/70 border-slate-200 dark:border-white/10"}`}
        >
          <p className="text-sm text-slate-500">Bullish Signals</p>
          <h2 className="text-3xl font-bold text-emerald-500">
            {activeWatchlist.items.filter((i) => i.sentiment === "Bullish").length}
          </h2>
        </div>

        <div
          onClick={() => setSentimentFilter(sentimentFilter === "Bearish" ? "" : "Bearish")}
          className={`cursor-pointer rounded-3xl backdrop-blur-xl p-5 border transition-all
            ${sentimentFilter === "Bearish" ? "border-rose-500 bg-rose-50 dark:bg-rose-500/10" : "bg-white/70 dark:bg-night-900/70 border-slate-200 dark:border-white/10"}`}
        >
          <p className="text-sm text-slate-500">Bearish Signals</p>
          <h2 className="text-3xl font-bold text-rose-500">
            {activeWatchlist.items.filter((i) => i.sentiment === "Bearish").length}
          </h2>
        </div>

        <div className="rounded-3xl bg-white/70 dark:bg-night-900/70 backdrop-blur-xl p-5 border border-slate-200 dark:border-white/10">
          <p className="text-sm text-slate-500">AI Confidence</p>
          <h2 className="text-3xl font-bold">84%</h2>
        </div>
      </div>

      {/* WATCHLIST CONTROLS HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-night-900/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isCreatingList ? (
            <form onSubmit={handleCreateWatchlist} className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                placeholder="List Name..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="bg-slate-100 dark:bg-night-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm rounded-lg outline-none text-slate-900 dark:text-white"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors">
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingList(false)}
                className="bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 p-2 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="flex gap-2 overflow-x-auto">
                  {watchlists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => setActiveListId(list.id)}
                      className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                        activeListId === list.id
                          ? "bg-cyan-500 text-white"
                          : "bg-slate-100 dark:bg-night-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {list.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setIsCreatingList(true)}
                title="Create New Watchlist"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-400 transition-colors"
              >
                <FolderPlus className="h-4 w-4" />
              </button>

              {watchlists.length > 1 && (
                <button
                  onClick={handleDeleteWatchlist}
                  title="Delete Current Watchlist"
                  className="p-2.5 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Add Asset Button */}
        <button
          onClick={() => setIsAddingAsset(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-night-900 px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Symbol
        </button>
      </div>

      {/* MAIN TABLE CARD */}
      <div className="w-full glass-card overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-night-900/70 backdrop-blur-xl shadow-xl transition-colors duration-300">
        <div className="p-5">
          {sortedData.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 cursor-pointer">
              {sortedData.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    openChart({
                      symbol: item.symbol,
                      yahooSymbol: item.symbol,
                      name: item.name,
                      exchange: "WATCHLIST",
                      type: "asset",
                    })
                  }
                  className="group rounded-3xl cursor-pointer border border-slate-200 dark:border-white/10 bg-white dark:bg-night-900 p-5 hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{item.symbol}</h3>
                      <p className="text-sm text-slate-500">{item.name}</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAsset(item.id);
                      }}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="mt-5">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{item.price}</p>
                    <div className={`flex items-center gap-2 mt-2 ${item.isPositive ? "text-emerald-500" : "text-red-500"}`}>
                      {item.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span>{item.changePercent}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="font-bold text-lg">No Assets Added</h3>
              <p className="text-slate-500">Start tracking your favorite stocks</p>
            </div>
          )}
        </div>
      </div>

      {/* ADD ASSET MODAL */}
      {isAddingAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-night-950/80 backdrop-blur-sm" onClick={() => setIsAddingAsset(false)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-night-900/70 backdrop-blur-xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Symbol to Watchlist</h3>
              <button onClick={() => setIsAddingAsset(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-4">
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 block mb-1">Search Asset</label>
                <div className="relative">
                  <input
                    autoFocus
                    type="text"
                    required
                    placeholder="e.g. Apple or AAPL"
                    value={newAssetSymbol}
                    onChange={(e) => {
                      setNewAssetSymbol(e.target.value.toUpperCase());
                      setSelectedAssetInfo(null);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-3 text-sm rounded-xl outline-none text-slate-900 dark:text-white uppercase pr-10"
                  />
                  {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />}
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white/70 dark:bg-night-900/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                    {suggestions.map((asset) => (
                      <div
                        key={asset.id}
                        className="px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 flex justify-between items-center border-b border-slate-50 dark:border-white/5 last:border-0"
                        onClick={() => {
                          setNewAssetSymbol(asset.symbol);
                          setSelectedAssetInfo({
                            symbol: asset.symbol,
                            yahooSymbol: asset.yahooSymbol,
                            name: asset.name,
                            exchange: asset.exchange,
                            type: asset.type,
                          });
                          setShowSuggestions(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{asset.symbol}</span>
                          <span className="text-xs text-slate-500 line-clamp-1">{asset.name}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">
                          {asset.type?.replace("Common ", "")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-2">
                  *In a production environment, this will fetch real data from Finnhub/Dhan before adding.
                </p>
              </div>

              <button type="submit" className="w-full rounded-xl bg-blue-600 dark:bg-cyan-500 py-3 text-sm font-bold text-white dark:text-night-900 mt-4 shadow-md hover:scale-[1.02] transition-transform">
                Add to {activeWatchlist.name}
              </button>
            </form>
          </div>
        </div>
      )}

      <AIRankingCard
  assets={rankedAssets}
/>

    </div>
  );
}