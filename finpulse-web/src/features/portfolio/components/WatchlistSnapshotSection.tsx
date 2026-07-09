import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Bell, Bookmark, ExternalLink, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { WatchlistSnapshotItem } from "../data/portfolioPremiumSections";

interface Props {
  items: WatchlistSnapshotItem[];
}

const toneClasses: Record<
  WatchlistSnapshotItem["logoTone"],
  {
    gradient: string;
    text: string;
  }
> = {
  blue: {
    gradient: "from-blue-500/20 to-cyan-500/20",
    text: "text-blue-600 dark:text-cyan-400",
  },
  emerald: {
    gradient: "from-emerald-500/20 to-teal-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    gradient: "from-amber-500/20 to-orange-500/20",
    text: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    gradient: "from-rose-500/20 to-pink-500/20",
    text: "text-rose-600 dark:text-rose-400",
  },
  purple: {
    gradient: "from-purple-500/20 to-violet-500/20",
    text: "text-purple-600 dark:text-purple-400",
  },
};

function Sparkline({ values, positive }: { values: number[]; positive: boolean }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const normalized = values.map((value, index) => {
    const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100;
    const y = max === min ? 50 : 100 - ((value - min) / (max - min)) * 100;
    return `${x},${y}`;
  });

  return (
    <svg viewBox="0 0 100 100" className="h-10 w-full overflow-visible" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={positive ? "#10b981" : "#f43f5e"}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={normalized.join(" ")}
      />
    </svg>
  );
}

function WatchlistSnapshotSection({ items }: Props) {
  const navigate = useNavigate();

  return (
    <section className="glass-panel p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/10 via-transparent to-blue-500/[0.04] pointer-events-none" />

      <div className="relative flex flex-col gap-1.5 mb-6">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.32em]">Watchlist Snapshot</span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quick overview of the assets you're monitoring.</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {items.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 dark:border-slate-800/80 bg-slate-50/20 dark:bg-black/[0.05] rounded-2xl text-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <Bookmark className="h-5 w-5 text-blue-500 dark:text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">No watchlist assets found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add stocks, crypto, or ETFs to your watchlist to see them here.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/watchlist")}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-600 dark:text-cyan-400 transition-all duration-300 hover:-translate-y-0.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Go to Watchlist
            </button>
          </div>
        ) : items.map((item, index) => {
          const positive = item.dailyChangePercent >= 0;
          const tone = toneClasses[item.logoTone];

          return (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.05, duration: 0.35 }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/75 dark:bg-white/[0.025] backdrop-blur-sm p-5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.6)] transition-all duration-300 hover:border-blue-500/20 dark:hover:border-cyan-500/20 hover:shadow-[0_18px_42px_-28px_rgba(6,182,212,0.42)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-cyan-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative flex items-start justify-between gap-3 mb-4">
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${tone.gradient} flex items-center justify-center border border-white/10 shadow-sm`}>
                  <span className={`text-sm font-black tracking-wide ${tone.text}`}>
                    {item.logoInitials}
                  </span>
                </div>

                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${item.sentiment === "Bullish" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : item.sentiment === "Bearish" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-slate-500/10 text-slate-600 dark:text-slate-400"}`}>
                  <Sparkles className="h-3 w-3" />
                  AI {item.sentiment}
                </span>
              </div>

              <div className="relative space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.company}</h3>
                    <span className="rounded-full border border-slate-200/70 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.03] px-2 py-0.5 text-[10px] font-black tracking-wider text-slate-500 dark:text-slate-400">
                      {item.symbol}
                    </span>
                  </div>

                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Current Price</p>
                      <p className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        {item.currency === 'INR' ? '₹' : item.currency === 'EUR' ? '€' : item.currency === 'GBP' ? '£' : '$'}
                        {item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${positive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
                      <ArrowUpRight className={`h-3.5 w-3.5 ${positive ? "" : "rotate-180"}`} />
                      {positive ? "+" : ""}{item.dailyChangePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] px-3 py-2">
                  <Sparkline values={item.sparkline} positive={positive} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${item.sentiment === "Bullish" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : item.sentiment === "Bearish" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-slate-500/10 text-slate-600 dark:text-slate-400"}`}>
                    {item.sentiment} Sentiment
                  </span>

                  {item.alertLabel ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Bell className="h-3 w-3" />
                      {item.alertLabel}
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/watchlist")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/70 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.03] px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/20 dark:hover:border-cyan-500/20 hover:text-blue-600 dark:hover:text-cyan-400"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Watchlist
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

export default memo(WatchlistSnapshotSection);