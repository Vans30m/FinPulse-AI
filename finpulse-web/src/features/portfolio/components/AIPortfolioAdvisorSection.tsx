import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Download,
  FileText,
  Layers3,
  Loader2,
  PieChart,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import AnimatedNumber from "./AnimatedNumber";
import type { PortfolioAdvisorSnapshot } from "../data/portfolioPremiumSections";

interface Props {
  advisor: PortfolioAdvisorSnapshot;
}

const actionIconMap = {
  rebalance: RotateCcw,
  report: FileText,
  analysis: BrainCircuit,
  export: Download,
} as const;

function ProgressRing({ value }: { value: number }) {
  const size = 176;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(148,163,184,0.16)" strokeWidth={strokeWidth} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#portfolio-advisor-gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="portfolio-advisor-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline gap-1 text-slate-900 dark:text-white">
          <AnimatedNumber value={value} className="text-5xl font-black tracking-tight" />
          <span className="text-sm font-bold text-slate-400 dark:text-slate-500">/100</span>
        </div>
        <span className="mt-2 text-xs font-bold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">AI Health Score</span>
      </div>
    </div>
  );
}

function RecommendationProgress({ label, value, tone }: { label: string; value: number; tone: "blue" | "emerald" | "amber" | "rose" }) {
  const toneClasses = {
    blue: "bg-blue-600 dark:bg-cyan-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${toneClasses[tone]}`}
        />
      </div>
    </div>
  );
}

function AIPortfolioAdvisorSection({ advisor }: Props) {
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const strengthBadges = useMemo(
    () => advisor.strengths.map((item) => ({ label: item, tone: "emerald" as const })),
    [advisor.strengths]
  );

  const weaknessBadges = useMemo(
    () => advisor.weaknesses.map((item) => ({ label: item, tone: "rose" as const })),
    [advisor.weaknesses]
  );

  const handleAction = (actionId: string) => {
    setActiveAction(actionId);
    window.setTimeout(() => setActiveAction((current) => (current === actionId ? null : current)), 1400);
  };

  return (
    <section className="glass-panel p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-blue-500/[0.05] pointer-events-none" />

      <div className="relative flex flex-col gap-1.5 mb-6">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.32em]">AI Portfolio Advisor</span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI-powered recommendations to improve your portfolio.</h2>
      </div>

      <div className="relative grid grid-cols-1 xl:grid-cols-[minmax(240px,320px)_1fr] gap-6 items-center mb-6">
        <div className="rounded-3xl border border-slate-200/70 dark:border-white/5 bg-white/70 dark:bg-white/[0.025] backdrop-blur-sm p-6 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.65)]">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 dark:bg-cyan-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.26em] text-blue-600 dark:text-cyan-400">
              <Sparkles className="h-3.5 w-3.5" />
              {advisor.ringLabel}
            </div>

            <ProgressRing value={advisor.score} />

            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{advisor.status}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Portfolio profile based on diversification, risk, and opportunity scoring.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.article whileHover={{ y: -3 }} className="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/75 dark:bg-white/[0.025] backdrop-blur-sm p-5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400">
                  <PieChart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Portfolio Diversification</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Allocation balance and sector breadth</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Strong
              </span>
            </div>

            <div className="space-y-3">
              <RecommendationProgress label="Diversification Score" value={advisor.diversificationScore} tone="blue" />
              <div className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-800/50 pb-2.5">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Sector Exposure</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{advisor.sectorExposure}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-800/50 pb-2.5">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Suggested Allocation</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{advisor.suggestedAllocation}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Confidence</span>
                <span className="font-bold text-blue-600 dark:text-cyan-400">{advisor.diversificationConfidence}%</span>
              </div>
            </div>
          </motion.article>

          <motion.article whileHover={{ y: -3 }} className="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/75 dark:bg-white/[0.025] backdrop-blur-sm p-5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Risk Analysis</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Portfolio volatility and mitigation</p>
                </div>
              </div>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Balanced
              </span>
            </div>

            <div className="space-y-3">
              <RecommendationProgress label="Current Risk" value={advisor.riskConfidence} tone="rose" />
              <div className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-800/50 pb-2.5">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Risk Level</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{advisor.riskLevel}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-800/50 pb-2.5">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Suggested Action</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{advisor.riskAction}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Confidence</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{advisor.riskConfidence}%</span>
              </div>
            </div>
          </motion.article>

          <motion.article whileHover={{ y: -3 }} className="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/75 dark:bg-white/[0.025] backdrop-blur-sm p-5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Best Opportunity</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">AI-ranked upside candidate</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {advisor.opportunityRating}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-800/50 pb-2.5">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Stock Name</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{advisor.bestOpportunity}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-800/50 pb-2.5">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Current Price</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">${advisor.opportunityPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-800/50 pb-2.5">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Estimated Upside</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">+{advisor.opportunityUpside}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-500 dark:text-slate-400">AI Confidence</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{advisor.opportunityConfidence}%</span>
              </div>
            </div>
          </motion.article>

          <motion.article whileHover={{ y: -3 }} className="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/75 dark:bg-white/[0.025] backdrop-blur-sm p-5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Portfolio Health</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Strengths, weaknesses, and outlook</p>
                </div>
              </div>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                Healthy
              </span>
            </div>

            <div className="space-y-4">
              <RecommendationProgress label="Long-Term Outlook" value={advisor.healthProgress} tone="blue" />

              <div className="flex flex-wrap gap-2">
                {strengthBadges.map((item) => (
                  <span key={item.label} className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {item.label}
                  </span>
                ))}
                {weaknessBadges.map((item) => (
                  <span key={item.label} className="inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    {item.label}
                  </span>
                ))}
              </div>

              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{advisor.outlook}</p>
            </div>
          </motion.article>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {advisor.actions.map((action) => {
          const Icon = actionIconMap[action.icon];
          const isLoading = activeAction === action.id;

          return (
            <button
              key={action.id}
              type="button"
              onClick={() => handleAction(action.id)}
              disabled={Boolean(activeAction && activeAction !== action.id)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/70 dark:bg-white/[0.03] px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/20 dark:hover:border-cyan-500/20 hover:text-blue-600 dark:hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
              {action.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default memo(AIPortfolioAdvisorSection);