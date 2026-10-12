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
import { motion } from "framer-motion";
import RollingCagrSection from "./performance/RollingCagrSection";
import AiPerformanceCoachSection from "./performance/AiPerformanceCoachSection";
import BenchmarkRadarSection from "./performance/BenchmarkRadarSection";
import { getFundamentals } from "../../../services/marketService";
import { getBenchmarkComparison } from "../../../services/portfolioService";
import { processCumulativeData } from "../../../utils/chartUtils";
import CumulativeReturnChart from "./performance/CumulativeReturnChart";
import AIPortfolioAdvisorSection from "../../portfolio/components/AIPortfolioAdvisorSection";
import API_BASE_URL from "../../../config/api";
import { useAppData } from "../../../context/AppDataContext";
import PageLoader from "../../../components/ui/PageLoader";

import LightLogo from "../../../assets/Dark_Logo.png";
import DarkLogo from "../../../assets/Light_Logo.png";

export default function PerformanceComparison() {
  const navigate = useNavigate();
  const { user } = useAppData();
  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [usdToInrRate, setUsdToInrRate] = useState<number>(() => {
    const cached = sessionStorage.getItem("usdToInrRate");
    return cached ? parseFloat(cached) : 83.45;
  });
  const [usdToEurRate, setUsdToEurRate] = useState<number>(() => {
    const cached = sessionStorage.getItem("usdToEurRate");
    return cached ? parseFloat(cached) : 0.92;
  });
  const [usdToGbpRate, setUsdToGbpRate] = useState<number>(() => {
    const cached = sessionStorage.getItem("usdToGbpRate");
    return cached ? parseFloat(cached) : 0.79;
  });

  // Benchmark Comparison states
  const [benchmarkTicker, setBenchmarkTicker] = useState<string>("^GSPC");
  const [benchmarkTimeframe, setBenchmarkTimeframe] = useState<string>("1M");
  const [comparisonLoading, setComparisonLoading] = useState<boolean>(true);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<{ series: any[], stats: any, constituents: any[] } | null>(null);

  // AI Advisor integration state
  const [advisorData, setAdvisorData] = useState<any>(null);
  const [advisorLoading, setAdvisorLoading] = useState<boolean>(true);

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

      const holdingsRes = await fetch(`${API_BASE_URL}/api/portfolio/holdings`, { headers });

      if (holdingsRes.ok) {
        const data = await holdingsRes.json();
        const allHoldings = (data.sections || []).flatMap((s: any) =>
          (s.holdings || []).map((h: any) => ({ ...h, marketId: s.id }))
        );
        setHoldings(allHoldings);
      }

      // Fetch AI Advisor data
      const advisorCacheKey = `portfolioAdvisor:v3:${userId || "anonymous"}`;
      const cachedAdvisor = sessionStorage.getItem(advisorCacheKey);
      if (cachedAdvisor) {
        try {
          setAdvisorData(JSON.parse(cachedAdvisor));
          setAdvisorLoading(false);
        } catch (e) { }
      }

      fetch(`${API_BASE_URL}/api/ai/portfolio-advisor`, { headers })
        .then(async res => {
          if (res.ok) {
            const data = await res.json();
            setAdvisorData(data);
            sessionStorage.setItem(advisorCacheKey, JSON.stringify(data));
          }
          setAdvisorLoading(false);
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

  const getCurrencyCode = (currencyString?: string): 'USD' | 'INR' | 'EUR' | 'GBP' => {
    if (!currencyString) return 'INR';
    if (currencyString.toUpperCase().includes('INR') || currencyString.includes('₹')) return 'INR';
    if (currencyString.toUpperCase().includes('USD') || currencyString.includes('$')) return 'USD';
    if (currencyString.toUpperCase().includes('EUR') || currencyString.includes('€')) return 'EUR';
    if (currencyString.toUpperCase().includes('GBP') || currencyString.includes('£')) return 'GBP';
    return 'INR';
  };

  const [portfolioCurrency, setPortfolioCurrency] = useState<'USD' | 'INR' | 'EUR' | 'GBP'>(() => getCurrencyCode(user?.currency));

  useEffect(() => {
    if (user?.currency) {
      setPortfolioCurrency(getCurrencyCode(user.currency));
    }
  }, [user?.currency]);

  const fetchSingleRate = async (code: 'USD' | 'INR' | 'EUR' | 'GBP') => {
    if (code === 'USD') return;
    if (code === 'INR') {
      try {
        const inrData = await getFundamentals('USDINR=X');
        if (inrData && inrData.price) {
          setUsdToInrRate(inrData.price);
          sessionStorage.setItem('usdToInrRate', inrData.price.toString());
        }
      } catch (e) { }
    } else if (code === 'EUR') {
      try {
        const eurData = await getFundamentals('USDEUR=X');
        if (eurData && eurData.price) {
          setUsdToEurRate(eurData.price);
          sessionStorage.setItem('usdToEurRate', eurData.price.toString());
        }
      } catch (e) { }
    } else if (code === 'GBP') {
      try {
        const gbpData = await getFundamentals('USDGBP=X');
        if (gbpData && gbpData.price) {
          setUsdToGbpRate(gbpData.price);
          sessionStorage.setItem('usdToGbpRate', gbpData.price.toString());
        }
      } catch (e) { }
    }
  };

  const handleCurrencyChange = (newCurrency: 'USD' | 'INR' | 'EUR' | 'GBP') => {
    setPortfolioCurrency(newCurrency);
    if (newCurrency !== getCurrencyCode(user?.currency)) {
      fetchSingleRate(newCurrency);
    }
  };

  const handleRefresh = () => {
    loadPerformanceData();
    fetchBenchmarkComparison();
  };

  const processedSeries = useMemo(() => {
    if (!comparisonData || !comparisonData.series) return [];
    return processCumulativeData(comparisonData.series);
  }, [comparisonData]);

  const activeBenchmarkName = useMemo(() => {
    return BENCHMARK_OPTIONS.find(b => b.symbol === benchmarkTicker)?.name || "Benchmark";
  }, [benchmarkTicker]);

  const TIMEFRAME_OPTIONS = ["1M", "6M", "YTD", "1Y", "ALL"];

  const portfolioStats = useMemo(() => {
    let totalValuation = 0;
    let totalCost = 0;
    let totalGain = 0;

    holdings.forEach(h => {
      const positionUnits = Number(h.shares) || 0;
      const absShares = Math.abs(positionUnits);
      const marketValue = absShares * (Number(h.currentPrice) || 0);
      const costBasis = absShares * (Number(h.avgCost) || 0);
      const gain = positionUnits < 0 ? costBasis - marketValue : marketValue - costBasis;

      let value = h.marketValue ?? (marketValue || 0);
      let cost = h.avgCost !== undefined ? costBasis : 0;
      let pnl = typeof h.totalGain === 'number' ? h.totalGain : gain;

      if (h.marketId === 'domestic') {
        value = value / usdToInrRate;
        cost = cost / usdToInrRate;
        pnl = pnl / usdToInrRate;
      }

      totalValuation += value;
      totalCost += cost;
      totalGain += pnl;
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

  const contributors = useMemo(() => {
    return holdings
      .map((h) => {
        const positionUnits = Number(h.shares) || 0;
        const absShares = Math.abs(positionUnits);
        const marketValue = absShares * (Number(h.currentPrice) || 0);
        const costBasis = absShares * (Number(h.avgCost) || 0);
        const totalGain = typeof h.totalGain === 'number' ? h.totalGain : (positionUnits < 0 ? costBasis - marketValue : marketValue - costBasis);
        const gainPercent = costBasis > 0 ? (totalGain / costBasis) * 100 : 0;

        return {
          ...h,
          numericTotalGain: totalGain,
          numericGainPercent: gainPercent
        };
      })
      .filter(h => h.numericTotalGain > 0)
      .sort((a, b) => b.numericTotalGain - a.numericTotalGain)
      .map(h => ({
        symbol: h.ticker,
        name: h.name,
        marketId: h.marketId,
        profit: h.numericTotalGain,
        return: `${h.numericGainPercent >= 0 ? "+" : ""}${h.numericGainPercent.toFixed(2)}%`
      }));
  }, [holdings]);

  const losses = useMemo(() => {
    return holdings
      .map((h) => {
        const positionUnits = Number(h.shares) || 0;
        const absShares = Math.abs(positionUnits);
        const marketValue = absShares * (Number(h.currentPrice) || 0);
        const costBasis = absShares * (Number(h.avgCost) || 0);
        const totalGain = typeof h.totalGain === 'number' ? h.totalGain : (positionUnits < 0 ? costBasis - marketValue : marketValue - costBasis);
        const gainPercent = costBasis > 0 ? (totalGain / costBasis) * 100 : 0;

        return {
          ...h,
          numericTotalGain: totalGain,
          numericGainPercent: gainPercent
        };
      })
      .filter(h => h.numericTotalGain < 0)
      .sort((a, b) => a.numericTotalGain - b.numericTotalGain)
      .map(h => ({
        symbol: h.ticker,
        name: h.name,
        marketId: h.marketId,
        loss: h.numericTotalGain,
        return: `${h.numericGainPercent.toFixed(2)}%`
      }));
  }, [holdings]);

  const [activeTab, setActiveTab] = useState<"overview" | "metrics" | "ai">("overview");

  if (loading) {
    return <PageLoader title="Performance Center" message="Analyzing risk metrics, calculating CAGR trajectories, and compiling benchmark comparison stats..." />;
  }

  if (holdings.length === 0) {
    return (
      <div className="space-y-8 text-slate-100 font-sans selection:bg-blue-500/25 selection:text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight uppercase">Performance Analytics Center</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Portfolio return analytics, risk attribution, and benchmark tracking.</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center text-center p-16 bg-white dark:bg-[#121a2a]/45 border border-slate-200 dark:border-slate-900 rounded-3xl space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Solvency & Performance Metrics Locked</h3>
            <p className="text-sm text-slate-400 max-w-md animate-pulse">
              No assets or transactions found. Please add holdings or transaction logs in the **Portfolio** tab to unlock real-time performance tracking.
            </p>
          </div>
          <button
            onClick={() => navigate("/portfolio")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-slate-900 dark:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-600/10"
          >
            Go to Portfolio Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getCurrencySymbol = (currencyCode?: 'USD' | 'INR' | 'EUR' | 'GBP') => {
    if (currencyCode === 'USD') return '$';
    if (currencyCode === 'EUR') return '€';
    if (currencyCode === 'GBP') return '£';
    return '₹';
  };
  const cSymbol = getCurrencySymbol(portfolioCurrency);

  const formatSignedCurrency = (value: number) => {
    const absolute = Math.abs(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const sign = value < 0 ? '-' : '+';
    return `${sign}${cSymbol}${absolute}`;
  };

  const formatCurrency = (value: number) => `${cSymbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const normalizeHoldingValueForDisplay = (value: number, marketId?: string) => {
    if (marketId === 'domestic') {
      const valueInUsd = value / usdToInrRate;
      if (portfolioCurrency === 'INR') return value;
      if (portfolioCurrency === 'USD') return valueInUsd;
      if (portfolioCurrency === 'EUR') return valueInUsd * usdToEurRate;
      if (portfolioCurrency === 'GBP') return valueInUsd * usdToGbpRate;
      return value;
    }

    if (portfolioCurrency === 'INR') return value * usdToInrRate;
    if (portfolioCurrency === 'USD') return value;
    if (portfolioCurrency === 'EUR') return value * usdToEurRate;
    if (portfolioCurrency === 'GBP') return value * usdToGbpRate;
    return value;
  };

  const displayGain =
    portfolioCurrency === 'INR' ? portfolioStats.totalGain * usdToInrRate :
      portfolioCurrency === 'EUR' ? portfolioStats.totalGain * usdToEurRate :
        portfolioCurrency === 'GBP' ? portfolioStats.totalGain * usdToGbpRate :
          portfolioStats.totalGain;

  const displayValuation =
    portfolioCurrency === 'INR' ? portfolioStats.totalValuation * usdToInrRate :
      portfolioCurrency === 'EUR' ? portfolioStats.totalValuation * usdToEurRate :
        portfolioCurrency === 'GBP' ? portfolioStats.totalValuation * usdToGbpRate :
          portfolioStats.totalValuation;

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto px-1 relative animate-fadeIn">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/4 w-72 h-72 bg-blue-400/10 dark:bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-400/10 dark:bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER SECTION WITH REFRESH TRIGGER */}
      <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 flex-nowrap">
              <h1 className="text-xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white font-display bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
                Performance Analytics
              </h1>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:bg-cyan-500/15 dark:text-cyan-400 border border-blue-500/20 dark:border-cyan-400/25">
                Benchmark Radar
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Institutional-grade return analytics, risk attribution & alpha benchmarking.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
            {/* Currency Pill Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.04] p-1 rounded-2xl border border-slate-200/60 dark:border-white/5">
              {[
                { code: 'USD', symbol: '$' },
                { code: 'INR', symbol: '₹' },
                { code: 'EUR', symbol: '€' },
                { code: 'GBP', symbol: '£' }
              ].map((cur) => (
                <button
                  key={cur.code}
                  onClick={() => handleCurrencyChange(cur.code as 'USD' | 'INR' | 'EUR' | 'GBP')}
                  aria-pressed={portfolioCurrency === cur.code}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all ${portfolioCurrency === cur.code
                    ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-cyan-400 shadow-sm border border-slate-200/60 dark:border-white/5'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  {cur.code} ({cur.symbol})
                </button>
              ))}
            </div>

            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Activity className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Recalculate</span>
            </button>
          </div>
        </div>

        {/* TABS CONTROLLER */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-2">
          {[
            { id: "overview", label: "Overview & Returns", icon: LineChartIcon },
            { id: "metrics", label: "Advanced Metrics", icon: Layers },
            { id: "ai", label: "AI Advisor Coach", icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 whitespace-nowrap border ${isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-cyan-500/20 dark:to-blue-500/20 text-white dark:text-cyan-300 border-blue-500 dark:border-cyan-400/40 shadow-sm"
                  : "bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* HERO PERFORMANCE SUMMARY */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Portfolio Yield Return", val: `${portfolioStats.yieldReturn >= 0 ? "+" : ""}${portfolioStats.yieldReturn.toFixed(2)}%`, desc: "Total Return", accent: "text-cyan-500 dark:text-cyan-400", icon: <TrendingUp className="h-5 w-5 text-cyan-500" />, iconBg: "bg-cyan-500/10 border-cyan-500/20" },
            { label: "Total Profit / Loss", val: formatSignedCurrency(displayGain), desc: "Unrealized P&L", accent: displayGain >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400", icon: <Activity className="h-5 w-5 text-emerald-500" />, iconBg: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "Capital Valuation Ledger", val: formatCurrency(displayValuation), desc: "Total Portfolio Value", accent: "text-blue-600 dark:text-blue-400", icon: <Layers className="h-5 w-5 text-blue-600" />, iconBg: "bg-blue-500/10 border-blue-500/20" },
            { label: "Assets Tracked", val: `${holdings.length} Positions`, desc: "Active Holdings", accent: "text-purple-600 dark:text-purple-400", icon: <PieIcon className="h-5 w-5 text-purple-600" />, iconBg: "bg-purple-500/10 border-purple-500/20" }
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="glass-panel p-5 flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] backdrop-blur-xl shadow-lg hover:border-slate-300 dark:hover:border-cyan-500/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{card.label}</span>
                <div className={`p-2 rounded-xl border ${card.iconBg}`}>
                  {card.icon}
                </div>
              </div>

              <div className="mt-3">
                <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${card.accent}`}>{card.val}</h3>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1 block">{card.desc}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {/* TAB CONTENT RENDERING */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fadeIn">
          {comparisonLoading ? (
            <div className="bg-white dark:bg-[#121a2a]/45 border border-slate-200 dark:border-slate-900 rounded-3xl p-8 shadow-md text-center flex flex-col items-center justify-center space-y-4 min-h-[300px]">
              <Activity className="h-8 w-8 text-blue-500 animate-spin" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest">Loading Benchmark Performance...</p>
            </div>
          ) : comparisonError ? (
            <div className="bg-white dark:bg-[#121a2a]/45 border border-slate-200 dark:border-slate-900 rounded-3xl p-8 shadow-md text-center flex flex-col items-center justify-center space-y-4 min-h-[300px]">
              <AlertCircle className="h-8 w-8 text-rose-500" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest">Unable to load benchmark.</p>
              <button
                onClick={() => fetchBenchmarkComparison()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-slate-900 dark:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Block */}
                <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] p-4 sm:p-5 shadow-xl backdrop-blur-xl">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/10 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 dark:border-cyan-400/20">
                        <LineChartIcon size={16} />
                      </div>
                      <span className="text-xs font-black tracking-wider uppercase text-slate-900 dark:text-white">
                        Cumulative Return Comparison
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {comparisonData?.stats && (
                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                            comparisonData.stats.portfolioReturn >= comparisonData.stats.benchmarkReturn
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {comparisonData.stats.portfolioReturn >= comparisonData.stats.benchmarkReturn ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5" />
                          )}
                          {comparisonData.stats.portfolioReturn >= comparisonData.stats.benchmarkReturn
                            ? `Outperformed by +${(comparisonData.stats.portfolioReturn - comparisonData.stats.benchmarkReturn).toFixed(2)}%`
                            : `Underperformed by ${Math.abs(comparisonData.stats.portfolioReturn - comparisonData.stats.benchmarkReturn).toFixed(2)}%`
                          }
                        </div>
                      )}

                      <div className="relative inline-flex items-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400 dark:text-slate-500 mr-1.5 uppercase text-[9px] font-bold">Benchmark:</span>
                        <select
                          value={benchmarkTicker}
                          onChange={(e) => setBenchmarkTicker(e.target.value)}
                          className="appearance-none bg-transparent pr-5 text-[10px] font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                        >
                          {BENCHMARK_OPTIONS.map((bench) => (
                            <option key={bench.symbol} value={bench.symbol} className="bg-white dark:bg-[#0c1222] text-slate-900 dark:text-white">
                              {bench.name}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-2.5 text-[9px] text-slate-400">▼</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full pt-4">
                    {(!comparisonData || processedSeries.length === 0) ? (
                      <div className="h-[300px] flex items-center justify-center text-slate-500 text-xs font-extrabold uppercase tracking-widest bg-slate-50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-2xl">
                        Not enough historical data available.
                      </div>
                    ) : (
                      <CumulativeReturnChart
                        data={processedSeries}
                        benchmarkName={activeBenchmarkName}
                        height={450}
                      />
                    )}
                  </div>
                </div>

                {/* Statistics Panel */}
                <div className="glass-panel rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] p-4 sm:p-5 shadow-xl backdrop-blur-xl flex flex-col justify-between">
                  <div>
                    <div className="mb-4 flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Benchmark Comparison Stats</span>
                      <div className="rounded-lg border border-slate-200/60 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Active: <span className="text-blue-600 dark:text-cyan-400 font-black">{BENCHMARK_OPTIONS.find(b => b.symbol === benchmarkTicker)?.name}</span>
                      </div>
                    </div>

                    {comparisonData?.stats && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3">
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Portfolio Return</span>
                            <span className={`mt-1 block font-mono text-base font-black ${comparisonData.stats.portfolioReturn >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                              {comparisonData.stats.portfolioReturn >= 0 ? "+" : ""}{comparisonData.stats.portfolioReturn}%
                            </span>
                          </div>
                          <div className="rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3">
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Benchmark Return</span>
                            <span className={`mt-1 block font-mono text-base font-black ${comparisonData.stats.benchmarkReturn >= 0 ? "text-slate-900 dark:text-white" : "text-rose-500"}`}>
                              {comparisonData.stats.benchmarkReturn >= 0 ? "+" : ""}{comparisonData.stats.benchmarkReturn}%
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1 border-t border-slate-200/60 dark:border-white/10 pt-3">
                          {[
                            { label: "Alpha (Jensen's Alpha)", value: `${comparisonData.stats.alpha >= 0 ? "+" : ""}${comparisonData.stats.alpha.toFixed(2)}` },
                            { label: "Beta (Systematic Risk)", value: comparisonData.stats.beta.toFixed(2) },
                            { label: "Correlation", value: comparisonData.stats.correlation.toFixed(2) },
                            { label: "Sharpe Ratio", value: comparisonData.stats.sharpeRatio.toFixed(2) },
                            { label: "Information Ratio", value: comparisonData.stats.informationRatio.toFixed(2) },
                            { label: "Tracking Error", value: `${comparisonData.stats.trackingError.toFixed(2)}%` },
                            { label: "Max Drawdown", value: `${comparisonData.stats.maxDrawdown.toFixed(2)}%` },
                            { label: "Portfolio Volatility", value: `${comparisonData.stats.volatility.toFixed(2)}%` }
                          ].map((stat, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 py-2 text-xs">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">{stat.label}</span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">{stat.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {comparisonData?.stats && (
                    <div className="mt-4 rounded-xl border border-blue-500/20 dark:border-cyan-400/20 bg-blue-500/5 dark:bg-cyan-500/5 p-3">
                      <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                        <Activity className="h-3.5 w-3.5" />
                        AI Performance Insights
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                        {comparisonData.stats.portfolioReturn >= comparisonData.stats.benchmarkReturn ? (
                          `Your portfolio has outperformed ${BENCHMARK_OPTIONS.find(b => b.symbol === benchmarkTicker)?.name || 'index'} by ${(comparisonData.stats.portfolioReturn - comparisonData.stats.benchmarkReturn).toFixed(2)}%. Active alpha remains positive with disciplined risk-adjusted returns.`
                        ) : (
                          `Portfolio trailing ${BENCHMARK_OPTIONS.find(b => b.symbol === benchmarkTicker)?.name || 'index'} by ${Math.abs(comparisonData.stats.portfolioReturn - comparisonData.stats.benchmarkReturn).toFixed(2)}%. Risk-adjusted efficiency and drawdown profile warrant closer monitoring.`
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Alpha & Beta Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-lg backdrop-blur-xl">
                  <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-white/10 pb-3 mb-4">
                    <TrendingUp size={16} className="text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Top Alpha Contributors</span>
                  </div>

                  <div className="space-y-2.5">
                    {contributors.length === 0 ? (
                      <div className="text-slate-400 text-xs py-4 font-bold text-center">No profitable assets currently.</div>
                    ) : (
                      contributors.map((c, i) => {
                        const displayVal = normalizeHoldingValueForDisplay(c.profit, c.marketId);
                        return (
                          <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-xl hover:border-emerald-500/30 transition-all">
                            <div>
                              <span className="text-xs font-black text-slate-900 dark:text-white">{c.symbol}</span>
                              <span className="text-[10px] text-slate-400 block font-medium">{c.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-emerald-500 font-mono">{c.return}</span>
                              <span className="text-[10px] text-slate-400 block font-mono font-medium">+{cSymbol}{displayVal.toFixed(2)} Profit</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="glass-panel bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-lg backdrop-blur-xl">
                  <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-white/10 pb-3 mb-4">
                    <TrendingDown size={16} className="text-rose-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Biggest Beta Underperformers</span>
                  </div>

                  <div className="space-y-2.5">
                    {losses.length === 0 ? (
                      <div className="text-slate-400 text-xs py-4 font-bold text-center">No negative assets currently.</div>
                    ) : (
                      losses.map((l, i) => {
                        const displayVal = normalizeHoldingValueForDisplay(Math.abs(l.loss), l.marketId);
                        return (
                          <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 rounded-xl hover:border-rose-500/30 transition-all">
                            <div>
                              <span className="text-xs font-black text-slate-900 dark:text-white">{l.symbol}</span>
                              <span className="text-[10px] text-slate-400 block font-medium">{l.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-rose-500 font-mono">{l.return}</span>
                              <span className="text-[10px] text-slate-400 block font-mono font-medium">-{cSymbol}{displayVal.toFixed(2)} Loss</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      {activeTab === "metrics" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Card 1: Benchmark Radar */}
          <div className="glass-panel bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2.5 border-b border-slate-200/60 dark:border-white/10 pb-3 mb-4">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Layers className="h-5 w-5 shrink-0" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Portfolio Allocation Benchmark Radar</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Visual comparison of sector distributions and risks against selected benchmarks.</p>
              </div>
            </div>
            <BenchmarkRadarSection />
          </div>

          {/* Card 2: Rolling CAGR */}
          <div className="glass-panel bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2.5 border-b border-slate-200/60 dark:border-white/10 pb-3 mb-4">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <TrendingUp className="h-5 w-5 shrink-0" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Rolling CAGR Charts</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Compounded Annual Growth Rates measured over dynamic holding timeframes.</p>
              </div>
            </div>
            <RollingCagrSection />
          </div>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="space-y-6 animate-fadeIn">
          {/* AI Portfolio Advisor */}
          {advisorLoading ? (
            <div className="glass-panel p-8 flex flex-col items-center justify-center min-h-[200px] border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] rounded-2xl">
              <Activity className="w-8 h-8 animate-spin text-blue-600 dark:text-cyan-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-mono font-medium">Synchronizing advisor insights...</p>
            </div>
          ) : advisorData ? (
            <AIPortfolioAdvisorSection advisor={advisorData} />
          ) : (
            <div className="glass-panel p-8 text-center text-slate-400 bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest">
              AI Advisor Coach has no insights for the current holdings.
            </div>
          )}
        </div>
      )}

      {/* COMMON COMPLIANCE & GLOSSARY FOOTER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200/60 dark:border-white/5 mt-8">
        {/* Metric Glossary */}
        <div className="glass-panel bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 space-y-4 relative overflow-hidden backdrop-blur-xl before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-500">
          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pl-2">
            <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Performance Metrics Glossary
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] pl-2">
            <div className="space-y-1">
              <span className="font-extrabold text-blue-600 dark:text-blue-400 block">Alpha (Jensen's Alpha)</span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">Measures the portfolio's active return against a benchmark. A positive alpha indicates outperforming the index.</p>
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-blue-600 dark:text-blue-400 block">Beta (Systematic Risk)</span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">Indicates sensitivity to market movements. A Beta of 1.0 matches the benchmark; &gt;1.0 implies higher sensitivity and market-relative volatility.</p>
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-blue-600 dark:text-blue-400 block">Sharpe Ratio</span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">Quantifies risk-adjusted return. Higher values (&gt;1.5) indicate efficient returns per unit of volatility risk.</p>
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-blue-600 dark:text-blue-400 block">Max Drawdown</span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">Represents the maximum observed peak-to-trough drop in value, signaling worst-case historical risk exposure.</p>
            </div>
          </div>
        </div>

        {/* Compliance Card */}
        <div className="glass-panel bg-white/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 space-y-4 flex flex-col justify-between relative overflow-hidden backdrop-blur-xl before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-amber-500">
          <div className="space-y-2 pl-2">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Regulatory Compliance & Disclosures
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              All performance metrics, mock calculations, and simulated returns generated on this analytics dashboard are purely illustrative. FinPulse AI does not act as a SEBI or SEC registered investment advisor. Backtested results do not guarantee future asset performance.
            </p>
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider pt-3 border-t border-slate-200/60 dark:border-white/5 pl-2 mt-4">
            <span>Version 1.0.0 (Beta)</span>
          </div>
        </div>
      </div>
    </div>
  );
}