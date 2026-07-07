import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { getFundamentals } from '../../../services/marketService';
import API_BASE_URL from "../../../config/api";

interface PaperTradingOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  virtualBalance: number;
  activeCurrency: '₹' | '$';
  usdToInrRate: number;
  currentHoldings: Array<{ ticker: string; shares: number }>;
  onExecuteTrade: (trade: {
    type: 'BUY' | 'SELL';
    symbol: string;
    name: string;
    shares: number;
    price: number;
    marketId: string;
  }) => void;
}

export default function PaperTradingOrderModal({
  isOpen,
  onClose,
  virtualBalance,
  activeCurrency,
  usdToInrRate,
  currentHoldings,
  onExecuteTrade,
}: PaperTradingOrderModalProps) {
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [assetSearch, setAssetSearch] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [livePriceLoading, setLivePriceLoading] = useState(false);
  const [sharesInput, setSharesInput] = useState('');

  // Search suggestions
  useEffect(() => {
    if (!assetSearch.trim() || !showSuggestions) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(assetSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [assetSearch, showSuggestions]);

  // Fetch live price when asset is selected
  useEffect(() => {
    if (!selectedAsset) {
      setLivePrice(null);
      return;
    }

    const fetchLivePrice = async () => {
      setLivePriceLoading(true);
      try {
        const data = await getFundamentals(selectedAsset.symbol);
        if (data && typeof data.price === 'number') {
          setLivePrice(data.price);
        } else {
          setLivePrice(80.00); // Fallback mock price
        }
      } catch (err) {
        console.error("Failed to load live price, using fallback:", err);
        setLivePrice(150.00);
      } finally {
        setLivePriceLoading(false);
      }
    };

    fetchLivePrice();
  }, [selectedAsset]);

  if (!isOpen) return null;

  const handleSelectAsset = (asset: any) => {
    setSelectedAsset(asset);
    setAssetSearch(`${asset.name} (${asset.symbol})`);
    setShowSuggestions(false);
  };

  const currentAvailableShares = selectedAsset
    ? currentHoldings.find(h => h.ticker.toUpperCase() === selectedAsset.symbol.toUpperCase())?.shares || 0
    : 0;

  // Conversion factor helper
  // SelectedAsset exchange e.g. NSE -> INR, otherwise USD.
  const isDomestic = selectedAsset?.symbol?.endsWith('.NS') || selectedAsset?.symbol?.endsWith('.BO');
  const assetCurrency = isDomestic ? '₹' : '$';
  
  // Calculate price converted to active portfolio currency
  const getConvertedPrice = (price: number) => {
    if (activeCurrency === '₹' && !isDomestic) {
      return price * usdToInrRate; // USD to INR
    }
    if (activeCurrency === '$' && isDomestic) {
      return price / usdToInrRate; // INR to USD
    }
    return price;
  };

  const calculatedPrice = livePrice ? getConvertedPrice(livePrice) : 0;
  const sharesCount = parseFloat(sharesInput) || 0;
  const estimatedValue = sharesCount * calculatedPrice;

  // Validation
  const canSubmit =
    selectedAsset &&
    sharesCount > 0 &&
    !livePriceLoading &&
    (tradeType === 'BUY'
      ? estimatedValue <= virtualBalance
      : sharesCount <= currentAvailableShares);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedAsset || !calculatedPrice) return;

    // Determine marketId
    let marketId = 'us';
    if (isDomestic) marketId = 'domestic';
    else if (selectedAsset.type?.toLowerCase().includes('crypto')) marketId = 'crypto';

    onExecuteTrade({
      type: tradeType,
      symbol: selectedAsset.symbol,
      name: selectedAsset.name,
      shares: sharesCount,
      price: calculatedPrice,
      marketId,
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-night-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090d1a] shadow-2xl p-6 text-slate-105 font-sans">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🎮 Paper Trading Sandbox</span>
          </h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Buy/Sell Action Picker */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => setTradeType('BUY')}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
              tradeType === 'BUY'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            BUY ORDER
          </button>
          <button
            type="button"
            onClick={() => setTradeType('SELL')}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
              tradeType === 'SELL'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            SELL ORDER
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-slate-850 dark:text-slate-200">
          {/* Asset Search */}
          <div className="relative">
            <label className="text-xs font-bold text-slate-400 block mb-1.5">Asset Symbol</label>
            <div className="relative">
              <input
                type="text"
                value={assetSearch}
                onChange={(e) => {
                  setAssetSearch(e.target.value);
                  setSelectedAsset(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 px-3.5 py-2.5 text-sm rounded-xl outline-none text-slate-900 dark:text-white pr-10 focus:border-blue-500 transition-colors"
                placeholder="Search symbol (e.g. RELIANCE, AAPL, BTC-USD)"
                required
              />
              {isSearching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                {suggestions.map((asset) => (
                  <div
                    key={asset.symbol}
                    onClick={() => handleSelectAsset(asset)}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 flex justify-between items-center border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                  >
                    <div>
                      <span className="text-xs font-black text-slate-950 dark:text-white">{asset.symbol}</span>
                      <span className="text-[10px] text-slate-450 block">{asset.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-800">{asset.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details / Estimates */}
          {selectedAsset && (
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-250 dark:border-slate-900 rounded-2xl p-3.5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Asset Name</span>
                <span className="font-bold text-slate-950 dark:text-white truncate max-w-[200px]">{selectedAsset.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Live Market Quote</span>
                <span className="font-mono font-bold text-slate-950 dark:text-white">
                  {livePriceLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : `${assetCurrency}${livePrice?.toFixed(2) || '---'}`}
                </span>
              </div>
              {tradeType === 'SELL' && (
                <div className="flex justify-between items-center text-xs border-t border-slate-200 dark:border-slate-900 pt-2">
                  <span className="text-slate-400 font-medium">Own Holdings</span>
                  <span className="font-mono font-bold text-slate-950 dark:text-white">{currentAvailableShares} shares available</span>
                </div>
              )}
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5">Quantity (Shares / Volume)</label>
            <input
              type="number"
              value={sharesInput}
              min="0.0001"
              step="any"
              onChange={(e) => setSharesInput(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 px-3.5 py-2.5 text-sm rounded-xl outline-none text-slate-900 dark:text-white focus:border-blue-500 transition-colors"
              placeholder="0.0"
              required
            />
          </div>

          {/* Total Cost / Proceeds Estimate */}
          {sharesCount > 0 && selectedAsset && !livePriceLoading && (
            <div className="border-t border-slate-200 dark:border-slate-900 pt-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Estimated Value ({activeCurrency})</span>
                <span className="font-mono font-black text-slate-950 dark:text-white">
                  {activeCurrency}{estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Available Cash Balance</span>
                <span className="font-mono font-bold text-slate-950 dark:text-white">
                  {activeCurrency}{virtualBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {tradeType === 'BUY' && estimatedValue > virtualBalance && (
                <p className="text-[10px] text-rose-500 font-bold text-right">⚠️ Insufficient virtual balance to execute buy order.</p>
              )}
              {tradeType === 'SELL' && sharesCount > currentAvailableShares && (
                <p className="text-[10px] text-rose-500 font-bold text-right">⚠️ Insufficient holding balance to execute sell order.</p>
              )}
            </div>
          )}

          {/* Execution Button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white transition-all shadow-md mt-4 ${
              canSubmit
                ? tradeType === 'BUY'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/10'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border border-slate-250 dark:border-slate-800 cursor-not-allowed'
            }`}
          >
            {tradeType === 'BUY' ? 'Execute Buy Order' : 'Execute Sell Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
