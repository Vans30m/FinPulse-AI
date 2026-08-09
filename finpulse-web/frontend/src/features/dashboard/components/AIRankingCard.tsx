import { useQueryClient } from "@tanstack/react-query";

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

function ScoreBadge({ score }: { score: number }) {
  let color = "text-cyan-500";
  let bg = "bg-cyan-500/10";
  if (score >= 80) { color = "text-emerald-500"; bg = "bg-emerald-500/10"; }
  else if (score >= 65) { color = "text-blue-500"; bg = "bg-blue-500/10"; }
  else if (score < 50) { color = "text-rose-500"; bg = "bg-rose-500/10"; }

  return (
    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl ${bg} shrink-0`}>
      <span className={`text-xl font-black leading-none ${color}`}>{score}</span>
      <span className={`text-[9px] font-bold uppercase tracking-wide ${color} opacity-70`}>score</span>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const lower = verdict.toLowerCase();
  if (lower.startsWith("strong buy")) return <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Strong Buy</span>;
  if (lower.startsWith("buy")) return <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">Buy</span>;
  if (lower.startsWith("sell")) return <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">Sell</span>;
  return <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">Hold</span>;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-white/5 p-4 animate-pulse">
      <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-white/10 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 rounded bg-slate-200 dark:bg-white/10" />
        <div className="h-2.5 w-36 rounded bg-slate-100 dark:bg-white/5" />
      </div>
      <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-white/10 shrink-0" />
    </div>
  );
}

export default function AIRankingCard({ assets, isLoading = false, isError = false, stockCount = 0 }: Props) {
  const queryClient = useQueryClient();

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['watchlist-ai-rankings'] });
  };

  const hasNoStocks = stockCount === 0;

  return (
    <div className="bg-white/70 dark:bg-night-900/70 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-lg">

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <span className="text-lg">✦</span>
            FinPulse AI Rankings
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isLoading
              ? "Analyzing technicals, financials & sentiment…"
              : isError
                ? "Failed to load AI rankings — click retry"
                : hasNoStocks
                  ? "Add stocks to your watchlist to see AI rankings"
                  : assets.length === 0
                    ? "Fetching scores for your watchlist…"
                    : "Top picks ranked by AI score — updated on demand"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Analyzing
            </div>
          )}
          {(isError || (!isLoading && !hasNoStocks && assets.length === 0)) && (
            <button
              onClick={handleRetry}
              className="text-[10px] font-bold text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
            >
              ↺ Retry
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {isLoading ? (
          // Show 3 skeleton rows while loading
          [1, 2, 3].map((i) => <SkeletonRow key={i} />)
        ) : isError ? (
          <div className="text-center py-8 space-y-3">
            <div className="text-3xl">⚠️</div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">AI Rankings Unavailable</p>
            <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
              The AI ranking service could not be reached. This usually means the backend needs to be redeployed with the latest changes.
            </p>
            <button
              onClick={handleRetry}
              className="mt-2 text-xs font-bold text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 rounded-xl transition-colors"
            >
              ↺ Retry Now
            </button>
          </div>
        ) : hasNoStocks ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Add stocks to your watchlist to see AI-powered rankings.
          </div>
        ) : assets.length === 0 ? (
          // Data loading but still empty — likely first load
          [1, 2, 3].map((i) => <SkeletonRow key={i} />)
        ) : (
          assets.map((asset, index) => (
            <div
              key={asset.symbol}
              className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 p-4 hover:bg-slate-100/70 dark:hover:bg-white/10 hover:border-slate-200 dark:hover:border-white/10 transition-all duration-300"
            >
              {/* Rank badge */}
              <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">#{index + 1}</span>
              </div>

              {/* Symbol + verdict */}
              <div className="flex-1 min-w-0">
                <div className="font-black text-slate-800 dark:text-white text-sm leading-tight">
                  {asset.symbol}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <VerdictBadge verdict={asset.verdict} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug truncate max-w-[200px]">
                  {asset.verdict}
                </p>
              </div>

              {/* Score */}
              <ScoreBadge score={asset.score} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}