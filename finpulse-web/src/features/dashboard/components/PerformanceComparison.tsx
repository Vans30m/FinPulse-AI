import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { LineChart as LineChartIcon, BarChart3, Table as TableIcon, Check, Plus } from 'lucide-react';

// ==========================================
// MOCK DATA (to simulate the graphs)
// ==========================================
const initialSummaryData = [
  { symbol: 'AAPL', name: 'Apple Inc', type: 'Stock', endValue: 25660.14, priceReturn: 151.10, divReturn: 5.50, totalReturn: 156.60, annualReturn: 20.78, grossDiv: 394.77, afterTaxDiv: 335.56, color: '#10b981' },
  { symbol: 'META', name: 'Meta Platforms Inc', type: 'Stock', endValue: 19344.81, priceReturn: 92.18, divReturn: 1.27, totalReturn: 93.45, annualReturn: 14.13, color: '#3b82f6' },
];

// For other symbols, you could append mock data mappings or fetch real data as needed for a real app
function getMockSummary(symbol: string) {
  const upper = symbol.toUpperCase();
  return {
    symbol: upper,
    name: `Sample Asset ${upper}`,
    type: 'Stock',
    endValue: Math.round(Math.random() * 20000 + 8000),
    priceReturn: Math.round(Math.random() * 200 - 50),
    divReturn: Math.round(Math.random() * 10),
    totalReturn: Math.round(Math.random() * 200),
    annualReturn: Math.round(Math.random() * 25),
    grossDiv: Math.round(Math.random() * 500),
    afterTaxDiv: Math.round(Math.random() * 500),
    color: '#6366f1',
  }
}

// Simulate portfolio growth/returns for all summary assets
function makeGrowthData(symbols: string[]) {
  return [
    { date: '2021-06', ...Object.fromEntries(symbols.map(sym => [sym, 10000])) },
    { date: '2022-06', ...Object.fromEntries(symbols.map(sym => [sym, 12000 + Math.random()*6000])) },
    { date: '2023-06', ...Object.fromEntries(symbols.map(sym => [sym, 13000 + Math.random()*8000])) },
    { date: '2024-06', ...Object.fromEntries(symbols.map(sym => [sym, 18000 + Math.random()*9000])) },
    { date: '2025-06', ...Object.fromEntries(symbols.map(sym => [sym, 23000 + Math.random()*6000])) },
    { date: '2026-05', ...Object.fromEntries(symbols.map(sym => [sym, 15000 + Math.random()*18000])) },
  ];
}
function makeAnnualReturnData(symbols: string[]) {
  return [
    { year: '2021', ...Object.fromEntries(symbols.map(sym => [sym, Math.round(Math.random()*80-30)])) },
    { year: '2022', ...Object.fromEntries(symbols.map(sym => [sym, Math.round(Math.random()*80-40)])) },
    { year: '2023', ...Object.fromEntries(symbols.map(sym => [sym, Math.round(Math.random()*90-30)])) },
    { year: '2024', ...Object.fromEntries(symbols.map(sym => [sym, Math.round(Math.random()*80-40)])) },
    { year: '2025', ...Object.fromEntries(symbols.map(sym => [sym, Math.round(Math.random()*65-10)])) },
    { year: '2026', ...Object.fromEntries(symbols.map(sym => [sym, Math.round(Math.random()*60)])) },
  ];
}

