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
      {/* HEADER SECTION WITH REFRESH TRIGGER */}
      <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 flex-nowrap">
              <h1 className="text-xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap">
                Performance Analytics
              </h1>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:bg-cyan-500/15 dark:text-cyan-300 border border-blue-500/20 dark:border-cyan-400/30">
                Benchmark Radar
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-200 mt-1">
              Institutional-grade return analytics, risk attribution & alpha benchmarking.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
            {/* Currency Pill Selector (matching portfolio layout) */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scrollbar-none">
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
                  className={`currency-selector ${portfolioCurrency === cur.code ? 'currency-selector-active' : ''} px-2.5 py-1 rounded-md text-[9px] font-bold border transition-all whitespace-nowrap min-h-[30px] flex items-center justify-center ${portfolioCurrency === cur.code
                    ? 'bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 border-transparent font-black shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5'
                    }`}
                >
                  {cur.code} ({cur.symbol})
                </button>
              ))}
            </div>

            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 shadow-sm transition-all min-h-[30px] active:scale-95 cursor-pointer"
            >
              <Activity className="h-3 w-3 text-blue-600 dark:text-cyan-400" />
              <span>Recalculate</span>
            </button>
          </div>
        </div>

        {/* TABS CONTROLLER */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 px-1 -mx-1">
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
                className={`performance-analytics-tab flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap min-h-[36px] cursor-pointer shrink-0 border ${
                  isActive
                    ? "performance-tab-active bg-blue-600 text-white border-blue-600 shadow-sm dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40 dark:shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                    : "performance-tab-inactive bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200/90 shadow-2xs dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-neutral-300 dark:hover:text-white dark:border-[#242424]"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${
                  isActive
                    ? "text-white dark:text-cyan-300"
                    : "text-slate-500 dark:text-neutral-400"
                }`} />
                <span className="tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* HERO PERFORMANCE SUMMARY - Harmonized with Portfolio KPI Cards */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4">
          {[
            {
              label: "Portfolio Yield Return",
              val: `${portfolioStats.yieldReturn >= 0 ? "+" : ""}${portfolioStats.yieldReturn.toFixed(2)}%`,
              desc: "Total Return",
              shortDesc: "Return",
              isPositive: portfolioStats.yieldReturn >= 0,
              icon: TrendingUp,
              iconKey: "yield",
              accentClass: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20"
            },
            {
              label: "Total Profit / Loss",
              val: formatSignedCurrency(displayGain),
              desc: "Unrealized P&L",
              shortDesc: "P&L",
              isPositive: displayGain >= 0,
              icon: Activity,
              iconKey: "pnl",
              accentClass: displayGain >= 0
                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
                : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20"
            },
            {
              label: "Capital Valuation Ledger",
              val: formatCurrency(displayValuation),
              desc: "Portfolio Value",
              shortDesc: "Value",
              isPositive: true,
              icon: Layers,
              iconKey: "valuation",
              accentClass: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20"
            },
            {
              label: "Assets Tracked",
              val: `${holdings.length} Positions`,
              desc: "Active Holdings",
              shortDesc: "Holdings",
              isPositive: true,
              icon: PieIcon,
              iconKey: "assets",
              accentClass: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20"
            }
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/5 bg-white dark:bg-white/[0.025] backdrop-blur-sm p-3 sm:p-4 md:p-5 shadow-xs dark:shadow-[0_10px_30px_-22px_rgba(15,23,42,0.65)] transition-all duration-300 hover:border-blue-500/30 dark:hover:border-cyan-500/20 hover:shadow-md dark:hover:shadow-[0_18px_48px_-28px_rgba(6,182,212,0.45)]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] to-cyan-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="relative flex items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-3">
                  <div className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border shadow-xs shrink-0 ${card.accentClass}`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                    card.isPositive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                      : "bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                  }`}>
                    {card.isPositive ? "+" : "-"}
                    <span className="hidden sm:inline">{card.desc}</span>
                    <span className="inline sm:hidden">{card.shortDesc}</span>
                  </span>
                </div>

                <div className="relative space-y-1">
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-slate-500 dark:text-slate-400 truncate">
                    {card.label}
                  </p>
                  <h3 className={`text-sm sm:text-xl md:text-2xl font-black tracking-tight truncate ${
                    card.iconKey === "yield"
                      ? (card.isPositive ? "text-cyan-700 dark:text-cyan-400" : "text-rose-600 dark:text-rose-400")
                      : card.iconKey === "pnl"
                        ? (card.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")
                        : "text-slate-900 dark:text-white"
                  }`}>
                    {card.val}
                  </h3>
                  <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 dark:text-slate-500 block truncate pt-0.5">
                    {card.iconKey === "yield" ? "Return relative to cost" : card.iconKey === "pnl" ? "Mark to market overall return" : card.iconKey === "valuation" ? "Live aggregate portfolio worth" : "Live categorized allocation"}
                  </span>
                </div>
              </motion.article>
            );
          })}
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
                <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4 sm:p-5 shadow-xs dark:shadow-xl backdrop-blur-xl">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-cyan-400/20 shadow-xs">
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
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400"
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

                      <div className="relative inline-flex items-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 shadow-xs">
                        <span className="text-slate-500 dark:text-slate-400 mr-1.5 uppercase text-[9px] font-bold">Benchmark:</span>
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
                <div className="glass-panel rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.02] p-3 sm:p-4 shadow-xs dark:shadow-xl backdrop-blur-xl flex flex-col justify-between">
                  <div>
                    <div className="mb-2.5 flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">Benchmark Comparison Stats</span>
                      <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-2 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Active: <span className="text-blue-600 dark:text-cyan-400 font-black">{BENCHMARK_OPTIONS.find(b => b.symbol === benchmarkTicker)?.name}</span>
                      </div>
                    </div>

                    {comparisonData?.stats && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg border border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-2 sm:p-2.5 shadow-xs">
                            <span className="block text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Portfolio Return</span>
                            <span className={`mt-0.5 block font-mono text-sm sm:text-base font-black ${comparisonData.stats.portfolioReturn >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                              {comparisonData.stats.portfolioReturn >= 0 ? "+" : ""}{comparisonData.stats.portfolioReturn}%
                            </span>
                          </div>
                          <div className="rounded-lg border border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-2 sm:p-2.5 shadow-xs">
                            <span className="block text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Benchmark Return</span>
                            <span className={`mt-0.5 block font-mono text-sm sm:text-base font-black ${comparisonData.stats.benchmarkReturn >= 0 ? "text-slate-900 dark:text-white" : "text-rose-600 dark:text-rose-400"}`}>
                              {comparisonData.stats.benchmarkReturn >= 0 ? "+" : ""}{comparisonData.stats.benchmarkReturn}%
                            </span>
                          </div>
                        </div>

                        <div className="space-y-0.5 border-t border-slate-100 dark:border-white/10 pt-1.5">
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
                            <div key={idx} className="flex items-center justify-between gap-2 border-b border-slate-100/80 dark:border-white/5 py-1 text-[11px] sm:text-xs">
                              <span className="text-slate-600 dark:text-slate-400 font-medium">{stat.label}</span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">{stat.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {comparisonData?.stats && (
                    <div className="mt-2.5 rounded-lg border border-blue-200 dark:border-cyan-400/20 bg-blue-50/70 dark:bg-cyan-500/5 p-2 sm:p-2.5">
                      <div className="mb-1 flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-blue-700 dark:text-cyan-400">
                        <Activity className="h-3 w-3" />
                        AI Performance Insights
                      </div>
                      <p className="text-[10px] leading-snug text-slate-700 dark:text-slate-300 font-medium">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="glass-panel bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-xs dark:shadow-lg backdrop-blur-xl">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/10 pb-2.5 mb-3">
                    <TrendingUp size={15} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Top Alpha Contributors</span>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    {contributors.length === 0 ? (
                      <div className="text-slate-400 text-xs py-4 font-bold text-center">No profitable assets currently.</div>
                    ) : (
                      contributors.map((c, i) => {
                        const displayVal = normalizeHoldingValueForDisplay(c.profit, c.marketId);
                        return (
                          <div key={i} className="flex justify-between items-center px-2.5 py-1.5 sm:px-3 sm:py-2 bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 rounded-lg sm:rounded-xl hover:border-emerald-500/40 hover:bg-emerald-50/20 transition-all">
                            <div className="min-w-0 pr-2">
                              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white block truncate">{c.symbol}</span>
                              <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 block font-medium truncate">{c.name}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[11px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono block">{c.return}</span>
                              <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 block font-mono font-medium">+{cSymbol}{displayVal.toFixed(2)} Profit</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="glass-panel bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-xs dark:shadow-lg backdrop-blur-xl">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/10 pb-2.5 mb-3">
                    <TrendingDown size={15} className="text-rose-600 dark:text-rose-400" />
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Biggest Beta Underperformers</span>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    {losses.length === 0 ? (
                      <div className="text-slate-400 text-xs py-4 font-bold text-center">No negative assets currently.</div>
                    ) : (
                      losses.map((l, i) => {
                        const displayVal = normalizeHoldingValueForDisplay(Math.abs(l.loss), l.marketId);
                        return (
                          <div key={i} className="flex justify-between items-center px-2.5 py-1.5 sm:px-3 sm:py-2 bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 rounded-lg sm:rounded-xl hover:border-rose-500/40 hover:bg-rose-50/20 transition-all">
                            <div className="min-w-0 pr-2">
                              <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white block truncate">{l.symbol}</span>
                              <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 block font-medium truncate">{l.name}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[11px] sm:text-xs font-black text-rose-600 dark:text-rose-400 font-mono block">{l.return}</span>
                              <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 block font-mono font-medium">-{cSymbol}{displayVal.toFixed(2)} Loss</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200/70 dark:border-white/5 mt-6">
        {/* Metric Glossary */}
        <div className="glass-panel bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-xl p-3.5 sm:p-4 space-y-2.5 relative overflow-hidden backdrop-blur-xl shadow-xs dark:shadow-none before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-blue-600">
          <h4 className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 pl-1.5">
            <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            Performance Metrics Glossary
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[10px] pl-1.5">
            <div className="space-y-0.5">
              <span className="font-extrabold text-blue-600 dark:text-blue-400 block">Alpha (Jensen's Alpha)</span>
              <p className="text-slate-600 dark:text-slate-400 leading-snug font-medium">Measures active return against benchmark. Positive alpha indicates outperforming the index.</p>
            </div>
            <div className="space-y-0.5">
              <span className="font-extrabold text-blue-600 dark:text-blue-400 block">Beta (Systematic Risk)</span>
              <p className="text-slate-600 dark:text-slate-400 leading-snug font-medium">Sensitivity to market. Beta 1.0 matches benchmark; &gt;1.0 implies higher sensitivity.</p>
            </div>
            <div className="space-y-0.5">
              <span className="font-extrabold text-blue-600 dark:text-blue-400 block">Sharpe Ratio</span>
              <p className="text-slate-600 dark:text-slate-400 leading-snug font-medium">Risk-adjusted return. Values &gt;1.5 indicate efficient returns per unit of volatility.</p>
            </div>
            <div className="space-y-0.5">
              <span className="font-extrabold text-blue-600 dark:text-blue-400 block">Max Drawdown</span>
              <p className="text-slate-600 dark:text-slate-400 leading-snug font-medium">Maximum peak-to-trough drop, signaling worst-case historical risk exposure.</p>
            </div>
          </div>
        </div>

        {/* Compliance Card */}
        <div className="glass-panel bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-xl p-3.5 sm:p-4 space-y-2.5 flex flex-col justify-between relative overflow-hidden backdrop-blur-xl shadow-xs dark:shadow-none before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-amber-500">
          <div className="space-y-1.5 pl-1.5">
            <h4 className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              Regulatory Compliance & Disclosures
            </h4>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-snug font-medium">
              All performance metrics, mock calculations, and simulated returns generated on this analytics dashboard are purely illustrative. FinPulse AI does not act as a SEBI or SEC registered investment advisor. Backtested results do not guarantee future asset performance.
            </p>
          </div>
          <div className="flex items-center justify-between text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider pt-2 border-t border-slate-100 dark:border-white/5 pl-1.5 mt-2">
            <span>Version 1.0.0 (Beta)</span>
          </div>
        </div>
      </div>
    </div>
  );
}