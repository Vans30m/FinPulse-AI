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
    <div className="space-y-6 text-white font-sans selection:bg-blue-500/25 selection:text-white bg-[#141414]">
      {/* HEADER SECTION WITH REFRESH TRIGGER */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#2a2a2a] bg-[#171717] px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold uppercase tracking-[0.14em] text-white md:text-xl">Performance Analytics Center</h2>
          <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#8d8d8d]">Portfolio return analytics, risk attribution, and benchmark tracking.</p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <div className="flex items-center gap-1 rounded-xl border border-[#2a2a2a] bg-[#1d1d1d] p-1">
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
                className={`min-w-[52px] rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500/60 ${portfolioCurrency === cur.code
                  ? 'bg-[#2b3d54] text-white'
                  : 'text-[#b2b2b2] hover:bg-[#222222] hover:text-white'
                  }`}
              >
                {cur.code} ({cur.symbol})
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-[#2a5fa8] bg-[#1f3b60] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#274d7e] focus:outline-none focus:ring-1 focus:ring-blue-500/60"
          >
            <Activity className="h-3.5 w-3.5" />
            Recalculate Metrics
          </button>
        </div>
      </div>

      {/* TABS CONTROLLER */}
      <div className="flex flex-wrap gap-2 border-b border-[#2a2a2a] pb-2">
        {[
          { id: "overview", label: "Overview & Returns" },
          { id: "metrics", label: "Advanced Metrics" },
          { id: "ai", label: "AI Advisor Coach" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`rounded-t-xl border-b-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500/60 ${activeTab === tab.id
                ? "border-blue-500 bg-[#1d2430] text-white"
                : "border-transparent text-[#8d8d8d] hover:border-[#3a3a3a] hover:text-white"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* HERO PERFORMANCE SUMMARY */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: "Portfolio Yield Return", val: `${portfolioStats.yieldReturn >= 0 ? "+" : ""}${portfolioStats.yieldReturn.toFixed(2)}%`, desc: "Total Return", accent: "text-[#5bb7ff]", icon: <TrendingUp className="h-4 w-4" />, gradient: "from-blue-500/20 to-cyan-500/10", borderColor: "border-blue-500/30", glowColor: "shadow-[0_0_20px_rgba(91,183,255,0.15)]" },
            { label: "Total Profit / Loss", val: formatSignedCurrency(displayGain), desc: "Unrealized P&L", accent: "text-[#6ad7a8]", icon: <Activity className="h-4 w-4" />, gradient: "from-emerald-500/20 to-teal-500/10", borderColor: "border-emerald-500/30", glowColor: "shadow-[0_0_20px_rgba(106,215,168,0.15)]" },
            { label: "Capital Valuation Ledger", val: formatCurrency(displayValuation), desc: "Total Value", accent: "text-[#7da7ff]", icon: <Layers className="h-4 w-4" />, gradient: "from-indigo-500/20 to-blue-500/10", borderColor: "border-indigo-500/30", glowColor: "shadow-[0_0_20px_rgba(125,167,255,0.15)]" },
            { label: "Assets Tracked", val: `${holdings.length} Positions`, desc: "Open Positions", accent: "text-[#d4b7ff]", icon: <Layers className="h-4 w-4" />, gradient: "from-purple-500/20 to-pink-500/10", borderColor: "border-purple-500/30", glowColor: "shadow-[0_0_20px_rgba(212,183,255,0.15)]" }
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative flex min-h-[140px] flex-col justify-between rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1"
              style={{
                background: `linear-gradient(135deg, ${card.gradient.split(' ')[1]}, ${card.gradient.split(' ')[3]})`,
                boxShadow: card.glowColor.replace('shadow-', '')
              }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent" />
              <div className="absolute inset-0 rounded-2xl border opacity-50" style={{ borderColor: card.borderColor.replace('border-', '') }} />
              <div className="relative flex items-start justify-between gap-2">
                <span className="max-w-[70%] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8d8d8d]">{card.label}</span>
                <div className="relative rounded-lg border border-[#2a2a2a] bg-[#1d1d1d]/80 p-1.5 backdrop-blur-sm">
                  <span className="block" style={{ color: card.accent.replace('text-', '') }}>{card.icon}</span>
                </div>
              </div>

              <div className="relative">
                <h3 className={`mt-4 text-2xl sm:text-3xl font-semibold tracking-tight ${card.accent}`}>{card.val}</h3>
                <span className="mt-2 block text-[10px] uppercase tracking-[0.1em] text-[#7e7e7e]">{card.desc}</span>
              </div>
              
              <div className="absolute bottom-4 right-4 opacity-20">
                <div className="w-16 h-16 rounded-full" style={{ background: `radial-gradient(circle, ${card.accent.replace('text-', '')} 0%, transparent 70%)` }} />
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
                <div className="lg:col-span-2 rounded-2xl border border-[#2a2a2a] bg-[#171717] p-3 sm:p-4 lg:p-5">
                  <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#2a2a2a] pb-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <LineChartIcon size={15} className="text-[#9ec9ff]" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#cfcfcf]">Cumulative Return Comparison</span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {comparisonData?.stats && (
                        <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${comparisonData.stats.portfolioReturn >= comparisonData.stats.benchmarkReturn
                            ? "border-[#2a5b3d] bg-[#1d2b23] text-[#82dca6]"
                            : "border-[#5a2a2a] bg-[#2a1c1c] text-[#f08d8d]"
                          }`}>
                          {comparisonData.stats.portfolioReturn >= comparisonData.stats.benchmarkReturn ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {comparisonData.stats.portfolioReturn >= comparisonData.stats.benchmarkReturn
                            ? `Outperformed ${BENCHMARK_OPTIONS.find(b => b.symbol === benchmarkTicker)?.name} by +${(comparisonData.stats.portfolioReturn - comparisonData.stats.benchmarkReturn).toFixed(2)}%`
                            : `Underperformed ${BENCHMARK_OPTIONS.find(b => b.symbol === benchmarkTicker)?.name} by ${Math.abs(comparisonData.stats.portfolioReturn - comparisonData.stats.benchmarkReturn).toFixed(2)}%`
                          }
                        </div>
                      )}

                      <label className="relative inline-flex items-center gap-1.5 rounded-lg border border-[#2a2a2a] bg-[#1d1d1d] px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#d7d7d7]">
                        <span>Benchmark</span>
                        <select
                          value={benchmarkTicker}
                          onChange={(e) => setBenchmarkTicker(e.target.value)}
                          className="appearance-none bg-transparent pr-4 text-[9px] font-semibold uppercase tracking-[0.12em] text-white focus:outline-none"
                        >
                          {BENCHMARK_OPTIONS.map((bench) => (
                            <option key={bench.symbol} value={bench.symbol}>{bench.name}</option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-2 text-[8px] text-[#8d8d8d]">▼</span>
                      </label>
                    </div>
                  </div>

                  <div className="w-full pt-1 pb-5">
                    {(!comparisonData || processedSeries.length === 0) ? (
                      <div className="h-[300px] flex items-center justify-center text-slate-500 text-xs font-extrabold uppercase tracking-widest bg-slate-50/50 dark:bg-[#050711]/45 border border-slate-200 dark:border-slate-900 rounded-3xl">
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

                {/* Statistics Panel */}
                <div className="rounded-2xl border border-[#2a2a2a] bg-[#171717] p-4 sm:p-5">
                  <div>
                    <div className="mb-4 flex items-center justify-between border-b border-[#2a2a2a] pb-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8d8d8d]">Benchmark Comparison Stats</span>
                      <div className="rounded-lg border border-[#2a2a2a] bg-[#1d1d1d] px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#d7d7d7]">
                        Active: <span className="text-white">{BENCHMARK_OPTIONS.find(b => b.symbol === benchmarkTicker)?.name}</span>
                      </div>
                    </div>

                    {comparisonData?.stats && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="rounded-xl border border-[#2a2a2a] bg-[#1d1d1d] p-3">
                            <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8d8d8d]">Portfolio Return</span>
                            <span className={`mt-1 block font-mono text-base font-semibold ${comparisonData.stats.portfolioReturn >= 0 ? "text-[#70d7a2]" : "text-[#f08d8d]"}`}>
                              {comparisonData.stats.portfolioReturn >= 0 ? "+" : ""}{comparisonData.stats.portfolioReturn}%
                            </span>
                          </div>
                          <div className="rounded-xl border border-[#2a2a2a] bg-[#1d1d1d] p-3">
                            <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8d8d8d]">Benchmark Return</span>
                            <span className={`mt-1 block font-mono text-base font-semibold ${comparisonData.stats.benchmarkReturn >= 0 ? "text-[#d7d7d7]" : "text-[#f08d8d]"}`}>
                              {comparisonData.stats.benchmarkReturn >= 0 ? "+" : ""}{comparisonData.stats.benchmarkReturn}%
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1 border-t border-[#2a2a2a] pt-3">
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
                            <div key={idx} className="flex items-center justify-between gap-3 border-b border-[#2a2a2a] py-2.5 text-xs">
                              <span className="text-[#9a9a9a]">{stat.label}</span>
                              <span className="font-mono font-semibold text-white">{stat.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {comparisonData?.stats && (
                    <div className="mt-4 rounded-xl border border-[#2a2a2a] bg-[#1d1d1d] p-3">
                      <div className="mb-2 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9ec9ff]">
                        <Activity className="h-3.5 w-3.5" />
                        AI Performance Insights
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#d1d1d1]">
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
                <div className="bg-white dark:bg-[#121a2a]/45 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-md">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-900 pb-3 mb-4">
                    <TrendingUp size={15} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">Top Alpha Contributors</span>
                  </div>

                  <div className="space-y-3">
                    {contributors.length === 0 ? (
                      <div className="text-slate-500 text-xs py-4 font-bold text-center">No profitable assets currently.</div>
                    ) : (
                      contributors.map((c, i) => {
                        const displayVal = normalizeHoldingValueForDisplay(c.profit, c.marketId);
                        return (
                          <div key={i} className="flex justify-between items-center p-3 bg-slate-50/50 dark:bg-[#050711]/60 border border-slate-200 dark:border-slate-900 rounded-2xl">
                            <div>
                              <span className="text-xs font-black text-white">{c.symbol}</span>
                              <span className="text-[10px] text-slate-500 block">{c.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">{c.return}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">+{cSymbol}{displayVal.toFixed(2)} Profit</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-[#121a2a]/45 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-md">
                  <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
                    <TrendingDown size={15} className="text-rose-500 dark:text-rose-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">Biggest Beta Underperformers</span>
                  </div>

                  <div className="space-y-3">
                    {losses.length === 0 ? (
                      <div className="text-slate-500 text-xs py-4 font-bold text-center">No negative assets currently.</div>
                    ) : (
                      losses.map((l, i) => {
                        const displayVal = normalizeHoldingValueForDisplay(Math.abs(l.loss), l.marketId);
                        return (
                          <div key={i} className="flex justify-between items-center p-3 bg-slate-50/50 dark:bg-[#050711]/60 border border-slate-200 dark:border-slate-900 rounded-2xl">
                            <div>
                              <span className="text-xs font-black text-white">{l.symbol}</span>
                              <span className="text-[10px] text-slate-500 block">{l.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-rose-500 dark:text-rose-400 font-mono">{l.return}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">-{cSymbol}{displayVal.toFixed(2)} Loss</span>
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
          <div className="bg-white dark:bg-[#121a2a]/45 border border-slate-200 dark:border-slate-900 rounded-3xl p-4 sm:p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-900 pb-3 mb-4">
              <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">Portfolio Allocation Benchmark Radar</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Visual comparison of sector distributions and risks against selected benchmarks.</p>
              </div>
            </div>
            <BenchmarkRadarSection />
          </div>
 
          {/* Card 2: Performance Heatmap */}
          <div className="bg-white dark:bg-[#121a2a]/45 border border-slate-200 dark:border-slate-900 rounded-3xl p-4 sm:p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-900 pb-3 mb-4">
              <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">Performance Calendar Heatmap</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Historical ledger return heatmaps categorized by day, week, or month.</p>
              </div>
            </div>
            <PerformanceHeatmap />
          </div>
 
          {/* Card 3: Rolling CAGR */}
          <div className="bg-white dark:bg-[#121a2a]/45 border border-slate-200 dark:border-slate-900 rounded-3xl p-4 sm:p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-900 pb-3 mb-4">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">Rolling CAGR Charts</h3>
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
            <div className="glass-panel p-8 flex flex-col items-center justify-center min-h-[200px] border border-slate-900 bg-[#121a2a]/45 rounded-3xl">
              <Activity className="w-8 h-8 animate-spin text-blue-600 dark:text-cyan-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-mono">Synchronizing advisor insights...</p>
            </div>
          ) : advisorData ? (
            <AIPortfolioAdvisorSection advisor={advisorData} />
          ) : (
            <div className="p-8 text-center text-slate-400 bg-white dark:bg-[#121a2a]/45 border border-slate-200 dark:border-slate-900 rounded-3xl text-xs font-black uppercase tracking-widest">
              AI Advisor Coach has no insights for the current holdings.
            </div>
          )}
        </div>
      )}

      {/* COMMON COMPLIANCE & GLOSSARY FOOTER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5 mt-8">
        {/* Metric Glossary */}
        <div className="bg-gradient-to-br from-[#121a2a]/40 to-[#0a0f1d]/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 space-y-4 relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-500">
          <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2 pl-2">
            <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Performance Metrics Glossary
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] pl-2">
            <div className="space-y-1">
              <span className="font-extrabold text-blue-600 dark:text-blue-400 block">Alpha (Jensen's Alpha)</span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Measures the portfolio's active return against a benchmark. A positive alpha indicates outperforming the index.</p>
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-blue-600 dark:text-blue-400 block">Beta (Systematic Risk)</span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Indicates sensitivity to market movements. A Beta of 1.0 matches the benchmark; &gt;1.0 implies higher sensitivity and market-relative volatility.</p>
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-blue-600 dark:text-blue-400 block">Sharpe Ratio</span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Quantifies risk-adjusted return. Higher values (&gt;1.5) indicate efficient returns per unit of volatility risk.</p>
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-blue-600 dark:text-blue-400 block">Max Drawdown</span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Represents the maximum observed peak-to-trough drop in value, signaling worst-case historical risk exposure.</p>
            </div>
          </div>
        </div>

        {/* Compliance Card */}
        <div className="bg-gradient-to-br from-[#121a2a]/40 to-[#0a0f1d]/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 space-y-4 flex flex-col justify-between relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-amber-500">
          <div className="space-y-2 pl-2">
            <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              Regulatory Compliance & Disclosures
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              All performance metrics, mock calculations, and simulated returns generated on this analytics dashboard are purely illustrative. FinPulse AI does not act as a SEBI or SEC registered investment advisor. Backtested results do not guarantee future asset performance.
            </p>
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider pt-3 border-t border-white/5 pl-2 mt-4">
            <span>Version 1.0.0 (Beta)</span>
          </div>
        </div>
      </div>
    </div>
  );
}