export default function PerformanceComparison() {
  const [summaryData, setSummaryData] = useState(initialSummaryData);
  const [showAdd, setShowAdd] = useState<null | number>(null);
  const [newSymbol, setNewSymbol] = useState('');
  const [activeTab, setActiveTab] = useState<'growth' | 'annual' | 'summary'>('growth');
  const [initialInv, setInitialInv] = useState('10000');
  const [monthlyInv, setMonthlyInv] = useState('0');
  const [divTax, setDivTax] = useState('15');
  const [period, setPeriod] = useState('5Y');
  const [reinvest, setReinvest] = useState(true);

  // Up to 5 assets
  const filledSummary = [
    ...summaryData,
    ...Array(5 - summaryData.length).fill(null)
  ].slice(0, 5);

  // Graph data adapts to which symbols are present
  const symbols = summaryData.map(x => x.symbol);
  const growthData = makeGrowthData(symbols.length ? symbols : ['AAPL']);
  const annualReturnData = makeAnnualReturnData(symbols.length ? symbols : ['AAPL']);

  // Handler for "adding" asset - demo implementation
  function handleAddNew(idx: number) {
    // Only add if slot available, symbol is non-empty, not duplicate
    const upper = newSymbol.toUpperCase();
    if (!upper || summaryData.length >= 5 || summaryData.some(a => a.symbol === upper)) return;
    setSummaryData([...summaryData, getMockSummary(upper)]);
    setShowAdd(null);
    setNewSymbol('');
  }

  return (
    <div className="w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Performance Comparison</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Comparing {summaryData.map(a => a.symbol).join(', ') || '...'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
          <span className="bg-slate-200 dark:bg-white/10 px-3 py-1.5 rounded-full">{period} - 2021-05-31 to 2026-05-31</span>
          <span className="bg-slate-200 dark:bg-white/10 px-3 py-1.5 rounded-full">Initial investment: ${parseFloat(initialInv).toLocaleString()}</span>
          <span className="bg-slate-200 dark:bg-white/10 px-3 py-1.5 rounded-full">Monthly investment: ${parseFloat(monthlyInv).toLocaleString()}</span>
          <span className="bg-slate-200 dark:bg-white/10 px-3 py-1.5 rounded-full">Reinvest dividends - Tax {divTax}%</span>
        </div>
      </div>

      {/* CONTROL PANEL (Inputs) */}
      <div className="bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* REMOVE Symbol up to 5 input */}
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Initial Investment</label>
            <input type="number" value={initialInv} onChange={(e) => setInitialInv(e.target.value)} className="w-full bg-slate-50 dark:bg-[#141517] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none text-slate-900 dark:text-white focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Monthly Investment</label>
            <input type="number" value={monthlyInv} onChange={(e) => setMonthlyInv(e.target.value)} className="w-full bg-slate-50 dark:bg-[#141517] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none text-slate-900 dark:text-white focus:border-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Div Tax (%)</label>
              <input type="number" value={divTax} onChange={(e) => setDivTax(e.target.value)} className="w-full bg-slate-50 dark:bg-[#141517] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none text-slate-900 dark:text-white focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Period</label>
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full bg-slate-50 dark:bg-[#141517] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none text-slate-900 dark:text-white focus:border-emerald-500">
                <option value="1Y">1Y</option>
                <option value="5Y">5Y</option>
                <option value="10Y">10Y</option>
              </select>
            </div>
          </div>
          <div>
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2 rounded-lg transition-colors">
              Generate Chart
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 bg-slate-50 dark:bg-[#141517] border border-slate-200 dark:border-white/5 p-3 rounded-lg w-full">
          <button 
            onClick={() => setReinvest(!reinvest)}
            className={`h-4 w-4 rounded flex items-center justify-center border ${reinvest ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-400'}`}
          >
            {reinvest && <Check className="h-3 w-3" />}
          </button>
          <span className="text-sm text-slate-700 dark:text-slate-300">Reinvest dividends</span>
        </div>
      </div>

      {/* INDIVIDUAL ASSET SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {filledSummary.map((row, idx) =>
          row ? (
            <div key={row.symbol} className="bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 p-5 rounded-2xl flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: row.color || "#888" }}
                >
                  {row.symbol[0]}
                </span>
                <div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {row.symbol}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{row.name}</div>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{row.type}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">End Value</div>
                <div className="text-xl font-extrabold mb-3 text-emerald-600 dark:text-emerald-400">
                  ${row.endValue.toLocaleString()}
                </div>
                <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
                  <div>Total Return: <span className="font-bold">{row.totalReturn?.toFixed(2) ?? "0.00"}%</span></div>
                  <div>Annualized: <span className="font-bold">{row.annualReturn?.toFixed(2) ?? "0.00"}%</span></div>
                  <div>Price Return: <span className="">{row.priceReturn?.toFixed(2) ?? "0.00"}%</span></div>
                  <div>Dividend: <span className="">{row.divReturn?.toFixed?.(2) ?? "0.00"}%</span></div>
                </div>
              </div>
            </div>
          ) : (
            <div key={idx} className="bg-white dark:bg-[#1a1b1e] border border-dashed border-slate-200 dark:border-white/10 p-5 rounded-2xl flex flex-col items-center justify-center h-full min-h-[200px]">
              {showAdd === idx ? (
                <div className="flex flex-col items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    className="bg-slate-50 dark:bg-night-800 dark:text-white border border-slate-200 dark:border-white/10 rounded px-3 py-2 text-sm outline-none text-slate-900 dark:text-white"
                    placeholder="Enter symbol (e.g. TSLA)"
                    value={newSymbol}
                    onChange={e => setNewSymbol(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddNew(idx);
                      if (e.key === 'Escape') { setShowAdd(null); setNewSymbol(''); }
                    }}
                  />
                  <button
                    onClick={() => handleAddNew(idx)}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Add Asset
                  </button>
                  <button
                    onClick={() => { setShowAdd(null); setNewSymbol(''); }}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-1"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="flex flex-col items-center text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-500 focus:outline-none"
                  onClick={() => setShowAdd(idx)}
                >
                  <Plus className="h-8 w-8 mb-2" />
                  <span className="font-medium text-sm">Add Asset</span>
                </button>
              )}
            </div>
          )
        )}
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => setActiveTab('growth')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${activeTab === 'growth' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-transparent border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
        >
          <LineChartIcon className="h-4 w-4" /> Portfolio Growth
        </button>
        <button 
          onClick={() => setActiveTab('annual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${activeTab === 'annual' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-transparent border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
        >
          <BarChart3 className="h-4 w-4" /> Annual Return
        </button>
        <button 
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${activeTab === 'summary' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-transparent border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
        >
          <TableIcon className="h-4 w-4" /> Summary Table
        </button>
      </div>

      {/* TAB CONTENT AREAS */}
      <div className="bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 rounded-2xl p-6 min-h-[400px]">

        {/* GROWTH CHART (Line) */}
        {activeTab === 'growth' && (
          <div className="h-[400px] w-full animate-in fade-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Portfolio Growth</h3>
            <p className="text-xs text-slate-500 mb-6">Initial ${parseFloat(initialInv).toLocaleString()} + monthly ${parseFloat(monthlyInv)} per symbol</p>
            <ResponsiveContainer width="100%" height="80%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 12 }} />
                <YAxis stroke="#666" tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val.toLocaleString()}`} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1b1e', borderColor: '#333', color: '#fff' }} />
                <Legend iconType="circle" />
                {symbols.map((sym, i) =>
                  <Line
                    key={sym}
                    type="monotone"
                    dataKey={sym}
                    stroke={summaryData[i]?.color || '#6366f1'}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ANNUAL RETURN CHART (Bar) */}
        {activeTab === 'annual' && (
          <div className="h-[400px] w-full animate-in fade-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Annual Return</h3>
            <p className="text-xs text-slate-500 mb-6">Partial years are labeled on the x-axis</p>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={annualReturnData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="year" stroke="#666" tick={{ fontSize: 12 }} />
                <YAxis stroke="#666" tick={{ fontSize: 12 }} tickFormatter={(val) => `${val}%`} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1b1e', borderColor: '#333', color: '#fff' }} formatter={(val) => `${val}%`} />
                <Legend iconType="circle" />
                {symbols.map((sym, i) =>
                  <Bar
                    key={sym}
                    dataKey={sym}
                    fill={summaryData[i]?.color || '#6366f1'}
                    radius={[4, 4, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* SUMMARY TABLE */}
        {activeTab === 'summary' && (
          <div className="w-full overflow-x-auto animate-in fade-in">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">End Value</th>
                  <th className="py-3 px-4 text-right">Price Return</th>
                  <th className="py-3 px-4 text-right">Dividend Return</th>
                  <th className="py-3 px-4 text-right">Total Return</th>
                  <th className="py-3 px-4 text-right">Annualized Return</th>
                  <th className="py-3 px-4 text-right">Gross Dividends</th>
                  <th className="py-3 px-4 text-right">After-Tax Dividends</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {summaryData.map((row) => (
                  <tr key={row.symbol} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="py-4 px-4 font-bold" style={{ color: row.color }}>{row.symbol}</td>
                    <td className="py-4 px-4 text-sm text-slate-700 dark:text-slate-300">{row.name}</td>
                    <td className="py-4 px-4 text-sm text-slate-500">{row.type}</td>
                    <td className="py-4 px-4 text-sm text-right font-mono">${row.endValue?.toLocaleString?.() ?? '0.00'}</td>
                    <td className="py-4 px-4 text-sm text-right text-emerald-500 font-mono">{row.priceReturn?.toFixed?.(2) ?? '0.00'}%</td>
                    <td className="py-4 px-4 text-sm text-right text-emerald-500 font-mono">{row.divReturn?.toFixed?.(2) ?? '0.00'}%</td>
                    <td className="py-4 px-4 text-sm text-right text-emerald-500 font-mono">{row.totalReturn?.toFixed?.(2) ?? '0.00'}%</td>
                    <td className="py-4 px-4 text-sm text-right text-emerald-500 font-mono">{row.annualReturn?.toFixed?.(2) ?? '0.00'}%</td>
                    <td className="py-4 px-4 text-sm text-right font-mono">${row.grossDiv?.toFixed?.(2) ?? '0.00'}</td>
                    <td className="py-4 px-4 text-sm text-right font-mono">${row.afterTaxDiv?.toFixed?.(2) ?? '0.00'}</td>
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