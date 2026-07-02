import { useState, useMemo } from "react";
import {
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldAlert,
  PieChart as PieIcon,
  Download,
  Calendar,
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

export default function PerformanceComparison() {
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<"1D" | "5D" | "1M" | "3M" | "6M" | "1Y" | "MAX">("1M");
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>("S&P 500");

  // Benchmarks list for comparative analysis
  const benchmarksList = ["NIFTY 50", "SENSEX", "NASDAQ", "S&P 500", "Gold", "Bitcoin"];

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 900);
  };

  // 1. Unified Dataset generating realistic performance indexes based on selected timeframe
  const growthTimelineData = useMemo(() => {
    const pointsCount = timeframe === "1D" ? 24 : timeframe === "5D" ? 5 : timeframe === "1M" ? 30 : timeframe === "3M" ? 90 : 120;
    const baseVal = 10000;
    const data = [];
    
    let currentPort = baseVal;
    let currentBench = baseVal;

    for (let i = 0; i < pointsCount; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (pointsCount - i));
      const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      
      const portRand = (Math.random() - 0.47) * 2; // slight positive bias
      const benchRand = (Math.random() - 0.49) * 2; // market benchmark bias
      
      currentPort = currentPort * (1 + portRand / 100);
      currentBench = currentBench * (1 + benchRand / 100);

      data.push({
        name: dateStr,
        Portfolio: parseFloat(currentPort.toFixed(2)),
        Benchmark: parseFloat(currentBench.toFixed(2)),
        Difference: parseFloat((currentPort - currentBench).toFixed(2))
      });
    }
    return data;
  }, [timeframe]);

  // Rolling returns database
  const rollingReturns = [
    { period: "Today", val: "+0.84%", delta: 0.84, positive: true, sparkline: [10, 15, 8, 12, 19, 14, 22] },
    { period: "1 Week", val: "+2.15%", delta: 2.15, positive: true, sparkline: [5, 12, 18, 10, 15, 20, 25] },
    { period: "1 Month", val: "+8.92%", delta: 8.92, positive: true, sparkline: [20, 22, 19, 24, 28, 26, 34] },
    { period: "3 Months", val: "+14.65%", delta: 14.65, positive: true, sparkline: [30, 28, 35, 42, 38, 45, 52] },
    { period: "6 Months", val: "+22.40%", delta: 22.40, positive: true, sparkline: [40, 44, 42, 50, 48, 55, 62] },
    { period: "1 Year", val: "+28.18%", delta: 28.18, positive: true, sparkline: [50, 55, 58, 62, 60, 68, 75] },
    { period: "YTD", val: "+24.12%", delta: 24.12, positive: true, sparkline: [45, 48, 52, 58, 55, 62, 70] },
    { period: "MAX", val: "+156.40%", delta: 156.4, positive: true, sparkline: [10, 25, 45, 75, 95, 120, 156] }
  ];

  // Contributors lists
  const contributors = [
    { symbol: "AAPL", name: "Apple Inc", profit: 1450.20, return: "+12.4%", trend: [100, 105, 102, 108, 112] },
    { symbol: "NVDA", name: "NVIDIA Corp", profit: 3240.85, return: "+24.8%", trend: [200, 215, 230, 224, 248] },
    { symbol: "MSFT", name: "Microsoft Corp", profit: 1120.40, return: "+9.1%", trend: [300, 305, 302, 308, 309] }
  ];

  const losses = [
    { symbol: "TSLA", name: "Tesla Inc", loss: -840.20, return: "-6.2%", trend: [180, 175, 178, 172, 168] },
    { symbol: "NFLX", name: "Netflix Inc", loss: -320.10, return: "-2.4%", trend: [450, 445, 442, 438, 435] }
  ];

  // Sector breakdown contribution margins
  const sectorAllocations = [
    { name: "Technology", val: 42.5, count: 4250, color: "#3b82f6" },
    { name: "Finance", val: 18.2, count: 1820, color: "#10b981" },
    { name: "Healthcare", val: 12.4, count: 1240, color: "#a855f7" },
    { name: "Energy", val: 9.8, count: 980, color: "#f59e42" },
    { name: "Crypto", val: 8.5, count: 850, color: "#ec4899" },
    { name: "Cash Ledger", val: 8.6, count: 860, color: "#64748b" }
  ];

  // Generate mock heatmap days list (140 days back)
  const heatmapDays = useMemo(() => {
    const list = [];
    for (let i = 140; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const isPositive = Math.random() > 0.45;
      const profitVal = (Math.random() - 0.45) * 450;
      list.push({
        date: date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }),
        return: (isPositive ? "+" : "") + (profitVal / 1000).toFixed(2) + "%",
        profit: parseFloat(profitVal.toFixed(2)),
        isPositive
      });
    }
    return list;
  }, []);

  return (
    <div className="space-y-8 text-slate-105 font-sans selection:bg-blue-500/25 selection:text-white">
      {/* HEADER SECTION WITH REFRESH TRIGGER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Performance Analytics Center</h2>
          <p className="text-xs text-slate-400 font-medium">Deep-dive metric matrices, alpha models, and solvency indicators.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
          >
            <Activity className={`h-4.5 w-4.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Re-calculating..." : "Recalculate Solvency"}
          </button>
        </div>
      </div>

      {/* ==================== 1. HERO PERFORMANCE SUMMARY ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {[
          { label: "Portfolio Yield Return", val: "+28.61%", desc: "Lifetime aggregated alpha return", positive: true, grad: "from-cyan-600/10 to-blue-500/10" },
          { label: "Today's Profit / Loss", val: "+$145.20", desc: "+0.84% single day change", positive: true, grad: "from-emerald-600/10 to-teal-500/10" },
          { label: "Total Net Profit Margin", val: "+$8,412.90", desc: "Realized + unrealized ledger delta", positive: true, grad: "from-indigo-600/10 to-purple-500/10" },
          { label: "Capital Valuation Ledger", val: "$48,610.00", desc: "Total asset portfolio valuation", positive: true, grad: "from-blue-600/10 to-indigo-500/10" },
          { label: "AI overall Rating Score", val: "88/100", desc: "Grade A solvency alignment rating", positive: true, grad: "from-purple-600/10 to-pink-500/10" }
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
        {/* Main TV Line Chart Container */}
        <div className="lg:col-span-2 bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <LineChartIcon size={16} className="text-blue-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Yield Comparison Timeline</span>
            </div>

            {/* Timeframe selector chips */}
            <div className="flex bg-[#050711] p-1 rounded-xl border border-slate-900">
              {["1D", "5D", "1M", "3M", "6M", "1Y", "MAX"].map((tf) => (
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
                <ChartTooltip contentStyle={{ backgroundColor: "#121a2a", borderColor: "#050711", borderRadius: "10px", fontSize: "11px" }} />
                <Area type="monotone" dataKey="Portfolio" stroke="#4F9DFF" strokeWidth={3} fillOpacity={1} fill="url(#colorPort)" />
                <Area type="monotone" dataKey="Benchmark" stroke="#f59e42" strokeWidth={2} fillOpacity={1} fill="url(#colorBench)" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Benchmark Selector & Comparison Cards */}
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
                <span className="text-sm font-black text-emerald-400 font-mono">+28.61%</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-900/60">
                <span className="text-xs text-slate-400 font-medium">{selectedBenchmark} Index Yield</span>
                <span className="text-sm font-black text-slate-200 font-mono">+19.45%</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-900/60">
                <span className="text-xs text-slate-400 font-medium">Yield Margin Difference</span>
                <span className="text-sm font-black text-blue-400 font-mono">+9.16%</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 mt-6 text-center">
            <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest">Outperformance Target</span>
            <p className="text-sm font-black text-white mt-1">Portfolio beats {selectedBenchmark} index by +9.16%</p>
          </div>
        </div>
      </div>

      {/* ==================== 4. AI PERFORMANCE SUMMARY ==================== */}
      <div className="bg-[#121a2a]/45 backdrop-blur-md border border-slate-900 rounded-3xl p-6 shadow-md relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-2 border-b border-slate-900 pb-3.5 mb-5">
          <Award size={16} className="text-purple-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">AI Performance Analyst Summary Verdict</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#050711]/60 border border-slate-900 rounded-2xl p-4">
                <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider">Key Solvency Strengths</span>
                <ul className="text-xs text-slate-300 mt-2 space-y-1.5 list-disc pl-4 font-semibold">
                  <li>Strong asset allocation matching technical volatility standards.</li>
                  <li>Overperforming index benchmarks across the last 12-month sequence.</li>
                </ul>
              </div>

              <div className="bg-[#050711]/60 border border-slate-900 rounded-2xl p-4">
                <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-wider">Potential Volatility Weaknesses</span>
                <ul className="text-xs text-slate-300 mt-2 space-y-1.5 list-disc pl-4 font-semibold">
                  <li>Slight concentration in tech sector growth equity tickers.</li>
                  <li>Historical drawdowns match beta fluctuations above normal bounds.</li>
                </ul>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              **AI Analyst Summary:** The portfolio shows strong alpha generation (+28.61% lifetime return) outperforming the S&P 500 benchmark. We recommend maintaining the current asset weights while allocating subsequent cash buffers into low-beta dividend engines.
            </p>
          </div>

          <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-4 flex flex-col justify-between items-center text-center">
            <div>
              <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest">AI Consensus</span>
              <h4 className="text-xl font-black text-white mt-1.5">Grade A (HOLD)</h4>
            </div>
            <div className="mt-4">
              <span className="text-[9px] text-slate-500 uppercase block">Model Confidence</span>
              <span className="text-sm font-black text-purple-400 font-mono mt-0.5 block">94% Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 5. RISK DASHBOARD & 6. ATTRIBUTION ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Metrics Gauges */}
        <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
            <ShieldAlert size={15} className="text-rose-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">solvency & Risk Metrics Dashboard</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: "Sharpe Ratio", val: "2.14", status: "Excellent", color: "text-emerald-400" },
              { name: "Beta Coefficient", val: "1.12", status: "Above Index", color: "text-amber-400" },
              { name: "Sortino Ratio", val: "2.84", status: "Excellent", color: "text-emerald-400" },
              { name: "Max Drawdown", val: "-12.45%", status: "Stable", color: "text-emerald-400" },
              { name: "Treynor Ratio", val: "0.22", status: "Good", color: "text-emerald-400" },
              { name: "Standard Deviation", val: "14.20%", status: "Medium", color: "text-amber-400" },
              { name: "Tracking Error", val: "3.45%", status: "Low Margin", color: "text-emerald-400" },
              { name: "Jensen's Alpha", val: "8.12%", status: "Superior", color: "text-emerald-400" }
            ].map((r, idx) => (
              <div key={idx} className="bg-[#050711] border border-slate-900 rounded-2xl p-3">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase">{r.name}</span>
                <p className="text-sm font-black text-white mt-1.5 font-mono">{r.val}</p>
                <span className={`text-[9px] font-black mt-1 block uppercase ${r.color}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sector Attribution Progress Lines */}
        <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
            <PieIcon size={15} className="text-cyan-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Sector allocation Contribution margin</span>
          </div>

          <div className="space-y-4">
            {sectorAllocations.map((sector, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-350 font-extrabold">{sector.name}</span>
                  <span className="font-mono text-slate-200 font-bold">{sector.val}% (${sector.count.toLocaleString()})</span>
                </div>
                <div className="w-full h-1.5 bg-[#050711] rounded-full overflow-hidden border border-slate-900/40">
                  <div className="h-full rounded-full" style={{ width: `${sector.val}%`, backgroundColor: sector.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== 7. CONTRIBUTORS & 8. LOSSES ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Contributors */}
        <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
            <TrendingUp size={15} className="text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Top Alpha Contributors</span>
          </div>

          <div className="space-y-3">
            {contributors.map((c, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-[#050711]/60 border border-slate-900 rounded-2xl">
                <div>
                  <span className="text-xs font-black text-white">{c.symbol}</span>
                  <span className="text-[10px] text-slate-500 block">{c.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400 font-mono">+{c.return}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">+${c.profit.toFixed(2)} Profit</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Biggest Losses */}
        <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
              <TrendingDown size={15} className="text-rose-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Biggest Beta Underperformers</span>
            </div>

            <div className="space-y-3">
              {losses.map((l, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-[#050711]/60 border border-slate-900 rounded-2xl">
                  <div>
                    <span className="text-xs font-black text-white">{l.symbol}</span>
                    <span className="text-[10px] text-slate-500 block">{l.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-rose-500 font-mono">{l.return}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">-${Math.abs(l.loss).toFixed(2)} P/L</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#050711] border border-slate-900/60 p-3 rounded-2xl mt-4 text-[11px] text-slate-400 leading-snug">
            <span className="text-purple-400 font-bold uppercase block mb-1">AI Recommendation</span>
            Hedge high-beta volatility flags on TSLA using protective cash assets.
          </div>
        </div>
      </div>

      {/* ==================== 9. ROLLING RETURNS ==================== */}
      <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md">
        <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
          <Layers size={14} className="text-blue-400" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">Interval Rolling Returns Ledger</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {rollingReturns.map((r, i) => (
            <div key={i} className="bg-[#050711] border border-slate-900 rounded-2xl p-4 flex flex-col justify-between h-28">
              <div>
                <span className="text-[9px] text-slate-500 font-extrabold uppercase block">{r.period}</span>
                <p className="text-sm font-black text-emerald-400 font-mono mt-1">{r.val}</p>
              </div>
              <div className="h-6 w-full opacity-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={r.sparkline.map((v, idx) => ({ idx, val: v }))}>
                    <Area type="monotone" dataKey="val" stroke="#10b981" fill="#10b98110" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== 10. WIN RATE & 11. DIVERSIFICATION SCORE ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win Rate Stats */}
        <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
            <Coins size={15} className="text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Position Win-Rate Matrix</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Winning Positions", val: "18 Assets", desc: "Gainers in holdings list" },
              { label: "Losing Positions", val: "6 Assets", desc: "Underperforming positions" },
              { label: "Average Gain Value", val: "+$324.50", desc: "Mean profitable yield delta" },
              { label: "Average Loss Value", val: "-$145.20", desc: "Mean drawdown loss delta" },
              { label: "Profit Factor", val: "2.24x", desc: "solvency yield correlation" },
              { label: "Recovery Factor", val: "3.12x", desc: "Drawdown recovery rate score" }
            ].map((stat, i) => (
              <div key={i} className="bg-[#050711] border border-slate-900 rounded-2xl p-4">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase">{stat.label}</span>
                <p className="text-sm font-black text-white mt-1.5 font-mono">{stat.val}</p>
                <span className="text-[9px] text-slate-400 block mt-1">{stat.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Diversification Score card */}
        <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
              <PieIcon size={15} className="text-indigo-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Portfolio Diversification Matrix</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#050711]/60 border border-slate-900 rounded-2xl mb-4">
              <div>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase">Calculated Score</span>
                <h4 className="text-xl font-black text-emerald-400 mt-1">Excellent (84/100)</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase">Model Alignment</span>
                <p className="text-xs text-slate-200 mt-1 font-semibold">Broad Market Balanced</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              **AI comment:** Allocation is well diversified across major equity sectors, crypto reserves, and commodities. Slight adjustments to increase sovereign cash bonds could decrease portfolio correlation during market cycles.
            </p>
          </div>

          <div className="grid grid-cols-5 gap-2 border-t border-slate-900 pt-4 mt-6 text-center text-[10px] font-mono font-bold text-slate-400">
            <div><span>Stocks</span><p className="text-white mt-1 font-black">68%</p></div>
            <div><span>Crypto</span><p className="text-white mt-1 font-black">12%</p></div>
            <div><span>Forex</span><p className="text-white mt-1 font-black">8%</p></div>
            <div><span>Commod</span><p className="text-white mt-1 font-black">7%</p></div>
            <div><span>Cash</span><p className="text-white mt-1 font-black">5%</p></div>
          </div>
        </div>
      </div>

      {/* ==================== 12. PERFORMANCE CALENDAR HEATMAP ==================== */}
      <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md">
        <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
          <Calendar size={15} className="text-blue-400" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">Daily Return Heatmap Ledger</span>
        </div>

        <div className="flex flex-wrap gap-1 items-center justify-center p-2 bg-[#050711]/60 border border-slate-900 rounded-2xl max-h-[140px] overflow-y-auto custom-scrollbar">
          {heatmapDays.map((day, idx) => (
            <div
              key={idx}
              title={`${day.date}: ${day.return} ($${day.profit.toFixed(2)})`}
              className={`h-3 w-3 rounded-sm cursor-pointer transition-colors ${
                day.isPositive
                  ? day.profit > 200
                    ? "bg-emerald-500"
                    : "bg-emerald-500/40"
                  : Math.abs(day.profit) > 200
                  ? "bg-rose-500"
                  : "bg-rose-500/40"
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* ==================== 13. GOALS & 14. FORECAST ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal Tracking */}
        <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
              <Target size={15} className="text-cyan-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Financial Goal Vector Progress</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-400 font-medium">Goal Amount: $100,000</span>
                  <span className="font-mono text-emerald-405 font-bold">48.6% Met</span>
                </div>
                <div className="w-full h-2 bg-[#050711] rounded-full overflow-hidden border border-slate-900/60">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: "48.6%" }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 text-xs font-mono">
                <div><span className="text-slate-500 font-sans block">Remaining Balance</span><p className="font-black text-white mt-1">$51,390.00</p></div>
                <div><span className="text-slate-500 font-sans block">Est. Completion Horizon</span><p className="font-black text-white mt-1">2.4 Years</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Forecast */}
        <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl pointer-events-none rounded-full"></div>
          <div>
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
              <Compass size={15} className="text-indigo-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">AI Predictive Growth Forecast</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Expected 12M Yield</span>
                <p className="text-sm font-black text-emerald-400 font-mono mt-1">+14.20% Est.</p>
              </div>
              <div>
                <span className="text-slate-500 block">Horizon Trend</span>
                <p className="text-sm font-black text-white mt-1">Moderate Bullish Vector</p>
              </div>
              <div>
                <span className="text-slate-500 block">Model Confidence Score</span>
                <p className="text-sm font-black text-indigo-400 font-mono mt-1">82% Confidence</p>
              </div>
              <div>
                <span className="text-slate-500 block">Risk Classifier</span>
                <p className="text-sm font-black text-amber-500 mt-1">Moderate Risk</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-4 mt-6 text-[10px] text-slate-500 leading-snug italic font-medium flex items-center gap-1">
            <Info size={11} className="text-indigo-400 shrink-0" />
            <span>AI Forecast Model. NOT financial investment advice.</span>
          </div>
        </div>
      </div>

      {/* ==================== 15. BREAKDOWN ==================== */}
      <div className="bg-[#121a2a]/45 border border-slate-900 rounded-3xl p-5 shadow-md">
        <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
          <Layers size={14} className="text-blue-400" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">Income Stream Ledger breakdown</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Capital Gain Yield", val: "$6,240.50", desc: "+21.2% Gain margin", color: "border-blue-500/20" },
            { label: "Dividend Payouts", val: "$1,120.40", desc: "+3.8% yield return", color: "border-emerald-500/20" },
            { label: "Interest Earned", val: "$450.20", desc: "Yield cash margins", color: "border-indigo-500/20" },
            { label: "Currency Differentials", val: "$345.10", desc: "FX conversion delta", color: "border-cyan-500/20" },
            { label: "Other Income Payouts", val: "$256.70", desc: "Rebates + minor items", color: "border-purple-500/20" },
            { label: "Total Net Profit Margin", val: "$8,412.90", desc: "Aggregated profit delta", color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400 font-bold" }
          ].map((card, i) => (
            <div key={i} className={`bg-[#050711]/60 border rounded-2xl p-4 ${card.color}`}>
              <span className="text-[9px] text-slate-500 font-extrabold uppercase block">{card.label}</span>
              <p className="text-sm font-black mt-2 font-mono">{card.val}</p>
              <span className="text-[9px] text-slate-400 block mt-1">{card.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== 16. EXPORT & SHARE ==================== */}
      <div className="flex items-center justify-between p-4 bg-[#121a2a]/45 border border-slate-900 rounded-3xl shadow-md">
        <div className="flex items-center gap-2">
          <Download size={14} className="text-blue-400" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 font-sans">Report Export Engine</span>
        </div>

        <div className="flex gap-2">
          {["CSV", "Excel", "PDF"].map((format) => (
            <button
              key={format}
              onClick={() => {
                const textContent = `FinPulse Performance Analytics Report\nTimeframe: ${timeframe}\nExport Date: ${new Date().toLocaleDateString()}\n`;
                const element = document.createElement("a");
                const file = new Blob([textContent], {type: 'text/plain'});
                element.href = URL.createObjectURL(file);
                element.download = `finpulse_performance_report.${format === "CSV" ? "csv" : format === "Excel" ? "xlsx" : "pdf"}`;
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#050711] hover:bg-slate-900 border border-slate-900 text-xs font-black uppercase tracking-wider transition-colors"
            >
              Export {format}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}