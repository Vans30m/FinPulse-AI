import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LineChart as LineChartIcon, BarChart3, Table as TableIcon, Plus, Loader2, X } from 'lucide-react';

const CHART_COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f59e42', '#ef4444'];

// We start with baseline tickers to compile immediately on layout mount
const initialSummaryData = [
  { symbol: 'AAPL', name: 'Apple Inc', type: 'Stock', endValue: 0, totalReturn: 0, annualReturn: 0, color: CHART_COLORS[0] },
  { symbol: 'META', name: 'Meta Platforms Inc', type: 'Stock', endValue: 0, totalReturn: 0, annualReturn: 0, color: CHART_COLORS[1] },
];

function CustomLineTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: "#1a1b1e", border: "1px solid #333", color: "#fff", borderRadius: 8, padding: 12, minWidth: 110 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} style={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
          <span style={{ background: entry.color, borderRadius: "50%", width: 9, height: 9, display: "inline-block", marginRight: 8 }}></span>
          <span style={{ minWidth: 36, color: entry.color, fontWeight: 600 }}>{entry.name}</span>
          <span style={{ marginLeft: 7, fontWeight: 700, color: "#fff" }}>
            {typeof entry.value === 'number' ? entry.value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PerformanceComparison() {
  const [summaryData, setSummaryData] = useState(initialSummaryData);
  const [showAdd, setShowAdd] = useState<null | number>(null);
  const [activeTab, setActiveTab] = useState<'growth' | 'summary'>('growth');
  
  // Real-time Search and Sync States
  const [newSymbol, setNewSymbol] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [isCalculatingData, setIsCalculatingData] = useState(false);
  const [liveGrowthData, setLiveGrowthData] = useState<any[]>([]);
  
  const [initialInv, setInitialInv] = useState('10000');
  const [monthlyInv, setMonthlyInv] = useState('0');
  const [divTax, setDivTax] = useState('15');
  const [period, setPeriod] = useState('5Y');

  // Dynamically extract currently selected track keys
  const symbols = useMemo(() => summaryData.map(x => x.symbol), [summaryData]);

  // Debounced Auto-Complete Search Input Field Listener
  useEffect(() => {
    if (!newSymbol.trim() || !showSuggestions) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(newSymbol)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Lookup dropped:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [newSymbol, showSuggestions]);

  // Connects Frontend State variables directly to the API responses
  const handleSyncPerformanceData = async () => {
    if (symbols.length === 0) return;
    setIsCalculatingData(true);
    try {
      const response = await fetch('http://localhost:3000/api/performance/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: symbols,
          initialInvestment: initialInv
        })
      });

      if (response.ok) {
        const resultData = await response.json();
        
        // 1. Plot the chart points timeline
        setLiveGrowthData(resultData.growthData || []);
        
        // 2. Map structural metrics into summaryData states to update your UI cards!
        if (resultData.summaries && Array.isArray(resultData.summaries)) {
          const updatedCards = resultData.summaries.map((item: any, index: number) => ({
            symbol: item.symbol,
            name: item.name || `${item.symbol} Asset Track`,
            type: 'Asset',
            endValue: item.endValue || 0,
            totalReturn: item.totalReturn || 0,
            annualReturn: item.annualReturn || 0,
            color: CHART_COLORS[index % CHART_COLORS.length] // Retain hex colors assignments
          }));
          setSummaryData(updatedCards);
        }
      }
    } catch (error) {
      console.error("Calculation sync error:", error);
    } finally {
      setIsCalculatingData(false);
    }
  };

  // Run automatically on load or when track array size alters
  useEffect(() => {
    handleSyncPerformanceData();
  }, [symbols.length]);

  const handleSelectAndAdd = (asset: any) => {
    if (summaryData.length >= 5 || summaryData.some(a => a.symbol === asset.symbol)) {
      setShowAdd(null);
      setNewSymbol('');
      return;
    }
    // Push the placeholder token—the useEffect listener directly fetches its real metadata values immediately!
    setSummaryData([...summaryData, { symbol: asset.symbol, name: asset.name, type: 'Stock', endValue: 0, totalReturn: 0, annualReturn: 0, color: CHART_COLORS[summaryData.length] }]);
    setShowAdd(null);
    setNewSymbol('');
    setShowSuggestions(false);
  };

  const handleRemoveAsset = (symbolToRemove: string) => {
    if (summaryData.length <= 1) return;
    setSummaryData(summaryData.filter(a => a.symbol !== symbolToRemove));
  };

  const filledSummary = [...summaryData, ...Array(5 - summaryData.length).fill(null)].slice(0, 5);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Performance Comparison</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Comparing {summaryData.map(a => a.symbol).join(', ') || '...'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
          <span className="bg-slate-200 dark:bg-white/10 px-3 py-1.5 rounded-full">Initial: ${parseFloat(initialInv).toLocaleString()}</span>
          <span className="bg-slate-200 dark:bg-white/10 px-3 py-1.5 rounded-full">Monthly: ${parseFloat(monthlyInv).toLocaleString()}</span>
        </div>
      </div>

      {/* CONTROL PANEL */}
      <div className="bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div><label className="text-xs text-slate-500 mb-1.5 block">Initial Investment</label><input type="number" value={initialInv} onChange={(e) => setInitialInv(e.target.value)} className="w-full bg-slate-50 dark:bg-[#141517] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none text-slate-900 dark:text-white" /></div>
          <div><label className="text-xs text-slate-500 mb-1.5 block">Monthly Investment</label><input type="number" value={monthlyInv} onChange={(e) => setMonthlyInv(e.target.value)} className="w-full bg-slate-50 dark:bg-[#141517] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none text-slate-900 dark:text-white" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-slate-500 mb-1.5 block">Div Tax (%)</label><input type="number" value={divTax} onChange={(e) => setDivTax(e.target.value)} className="w-full bg-slate-50 dark:bg-[#141517] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none text-slate-900 dark:text-white" /></div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Period</label>
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full bg-slate-50 dark:bg-[#141517] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none text-slate-900 dark:text-white">
                <option value="1Y">1Y</option><option value="5Y">5Y</option><option value="10Y">10Y</option>
              </select>
            </div>
          </div>
          <div>
            <button type="button" onClick={handleSyncPerformanceData} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
              {isCalculatingData && <Loader2 className="h-4 w-4 animate-spin" />}
              Generate Chart
            </button>
          </div>
        </div>
      </div>

      {/* INDIVIDUAL CARDS (Live Updating Now!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {filledSummary.map((row, idx) =>
          row ? (
            <div key={row.symbol} className="bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 p-5 rounded-2xl flex flex-col relative group shadow-sm">
              {summaryData.length > 1 && (
                <button onClick={() => handleRemoveAsset(row.symbol)} className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg">
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="flex items-center gap-3 mb-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: row.color }}>{row.symbol[0]}</span>
                <div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{row.symbol}</div>
                  <div className="text-xs text-slate-500 truncate w-24">{row.name}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">End Value</div>
                <div className="text-xl font-extrabold mb-3 text-emerald-600 dark:text-emerald-400">${row.endValue?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
                  <div>Total Return: <span className="font-bold text-emerald-500">{row.totalReturn}%</span></div>
                  <div>Annualized: <span className="font-bold text-emerald-500">{row.annualReturn}%</span></div>
                </div>
              </div>
            </div>
          ) : (
            <div key={idx} className="bg-white dark:bg-[#1a1b1e] border border-dashed border-slate-200 dark:border-white/10 p-5 rounded-2xl flex flex-col items-center justify-center h-full min-h-[170px] relative">
              {showAdd === idx ? (
                <div className="flex flex-col items-center gap-2 w-full relative">
                  <div className="w-full relative">
                    <input
                      type="text" autoFocus placeholder="Search asset..." value={newSymbol}
                      onChange={e => { setNewSymbol(e.target.value.toUpperCase()); setShowSuggestions(true); }}
                      onFocus={() => setShowSuggestions(true)}
                      className="w-full bg-slate-50 dark:bg-night-800 border border-slate-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none text-slate-900 dark:text-white pr-8"
                    />
                    {isSearching && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />}
                  </div>

                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 z-50 w-full md:w-64 mt-1 bg-white dark:bg-night-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                      {suggestions.map((asset) => (
                        <div key={asset.id} className="px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 flex flex-col border-b border-slate-50 dark:border-white/5 last:border-0 text-left" onClick={() => handleSelectAndAdd(asset)}>
                          <div className="flex justify-between items-center w-full">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{asset.symbol}</span>
                            <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 rounded">{asset.exchange || asset.type?.replace('Common ', '')}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 line-clamp-1">{asset.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => { setShowAdd(null); setNewSymbol(''); }} className="text-xs text-slate-400 mt-2">Cancel</button>
                </div>
              ) : (
                <button className="flex flex-col items-center text-slate-400 hover:text-emerald-600 focus:outline-none" onClick={() => setShowAdd(idx)}>
                  <Plus className="h-8 w-8 mb-2" />
                  <span className="font-medium text-sm">Add Asset</span>
                </button>
              )}
            </div>
          )
        )}
      </div>

      {/* SECTIONS LAYOUTS CONTAINER */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveTab('growth')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${activeTab === 'growth' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}><LineChartIcon className="h-4 w-4" /> Growth Timeline</button>
        <button onClick={() => setActiveTab('summary')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${activeTab === 'summary' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}><TableIcon className="h-4 w-4" /> Summary Grid</button>
      </div>

      <div className="bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 rounded-2xl p-6 min-h-[400px]">
        {activeTab === 'growth' && (
          <div className="h-[400px] w-full animate-in fade-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Real Portfolio Growth (Yahoo Finance Engine)</h3>
            <ResponsiveContainer width="100%" height="80%">
              <LineChart data={liveGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 12 }} />
                <YAxis stroke="#666" tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val.toLocaleString()}`} />
                <Tooltip content={CustomLineTooltip as any} />
                <Legend iconType="circle" />
                {summaryData.map((asset) => <Line key={asset.symbol} type="monotone" dataKey={asset.symbol} name={asset.symbol} stroke={asset.color} strokeWidth={2} dot={false} activeDot={{ r: 6 }} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {activeTab === 'summary' && (
          <div className="w-full overflow-x-auto animate-in fade-in">
            <table className="w-full text-left whitespace-nowrap">
              <thead><tr className="border-b border-slate-200 dark:border-white/10 text-xs font-medium text-slate-500"><th className="py-3 px-4">Symbol</th><th className="py-3 px-4">Name</th><th className="py-3 px-4 text-right">End Value</th><th className="py-3 px-4 text-right">Total Return</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {summaryData.map((row) => (
                  <tr key={row.symbol} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="py-4 px-4 font-bold" style={{ color: row.color }}>{row.symbol}</td>
                    <td className="py-4 px-4 text-sm text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{row.name}</td>
                    <td className="py-4 px-4 text-sm text-right font-mono">${row.endValue?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="py-4 px-4 text-sm text-right text-emerald-500 font-mono">{row.totalReturn}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}