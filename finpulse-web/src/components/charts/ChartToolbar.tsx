
import React, { useState, useRef, useEffect, memo } from "react";
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Camera, 
  LineChart, 
  Check, 
  Star, 
  Search, 
  SlidersHorizontal,
  Loader2
} from "lucide-react";
import TimeframeSelector from "./TimeframeSelector";

interface ChartToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;

  currentTimeframe: string;
  onTimeframeChange: (tf: string) => void;

  // Technical indicator props
  activeOverlays: string[];
  activePanes: string[];
  onToggleOverlay: (overlay: string) => void;
  onTogglePane: (pane: string) => void;
  onClearAll: () => void;

  // Advanced TradingView props
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onTakeScreenshot: () => void;
  
  compareSymbol: string;
  onCompareSymbol: (symbol: string) => void;
  
  settings: {
    gridVisible: boolean;
    lineThickness: number;
  };
  onSettingsChange: (settings: any) => void;
}

const OVERLAYS = [
  "EMA 20", 
  "EMA 50", 
  "EMA 200", 
  "SMA", 
  "VWAP", 
  "Bollinger Bands",
  "Last Price",
  "Previous Close",
  "Day High",
  "Day Low"
];
const PANES = ["RSI", "MACD", "Stochastic", "ATR"];

