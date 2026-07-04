import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Plus, Trash2,
  Download, MessageSquare
} from "lucide-react";
import {
  useWatchlists, useCreateWatchlist, useAddWatchlistItem, useRemoveWatchlistItem,
  useAddWatchlistNote
} from "../../../hooks/useDashboard";
import AIRankingCard from "./AIRankingCard";

export default function Watchlist() {
  const navigate = useNavigate();
  const { data: dbWatchlists = [] } = useWatchlists();
  const createListMutation = useCreateWatchlist();
  const addItemMutation = useAddWatchlistItem();
  const removeItemMutation = useRemoveWatchlistItem();

  const [activeListId, setActiveListId] = useState<string>("");
  const [watchlists, setWatchlists] = useState<any[]>([]);

  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [newAssetSymbol, setNewAssetSymbol] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAssetInfo, setSelectedAssetInfo] = useState<any>(null);

  const [activeNoteItemId, setActiveNoteItemId] = useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteDesc, setNewNoteDesc] = useState("");
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const searchQuery = "";
  const showOnlyFavorites = false;
  const showOnlyPinned = false;
  const sortField: string = "position";
  const sortDirection = "asc";

  useEffect(() => {
    if (dbWatchlists.length > 0) {
      setWatchlists(dbWatchlists);
      if (!activeListId) {
        setActiveListId(dbWatchlists[0].id);
      }
    }
  }, [dbWatchlists, activeListId]);

  useEffect(() => {
    const term = newAssetSymbol.trim();
    if (!term) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/screeners/search?q=${term}`);
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

  const addNoteMutation = useAddWatchlistNote();

  const handleCreateWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createListMutation.mutate({ name: newListName.trim() }, {
      onSuccess: (data) => { setActiveListId(data.id); setNewListName(""); setIsCreatingList(false); }
    });
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetSymbol.trim()) return;
    const symbol = selectedAssetInfo?.symbol || newAssetSymbol.toUpperCase();
    addItemMutation.mutate({ listId: activeListId, item: { symbol, notes: "Added to watchlist" } }, {
      onSuccess: () => { setNewAssetSymbol(""); setSelectedAssetInfo(null); setIsAddingAsset(false); }
    });
  };

  const handleRemoveAsset = (itemId: string) => removeItemMutation.mutate(itemId);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNoteItemId || !newNoteTitle.trim() || !newNoteDesc.trim()) return;
    addNoteMutation.mutate({ itemId: activeNoteItemId, note: { title: newNoteTitle, description: newNoteDesc } }, {
      onSuccess: () => { setNewNoteTitle(""); setNewNoteDesc(""); }
    });
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
      return (item.symbol.toLowerCase().includes(q) || (item.name || "").toLowerCase().includes(q)) && (!showOnlyFavorites || item.favorite) && (!showOnlyPinned || item.pinned);
    });
    filtered.sort((a: any, b: any) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      let valA = a[sortField], valB = b[sortField];
      if (sortField === "price" || sortField === "changePercent") {
        valA = parseFloat(String(a.price || "0").replace(/[^0-9.-]+/g, ""));
        valB = parseFloat(String(b.price || "0").replace(/[^0-9.-]+/g, ""));
      }
      return sortDirection === "asc" ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
    });
    return filtered;
  }, [activeWatchlist.items, searchQuery, showOnlyFavorites, showOnlyPinned, sortField, sortDirection]);

  const getAvatarColor = (sym: string) => {
    const colors = ["from-blue-500 to-indigo-600", "from-cyan-500 to-blue-600", "from-emerald-500 to-teal-600", "from-violet-500 to-purple-600", "from-rose-500 to-pink-600"];
    return colors[sym.charCodeAt(0) % colors.length];
  };

  const rankedAssets = useMemo(() => {
    return [...(activeWatchlist.items || [])]
      .filter((item: any) => item.aiScore !== undefined)
      .sort((a: any, b: any) => (b.aiScore || 0) - (a.aiScore || 0))
      .slice(0, 5)
      .map((item: any) => ({ symbol: item.symbol, score: item.aiScore || 0, verdict: item.aiReason || "No analysis available" }));
  }, [activeWatchlist.items]);

  const stats = useMemo(() => {
    const items = activeWatchlist.items || [];
    let gainers = 0, losers = 0, sumChange = 0;
    items.forEach((item: any) => {
      const change = parseFloat(String(item.changePercent || "0").replace(/[^0-9.-]+/g, ""));
      if (change > 0) gainers++; else if (change < 0) losers++;
      sumChange += change;
    });
    return { total: items.length, gainers, losers, avgChange: `${(sumChange / (items.length || 1)).toFixed(2)}%` };
  }, [activeWatchlist.items]);

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-3xl p-5 bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-xl">
          <p className="text-xs opacity-75 uppercase font-bold">Assets</p>
          <h2 className="text-3xl font-black mt-2">{stats.total}</h2>
        </div>
        <div className="rounded-3xl p-5 bg-white/70 dark:bg-night-900/70 border border-slate-200 dark:border-white/10 backdrop-blur-xl">
          <p className="text-xs text-slate-400 font-bold uppercase">Gainers</p>
          <h2 className="text-3xl font-black mt-2 text-emerald-500 flex items-center gap-2"><TrendingUp className="h-6 w-6" /> {stats.gainers}</h2>
        </div>
        <div className="rounded-3xl p-5 bg-white/70 dark:bg-night-900/70 border border-slate-200 dark:border-white/10 backdrop-blur-xl">
          <p className="text-xs text-slate-400 font-bold uppercase">Losers</p>
          <h2 className="text-3xl font-black mt-2 text-rose-500 flex items-center gap-2"><TrendingDown className="h-6 w-6" /> {stats.losers}</h2>
        </div>
        <div className="rounded-3xl p-5 bg-white/70 dark:bg-night-900/70 border border-slate-200 dark:border-white/10 backdrop-blur-xl">
          <p className="text-xs text-slate-400 font-bold uppercase">Avg Return</p>
          <h2 className="text-3xl font-black mt-2">{stats.avgChange}</h2>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-night-900/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-5 rounded-3xl shadow-xl flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {isCreatingList ? (
              <form onSubmit={handleCreateWatchlist} className="flex items-center gap-2">
                <input autoFocus type="text" value={newListName} onChange={(e) => setNewListName(e.target.value)} className="bg-slate-100 dark:bg-night-800 border px-3 py-2 text-sm rounded-xl" />
                <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold">Save</button>
              </form>
            ) : (
              <>
                {watchlists.map((list) => (
                  <button key={list.id} onClick={() => setActiveListId(list.id)} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeListId === list.id ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-white/5"}`}>{list.name}</button>
                ))}
                <button onClick={() => setIsCreatingList(true)} className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><Plus className="h-4 w-4" /></button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold"><Download className="h-3.5 w-3.5" /></button>
            <button onClick={() => setIsAddingAsset(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"><Plus className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        <AnimatePresence>
          {processedItems.map((item: any) => (
            <motion.div key={item.id} className="group rounded-3xl border border-slate-200 bg-white dark:bg-night-900 p-5 shadow-sm">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3" onClick={() => navigate(`/asset/${item.symbol}`)}>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(item.symbol)} flex items-center justify-center text-white text-xs font-black uppercase`}>{item.symbol.slice(0, 2)}</div>
                  <div>
                    <h3 className="font-bold text-base">{item.symbol}</h3>
                    <p className="text-xs text-slate-400">{item.name}</p>
                  </div>
                </div>
                <button onClick={() => handleRemoveAsset(item.id)} className="text-slate-400 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-5 flex items-baseline justify-between">
                <p className="text-2xl font-black">{item.price}</p>
                <button onClick={() => { setActiveNoteItemId(item.id); setIsNotesOpen(true); }} className="text-slate-400"><MessageSquare className="h-4 w-4" /></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isNotesOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setIsNotesOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-night-900 p-6 rounded-3xl shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Notes</h3>
            <form onSubmit={handleAddNote} className="space-y-4">
              <input placeholder="Title" value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} className="w-full border p-2 rounded-xl" />
              <textarea placeholder="Description" value={newNoteDesc} onChange={(e) => setNewNoteDesc(e.target.value)} className="w-full border p-2 rounded-xl" />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl">Add Note</button>
            </form>
          </div>
        </div>
      )}

      {isAddingAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setIsAddingAsset(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-night-900 p-6 rounded-3xl">
            <form onSubmit={handleAddAsset}>
              <input value={newAssetSymbol} onChange={(e) => { setNewAssetSymbol(e.target.value); setShowSuggestions(true) }} className="w-full border p-3 rounded-xl mb-4" placeholder="Search Ticker..." />
              {showSuggestions && suggestions.map((s) => (
                <div key={s.id} onClick={() => { setNewAssetSymbol(s.symbol); setSelectedAssetInfo(s); setShowSuggestions(false); }} className="p-2 cursor-pointer">{s.symbol}</div>
              ))}
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl">Add Symbol</button>
            </form>
          </div>
        </div>
      )}

      <AIRankingCard assets={rankedAssets} />
    </div>
  );
}