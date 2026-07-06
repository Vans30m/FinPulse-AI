import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  PieChart as PieIcon,
  Layers,
  Search,
  ArrowUpDown,
  AlertCircle,
  CheckCircle as CheckCircle2
} from "lucide-react";
import PerformanceHeatmap from "./performance/PerformanceHeatmap";
import RollingCagrSection from "./performance/RollingCagrSection";
import AiPerformanceCoachSection from "./performance/AiPerformanceCoachSection";
import BenchmarkRadarSection from "./performance/BenchmarkRadarSection";
import { getFundamentals } from "../../../services/marketService";
import { getBenchmarkComparison } from "../../../services/portfolioService";
import { processCumulativeData } from "../../../utils/chartUtils";
import CumulativeReturnChart from "./performance/CumulativeReturnChart";
import AIPortfolioAdvisorSection from "../../portfolio/components/AIPortfolioAdvisorSection";
import API_BASE_URL from "../../../config/api";

export default function PerformanceComparison() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [usdToInrRate, setUsdToInrRate] = useState<number>(83.45);

  // New Benchmark Comparison states
  const [benchmarkTicker, setBenchmarkTicker] = useState<string>("^GSPC");
  const [benchmarkTimeframe, setBenchmarkTimeframe] = useState<string>("1M");
  const [comparisonLoading, setComparisonLoading] = useState<boolean>(true);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<{ series: any[], stats: any, constituents: any[] } | null>(null);
  
  // AI Advisor integration state
  const [advisorData, setAdvisorData] = useState<any>(null);
  const [advisorLoading, setAdvisorLoading] = useState<boolean>(true);

  // Constituents table search/sort states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [constituentLimit, setConstituentLimit] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("weight");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const BENCHMARK_OPTIONS = [
    { name: "NIFTY 50", symbol: "^NSEI" },
    { name: "SENSEX", symbol: "^BSESN" },
    { name: "NASDAQ Composite", symbol: "^IXIC" },
    { name: "S&P 500", symbol: "^GSPC" },
    { name: "Dow Jones", symbol: "^DJI" },
    { name: "Russell 2000", symbol: "^RUT" },
    { name: "EURO STOXX 50", symbol: "^STOXX50E" },
    { name: "FTSE 100", symbol: "^FTSE" },
    { name: "DAX", symbol: "^GDAXI" },
    { name: "CAC 40", symbol: "^FCHI" },
    { name: "Nikkei 225", symbol: "^N225" },
    { name: "Hang Seng", symbol: "^HSI" },
    { name: "Taiwan Weighted", symbol: "^TWII" },
    { name: "KOSPI", symbol: "^KS11" },
    { name: "Gold", symbol: "GC=F" },
    { name: "Silver", symbol: "SI=F" },
    { name: "Bitcoin", symbol: "BTC-USD" },
    { name: "Ethereum", symbol: "ETH-USD" }
  ];

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
      const userId = storedUser.id;
      const token = localStorage.getItem('finpulse_token') || localStorage.getItem('finpulse-token');
      const headers: any = {};
      if (userId) headers['X-User-Id'] = userId;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const holdingsRes = await fetch('${API_BASE_URL}/api/portfolio/holdings', { headers });

      if (holdingsRes.ok) {
        const data = await holdingsRes.json();
        const allHoldings = (data.sections || []).flatMap((s: any) => s.holdings || []);
        setHoldings(allHoldings);
      }

      // Fetch AI Advisor data
      const cachedAdvisor = sessionStorage.getItem("portfolioAdvisor");
      if (cachedAdvisor) {
        try {
          setAdvisorData(JSON.parse(cachedAdvisor));
          setAdvisorLoading(false);
        } catch (e) {}
      }

      fetch('${API_BASE_URL}/api/ai/portfolio-advisor', { headers })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            sessionStorage.setItem("portfolioAdvisor", JSON.stringify(data));
            setAdvisorData(data);
          }
        })
        .catch(err => console.error("Advisor load failed:", err))
        .finally(() => setAdvisorLoading(false));

    } catch (err) {
      console.error("Failed to load performance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const data = await getFundamentals('USDINR=X');
        if (data && data.price) {
          setUsdToInrRate(data.price);
        }
      } catch (err) {
        console.error("Failed to fetch USDINR exchange rate:", err);
      }
    };
    fetchRate();
    loadPerformanceData();
  }, []);

  const fetchBenchmarkComparison = async (signal?: AbortSignal) => {
    setComparisonLoading(true);
    setComparisonError(null);
    try {
      const data = await getBenchmarkComparison(benchmarkTicker, benchmarkTimeframe, signal);
      setComparisonData(data);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setComparisonError(err.message || "Failed to load benchmark comparison");
    } finally {
      if (!signal?.aborted) {
        setComparisonLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      fetchBenchmarkComparison(controller.signal);
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [benchmarkTicker, benchmarkTimeframe]);

  const handleRefresh = () => {
    loadPerformanceData();
    fetchBenchmarkComparison();
  };
  // Process cumulative return series using helper utility with memoization
  const processedSeries = useMemo(() => {
    if (!comparisonData || !comparisonData.series) return [];
    return processCumulativeData(comparisonData.series);
  }, [comparisonData]);

  const activeBenchmarkName = useMemo(() => {
    return BENCHMARK_OPTIONS.find(b => b.symbol === benchmarkTicker)?.name || "Benchmark";
  }, [benchmarkTicker]);
  const portfolioStats = useMemo(() => {
    let totalValuation = 0;
    let totalCost = 0;
    let totalGain = 0;

    holdings.forEach(h => {
      let value = h.marketValue || (h.shares * h.currentPrice) || 0;
      let cost = h.shares * h.avgCost;
      let gain = h.totalGain || (value - cost);

      if (h.marketId === 'domestic') {
        value = value / usdToInrRate;
        cost = cost / usdToInrRate;
        gain = gain / usdToInrRate;
      }

      totalValuation += value;
      totalCost += cost;
      totalGain += gain;
    });

    const yieldReturn = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    return {
      totalValuation,
      totalCost,
      totalGain,
      yieldReturn
    };
  }, [holdings, usdToInrRate]);
  const sectorAllocations = useMemo(() => {
    if (holdings.length === 0) return [];
    const sectorsMap: Record<string, number> = {};
    let totalValue = 0;

    holdings.forEach(h => {
      const val = h.marketValue || (h.shares * h.currentPrice) || 0;
      sectorsMap[h.sector || "Other"] = (sectorsMap[h.sector || "Other"] || 0) + val;
      totalValue += val;
    });

    const colors = ["#3b82f6", "#10b981", "#a855f7", "#f59e42", "#ec4899", "#64748b"];
    return Object.entries(sectorsMap).map(([name, count], index) => ({
      name,
      count: parseFloat(count.toFixed(2)),
      val: parseFloat((totalValue > 0 ? (count / totalValue) * 100 : 0).toFixed(1)),
      color: colors[index % colors.length]
    }));
  }, [holdings]);

  // Top gainers (alpha contributors)
  const contributors = useMemo(() => {
    return holdings
      .filter(h => h.totalGain > 0)
      .sort((a, b) => b.totalGain - a.totalGain)
      .map(h => ({
        symbol: h.ticker,
        name: h.name,
        profit: h.totalGain,
        return: `${h.gainPercent >= 0 ? "+" : ""}${h.gainPercent.toFixed(2)}%`
      }));
  }, [holdings]);

  // Underperformers (losses)
  const losses = useMemo(() => {
    return holdings
      .filter(h => h.totalGain < 0)
      .sort((a, b) => a.totalGain - b.totalGain)
      .map(h => ({
        symbol: h.ticker,
        name: h.name,
        loss: h.totalGain,
        return: `${h.gainPercent.toFixed(2)}%`
      }));
  }, [holdings]);

  const sortedAndFilteredConstituents = useMemo(() => {
    if (!comparisonData || !comparisonData.constituents) return [];
    let list = [...comparisonData.constituents];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
    }

    // Sort order
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
    });

    // Limit elements
    if (constituentLimit !== 'all') {
      const limitVal = parseInt(constituentLimit);
      list = list.slice(0, limitVal);
    }

    return list;
  }, [comparisonData, searchQuery, constituentLimit, sortField, sortDirection]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Activity className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Render Premium Fallback/Zero State when Portfolio is Empty (Removing mock data completely)
  if (holdings.length === 0) {
    return (
      <div className="space-y-8 text-slate-100 font-sans selection:bg-blue-500/25 selection:text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Performance Analytics Center</h2>
            <p className="text-xs text-slate-400 font-medium">Deep-dive metric matrices, alpha models, and solvency indicators.</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center text-center p-16 bg-[#121a2a]/45 border border-slate-900 rounded-3xl space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Activity className="h-8 w-8 text-blue-405" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Solvency & Performance Metrics Locked</h3>
            <p className="text-sm text-slate-400 max-w-md animate-pulse">
              No assets or transactions found. Please add holdings or transaction logs in the **Portfolio** tab to unlock real-time performance tracking.
            </p>
          </div>
          <button
            onClick={() => navigate("/portfolio")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-600/10"
          >
            Go to Portfolio Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-slate-100 font-sans selection:bg-blue-500/25 selection:text-white">
      {/* HEADER SECTION WITH REFRESH TRIGGER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Performance Analytics Center</h2>
          <p className="text-xs text-slate-400 font-medium">Deep-dive metric matrices, alpha models, and solvency indicators.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all"
          >
            <Activity className="h-4.5 w-4.5" />
            Recalculate Metrics
          </button>
        </div>
      </div>

      {/* ==================== 1. HERO PERFORMANCE SUMMARY ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Portfolio Yield Return", val: `${portfolioStats.yieldReturn >= 0 ? "+" : ""}${portfolioStats.yieldReturn.toFixed(2)}%`, desc: "Aggregate return yield", grad: "from-cyan-600/10 to-blue-500/10" },
          { label: "Total Profit / Loss", val: `${portfolioStats.totalGain >= 0 ? "+" : ""}$${portfolioStats.totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, desc: "Unrealized ledger delta", grad: "from-emerald-600/10 to-teal-500/10" },
          { label: "Capital Valuation Ledger", val: `$${portfolioStats.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, desc: "Total asset valuation", grad: "from-blue-600/10 to-indigo-500/10" },
          { label: "Assets Tracked", val: `${holdings.length} Positions`, desc: "Active ledger size", grad: "from-purple-600/10 to-pink-500/10" }
        ].map((card, i) => (
          <div
            key={i}
            className={`bg-[#121a2a]/45 backdrop-blur-md border border-slate-900 rounded-3xl p-5 shadow-lg bg-gradient-to-br ${card.grad} hover:translate-y-[-2px] transition-all duration-300`}
          >
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">{card.label}</span>
            <h3 className="text-2xl font-black text-white tracking-tight mt-2">{card.val}</h3>
            <span className="text-[10px] text-slate-400 block mt-1.5 font-medium">{card.desc}</span>
          </div>
        ))}
      </div>
      {/* ==================== 2. PERFORMANCE CHART & BENCHMARK COMPARISON ==================== */}
      <div className="space-y-6">
        {comparisonLoading ? (
          <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-8 shadow-md text-center flex flex-col items-center justify-center space-y-4 min-h-[300px]">
            <Activity className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest">Loading Benchmark Performance...</p>
          </div>
        ) : comparisonError ? (
          <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-8 shadow-md text-center flex flex-col items-center justify-center space-y-4 min-h-[300px]">
            <AlertCircle className="h-8 w-8 text-rose-500" />
            <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest">Unable to load benchmark.</p>
            <button
              onClick={fetchBenchmarkComparison}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Performance Summary Banner */}
            {comparisonData?.stats && (
              <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                comparisonData.stats.portfolioReturn >= comparisonData.stats.benchmarkReturn
                  ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
                  : "bg-rose-500/5 border-rose-500/10 text-rose-400"
              }`}>
                {comparisonData.stats.portfolioReturn >= comparisonData.stats.benchmarkReturn ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0" />
                )}
                <span className="text-sm font-black uppercase tracking-wide">
                  {comparisonData.stats.portfolioReturn >= comparisonData.stats.benchmarkReturn
                    ? `Portfolio outperformed ${BENCHMARK_OPTIONS.find(b => b.symbol === benchmarkTicker)?.name} by +${(comparisonData.stats.portfolioReturn - comparisonData.stats.benchmarkReturn).toFixed(2)}%`
                    : `Portfolio underperformed ${BENCHMARK_OPTIONS.find(b => b.symbol === benchmarkTicker)?.name} by ${(comparisonData.stats.portfolioReturn - comparisonData.stats.benchmarkReturn).toFixed(2)}%`
                  }
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Block */}
              <div className="lg:col-span-2 bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <LineChartIcon size={16} className="text-blue-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">Cumulative Return Comparison</span>
                  </div>

                  <div className="flex flex-wrap bg-[#050711] p-1 rounded-xl border border-slate-900 gap-1">
                    {["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "3Y", "5Y", "MAX"].map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setBenchmarkTimeframe(tf)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                          benchmarkTimeframe === tf
                            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-1.5">
                  {BENCHMARK_OPTIONS.map((bench) => (
                    <button
                      key={bench.symbol}
                      onClick={() => setBenchmarkTicker(bench.symbol)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border transition-all ${
                        benchmarkTicker === bench.symbol
                          ? "bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-inner"
                          : "bg-[#050711]/40 text-slate-400 border-slate-900/60 hover:text-white"
                      }`}
                    >
                      {bench.name}
                    </button>
                  ))}
                </div>

                {/* Stats Grid Above the Chart */}
                {comparisonData?.stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6 border-b border-slate-900/60 pb-5">
                    <div className="bg-[#050711]/60 border border-slate-900/60 rounded-2xl p-3 text-center">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Portfolio Return</span>
                      <span className="text-xs font-black text-emerald-400 font-mono block mt-1">
                        {comparisonData.stats.portfolioReturn >= 0 ? "+" : ""}{comparisonData.stats.portfolioReturn}%
                      </span>
                    </div>
                    <div className="bg-[#050711]/60 border border-slate-900/60 rounded-2xl p-3 text-center">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Benchmark Return</span>
                      <span className="text-xs font-black text-slate-350 font-mono block mt-1">
                        {comparisonData.stats.benchmarkReturn >= 0 ? "+" : ""}{comparisonData.stats.benchmarkReturn}%
                      </span>
                    </div>
                    <div className="bg-[#050711]/60 border border-slate-900/60 rounded-2xl p-3 text-center">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Outperformance</span>
                      <span className={`text-xs font-black font-mono block mt-1 ${
                        comparisonData.stats.portfolioReturn >= comparisonData.stats.benchmarkReturn ? "text-emerald-400" : "text-rose-450"
                      }`}>
                        {(comparisonData.stats.portfolioReturn - comparisonData.stats.benchmarkReturn) >= 0 ? "+" : ""}
                        {(comparisonData.stats.portfolioReturn - comparisonData.stats.benchmarkReturn).toFixed(2)}%
                      </span>
                    </div>
                    <div className="bg-[#050711]/60 border border-slate-900/60 rounded-2xl p-3 text-center">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Alpha</span>
                      <span className="text-xs font-black text-white font-mono block mt-1">
                        {comparisonData.stats.alpha >= 0 ? "+" : ""}{comparisonData.stats.alpha}
                      </span>
                    </div>
                    <div className="bg-[#050711]/60 border border-slate-900/60 rounded-2xl p-3 text-center">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Beta</span>
                      <span className="text-xs font-black text-white font-mono block mt-1">
                        {comparisonData.stats.beta}
                      </span>
                    </div>
                    <div className="bg-[#050711]/60 border border-slate-900/60 rounded-2xl p-3 text-center">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Sharpe Ratio</span>
                      <span className="text-xs font-black text-white font-mono block mt-1">
                        {comparisonData.stats.sharpeRatio}
                      </span>
                    </div>
                    <div className="bg-[#050711]/60 border border-slate-900/60 rounded-2xl p-3 text-center">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Volatility</span>
                      <span className="text-xs font-black text-white font-mono block mt-1">
                        {comparisonData.stats.volatility}%
                      </span>
                    </div>
                    <div className="bg-[#050711]/60 border border-slate-900/60 rounded-2xl p-3 text-center">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Max Drawdown</span>
                      <span className="text-xs font-black text-rose-450 font-mono block mt-1">
                        {comparisonData.stats.maxDrawdown}%
                      </span>
                    </div>
                  </div>
                )}

                <div className="w-full mt-2">
                  {(!comparisonData || processedSeries.length === 0) ? (
                    <div className="h-[300px] flex items-center justify-center text-slate-500 text-xs font-extrabold uppercase tracking-widest bg-[#050711]/45 border border-slate-900 rounded-3xl">
                      Not enough historical data available.
                    </div>
                  ) : (
                    <CumulativeReturnChart
                      data={processedSeries}
                      benchmarkName={activeBenchmarkName}
                      height={320}
                    />
                  )}
                </div>
              </div>

              {/* Statistics & Target Ledger Panel */}
              <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">Benchmark comparison statistics</span>
                    <div className="flex items-center gap-1 bg-[#050711] px-2.5 py-1 rounded-xl border border-slate-900 text-xs">
                      <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Active:</span>
                      <span className="text-white font-extrabold">{BENCHMARK_OPTIONS.find(b => b.symbol === benchmarkTicker)?.name}</span>
                    </div>
                  </div>

                  {comparisonData?.stats && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#050711]/60 border border-slate-900 rounded-xl p-3">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Portfolio Return</span>
                          <span className="text-sm font-black text-emerald-400 font-mono block mt-1">{comparisonData.stats.portfolioReturn >= 0 ? "+" : ""}{comparisonData.stats.portfolioReturn}%</span>
                        </div>
                        <div className="bg-[#050711]/60 border border-slate-900 rounded-xl p-3">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Benchmark Return</span>
                          <span className="text-sm font-black text-slate-200 font-mono block mt-1">{comparisonData.stats.benchmarkReturn >= 0 ? "+" : ""}{comparisonData.stats.benchmarkReturn}%</span>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-slate-900/60 pt-3">
                        {[
                          { label: "Alpha (Excess Return)", value: `${comparisonData.stats.alpha >= 0 ? "+" : ""}${comparisonData.stats.alpha}` },
                          { label: "Beta (Systemic Risk)", value: comparisonData.stats.beta },
                          { label: "Correlation", value: comparisonData.stats.correlation },
                          { label: "Sharpe Ratio", value: comparisonData.stats.sharpeRatio },
                          { label: "Information Ratio", value: comparisonData.stats.informationRatio },
                          { label: "Tracking Error", value: `${comparisonData.stats.trackingError}%` },
                          { label: "Max Drawdown", value: `${comparisonData.stats.maxDrawdown}%` },
                          { label: "Portfolio Volatility", value: `${comparisonData.stats.volatility}%` }
                        ].map((stat, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-900/60 text-xs">
                            <span className="text-slate-400 font-medium">{stat.label}</span>
                            <span className="font-mono font-black text-white">{stat.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Constituents Section */}
            {comparisonData?.constituents && (
              <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers className="h-4.5 w-4.5 text-blue-400" />
                      Benchmark constituents & weights
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Real-time Yahoo Finance constituent quotes and comparative returns.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Search Bar */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search constituents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-4 py-1.5 bg-[#050711] border border-slate-900 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44"
                      />
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    </div>

                    {/* Limit Filters */}
                    <div className="flex bg-[#050711] p-1 rounded-xl border border-slate-900 text-[10px] font-black uppercase text-slate-400">
                      {[
                        { label: "Top 10", val: "10" },
                        { label: "Top 25", val: "25" },
                        { label: "Top 50", val: "50" },
                        { label: "All", val: "all" }
                      ].map((lim) => (
                        <button
                          key={lim.val}
                          onClick={() => setConstituentLimit(lim.val)}
                          className={`px-2.5 py-1 rounded-lg transition-all ${
                            constituentLimit === lim.val ? "bg-blue-600/10 text-blue-400" : "hover:text-white"
                          }`}
                        >
                          {lim.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] hover:bg-transparent">
                        <th className="py-3 px-2">Constituent Company</th>
                        <th className="py-3 px-2 cursor-pointer hover:text-white" onClick={() => {
                          setSortField("weight");
                          setSortDirection(prev => prev === "desc" ? "asc" : "desc");
                        }}>
                          Weight <ArrowUpDown className="inline-block h-3 w-3 ml-1" />
                        </th>
                        <th className="py-3 px-2 cursor-pointer hover:text-white" onClick={() => {
                          setSortField("price");
                          setSortDirection(prev => prev === "desc" ? "asc" : "desc");
                        }}>
                          Current Price <ArrowUpDown className="inline-block h-3 w-3 ml-1" />
                        </th>
                        <th className="py-3 px-2 cursor-pointer hover:text-white" onClick={() => {
                          setSortField("timeframeReturn");
                          setSortDirection(prev => prev === "desc" ? "asc" : "desc");
                        }}>
                          {benchmarkTimeframe} Return % <ArrowUpDown className="inline-block h-3 w-3 ml-1" />
                        </th>
                        <th className="py-3 px-2 cursor-pointer hover:text-white" onClick={() => {
                          setSortField("dailyChange");
                          setSortDirection(prev => prev === "desc" ? "asc" : "desc");
                        }}>
                          Daily Change % <ArrowUpDown className="inline-block h-3 w-3 ml-1" />
                        </th>
                        <th className="py-3 px-2">Sector</th>
                        <th className="py-3 px-2 cursor-pointer hover:text-white" onClick={() => {
                          setSortField("marketCap");
                          setSortDirection(prev => prev === "desc" ? "asc" : "desc");
                        }}>
                          Market Cap <ArrowUpDown className="inline-block h-3 w-3 ml-1" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAndFilteredConstituents.map((con, idx) => (
                        <tr key={idx} className="border-b border-slate-900 hover:bg-[#050711]/40 transition-colors group relative">
                          <td className="py-3.5 px-2 flex items-center gap-2.5">
                            {con.logo ? (
                              <img src={con.logo} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 p-0.5 object-contain" />
                            ) : (
                              <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] text-blue-400 font-bold font-mono">
                                {con.symbol.slice(0, 2)}
                              </div>
                            )}
                            <div>
                              <span className="font-extrabold text-white block">{con.name}</span>
                              <span className="font-mono text-[9px] text-slate-500 uppercase">{con.symbol}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-2 font-mono font-bold text-slate-200">
                            {con.weight ? `${con.weight}%` : "—"}
                          </td>
                          <td className="py-3.5 px-2 font-mono font-bold text-slate-200">
                            {con.price ? `$${con.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                          </td>
                          <td className={`py-3.5 px-2 font-mono font-bold ${con.timeframeReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {con.timeframeReturn >= 0 ? "+" : ""}{con.timeframeReturn}%
                          </td>
                          <td className={`py-3.5 px-2 font-mono font-bold ${con.dailyChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {con.dailyChange >= 0 ? "+" : ""}{con.dailyChange?.toFixed(2)}%
                          </td>
                          <td className="py-3.5 px-2 text-slate-400 font-medium">
                            {con.sector}
                          </td>
                          <td className="py-3.5 px-2 font-mono font-medium text-slate-400">
                            {con.marketCap ? `$${(con.marketCap / 1e9).toFixed(2)}B` : "—"}
                          </td>

                          {/* Hover Tooltip card details */}
                          <div className="absolute left-1/4 bottom-full mb-2 hidden group-hover:block bg-[#050711]/95 border border-slate-900 p-3.5 rounded-2xl shadow-2xl z-50 min-w-[200px] pointer-events-none backdrop-blur-md">
                            <span className="block text-[9px] font-black uppercase tracking-wider text-blue-400 border-b border-slate-900 pb-1 mb-2">{con.name} metrics</span>
                            <div className="space-y-1.5 text-[10px]">
                              <div className="flex justify-between gap-4"><span className="text-slate-500 font-bold uppercase">Sector:</span><span className="text-slate-300 font-semibold">{con.sector}</span></div>
                              <div className="flex justify-between gap-4"><span className="text-slate-500 font-bold uppercase">Industry:</span><span className="text-slate-300 font-semibold">{con.industry}</span></div>
                              <div className="flex justify-between gap-4"><span className="text-slate-500 font-bold uppercase">PE Ratio:</span><span className="text-slate-300 font-mono font-semibold">{con.pe ? con.pe.toFixed(2) : "—"}</span></div>
                              <div className="flex justify-between gap-4"><span className="text-slate-500 font-bold uppercase">Dividend Yield:</span><span className="text-slate-300 font-mono font-semibold">{con.dividendYield ? `${(con.dividendYield * 100).toFixed(2)}%` : "—"}</span></div>
                              <div className="flex justify-between gap-4"><span className="text-slate-500 font-bold uppercase">52W High:</span><span className="text-emerald-450 font-mono font-semibold">${con.fiftyTwoWeekHigh?.toFixed(2)}</span></div>
                              <div className="flex justify-between gap-4"><span className="text-slate-500 font-bold uppercase">52W Low:</span><span className="text-rose-450 font-mono font-semibold">${con.fiftyTwoWeekLow?.toFixed(2)}</span></div>
                            </div>
                          </div>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* ==================== 3. CONTRIBUTORS & UNDERPERFORMERS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
            <TrendingUp size={15} className="text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Top Alpha Contributors</span>
          </div>

          <div className="space-y-3">
            {contributors.length === 0 ? (
              <div className="text-slate-500 text-xs py-4 font-bold text-center">No profitable assets currently.</div>
            ) : (
              contributors.map((c, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-[#050711]/60 border border-slate-900 rounded-2xl">
                  <div>
                    <span className="text-xs font-black text-white">{c.symbol}</span>
                    <span className="text-[10px] text-slate-500 block">{c.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-400 font-mono">{c.return}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">+${c.profit.toFixed(2)} Profit</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
            <TrendingDown size={15} className="text-rose-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Biggest Beta Underperformers</span>
          </div>

          <div className="space-y-3">
            {losses.length === 0 ? (
              <div className="text-slate-500 text-xs py-4 font-bold text-center">No negative assets currently.</div>
            ) : (
              losses.map((l, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-[#050711]/60 border border-slate-900 rounded-2xl">
                  <div>
                    <span className="text-xs font-black text-white">{l.symbol}</span>
                    <span className="text-[10px] text-slate-500 block">{l.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-rose-505 font-mono">{l.return}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">-${Math.abs(l.loss).toFixed(2)} Loss</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* AI Portfolio Advisor */}
      {advisorLoading ? (
        <div className="glass-panel p-8 flex flex-col items-center justify-center min-h-[200px] border border-slate-900 bg-[#121a2a]/45 rounded-3xl">
          <Activity className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-xs text-slate-400 mt-3 font-mono">Synchronizing advisor insights...</p>
        </div>
      ) : advisorData ? (
        <AIPortfolioAdvisorSection advisor={advisorData} />
      ) : null}

      <BenchmarkRadarSection />
      <PerformanceHeatmap />
      <RollingCagrSection />
    </div>
  );
}