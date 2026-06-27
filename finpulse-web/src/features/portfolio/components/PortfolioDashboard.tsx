import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Globe, DollarSign, TrendingUp, PieChart, Plus, X, Coins, Bitcoin, Loader2, Sparkles } from 'lucide-react';
import { BarChart3 } from "lucide-react";
import PortfolioAllocationChart
from "./PortfolioAllocationChart";
import PortfolioHealthCard
from "./PortfolioHealthCard";
import PortfolioInsightsCard
from "./PortfolioInsightsCard";
import RebalancingCard
from "./RebalancingCard";
import PortfolioPerformanceChart
from "./PortfolioPerformanceChart";
import RiskSimulatorCard
from "./RiskSimulatorCard";
import SectorExposureCard
from "./SectorExposureCard";
import AISectorAnalysisCard from "./AISectorAnalysisCard";
import { useChart }
from "../../../context/ChartContext";

interface Holding {
  ticker: string;
  yahooSymbol?: string;
  exchange?: string;
  type?: string;
  name: string;
  sector: string;
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
  title: 'Indian Market',
  region: 'India',
  icon: <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
  holdings: [
    {
      ticker: 'RELIANCE',
      name: 'Reliance Industries Ltd.',
      sector: 'Energy',
      shares: 45,
      avgCost: 2450.00,
      currentPrice: 2870.50,
      marketValue: 129172.50,
      totalGain: 18922.50,
      gainPercent: 17.16,
      colorClass: {
        bg: 'bg-indigo-50 dark:bg-indigo-950/40',
        text: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-200/50 dark:border-indigo-900/50'
      }
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
      sector: 'Technology',
      shares: 15,
      avgCost: 420.00,
      currentPrice: 875.12,
      marketValue: 13126.80,
      totalGain: 6826.80,
      gainPercent: 108.36,
      colorClass: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200/50 dark:border-emerald-900/50'
      }
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
      sector: 'Index',
      shares: 5,
      avgCost: 10750,
      currentPrice: 11500,
      marketValue: 57500,
      totalGain: 3750,
      gainPercent: 7.0,
      colorClass: {
        bg: 'bg-purple-50 dark:bg-purple-950/40',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200/50 dark:border-purple-900/50'
      }
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
      sector: 'Crypto',
      shares: 0.42,
      avgCost: 48000,
      currentPrice: 67500,
      marketValue: 28350,
      totalGain: 8190,
      gainPercent: 40.6,
      colorClass: {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200/50 dark:border-amber-900/50'
      }
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

const performanceData = [
  {
    month: "Jan",
    value: 100000,
  },
  {
    month: "Feb",
    value: 104000,
  },
  {
    month: "Mar",
    value: 111000,
  },
  {
    month: "Apr",
    value: 108000,
  },
  {
    month: "May",
    value: 118000,
  },
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

  const [aiTab, setAiTab] = useState<"health" | "insights" | "sectors" | "rebalance">("health");

  const {
  openChart,
} = useChart();

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
      colorClass: chosenColor,
  sector:
  selectedAsset.type ===
  "Crypto"
    ? "Crypto"
    : selectedAsset.type ===
      "Forex"
    ? "Forex"
    : selectedAsset.type ===
      "Commodity"
    ? "Commodities"
    : "Technology",
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

  const getHoldingValueInUSD = (h: Holding, sectionId: string) => {
    if (sectionId === 'domestic') {
      return h.marketValue / 83;
    }
    return h.marketValue;
  };

  const getHoldingGainInUSD = (h: Holding, sectionId: string) => {
    if (sectionId === 'domestic') {
      return h.totalGain / 83;
    }
    return h.totalGain;
  };

  const displayCurrency = activeMarket === 'domestic' ? '₹' : '$';

  const totalNetValue = sections
    .filter(sec => activeMarket === 'all' || activeMarket === sec.id)
    .reduce((sum, sec) => {
      return sum + sec.holdings.reduce((s, h) => {
        if (activeMarket === 'all') {
          return s + getHoldingValueInUSD(h, sec.id);
        }
        return s + h.marketValue;
      }, 0);
    }, 0);

  const totalGain = sections
    .filter(sec => activeMarket === 'all' || activeMarket === sec.id)
    .reduce((sum, sec) => {
      return sum + sec.holdings.reduce((s, h) => {
        if (activeMarket === 'all') {
          return s + getHoldingGainInUSD(h, sec.id);
        }
        return s + h.totalGain;
      }, 0);
    }, 0);

  const allocationData = sections
    .map((section) => ({
      name: section.title,
      value: section.holdings.reduce((sum, h) => {
        return sum + (section.id === 'domestic' ? h.marketValue / 83 : h.marketValue);
      }, 0),
    }))
    .filter((x) => x.value > 0);

  const totalAssets = sections.reduce(
    (sum, section) => sum + section.holdings.length,
    0
  );

  const sectorMap =
  new Map<
    string,
    number
  >();

sections.forEach(
  (section) => {
    section.holdings.forEach(
      (holding) => {
        const currentValue =
          sectorMap.get(
            holding.sector
          ) || 0;

        sectorMap.set(
          holding.sector,
          currentValue +
            holding.marketValue
        );
      }
    );
  }
);

const sectorExposure =
  Array.from(
    sectorMap.entries()
  ).map(
    ([sector, value]) => ({
      sector,

      percentage:
        totalNetValue > 0
          ? (
              (value /
                totalNetValue) *
              100
            ).toFixed(1)
          : "0",

      value,
    })
  );

  const sortedSectors =
  [...sectorExposure].sort(
    (a, b) =>
      Number(b.percentage) -
      Number(a.percentage)
  );

const topSector =
  sortedSectors[0];

let sectorInsight =
  "Portfolio is well diversified.";

let sectorDiversificationScore =
  100;

if (
  topSector &&
  Number(
    topSector.percentage
  ) > 50
) {
  sectorInsight =
    `${topSector.sector} dominates the portfolio. Risk of over-concentration is high.`;

  sectorDiversificationScore =
    60;
}
else if (
  topSector &&
  Number(
    topSector.percentage
  ) > 35
) {
  sectorInsight =
    `${topSector.sector} has a large allocation. Consider adding exposure to other sectors.`;

  sectorDiversificationScore =
    80;
}

let sectorRecommendation =
  "Portfolio allocation looks healthy.";

if (
  topSector &&
  Number(
    topSector.percentage
  ) > 40
) {
  sectorRecommendation =
    `Reduce ${topSector.sector} exposure and increase diversification.`;
}

const diversificationScore =
  Math.min(
    100,
    totalAssets * 12
  );

const healthScore =
  Math.round(
    diversificationScore
  );

const risk =
  sections.find(
    (s) => s.id === "crypto"
  )?.holdings.length
    ? "Medium"
    : "Low";

const growth =
  sections.find(
    (s) => s.id === "us"
  )?.holdings.length
    ? "High"
    : "Moderate";

const cryptoValue =
  sections
    .find(
      (s) =>
        s.id === "crypto"
    )
    ?.holdings.reduce(
      (sum, h) =>
        sum + h.marketValue,
      0
    ) || 0;

const cryptoPercentage =
  totalNetValue > 0
    ? (
        (cryptoValue /
          totalNetValue) *
        100
      ).toFixed(1)
    : "0";

const usAssets =
  sections.find(
    (s) => s.id === "us"
  )?.holdings.length || 0;

const insights = [];

if (Number(cryptoPercentage) > 15) {
  insights.push(
    `Crypto exposure is ${cryptoPercentage}% of the portfolio.`
  );
}

if (usAssets > 0) {
  insights.push(
    "US equities contribute strongly to growth potential."
  );
}

if (healthScore > 80) {
  insights.push(
    "Portfolio diversification is excellent."
  );
}

if (healthScore > 60) {
  insights.push(
    "Risk profile appears balanced."
  );
}

if (totalGain > 0) {
  insights.push(
    "Portfolio is currently generating positive returns."
  );
}

const rebalancingSuggestions: string[] = [];

const cryptoPercentageNumber =
  Number(cryptoPercentage);

if (cryptoPercentageNumber > 25) {
  rebalancingSuggestions.push(
    "Reduce crypto exposure below 25%."
  );
}

if (healthScore < 60) {
  rebalancingSuggestions.push(
    "Increase diversification across asset classes."
  );
}

if (usAssets > totalAssets / 2) {
  rebalancingSuggestions.push(
    "Portfolio heavily depends on US equities."
  );
}

if (
  rebalancingSuggestions.length === 0
) {
  rebalancingSuggestions.push(
    "Portfolio allocation appears balanced."
  );
}

const riskScore =
  Math.min(
    100,
    Math.round(
      cryptoPercentageNumber * 2 +
      totalAssets * 5
    )
  );

const expectedReturn =
  Math.round(
    healthScore * 0.15
  );

const bestCase =
  expectedReturn + 15;
const worstCase =
  -(riskScore / 5);

  const filteredHoldings = sections
    .filter((section) => activeMarket === 'all' || activeMarket === section.id)
    .flatMap((section) => 
      section.holdings.map(h => ({
        ...h,
        category: section.title,
        sectionId: section.id,
        icon: section.icon
      }))
    );

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto px-1 relative">

      {/* HEADER & AGGREGATES */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-100 dark:border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white font-display bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Asset Portfolio
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5">
            Global allocation breakdown with modular tracking.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Add Asset CTA Button */}
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-650 dark:from-cyan-500 dark:to-blue-600 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-cyan-400 dark:hover:to-blue-500 px-5 py-3 text-sm font-bold text-white dark:text-night-950 shadow-lg hover:shadow-blue-500/25 dark:hover:shadow-cyan-400/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 w-full sm:w-auto sm:ml-auto lg:ml-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" /> Add Asset Position
          </button>
        </div>
      </div>

      {/* Aggregate Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 flex items-center gap-4 hover:border-slate-350 dark:hover:border-slate-850 hover:shadow-lg transition-all duration-300">
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-cyan-400">
            <PieChart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Net Value</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {displayCurrency}{totalNetValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center gap-4 hover:border-slate-350 dark:hover:border-slate-850 hover:shadow-lg transition-all duration-300">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Returns</p>
            <h3 className={`text-2xl font-black mt-1 ${totalGain >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-500'}`}>
              {totalGain >= 0 ? '+' : ''}{displayCurrency}{totalGain.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
        
        <div className="glass-panel p-6 flex items-center gap-4 hover:border-slate-350 dark:hover:border-slate-850 hover:shadow-lg transition-all duration-300">
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Asset Classes</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">5 Unique Hubs</h3>
          </div>
        </div>
      </div>

      {/* 1. Performance Chart (Full Page Width) */}
      <PortfolioPerformanceChart
        data={performanceData}
      />

      {/* 2. Unified Holdings Card (Full-width Section below main chart) */}
      <div className="glass-panel overflow-hidden shadow-lg transition-all duration-300">
        <div className="p-6 bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Portfolio Positions</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Live holdings index list across active categories.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Market Tab Selector */}
            <div className="flex bg-slate-100/80 dark:bg-white/[0.03] p-1 rounded-xl border border-slate-200/50 dark:border-white/5 text-xs font-bold shadow-inner">
              {['all', 'domestic', 'us', 'other', 'crypto', 'metals'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveMarket(tab)} 
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all duration-300 whitespace-nowrap ${
                    activeMarket === tab 
                      ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-cyan-400 shadow-sm border border-slate-200/60 dark:border-white/5' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {tab === 'all' ? 'All Assets' : tab === 'us' ? 'US' : tab}
                </button>
              ))}
            </div>

            <span className="rounded-full bg-blue-500/10 dark:bg-cyan-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-cyan-400">
              {filteredHoldings.length} Positions
            </span>
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/60 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-white/[0.01]">
                <th className="py-4 px-4">Asset / Hub</th>
                <th className="py-4 px-4 text-right">Qty / Vol</th>
                <th className="py-4 px-4 text-right">Avg Cost</th>
                <th className="py-4 px-4 text-right">Current Price</th>
                <th className="py-4 px-4 text-right">Market Value</th>
                <th className="py-4 px-4 text-right">Returns</th>
                <th className="py-4 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {filteredHoldings.map((asset) => {
                const posCurrency = asset.sectionId === 'domestic' ? '₹' : '$';
                return (
                  <tr key={asset.ticker} className="hover:bg-slate-50/30 dark:hover:bg-white/[0.005] transition-colors group align-middle">
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 justify-center">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2 py-0.5 text-[9px] font-black rounded border leading-tight ${asset.colorClass.bg} ${asset.colorClass.text} ${asset.colorClass.border}`}>
                            {asset.ticker}
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                            {asset.name}
                          </span>
                        </div>
                        <span className="text-[9px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                          {asset.category}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-slate-650 dark:text-slate-300 align-middle">
                      {asset.shares.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-slate-600 dark:text-slate-355 align-middle">
                      {posCurrency}{asset.avgCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm font-semibold text-slate-800 dark:text-slate-200 align-middle">
                      {posCurrency}{asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm font-bold text-slate-950 dark:text-white align-middle">
                      {posCurrency}{asset.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right align-middle">
                      <div className={`flex flex-col items-end justify-center ${asset.totalGain >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-500'}`}>
                        <span className="text-sm font-semibold flex items-center gap-0.5">
                          {asset.totalGain >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                          {posCurrency}{Math.abs(asset.totalGain).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] font-medium opacity-85">
                          {asset.gainPercent.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center align-middle">
                      <button
                        type="button"
                        onClick={() =>
                          openChart({
                            symbol: asset.ticker,
                            yahooSymbol: asset.yahooSymbol || asset.ticker,
                            name: asset.name,
                            exchange: asset.exchange || "GLOBAL",
                            type: asset.type || "Asset",
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-cyan-500/10 text-xs font-bold transition-all"
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Chart
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredHoldings.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    No active holdings found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Diagnostics Grid (2x2 layout for Allocation, AI Analyst, Risk, and Sectors) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Card 1: Allocation Chart */}
        <PortfolioAllocationChart
          data={allocationData}
        />

        {/* Card 2: Combined AI Analyst Tabbed Card */}
        <div className="glass-panel p-6 border-slate-200 dark:border-slate-800/60 shadow-lg">
          <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              AI Portfolio Analyst
            </h2>
          </div>

          {/* Tab selection cluster */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 p-1 rounded-2xl mb-6">
            {[
              { id: "health", label: "Health" },
              { id: "insights", label: "Insights" },
              { id: "sectors", label: "Sectors" },
              { id: "rebalance", label: "Realignment" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAiTab(tab.id as any)}
                className={`px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                  aiTab === tab.id
                    ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-white/5"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-355"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content wrapper */}
          <div className="min-h-[220px] flex flex-col justify-between">
            {aiTab === "health" && (
              <PortfolioHealthCard
                score={healthScore}
                diversification={
                  healthScore > 80
                    ? "Excellent"
                    : healthScore > 60
                    ? "Good"
                    : "Needs Improvement"
                }
                risk={risk}
                growth={growth}
              />
            )}

            {aiTab === "insights" && (
              <PortfolioInsightsCard
                insights={insights}
              />
            )}

            {aiTab === "sectors" && (
              <AISectorAnalysisCard
                insight={sectorInsight}
                recommendation={sectorRecommendation}
                score={sectorDiversificationScore}
                topSector={topSector?.sector || "N/A"}
              />
            )}

            {aiTab === "rebalance" && (
              <RebalancingCard
                suggestions={rebalancingSuggestions}
              />
            )}
          </div>
        </div>

        {/* Card 3: Portfolio Risk Analysis */}
        <RiskSimulatorCard
          riskScore={riskScore}
          expectedReturn={expectedReturn}
          bestCase={bestCase}
          worstCase={worstCase}
        />

        {/* Card 4: Sector Exposure */}
        <SectorExposureCard
          sectors={sectorExposure}
        />

      </div>

      {/* MODAL WITH NEW DEBOUNCED SEARCH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-night-950/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Add Asset Position</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Asset Category</label>
                <select 
                  value={marketId} 
                  onChange={e => setMarketId(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-sm rounded-xl outline-none text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-cyan-400 transition-colors"
                >
                  <option value="domestic" className="bg-white dark:bg-night-900 text-slate-900 dark:text-white font-medium">Domestic Stock</option>
                  <option value="us" className="bg-white dark:bg-night-900 text-slate-900 dark:text-white font-medium">US Stock</option>
                  <option value="other" className="bg-white dark:bg-night-900 text-slate-900 dark:text-white font-medium">Other Market</option>
                  <option value="crypto" className="bg-white dark:bg-night-900 text-slate-900 dark:text-white font-medium">Crypto</option>
                  <option value="metals" className="bg-white dark:bg-night-900 text-slate-900 dark:text-white font-medium">Precious Metals</option>
                </select>
              </div>
              
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Search Asset</label>
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
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-sm rounded-xl outline-none text-slate-900 dark:text-white pr-10 focus:border-blue-500 dark:focus:border-cyan-400 transition-colors"
                    placeholder="e.g. Apple or AAPL"
                    required
                  />
                  {isSearching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />}
                </div>

                {showSuggestions && assetSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-night-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
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
                  <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-1.5">
                    ✓ Selected: {selectedAsset.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Quantity</label>
                  <input 
                    type="number" 
                    step="any" 
                    required 
                    placeholder="0" 
                    value={shares} 
                    onChange={e => setShares(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-sm rounded-xl outline-none text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-cyan-400 transition-colors" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Average Price ($)</label>
                  <input 
                    type="number" 
                    step="any" 
                    required 
                    placeholder="0.00" 
                    value={cost} 
                    onChange={e => setCost(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-sm rounded-xl outline-none text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-cyan-400 transition-colors" 
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 py-3 text-sm font-bold text-white dark:text-night-900 mt-2 shadow-md transition-all active:scale-95"
              >
                Log Position
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}