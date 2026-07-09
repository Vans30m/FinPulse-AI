import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RankedAsset {
  symbol: string;
  score: number;
  verdict: string;
}

interface Props {
  assets: RankedAsset[];
  isLoading?: boolean;
  isError?: boolean;
  stockCount?: number;
}

// ─── Score helpers ────────────────────────────────────────────────────────────
function getScoreConfig(score: number) {
  if (score >= 80) return {
    label: "Strong Buy",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    bar: "from-emerald-400 to-green-400",
    glow: "shadow-emerald-500/20",
    icon: <TrendingUp className="h-3 w-3" />,
  };
  if (score >= 65) return {
    label: "Buy",
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    bar: "from-blue-400 to-cyan-400",
    glow: "shadow-blue-500/20",
    icon: <TrendingUp className="h-3 w-3" />,
  };
  if (score >= 50) return {
    label: "Hold",
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    bar: "from-amber-400 to-yellow-400",
    glow: "shadow-amber-500/20",
    icon: <Minus className="h-3 w-3" />,
  };
  return {
    label: "Sell",
    color: "text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
    bar: "from-rose-400 to-pink-400",
    glow: "shadow-rose-500/20",
    icon: <TrendingDown className="h-3 w-3" />,
  };
}

function getRankConfig(index: number) {
  if (index === 0) return { bg: "from-yellow-500/30 to-amber-500/20", border: "border-yellow-500/40", text: "text-yellow-400", label: "🥇" };
  if (index === 1) return { bg: "from-slate-400/20 to-slate-500/10", border: "border-slate-400/30", text: "text-slate-300", label: "🥈" };
  if (index === 2) return { bg: "from-orange-600/20 to-amber-700/10", border: "border-orange-600/30", text: "text-orange-400", label: "🥉" };
  return { bg: "from-slate-700/20 to-slate-800/10", border: "border-white/5", text: "text-slate-500", label: `#${index + 1}` };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SkeletonRow({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/3 p-4 overflow-hidden relative"
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="w-9 h-9 rounded-xl bg-white/8 shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="h-3.5 w-24 rounded-lg bg-white/8" />
        <div className="h-2.5 w-40 rounded-lg bg-white/5" />
        <div className="h-1.5 w-full rounded-full bg-white/5" />
      </div>
      <div className="w-12 h-12 rounded-2xl bg-white/8 shrink-0" />
    </motion.div>
  );
}

function RankingRow({ asset, index }: { asset: RankedAsset; index: number }) {
  const cfg = getScoreConfig(asset.score);
  const rank = getRankConfig(index);
  const pct = Math.min(100, Math.max(0, asset.score));

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: "easeOut" }}
      className={`group relative flex items-center gap-4 rounded-2xl border ${rank.border} bg-gradient-to-r ${rank.bg} p-4 hover:scale-[1.01] transition-transform duration-200 overflow-hidden`}
    >
      {/* Subtle glow on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl bg-gradient-to-r ${rank.bg}`} />

      {/* Rank Medal */}
      <div className="relative shrink-0 w-9 h-9 flex items-center justify-center text-base leading-none">
        {rank.label}
      </div>

      {/* Content */}
      <div className="relative flex-1 min-w-0 space-y-1.5">
        {/* Symbol + verdict badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-black text-white text-sm tracking-wide">{asset.symbol}</span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
            {cfg.icon}
            {cfg.label}
          </span>
        </div>

        {/* Verdict text */}
        <p className="text-[10px] text-slate-400 leading-snug line-clamp-1 max-w-[220px]">
          {asset.verdict}
        </p>

        {/* Score bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: index * 0.07 + 0.2, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${cfg.bar}`}
            />
          </div>
          <span className={`text-[9px] font-bold ${cfg.color}`}>{pct}%</span>
        </div>
      </div>

      {/* Score circle */}
      <div className="relative shrink-0">
        <svg width="52" height="52" viewBox="0 0 52 52" className="rotate-[-90deg]">
          <circle cx="26" cy="26" r="21" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
          <motion.circle
            cx="26" cy="26" r="21"
            fill="none"
            stroke="url(#scoreGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 21}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 21 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 21 * (1 - pct / 100) }}
            transition={{ duration: 0.9, delay: index * 0.07 + 0.15, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={score_color_start(asset.score)} />
              <stop offset="100%" stopColor={score_color_end(asset.score)} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-black leading-none ${cfg.color}`}>{pct}</span>
        </div>
      </div>
    </motion.div>
  );
}

function score_color_start(score: number) {
  if (score >= 80) return "#34d399";
  if (score >= 65) return "#60a5fa";
  if (score >= 50) return "#fbbf24";
  return "#f87171";
}
function score_color_end(score: number) {
  if (score >= 80) return "#4ade80";
  if (score >= 65) return "#22d3ee";
  if (score >= 50) return "#facc15";
  return "#fb7185";
}

// ─── Main Card ────────────────────────────────────────────────────────────────
export default function AIRankingCard({ assets, isLoading = false, isError = false, stockCount = 0 }: Props) {
  const queryClient = useQueryClient();

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ["watchlist-ai-rankings"] });
  };

  const hasNoStocks = stockCount === 0;
  const showSkeletons = isLoading || (!isError && !hasNoStocks && assets.length === 0);

  return (
    <div className="relative rounded-3xl border border-white/10 bg-white/5 dark:bg-night-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      {/* Background glow */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30">
                <Sparkles className="h-4 w-4 text-blue-400" />
              </div>
              <h2 className="text-base font-black text-white tracking-tight">FinPulse AI Rankings</h2>
              {!isLoading && !isError && assets.length > 0 && (
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Live
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 pl-0.5">
              {isLoading
                ? "Analyzing technicals, financials & news sentiment…"
                : isError
                ? "Could not load AI rankings"
                : hasNoStocks
                ? "Add stocks to your watchlist to see AI rankings"
                : `Ranked by composite AI score across ${assets.length} asset${assets.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isLoading && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Analyzing
              </div>
            )}
            {(isError || (!isLoading && !hasNoStocks && assets.length === 0)) && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-full transition-all"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            )}
            {!isLoading && !isError && assets.length > 0 && (
              <button
                onClick={handleRetry}
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-all"
                title="Refresh AI rankings"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="space-y-2.5">
          <AnimatePresence mode="wait">
            {showSkeletons ? (
              <motion.div key="skeletons" className="space-y-2.5">
                {[0, 1, 2].map((i) => <SkeletonRow key={i} index={i} />)}
              </motion.div>
            ) : isError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-10 text-center"
              >
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle className="h-6 w-6 text-rose-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-300">AI Rankings Unavailable</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-xs">
                    Backend returned an error. The AI scoring service may be warming up.
                  </p>
                </div>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-4 py-2 rounded-xl transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try Again
                </button>
              </motion.div>
            ) : hasNoStocks ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-10 text-center"
              >
                <div className="p-3 rounded-2xl bg-slate-500/10 border border-white/5">
                  <Sparkles className="h-6 w-6 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400">No Assets to Rank</p>
                  <p className="text-[10px] text-slate-600 mt-1">Add stocks to your watchlist above to see AI-powered rankings.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="rankings" className="space-y-2.5">
                {assets.map((asset, i) => (
                  <RankingRow key={asset.symbol} asset={asset} index={i} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer legend */}
        {!isLoading && !isError && !hasNoStocks && assets.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4 mt-5 pt-4 border-t border-white/5 flex-wrap"
          >
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Score Legend</span>
            {[
              { label: "Strong Buy", color: "bg-emerald-400" },
              { label: "Buy", color: "bg-blue-400" },
              { label: "Hold", color: "bg-amber-400" },
              { label: "Sell", color: "bg-rose-400" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${l.color}`} />
                <span className="text-[9px] text-slate-500">{l.label}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}