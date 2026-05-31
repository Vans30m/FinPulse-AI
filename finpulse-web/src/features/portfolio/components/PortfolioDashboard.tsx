import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Globe, DollarSign, TrendingUp, PieChart, Layers, Plus, X, Coins, Bitcoin } from 'lucide-react';

interface Holding {
  ticker: string;
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

// Initial placeholder data
const INITIAL_SECTIONS = [
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
  }
];

export default function PortfolioDashboard() {
  const [sections, setSections] = useState<MarketSection[]>(INITIAL_SECTIONS);
  const [activeMarket, setActiveMarket] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form States
  const [marketId, setMarketId] = useState('domestic');
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [shares, setShares] = useState('');
  const [cost, setCost] = useState('');

  // Handle adding asset
  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !name || !shares || !cost) return;

    const numShares = parseFloat(shares);
    const numCost = parseFloat(cost);

    // Simple mock color assigning logic
    const baseColors = [
      { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200/50 dark:border-purple-900/50' },
      { bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-200/50 dark:border-sky-900/50' },
      { bg: 'bg-pink-50 dark:bg-pink-950/40', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200/50 dark:border-pink-900/50' }
    ];
    const chosenColor = baseColors[Math.floor(Math.random() * baseColors.length)];

    const newHolding: Holding = {
      ticker: ticker.toUpperCase(),
      name,
      shares: numShares,
      avgCost: numCost,
      currentPrice: numCost * 1.04, // Simulating a minor gain immediately for UI demonstration
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

    // Reset fields & close modal
    setTicker('');
    setName('');
    setShares('');
    setCost('');
    setIsModalOpen(false);
  };

  // Calculate Totals dynamically
  const totalNetValue = sections.reduce((sum, sec) => sum + sec.holdings.reduce((s, h) => s + h.marketValue, 0), 0);
  const totalGain = sections.reduce((sum, sec) => sum + sec.holdings.reduce((s, h) => s + h.totalGain, 0), 0);

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto px-1 relative">

      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Asset Portfolio</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global allocation breakdown with separate Stock, Crypto and Other market modules.
          </p>
        </div>

        {/* Control Button Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/60 dark:border-white/10 text-xs font-bold">
            <button onClick={() => setActiveMarket('all')} className={`px-3 py-1.5 rounded-lg ${activeMarket === 'all' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500'}`}>All</button>
            <button onClick={() => setActiveMarket('domestic')} className={`px-3 py-1.5 rounded-lg ${activeMarket === 'domestic' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500'}`}>Domestic</button>
            <button onClick={() => setActiveMarket('us')} className={`px-3 py-1.5 rounded-lg ${activeMarket === 'us' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500'}`}>US</button>
            <button onClick={() => setActiveMarket('other')} className={`px-3 py-1.5 rounded-lg ${activeMarket === 'other' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500'}`}>Other</button>
            <button onClick={() => setActiveMarket('crypto')} className={`px-3 py-1.5 rounded-lg ${activeMarket === 'crypto' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500'}`}>Crypto</button>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 dark:bg-cyan-400 px-4 py-2 text-sm font-bold text-white dark:text-night-900 shadow-md hover:scale-[1.02] transition-transform ml-auto md:ml-0"
          >
            <Plus className="h-4 w-4" /> Add Asset
          </button>
        </div>
      </div>

      {/* Aggregate Overview Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-night-950 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-md flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-cyan-400"><PieChart className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Net Value</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">${totalNetValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-night-950 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-md flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><TrendingUp className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Returns</p>
            <h3 className={`text-2xl font-black mt-1 ${totalGain >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {totalGain >= 0 ? '+' : ''}${totalGain.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
        <div className="bg-white dark:bg-night-950 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-md flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"><Globe className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Asset Classes</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">4 Unique Hubs</h3>
          </div>
        </div>
      </div>

      {/* Asset Render Lists */}
      <div className="space-y-8">
        {sections
          .filter((section) => activeMarket === 'all' || activeMarket === section.id)
          .map((section) => (
            <div key={section.id} className="bg-white dark:bg-night-950 border border-slate-200 dark:border-white/10 rounded-3xl shadow-xl overflow-hidden">
              <div className="p-6 bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-100 dark:border-white/5 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10">{section.icon}</div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{section.title}</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{section.region}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider"><th className="py-3.5 px-6">Asset Name</th><th className="py-3.5 px-6 text-right">Quantity / Vol</th><th className="py-3.5 px-6 text-right">Avg Buy Price</th><th className="py-3.5 px-6 text-right">Current Price</th><th className="py-3.5 px-6 text-right">Market Value</th><th className="py-3.5 px-6 text-right">Total Returns</th></tr>
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
                        </td>
                      </tr>
                    ))}
                    {section.holdings.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-sm text-slate-400">No open positions recorded in this asset category.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
      </div>

      {/* MODAL WINDOW DIALOG FOR NEW ASSET ADDITION */}
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
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Symbol / Ticker</label>
                  <input type="text" required placeholder="e.g. INFY or BTC" value={ticker} onChange={e => setTicker(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm rounded-xl outline-none text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Full Corporate Name</label>
                  <input type="text" required placeholder="e.g. Infosys Ltd. or Bitcoin" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm rounded-xl outline-none text-slate-900 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Quantity / Size</label>
                  <input type="number" step="any" required placeholder="0" value={shares} onChange={e => setShares(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm rounded-xl outline-none text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Average Cost Price</label>
                  <input type="number" step="any" required placeholder="0.00" value={cost} onChange={e => setCost(e.target.value)} className="w-full bg-slate-50 dark:bg:white/5 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm rounded-xl outline-none text-slate-900 dark:text-white" />
                </div>
              </div>
              <button type="submit" className="w-full rounded-xl bg-blue-600 dark:bg-cyan-400 py-3 text-sm font-bold text-white dark:text-night-900 mt-2 shadow-md">
                Log Position
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}