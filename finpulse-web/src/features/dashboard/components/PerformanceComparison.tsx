import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldAlert,
  PieChart as PieIcon,
  Download,
  Compass,
  Coins,
  Award,
  Target,
  Info,
  Layers
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer
} from "recharts";
import PerformanceHeatmap from "./performance/PerformanceHeatmap";
import RollingCagrSection from "./performance/RollingCagrSection";
import AiPerformanceCoachSection from "./performance/AiPerformanceCoachSection";
import BenchmarkRadarSection from "./performance/BenchmarkRadarSection";

export default function PerformanceComparison() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [cagrData, setCagrData] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<"1D" | "5D" | "1M" | "3M" | "6M" | "1Y" | "MAX">("1M");
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>("S&P 500");

  const BENCHMARK_YIELDS: Record<string, number> = {
    "NIFTY 50": 14.20,
    "SENSEX": 13.80,
    "NASDAQ": 22.40,
    "S&P 500": 11.50,
    "Gold": 8.60,
    "Bitcoin": 45.10
  };

  const activeBenchmarkYield = BENCHMARK_YIELDS[selectedBenchmark] || 12.50;
  const benchmarksList = ["NIFTY 50", "SENSEX", "NASDAQ", "S&P 500", "Gold", "Bitcoin"];

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
      const userId = storedUser.id;
      const token = localStorage.getItem('finpulse_token') || localStorage.getItem('finpulse-token');
      const headers: any = {};
      if (userId) headers['X-User-Id'] = userId;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [holdingsRes, cagrRes] = await Promise.all([
        fetch('http://localhost:3000/api/portfolio/holdings', { headers }),
        fetch('http://localhost:3000/api/portfolio/rolling-cagr', { headers })
      ]);

      if (holdingsRes.ok) {
        const data = await holdingsRes.json();
        const allHoldings = (data.sections || []).flatMap((s: any) => s.holdings || []);
        setHoldings(allHoldings);
      }
      if (cagrRes.ok) {
        const data = await cagrRes.json();
        setCagrData(data);
      }
    } catch (err) {
      console.error("Failed to load performance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const handleRefresh = () => {
    loadPerformanceData();
  };

  // Dynamic calculations based on real portfolio holdings
  const portfolioStats = useMemo(() => {
    let totalValuation = 0;
    let totalCost = 0;
    let totalGain = 0;

    holdings.forEach(h => {
      const value = h.marketValue || (h.shares * h.currentPrice) || 0;
      const cost = h.shares * h.avgCost;
      totalValuation += value;
      totalCost += cost;
      totalGain += (h.totalGain || (value - cost));
    });

    const yieldReturn = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    return {
      totalValuation,
      totalCost,
      totalGain,
      yieldReturn
    };
  }, [holdings]);

  // Sector allocation contribution margins calculated dynamically
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

  // Build timeline data using the actual CAGR / portfolio values history
  const growthTimelineData = useMemo(() => {
    if (!cagrData || !cagrData.portfolioValues || cagrData.portfolioValues.length === 0) {
      return [];
    }
    return cagrData.portfolioValues.map((pv: any, index: number) => {
      const parts = pv.month.split('-');
      const monthIndex = parseInt(parts[1] || '1') - 1;
      const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthIndex];
      const year = parts[0]?.slice(2) || '';
      
      // Calculate a simple simulated benchmark path starting at the same initial portfolio value
      const initialVal = cagrData.portfolioValues[0]?.value || 1000;
      const daysElapsed = index + 1;
      const annualRate = (BENCHMARK_YIELDS[selectedBenchmark] || 12.50) / 100;
      const simulatedBenchmark = initialVal * Math.pow(1 + annualRate / 12, daysElapsed);

      return {
        name: `${monthName} '${year}`,
        Portfolio: parseFloat(pv.value.toFixed(2)),
        Benchmark: parseFloat(simulatedBenchmark.toFixed(2))
      };
    });
  }, [cagrData]);

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <LineChartIcon size={16} className="text-blue-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Yield Comparison Timeline</span>
            </div>

            <div className="flex bg-[#050711] p-1 rounded-xl border border-slate-900">
              {["1M", "3M", "6M", "1Y", "MAX"].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf as any)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    timeframe === tf
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full mt-2">
            {growthTimelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-bold">
                Not enough history. Keep holdings active to build historical charts.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthTimelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPort" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F9DFF" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4F9DFF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBench" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e42" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f59e42" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#050711" />
                  <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} />
                  <YAxis stroke="#555" fontSize={10} tickLine={false} domain={["auto", "auto"]} />
                  <ChartTooltip contentStyle={{ backgroundColor: "#121a2a", borderColor: "#050711", borderRadius: "10px", fontSize: "11px", color: "#fff" }} />
                  <Area type="monotone" dataKey="Portfolio" stroke="#4F9DFF" strokeWidth={3} fillOpacity={1} fill="url(#colorPort)" />
                  <Area type="monotone" dataKey="Benchmark" stroke="#f59e42" strokeWidth={2} fillOpacity={1} fill="url(#colorBench)" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Benchmark Index Target</span>
              <div className="flex items-center gap-1 bg-[#050711] px-2.5 py-1 rounded-xl border border-slate-900 text-xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Active:</span>
                <span className="text-white font-extrabold">{selectedBenchmark}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-6">
              {benchmarksList.map((bench) => (
                <button
                  key={bench}
                  onClick={() => setSelectedBenchmark(bench)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                    selectedBenchmark === bench
                      ? "bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-inner"
                      : "bg-[#050711]/40 text-slate-400 border-slate-900/60 hover:text-white"
                  }`}
                >
                  {bench}
                </button>
              ))}
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center py-2.5 border-b border-slate-900/60">
                <span className="text-xs text-slate-400 font-medium">Your Portfolio Return</span>
                <span className="text-sm font-black text-emerald-400 font-mono">{portfolioStats.yieldReturn >= 0 ? "+" : ""}{portfolioStats.yieldReturn.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-900/60">
                <span className="text-xs text-slate-400 font-medium">{selectedBenchmark} Target Yield</span>
                <span className="text-sm font-black text-slate-200 font-mono">+{activeBenchmarkYield.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-900/60">
                <span className="text-xs text-slate-400 font-medium">Yield Margin Difference</span>
                <span className="text-sm font-black text-blue-400 font-mono">
                  {(portfolioStats.yieldReturn - activeBenchmarkYield) >= 0 ? "+" : ""}{(portfolioStats.yieldReturn - activeBenchmarkYield).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 mt-6 text-center">
            <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest">Outperformance Target</span>
            <p className="text-sm font-black text-white mt-1">
              {portfolioStats.yieldReturn >= activeBenchmarkYield 
                ? `Portfolio beats ${selectedBenchmark} index by +${(portfolioStats.yieldReturn - activeBenchmarkYield).toFixed(2)}%`
                : `Portfolio trails ${selectedBenchmark} index by ${(activeBenchmarkYield - portfolioStats.yieldReturn).toFixed(2)}%`}
            </p>
          </div>
        </div>
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

      {/* ==================== 4. SECTOR ALLOCATION CONTRIBUTION ==================== */}
      <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md">
        <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
          <PieIcon size={15} className="text-cyan-400" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">Sector Allocation Contribution Margin</span>
        </div>

        <div className="space-y-4">
          {sectorAllocations.length === 0 ? (
            <div className="text-slate-500 text-xs py-4 font-bold text-center">No sector allocation data available.</div>
          ) : (
            sectorAllocations.map((sector, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-extrabold">{sector.name}</span>
                  <span className="font-mono text-slate-200 font-bold">{sector.val}% (${sector.count.toLocaleString()})</span>
                </div>
                <div className="w-full h-1.5 bg-[#050711] rounded-full overflow-hidden border border-slate-900/40">
                  <div className="h-full rounded-full" style={{ width: `${sector.val}%`, backgroundColor: sector.color }}></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ==================== 5. SUBSECTIONS ==================== */}
      <AiPerformanceCoachSection />
      <BenchmarkRadarSection />
      <PerformanceHeatmap />
      <RollingCagrSection />
    </div>
  );
}