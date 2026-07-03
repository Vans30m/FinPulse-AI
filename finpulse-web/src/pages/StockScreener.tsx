// src/pages/StockScreener.tsx

import { useState, useMemo } from 'react';
import { useStockScreener } from '../hooks/useStockScreener';
import type { StockRecord } from '../types/screener';

// Import all modular layout components
import FilterAccordion from '../components/screener/FilterAccordion';
import RangeSlider from '../components/screener/RangeSlider';
import MultiSelectFilter from '../components/screener/MultiSelectFilter';
import ScreenerTable from '../components/screener/ScreenerTable';

const MOCK_STOCK_UNIVERSE: StockRecord[] = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    exchange: 'NASDAQ',
    price: 185.40,
    changePercent: 1.25,
    marketCap: 2900000,
    peRatio: 28.4,
    forwardPE: 26.1,
    roe: 145.2,
    roa: 29.4,
    revenueGrowth: 4.2,
    epsGrowth: 8.7,
    profitMargin: 25.8,
    debtToEquity: 1.4,
    rsi: 58,
    sma50Dist: 2.4,
    sma200Dist: 11.2,
    aiScore: 84,
    aiSignal: 'BUY',
    aiSummary: 'Strong cash flows and robust ecosystem retention offset short-term hardware cycles.'
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Technology',
    industry: 'Semiconductors',
    exchange: 'NASDAQ',
    price: 875.12,
    changePercent: 4.82,
    marketCap: 2180000,
    peRatio: 74.2,
    forwardPE: 32.5,
    roe: 91.3,
    roa: 46.8,
    revenueGrowth: 125.6,
    epsGrowth: 288.0,
    profitMargin: 48.9,
    debtToEquity: 0.2,
    rsi: 72,
    sma50Dist: 14.8,
    sma200Dist: 44.1,
    aiScore: 95,
    aiSignal: 'STRONG_BUY',
    aiSummary: 'Unrivaled data center compute dominance and soaring margins reinforce compounding competitive advantage.'
  },
  {
    ticker: 'JPM',
    name: 'JPMorgan Chase & Co.',
    sector: 'Financials',
    industry: 'Banks—Diversified',
    exchange: 'NYSE',
    price: 195.20,
    changePercent: -0.45,
    marketCap: 560000,
    peRatio: 12.1,
    forwardPE: 11.4,
    roe: 16.8,
    roa: 1.3,
    revenueGrowth: 6.8,
    epsGrowth: 11.2,
    profitMargin: 33.4,
    debtToEquity: null,
    rsi: 48,
    sma50Dist: -0.8,
    sma200Dist: 8.5,
    aiScore: 68,
    aiSignal: 'HOLD',
    aiSummary: 'Net interest income tailwinds are stabilizing; premium valuation relative to peer banking institutions.'
  }
];

