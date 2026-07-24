import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Brain,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCcw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import type { AiPerformanceCoachData } from "./aiPerformanceCoachTypes";
import AiCoachScoreRing from "./AiCoachScoreRing";
import AiCoachInsightCards from "./AiCoachInsightCards";
import API_BASE_URL from "../../../../config/api";

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 65) return "text-cyan-400";
  if (score >= 50) return "text-amber-400";
  return "text-rose-400";
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        <div className="h-64 rounded-2xl border border-slate-900 bg-[#050711]/70" />
        <div className="h-64 rounded-2xl border border-slate-900 bg-[#050711]/70" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-36 rounded-2xl border border-slate-900 bg-[#050711]/70" />
        <div className="h-36 rounded-2xl border border-slate-900 bg-[#050711]/70" />
      </div>
    </div>
  );
}

export default function AiPerformanceCoachSection() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AiPerformanceCoachData | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
    const userId = storedUser.id;
    const headers = userId ? { 'X-User-Id': userId } : undefined;

    fetch(`${API_BASE_URL}/api/portfolio/analysis`, { headers })
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error("AI Coach load failed", err);
        setLoading(false);
      });
  }, []);

  const metrics = useMemo(
    () =>
      data
        ? [
            { label: "Portfolio Consistency", value: data.scoreBreakdown.consistency },
            { label: "Risk-Adjusted Return", value: data.scoreBreakdown.riskAdjustedReturn },
            { label: "Diversification Score", value: data.scoreBreakdown.diversification },
            { label: "Growth Score", value: data.scoreBreakdown.growth },
          ]
        : [],
    [data]
  );

  const handleAction = (id: string) => {
    setActiveAction(id);
    setTimeout(() => {
      setActiveAction((curr) => (curr === id ? null : curr));
    }, 1200);
  };

  const actions = [
    { id: "full-report", label: "Generate Full Report", icon: FileText },
    { id: "optimize", label: "Optimize Portfolio", icon: Brain },
    { id: "risk-profile", label: "Improve Risk Profile", icon: AlertTriangle },
    { id: "export-ai", label: "Export AI Analysis", icon: Download },
  ];

  return (
    <section className="bg-white dark:bg-[#121a2a]/45 border border-slate-200 dark:border-slate-900 rounded-3xl p-5 shadow-md relative overflow-hidden">
      <div className="absolute top-0 right-0 w-56 h-56 bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />

      <div className="flex items-center justify-between gap-4 mb-4 border-b border-slate-200 dark:border-slate-900 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">AI Performance Coach</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">AI-guided diagnostics, benchmark intelligence, and optimization actions for sustained performance quality.</p>
        </div>
      </div>

      {loading ? (
        <Skeleton />
      ) : !data ? (
        <div className="rounded-2xl border border-slate-900 bg-[#050711]/70 p-10 text-center">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No AI performance data available.</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
              const userId = storedUser.id;
              const headers = userId ? { 'X-User-Id': userId } : undefined;

              fetch(`${API_BASE_URL}/api/portfolio/analysis`, { headers })
                .then(res => res.json())
                .then(d => {
                  setData(d);
                  setLoading(false);
                })
                .catch(() => setLoading(false));
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-600/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-blue-400 hover:bg-blue-600/20 transition-colors"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-4 mb-4">
            <AiCoachScoreRing score={data.performanceScore} rating={data.rating} />

            <div className="rounded-3xl border border-slate-900 bg-[#050711]/70 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-slate-900 bg-[#050711]/85 p-3">
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">{metric.label}</p>
                    <p className={`text-lg font-black font-mono mt-1.5 ${scoreTone(metric.value)}`}>{metric.value}/100</p>
                    <div className="h-1.5 rounded-full bg-slate-900 mt-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.value}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-900 bg-[#050711]/85 p-3">
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Portfolio Concentration</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">{data.concentrationRisk}</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-[#050711]/85 p-3">
                  <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Risk Observation</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">{data.riskObservation}</p>
                </div>
              </div>
            </div>
          </div>

          <AiCoachInsightCards insights={data.insights} />

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-900 bg-[#050711]/70 p-4">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-200 dark:border-slate-900 pb-3">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Benchmark Analysis</span>
              </div>

              <div className="space-y-2.5">
                {data.benchmarkRows.map((row) => (
                  <div key={row.index} className="rounded-xl border border-slate-900 bg-[#050711]/85 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">{row.index}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Benchmark {row.benchmarkReturn.toFixed(2)}% | Portfolio {row.portfolioReturn.toFixed(2)}%</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black font-mono ${row.outperform ? "text-emerald-400" : "text-rose-400"}`}>{row.difference >= 0 ? "+" : ""}{row.difference.toFixed(2)}%</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${row.outperform ? "text-emerald-400" : "text-rose-400"}`}>
                        {row.outperform ? "Outperform" : "Underperform"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-900 bg-[#050711]/70 p-4">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-200 dark:border-slate-900 pb-3">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Forecast & AI Signals</span>
              </div>

              <div className="space-y-3">
                {data.forecast.map((item) => (
                  <div key={item.horizon} className="rounded-xl border border-slate-900 bg-[#050711]/85 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black text-slate-900 dark:text-white">{item.horizon}</p>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${item.expectedReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{item.expectedReturn >= 0 ? "+" : ""}{item.expectedReturn.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{item.bias}</span>
                      <span className="font-bold">Confidence {item.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                <div className="rounded-xl border border-slate-900 bg-[#050711]/85 p-3 text-slate-700 dark:text-slate-300">
                  <p className="text-[10px] uppercase text-slate-500 font-bold">Top Contributors</p>
                  <p className="mt-1.5">{data.topContributors.join("; ")}</p>
                </div>
                <div className="rounded-xl border border-slate-900 bg-[#050711]/85 p-3 text-slate-700 dark:text-slate-300">
                  <p className="text-[10px] uppercase text-slate-500 font-bold">Missed Opportunities</p>
                  <p className="mt-1.5">{data.missedOpportunities.join("; ")}</p>
                </div>
                <div className="rounded-xl border border-slate-900 bg-[#050711]/85 p-3 text-slate-700 dark:text-slate-300 sm:col-span-2">
                  <p className="text-[10px] uppercase text-slate-500 font-bold">Weaknesses</p>
                  <p className="mt-1.5">{data.weaknesses.join("; ")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-900 bg-[#050711]/70 p-4">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-200 dark:border-slate-900 pb-3">
              <Target className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">AI Action Center</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
              {actions.map((action) => {
                const Icon = action.icon;
                const isActive = activeAction === action.id;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => handleAction(action.id)}
                    className="rounded-xl border border-slate-900 bg-[#050711]/85 px-3 py-2.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-white hover:bg-slate-900 transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    {isActive ? <RefreshCcw className="h-3.5 w-3.5 animate-spin text-cyan-400" /> : <Icon className="h-3.5 w-3.5 text-cyan-400" />}
                    {action.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button className="px-3 py-2 rounded-xl border border-slate-900 bg-[#050711]/85 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 hover:bg-slate-900 transition-colors">
                <FileText className="h-3.5 w-3.5 text-blue-400" /> PDF
              </button>
              <button className="px-3 py-2 rounded-xl border border-slate-900 bg-[#050711]/85 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 hover:bg-slate-900 transition-colors">
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> CSV
              </button>
              <button className="px-3 py-2 rounded-xl border border-slate-900 bg-[#050711]/85 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 hover:bg-slate-900 transition-colors">
                <Download className="h-3.5 w-3.5 text-purple-400" /> Excel
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
