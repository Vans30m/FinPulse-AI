import { BarChart3, Cpu, RefreshCw, Zap } from "lucide-react";
import { useState } from "react";

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<"sentiment" | "volatility" | "correlation">("sentiment");
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500 p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 pointer-events-none flex items-center justify-center pr-10">
          <BarChart3 className="h-64 w-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-white/10">
              <BarChart3 className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Advanced Analytics</h1>
              <p className="mt-2 text-white/80 max-w-xl">
                Deep dive into market indicators, predictive models, and real-time computational signals powered by FinPulse AI.
              </p>
            </div>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="self-start md:self-auto flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 px-5 py-3 text-sm font-bold text-white transition-all backdrop-blur-md active:scale-95 disabled:opacity-55"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Re-calculating..." : "Recalculate Signals"}
          </button>
        </div>
      </div>

      {/* Tabs / Filter Controls */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {(["sentiment", "volatility", "correlation"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3.5 text-sm font-semibold capitalize border-b-2 transition-all ${
              activeTab === tab
                ? "border-b-2 border-blue-600 dark:border-cyan-400 text-blue-600 dark:text-cyan-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            {tab} Engine
          </button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Visual Chart Simulation */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                  {activeTab} Trend Index
                </h3>
                <p className="text-xs text-slate-500">Live 24h calculated index interval</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                +14.2% Delta
              </span>
            </div>

            {/* Custom SVG Line Chart */}
            <div className="h-64 w-full flex items-end justify-between relative mt-4">
              <svg className="w-full h-full text-blue-500 dark:text-cyan-400" viewBox="0 0 100 30" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d={
                    activeTab === "sentiment"
                      ? "M 0 20 Q 20 5 40 18 T 80 10 T 100 5 L 100 30 L 0 30 Z"
                      : activeTab === "volatility"
                      ? "M 0 10 Q 15 28 35 15 T 70 25 T 100 12 L 100 30 L 0 30 Z"
                      : "M 0 15 Q 25 15 50 8 T 75 18 T 100 7 L 100 30 L 0 30 Z"
                  }
                  fill="url(#chartGradient)"
                />
                <path
                  d={
                    activeTab === "sentiment"
                      ? "M 0 20 Q 20 5 40 18 T 80 10 T 100 5"
                      : activeTab === "volatility"
                      ? "M 0 10 Q 15 28 35 15 T 70 25 T 100 12"
                      : "M 0 15 Q 25 15 50 8 T 75 18 T 100 7"
                  }
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />
              </svg>
              {/* Overlay grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                <div className="border-b border-current w-full" />
                <div className="border-b border-current w-full" />
                <div className="border-b border-current w-full" />
                <div className="border-b border-current w-full" />
              </div>
            </div>
          </div>

          <div className="flex justify-between text-xs text-slate-400 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <span>08:00 AM</span>
            <span>12:00 PM</span>
            <span>04:00 PM</span>
            <span>08:00 PM</span>
            <span>Active Feed</span>
          </div>
        </div>

        {/* Right column: Metric highlights */}
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-cyan-400">
                <Cpu className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white">AI Engine Configuration</h4>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Currently compiling model outputs using FinPulse LLM-V3. Confidence score is running at 94.8% across 1,200 feeds.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Sentiment Processing Power</span>
                  <span>92%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-1.5 rounded-full bg-cyan-500 w-[92%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Predictive Backtesting Accuracy</span>
                  <span>87%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-1.5 rounded-full bg-blue-500 w-[87%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-amber-500" />
              <h4 className="font-bold text-slate-900 dark:text-white">Premium Signals Available</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Unlock millisecond latency alerts and advanced order book imbalance metrics.
            </p>
            <button className="mt-4 w-full rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 py-2.5 text-xs font-bold text-white dark:text-slate-950 transition-colors">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
