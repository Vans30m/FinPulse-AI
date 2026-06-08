import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Globe, DollarSign, TrendingUp, PieChart, Layers, Plus, X, Coins, Bitcoin, Loader2 } from 'lucide-react';
import { BarChart3 } from "lucide-react";
import AssetChartModal from "../../../components/charts/AssetChartModal";
import StockSearch from "../../../components/ui/StockSearch";

interface Holding {
  ticker: string;
  yahooSymbol?: string;
  exchange?: string;
  type?: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  totalGain: number;
  gainPercent: number;
  colorClass: {
    bg: string;
    text: string;
    border: string;
  };
}

interface MarketSection {
  id: string;
  title: string;
  region: string;
  icon: React.ReactNode;
  holdings: Holding[];
}


const INITIAL_SECTIONS: MarketSection[] = [
  {
    id: 'domestic',
    title: 'Domestic Market',
    region: 'National Equities',
    icon: <Layers className="h-5 w-5 text-blue-600 dark:text-cyan-400" />,
    holdings: [
      {
        ticker: 'RELIANCE',
        name: 'Reliance Industries Ltd.',
        shares: 45,
        avgCost: 2450.00,
        currentPrice: 2870.50,
        marketValue: 129172.50,
        totalGain: 18922.50,
        gainPercent: 17.16,
        colorClass: { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200/50 dark:border-indigo-900/50' }
      }
    ]
  },
  {
    id: 'us',
    title: 'US Market',
    region: 'North America',
    icon: <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
    holdings: [
      {
        ticker: 'NVDA',
        name: 'NVIDIA Corporation',
        shares: 15,
        avgCost: 420.00,
        currentPrice: 875.12,
        marketValue: 13126.80,
        totalGain: 6826.80,
        gainPercent: 108.36,
        colorClass: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200/50 dark:border-emerald-900/50' }
      }
    ]
  },
  {
    id: 'other',
    title: 'Other Markets',
    region: 'Global / Exotic',
    icon: <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
    holdings: [
      {
        ticker: 'SMI',
        name: 'Swiss Market Index',
        shares: 5,
        avgCost: 10750,
        currentPrice: 11500,
        marketValue: 57500,
        totalGain: 3750,
        gainPercent: 7.0,
        colorClass: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200/50 dark:border-purple-900/50' }
      }
    ]
  },
  {
    id: 'crypto',
    title: 'Crypto Market',
    region: 'Digital Assets',
    icon: <Bitcoin className="h-5 w-5 text-amber-500 dark:text-amber-300" />,
    holdings: [
      {
        ticker: 'BTC',
        name: 'Bitcoin',
        shares: 0.42,
        avgCost: 48000,
        currentPrice: 67500,
        marketValue: 28350,
        totalGain: 8190,
        gainPercent: 40.6,
        colorClass: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200/50 dark:border-amber-900/50' }
      }
    ]
  },
  {
    id: 'metals',
    title: 'Precious Metals',
    region: 'Physical Commodities',
    icon: <Coins className="h-5 w-5 text-yellow-500 dark:text-yellow-300" />,
    holdings: []
  }
];

export default function PortfolioDashboard() {
  const [sections, setSections] = useState<MarketSection[]>(INITIAL_SECTIONS);
  const [activeMarket, setActiveMarket] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounced Search States
  const [assetSearch, setAssetSearch] = useState('');
  const [assetSuggestions, setAssetSuggestions] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] =
useState<{
  ticker: string;
  yahooSymbol: string;
  name: string;
  exchange: string;
  type: string;
} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Form State
  const [marketId, setMarketId] = useState('domestic');
  const [shares, setShares] = useState('');
  const [cost, setCost] = useState('');

  const [chartOpen, setChartOpen] =
  useState(false);

const [chartAsset, setChartAsset] =
  useState<any>(null);

  // Finnhub Debounced Search
  useEffect(() => {
    if (!assetSearch.trim() || !showSuggestions) {
      setAssetSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(assetSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setAssetSuggestions(data);
        }
      } catch (error) {
        console.error("Search fetch failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [assetSearch, showSuggestions]);

  const handleSelectAsset = (
  asset: any
) => {
  setSelectedAsset({
    ticker: asset.symbol,
    yahooSymbol:
      asset.yahooSymbol,
    name: asset.name,
    exchange:
      asset.exchange,
    type: asset.type,
  });

  setAssetSearch(
    `${asset.name} (${asset.symbol})`
  );

  setShowSuggestions(false);
};

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !shares || !cost) return;

    const numShares = parseFloat(shares);
    const numCost = parseFloat(cost);

    const baseColors = [
      { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200/50 dark:border-purple-900/50' },
      { bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-200/50 dark:border-sky-900/50' },
      { bg: 'bg-pink-50 dark:bg-pink-950/40', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200/50 dark:border-pink-900/50' }
    ];
    const chosenColor = baseColors[Math.floor(Math.random() * baseColors.length)];

    const newHolding: Holding = {
  ticker: selectedAsset.ticker,

  yahooSymbol:
    selectedAsset.yahooSymbol,

  exchange:
    selectedAsset.exchange,

  type:
    selectedAsset.type,

  name: selectedAsset.name,
      shares: numShares,
      avgCost: numCost,
      currentPrice: numCost * 1.04, // Mock 4% gain
      marketValue: numShares * (numCost * 1.04),
      totalGain: (numShares * (numCost * 1.04)) - (numShares * numCost),
      gainPercent: 4.00,
      colorClass: chosenColor
    };

    setSections(prev => prev.map(sec => {
      if (sec.id === marketId) {
        return { ...sec, holdings: [...sec.holdings, newHolding] };
      }
      return sec;
    }));

    setAssetSearch('');
    setSelectedAsset(null);
    setShares('');
    setCost('');
    setIsModalOpen(false);
  };

  const totalNetValue = sections.reduce((sum, sec) => sum + sec.holdings.reduce((s, h) => s + h.marketValue, 0), 0);
  const totalGain = sections.reduce((sum, sec) => sum + sec.holdings.reduce((s, h) => s + h.totalGain, 0), 0);

  return (
    
    <div className="space-y-8 w-full max-w-7xl mx-auto px-1 relative">

      {/* HEADER & AGGREGATES (Unchanged) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Asset Portfolio</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Global allocation breakdown with modular tracking.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/60 dark:border-white/10 text-xs font-bold overflow-x-auto custom-scrollbar">
            {['all', 'domestic', 'us', 'other', 'crypto', 'metals'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveMarket(tab)} 
                className={`px-3 py-1.5 rounded-lg capitalize ${activeMarket === tab ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-blue-600 dark:bg-cyan-400 px-4 py-2 text-sm font-bold text-white dark:text-night-900 shadow-md hover:scale-[1.02] transition-transform ml-auto md:ml-0">
            <Plus className="h-4 w-4" /> Add Asset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-night-950 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-md flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-cyan-400"><PieChart className="h-6 w-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Net Value</p><h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">${totalNetValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h3></div>
        </div>
        <div className="bg-white dark:bg-night-950 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-md flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><TrendingUp className="h-6 w-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Returns</p><h3 className={`text-2xl font-black mt-1 ${totalGain >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{totalGain >= 0 ? '+' : ''}${totalGain.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h3></div>
        </div>
        
        <div className="bg-white dark:bg-night-950 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-md flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"><Globe className="h-6 w-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Asset Classes</p><h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">5 Unique Hubs</h3></div>
        </div>
      </div>

      {/* ASSET LISTS (Unchanged) */}
      <div className="space-y-8">
        {sections.filter((section) => activeMarket === 'all' || activeMarket === section.id).map((section) => (
            <div key={section.id} className="bg-white dark:bg-night-950 border border-slate-200 dark:border-white/10 rounded-3xl shadow-xl overflow-hidden">
              <div className="p-6 bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-100 dark:border-white/5 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10">{section.icon}</div>
                <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">{section.title}</h2><p className="text-xs text-slate-400 dark:text-slate-500">{section.region}</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Asset Name</th><th className="py-3.5 px-6 text-right">Quantity / Vol</th>
                    <th className="py-3.5 px-6 text-right">Avg Buy Price</th><th className="py-3.5 px-6 text-right">Current Price</th>
                    <th className="py-3.5 px-6 text-right">Market Value</th><th className="py-3.5 px-6 text-right">Total Returns</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {section.holdings.map((asset) => (
                      <tr key={asset.ticker} className="hover:bg-slate-50/40 dark:hover:bg-white/[0.005] transition-colors group">
                        <td className="py-4 px-6"><div className="flex items-center gap-3"><span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${asset.colorClass.bg} ${asset.colorClass.text} ${asset.colorClass.border}`}>{asset.ticker}</span><span className="text-sm font-semibold text-slate-900 dark:text-white">{asset.name}</span></div></td>
                        <td className="py-4 px-6 text-right font-mono text-sm text-slate-600 dark:text-slate-300">{asset.shares.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right font-mono text-sm text-slate-600 dark:text-slate-300">${asset.avgCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 px-6 text-right font-mono text-sm font-semibold text-slate-900 dark:text-white">${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 px-6 text-right font-mono text-sm font-bold text-slate-900 dark:text-white">${asset.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 px-6 text-right">
                          <div className={`flex flex-col items-end ${asset.totalGain >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            <span className="text-sm font-semibold flex items-center gap-0.5">{asset.totalGain >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}${Math.abs(asset.totalGain).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className="text-xs">{asset.gainPercent.toFixed(2)}%</span>
                          </div>
                          {<button
    onClick={() => {
      setChartAsset({
  symbol: asset.ticker,

  yahooSymbol:
    asset.yahooSymbol ||
    asset.ticker,

  name: asset.name,

  exchange:
    asset.exchange ||
    "GLOBAL",

  type:
    asset.type ||
    "Asset",
});

      setChartOpen(true);
    }}
    className="
    inline-flex
    items-center
    gap-2
    px-3
    py-2
    rounded-xl
    bg-blue-600
    hover:bg-blue-700
    dark:bg-cyan-500
    dark:hover:bg-cyan-400
    text-white
    text-xs
    font-semibold
    transition-all
    "
  >
    <BarChart3 className="h-4 w-4" />
    View Chart
</button> }
                        </td>
                      </tr>
                    ))}
                    {section.holdings.length === 0 && (
                      <tr><td colSpan={7} className="py-8 text-center text-sm text-slate-400">No open positions recorded in this asset category.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
      </div>

      {/* MODAL WITH NEW DEBOUNCED SEARCH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-night-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-900 shadow-2xl animate-in fade-in zoom-in-95 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Asset Position</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Asset Category</label>
                <select value={marketId} onChange={e => setMarketId(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm rounded-xl outline-none text-slate-900 dark:text-white">
                  <option value="domestic" className="bg-white dark:bg-night-900 text-slate-900 dark:text-white">Domestic Stock</option>
                  <option value="us" className="bg-white dark:bg-night-900 text-slate-900 dark:text-white">US Stock</option>
                  <option value="other" className="bg-white dark:bg-night-900 text-slate-900 dark:text-white">Other Market</option>
                  <option value="crypto" className="bg-white dark:bg-night-900 text-slate-900 dark:text-white">Crypto</option>
                  <option value="metals" className="bg-white dark:bg-night-900 text-slate-900 dark:text-white">Precious Metals</option>
                </select>
              </div>
              
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 block mb-1">Search Asset</label>
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
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm rounded-xl outline-none text-slate-900 dark:text-white pr-10"
                    placeholder="e.g. Apple or AAPL"
                    required
                  />
                  {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />}
                </div>

                {showSuggestions && assetSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-night-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                    {assetSuggestions.map((asset) => (
                      <div 
                        key={asset.id} 
                        className="px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 flex justify-between items-center border-b border-slate-50 dark:border-white/5 last:border-0"
                        onClick={() => handleSelectAsset(asset)}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{asset.symbol}</span>
                          <span className="text-xs text-slate-500 line-clamp-1">{asset.name}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">{asset.type?.replace('Common ', '')}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedAsset && (
                  <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Selected: {selectedAsset.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Quantity</label>
                  <input type="number" step="any" required placeholder="0" value={shares} onChange={e => setShares(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm rounded-xl outline-none text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Average Price ($)</label>
                  <input type="number" step="any" required placeholder="0.00" value={cost} onChange={e => setCost(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm rounded-xl outline-none text-slate-900 dark:text-white" />
                </div>
              </div>
              <button type="submit" className="w-full rounded-xl bg-blue-600 dark:bg-cyan-400 py-3 text-sm font-bold text-white dark:text-night-900 mt-2 shadow-md">
                Log Position
              </button>
            </form>
          </div>
        </div>
      )}
        <AssetChartModal
  open={chartOpen}
  asset={chartAsset}
  onClose={() => {
    setChartOpen(false);
    setChartAsset(null);
  }}
/>
    </div>
  );
}