export default function StockScreener() {
  const {
    filters,
    sortBy,
    sortOrder,
    filteredStocks,
    setFilter,
    resetFilters,
    setSort,
  } = useStockScreener(MOCK_STOCK_UNIVERSE);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const uniqueSectors = useMemo(() => Array.from(new Set(MOCK_STOCK_UNIVERSE.map(s => s.sector))), []);
  const uniqueExchanges = useMemo(() => Array.from(new Set(MOCK_STOCK_UNIVERSE.map(s => s.exchange))), []);
  const aiSignalOptions = ['STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL'];

  // Native CSV Document Generation Action Engine
  const exportToCSV = () => {
    const headers = ['Ticker', 'Name', 'Sector', 'Price', 'Change %', 'P/E', 'ROE %', 'AI Score', 'AI Signal'];
    const rows = filteredStocks.map(s => [
      s.ticker,
      s.name,
      s.sector,
      s.price,
      s.changePercent,
      s.peRatio ?? 'N/A',
      s.roe ?? 'N/A',
      s.aiScore,
      s.aiSignal
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FinPulse_Screener_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-night-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      
      {/* Search Header control row */}
      <header className="border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-night-900/50 backdrop-blur sticky top-0 z-40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            AI Stock Screener
          </h1>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search symbol or company name..."
            value={filters.search}
            onChange={(e) => setFilter({ search: e.target.value })}
            className="w-full sm:w-64 bg-slate-100 dark:bg-night-950 border border-slate-200 dark:border-white/5 rounded-lg px-3 py-1.5 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button 
            onClick={exportToCSV}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg transition-all shadow-md shrink-0"
          >
            Export CSV
          </button>
          <button 
            onClick={resetFilters}
            className="px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
          >
            Reset
          </button>
        </div>
      </header>

      {/* Main Framework split pane layout */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Left Sticky Filters Sidebar */}
        <aside className={`border-r border-slate-200 dark:border-white/5 bg-white dark:bg-night-900 w-80 shrink-0 transition-all duration-300 transform fixed lg:sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto z-30 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:w-0'
        }`}>
          <div className="p-5 space-y-5">
            
            <FilterAccordion title="AI Quantitative Metrics" badgeCount={filters.aiSignals.length}>
              <RangeSlider 
                label="AI Core Confidence Score" 
                value={filters.aiScore} 
                onChange={(val) => setFilter({ aiScore: val })}
                minPlaceholder="1"
                maxPlaceholder="100"
              />
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">AI Target Signal</label>
                <MultiSelectFilter 
                  options={aiSignalOptions} 
                  selectedValues={filters.aiSignals} 
                  onChange={(val) => setFilter({ aiSignals: val })}
                />
              </div>
            </FilterAccordion>

            <FilterAccordion title="Market Descriptors" badgeCount={filters.sectors.length}>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Sector Class</label>
                <MultiSelectFilter 
                  options={uniqueSectors} 
                  selectedValues={filters.sectors} 
                  onChange={(val) => setFilter({ sectors: val })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Listing Exchange</label>
                <MultiSelectFilter 
                  options={uniqueExchanges} 
                  selectedValues={filters.exchanges} 
                  onChange={(val) => setFilter({ exchanges: val })}
                />
              </div>
            </FilterAccordion>

            <FilterAccordion title="Fundamental Valuation Metrics">
              <RangeSlider 
                label="Market Cap ($M)" 
                value={filters.marketCap} 
                onChange={(val) => setFilter({ marketCap: val })}
                minPlaceholder="Min Cap"
                maxPlaceholder="Max Cap"
              />
              <RangeSlider 
                label="Trailing P/E Ratio" 
                value={filters.peRatio} 
                onChange={(val) => setFilter({ peRatio: val })}
              />
              <RangeSlider 
                label="Return on Equity (ROE %)" 
                value={filters.roe} 
                onChange={(val) => setFilter({ roe: val })}
              />
            </FilterAccordion>

            <FilterAccordion title="Technical Oscillators" defaultOpen={false}>
              <RangeSlider 
                label="Relative Strength Index (RSI-14)" 
                value={filters.rsi} 
                onChange={(val) => setFilter({ rsi: val })}
                minPlaceholder="0"
                maxPlaceholder="100"
              />
            </FilterAccordion>

          </div>
        </aside>

        {/* Center Primary Results Viewport */}
        <main className="flex-1 p-6 overflow-x-hidden flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-night-900 border border-slate-200 dark:border-white/5 px-2.5 py-1 rounded-md transition-colors"
            >
              {isSidebarOpen ? '← Hide Filters' : '→ Show Filters'}
            </button>
          </div>

          {/* Conditional Query Rendering Frame */}
          <div className="flex-1 min-h-[400px]">
            {filteredStocks.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-white/5 rounded-xl text-slate-400 dark:text-slate-500">
                <p className="text-sm font-medium">No equities matched your active structural parameters.</p>
              </div>
            ) : (
              <ScreenerTable
                stocks={filteredStocks}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={setSort}
              />
            )}
          </div>
        </main>

      </div>
    </div>
  );
}