export const ChartToolbar = memo<ChartToolbarProps>(({
  onZoomIn,
  onZoomOut,
  onReset,
  currentTimeframe,
  onTimeframeChange,
  activeOverlays,
  activePanes,
  onToggleOverlay,
  onTogglePane,
  onClearAll,
  isFullscreen,
  onToggleFullscreen,
  onTakeScreenshot,
  compareSymbol,
  onCompareSymbol,
  settings,
  onSettingsChange,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [compareInput, setCompareInput] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const compareRef = useRef<HTMLDivElement>(null);

  // Favorites state persistent in LocalStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("finpulse_favorite_indicators");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("finpulse_favorite_indicators", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (indicator: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(indicator) ? prev.filter(i => i !== indicator) : [...prev, indicator]
    );
  };

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowDropdown(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setShowSettings(false);
      }
      if (compareRef.current && !compareRef.current.contains(target)) {
        setShowCompare(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced auto-complete logic for compare symbol search
  useEffect(() => {
    if (!compareInput.trim() || !showCompare) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(compareInput)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Compare symbol lookup failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [compareInput, showCompare]);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/60 dark:border-slate-800/60 rounded-xl mb-4 relative z-30">
      <div className="flex flex-wrap items-center gap-1.5">
        <TimeframeSelector selected={currentTimeframe} onChange={onTimeframeChange} />

        {/* Indicators Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            title="Toggle Indicators"
            aria-expanded={showDropdown}
            aria-label="Toggle Technical Indicators List"
            aria-haspopup="true"
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 ${
              showDropdown || activeOverlays.length > 0 || activePanes.length > 0
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            }`}
          >
            <LineChart className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Indicators</span>
            {(activeOverlays.length > 0 || activePanes.length > 0) && (
              <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-blue-500 text-white rounded-full font-bold">
                {activeOverlays.length + activePanes.length}
              </span>
            )}
          </button>

          {showDropdown && (
            <div 
              role="menu"
              className="absolute left-0 mt-2 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2.5 text-left space-y-2.5 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 origin-top-left"
            >
              <div>
                <span className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider block px-2 mb-1">
                  Overlays
                </span>
                <div className="space-y-0.5">
                  {OVERLAYS.map(ov => {
                    const isActive = activeOverlays.includes(ov);
                    const isFav = favorites.includes(ov);
                    return (
                      <button
                        key={ov}
                        onClick={() => onToggleOverlay(ov)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-left transition-colors group/item"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => toggleFavorite(ov, e)}
                            className="text-slate-350 hover:text-amber-400 transition-colors"
                          >
                            <Star className={`h-3.5 w-3.5 ${isFav ? "fill-amber-400 text-amber-400" : "opacity-0 group-hover/item:opacity-100"}`} />
                          </button>
                          <span>{ov}</span>
                        </div>
                        {isActive && <Check className="h-3.5 w-3.5 text-blue-500 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                <span className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider block px-2 mb-1">
                  Indicator Panes
                </span>
                <div className="space-y-0.5">
                  {PANES.map(pn => {
                    const isActive = activePanes.includes(pn);
                    const isFav = favorites.includes(pn);
                    return (
                      <button
                        key={pn}
                        onClick={() => onTogglePane(pn)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-left transition-colors group/item"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => toggleFavorite(pn, e)}
                            className="text-slate-355 hover:text-amber-400 transition-colors"
                          >
                            <Star className={`h-3.5 w-3.5 ${isFav ? "fill-amber-400 text-amber-400" : "opacity-0 group-hover/item:opacity-100"}`} />
                          </button>
                          <span>{pn}</span>
                        </div>
                        {isActive && <Check className="h-3.5 w-3.5 text-blue-500 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(activeOverlays.length > 0 || activePanes.length > 0) && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5">
                  <button
                    onClick={() => {
                      onClearAll();
                      setShowDropdown(false);
                    }}
                    className="w-full text-center py-1.5 text-xs font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Favorite Indicators Quick Toggles */}
        {favorites.length > 0 && (
          <div className="hidden lg:flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
            {favorites.map(fav => {
              const isOverlay = OVERLAYS.includes(fav);
              const isActive = isOverlay ? activeOverlays.includes(fav) : activePanes.includes(fav);
              return (
                <button
                  key={fav}
                  onClick={() => isOverlay ? onToggleOverlay(fav) : onTogglePane(fav)}
                  className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-colors ${
                    isActive 
                      ? "bg-blue-500 text-white" 
                      : "bg-slate-150 dark:bg-white/5 text-slate-550 hover:bg-slate-200 dark:hover:bg-white/10"
                  }`}
                >
                  {fav}
                </button>
              );
            })}
          </div>
        )}

        {/* Compare Symbol Popover */}
        <div className="relative" ref={compareRef}>
          <button
            onClick={() => setShowCompare(!showCompare)}
            title="Compare Tickers"
            aria-expanded={showCompare}
            aria-label="Compare Tickers Menu"
            aria-haspopup="true"
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 ${
              showCompare || compareSymbol
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Compare</span>
            {compareSymbol && (
              <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-emerald-500 text-white rounded font-bold uppercase">
                {compareSymbol}
              </span>
            )}
          </button>

          {showCompare && (
            <div 
              role="menu"
              className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 origin-top-left"
            >
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter ticker (e.g. AAPL)..."
                  value={compareInput}
                  onChange={(e) => setCompareInput(e.target.value.toUpperCase())}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none text-slate-900 dark:text-slate-100 uppercase placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {isSearching && <Loader2 className="absolute right-2.5 h-3.5 w-3.5 text-slate-400 animate-spin" />}
              </div>

              {suggestions.length > 0 && (
                <div className="max-h-40 overflow-y-auto border-t border-slate-100 dark:border-slate-800 pt-1.5 space-y-0.5">
                  {suggestions.map((asset) => (
                    <button
                      key={`${asset.symbol}-${asset.exchange || 'GLOBAL'}`}
                      onClick={() => {
                        onCompareSymbol(asset.symbol);
                        setCompareInput("");
                        setShowCompare(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 flex justify-between items-center text-[11px] font-bold transition-colors"
                    >
                      <span className="text-slate-900 dark:text-white">{asset.symbol}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]">{asset.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {compareSymbol && (
                <button
                  onClick={() => {
                    onCompareSymbol("");
                    setShowCompare(false);
                  }}
                  className="w-full text-center py-1 text-xs font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition-colors"
                >
                  Clear Comparison
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions Controls Panel */}
      <div className="flex items-center gap-1">
        <button 
          onClick={onZoomIn} 
          title="Zoom In" 
          aria-label="Zoom In"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400"
        >
          <Plus size={15} />
        </button>
        <button 
          onClick={onZoomOut} 
          title="Zoom Out" 
          aria-label="Zoom Out"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400"
        >
          <Minus size={15} />
        </button>
        <button 
          onClick={onReset} 
          title="Reset View" 
          aria-label="Reset Chart Zoom"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400"
        >
          <RotateCcw size={15} />
        </button>

        {/* Screenshot PNG Export */}
        <button 
          onClick={onTakeScreenshot} 
          title="Export Screenshot" 
          aria-label="Export Chart Screenshot"
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400"
        >
          <Camera size={15} />
        </button>

        {/* Chart Settings Menu */}
        <div className="relative" ref={settingsRef}>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            title="Chart Settings" 
            aria-expanded={showSettings}
            aria-label="Toggle Chart Custom Settings Panel"
            aria-haspopup="true"
            className={`p-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 ${
              showSettings 
                ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white" 
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            }`}
          >
            <SlidersHorizontal size={15} />
          </button>

          {showSettings && (
            <div 
              role="menu"
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-3.5 text-left space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150 origin-top-right"
            >
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Preferences
              </span>
              
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Show Grid Lines</span>
                <input
                  type="checkbox"
                  checked={settings.gridVisible}
                  onChange={(e) => onSettingsChange({ ...settings, gridVisible: e.target.checked })}
                  className="rounded text-blue-500 h-4 w-4 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Line Thickness</span>
                <select
                  value={settings.lineThickness}
                  onChange={(e) => onSettingsChange({ ...settings, lineThickness: Number(e.target.value) })}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded p-1.5 outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <option value={1} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">1px (Thin)</option>
                  <option value={2} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">2px (Normal)</option>
                  <option value={3} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">3px (Medium)</option>
                  <option value={4} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">4px (Thick)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen request */}
        <button 
          onClick={onToggleFullscreen} 
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} 
          aria-label={isFullscreen ? "Exit Fullscreen Mode" : "Enter Fullscreen Mode"}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400"
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>
    </div>
  );
});