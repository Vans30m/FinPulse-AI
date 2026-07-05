import { memo } from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  CircleDollarSign,
  CreditCard,
  Landmark,
  Percent,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AnimatedNumber from "./AnimatedNumber";

export type PortfolioSummaryMetric = {
  id: string;
  title: string;
  value: number;
  format: "currency" | "percent" | "number";
  helperText: string;
  trendLabel: string;
  isPositive: boolean;
  iconKey: PortfolioSummaryIconKey;
};

export type PortfolioSummaryIconKey =
  | "invested"
  | "portfolio"
  | "today"
  | "total"
  | "return"
  | "cash"
  | "power"
  | "margin";

interface Props {
  metrics: PortfolioSummaryMetric[];
  currencySymbol: string;
  loading?: boolean;
}

const SUMMARY_ICON_MAP: Record<PortfolioSummaryIconKey, LucideIcon> = {
  invested: Wallet,
  portfolio: CircleDollarSign,
  today: TrendingUp,
  total: Banknote,
  return: Percent,
  cash: PiggyBank,
  power: CreditCard,
  margin: Landmark,
};

function PortfolioSummarySection({ metrics, currencySymbol, loading = false }: Props) {
  return (
    <section className="glass-panel p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-cyan-500/[0.04] pointer-events-none" />

      <div className="relative flex flex-col gap-1.5 mb-6">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.32em]">Portfolio Summary</span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Complete overview of your investment portfolio.</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] p-5 animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-white/5 mb-4" />
              <div className="h-3 w-32 rounded-full bg-slate-200 dark:bg-white/5 mb-3" />
              <div className="h-8 w-40 rounded-full bg-slate-200 dark:bg-white/5 mb-3" />
              <div className="h-3 w-24 rounded-full bg-slate-200 dark:bg-white/5" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {metrics.map((metric, index) => {
            const Icon = SUMMARY_ICON_MAP[metric.iconKey];

            return (
              <motion.article
                key={metric.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/70 dark:bg-white/[0.025] backdrop-blur-sm p-5 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.65)] transition-all duration-300 hover:border-blue-500/20 dark:hover:border-cyan-500/20 hover:shadow-[0_18px_48px_-28px_rgba(6,182,212,0.45)]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] to-cyan-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative flex items-start justify-between gap-3 mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/5 text-blue-600 dark:text-cyan-400 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>

                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${metric.isPositive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
                    {metric.isPositive ? "+" : "-"}
                    {metric.trendLabel}
                  </span>
                </div>

                <div className="relative space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">{metric.title}</p>
                    <div className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      {metric.format === "currency" ? (
                        <AnimatedNumber value={metric.value} prefix={currencySymbol} decimals={2} className="font-black" />
                      ) : metric.format === "percent" ? (
                        <AnimatedNumber value={metric.value} suffix="%" decimals={2} className="font-black" />
                      ) : (
                        <AnimatedNumber value={metric.value} decimals={0} className="font-black" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{metric.helperText}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default memo(PortfolioSummarySection);