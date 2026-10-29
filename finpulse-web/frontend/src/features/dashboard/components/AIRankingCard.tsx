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
  // FIX: new prop — lets the card distinguish real LLM output from the
  // backend's random mock fallback (sent when all providers fail).
  source?: 'live' | 'fallback';
  onReload?: () => void;
}

function ScoreBadge({ score }: { score: number }) {
  let color = "text-cyan-500";
  let bg = "bg-cyan-500/10";
  if (score >= 80) { color = "text-emerald-500"; bg = "bg-emerald-500/10"; }
  else if (score >= 65) { color = "text-blue-500"; bg = "bg-blue-500/10"; }
  else if (score < 50) { color = "text-rose-500"; bg = "bg-rose-500/10"; }

  return (
    <div className={`flex flex-col items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${bg} shrink-0`}>
      <span className={`text-base sm:text-xl font-black leading-none ${color}`}>{score}</span>
      <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wide ${color} opacity-70`}>score</span>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const lower = verdict.toLowerCase();
  if (lower.startsWith("strong buy")) return <span className="text-[9px] sm:text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded-full">Strong Buy</span>;
  if (lower.startsWith("buy")) return <span className="text-[9px] sm:text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 sm:px-2 py-0.5 rounded-full">Buy</span>;
  if (lower.startsWith("sell")) return <span className="text-[9px] sm:text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 sm:px-2 py-0.5 rounded-full">Sell</span>;
  return <span className="text-[9px] sm:text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 sm:px-2 py-0.5 rounded-full">Hold</span>;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-2 sm:gap-3 rounded-xl border border-slate-200 dark:border-[#242424] bg-slate-50 dark:bg-[#141414] p-2 sm:p-3 animate-pulse">
      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-slate-200 dark:bg-[#1C1C1C] shrink-0" />
      <div className="flex-1 space-y-1">
        <div className="h-3 w-16 sm:w-20 rounded bg-slate-200 dark:bg-[#1C1C1C]" />
        <div className="h-2.5 w-24 sm:w-32 rounded bg-slate-100 dark:bg-[#171717]" />
      </div>
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-200 dark:bg-[#1C1C1C] shrink-0" />
    </div>
  );
}

export default function AIRankingCard({ assets, isLoading = false, isError = false, stockCount = 0, source, onReload }: Props) {
  const queryClient = useQueryClient();

  const handleRetry = () => {
    if (onReload) {
      onReload();
    } else {
      queryClient.invalidateQueries({ queryKey: ['watchlist-ai-rankings'] });
    }
  };

  const hasNoStocks = stockCount === 0;
  const isFallback = source === 'fallback';

  return (
    <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-[#242424] p-3.5 sm:p-5 shadow-xs">

      <div className="flex items-start sm:items-center justify-between gap-2 mb-3 sm:mb-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
            FinPulse AI Rankings
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-neutral-400 mt-0.5 leading-snug">
            {isLoading
              ? "Analyzing technicals, financials & sentiment…"
              : isError
                ? "Failed to load AI rankings — click reload to try again"
                : hasNoStocks
                  ? "Add stocks to your watchlist to see AI rankings"
                  : isFallback
                    ? "AI ranking service temporarily unavailable"
                    : assets.length === 0
                      ? "Fetching scores for your watchlist…"
                      : "Top picks ranked by AI score — updated on demand"}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isLoading && (
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 sm:px-2.5 py-1 rounded-lg">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Analyzing</span>
            </div>
          )}
          {!isLoading && !hasNoStocks && (
            <button
              onClick={handleRetry}
              className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-neutral-300 bg-slate-100 dark:bg-[#171717] hover:bg-slate-200 dark:hover:bg-[#202020] border border-slate-200 dark:border-[#242424] px-2 py-1 sm:px-2.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              ↺ Reload
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        {isLoading ? (
          [1, 2, 3].map((i) => <SkeletonRow key={i} />)
        ) : isError ? (
          <div className="text-center py-6 space-y-2">
            <div className="text-xl sm:text-2xl">⚠️</div>
            <p className="text-xs font-bold text-slate-700 dark:text-neutral-200">AI Rankings Unavailable</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              The AI ranking service could not be reached. Please check back later.
            </p>
            <button
              onClick={handleRetry}
              className="mt-2 text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-[#171717] hover:bg-slate-200 dark:hover:bg-[#202020] border border-slate-200 dark:border-[#242424] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              ↺ Reload AI Rankings
            </button>
          </div>
        ) : isFallback && assets.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <div className="text-xl sm:text-2xl">⚠️</div>
            <p className="text-xs font-bold text-slate-700 dark:text-neutral-200">Offline Mode</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              AI providers are unreachable and no cached rankings could be loaded.
            </p>
            <button
              onClick={handleRetry}
              className="mt-2 text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-[#171717] hover:bg-slate-200 dark:hover:bg-[#202020] border border-slate-200 dark:border-[#242424] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              ↺ Retry Connection
            </button>
          </div>
        ) : hasNoStocks ? (
          <div className="text-center py-6 text-slate-400 dark:text-neutral-500 text-xs">
            Add stocks to your watchlist to see AI-powered rankings.
          </div>
        ) : assets.length === 0 ? (
          [1, 2, 3].map((i) => <SkeletonRow key={i} />)
        ) : (
          [...assets]
            .sort((a, b) => b.score - a.score)
            .map((asset, index) => (
              <div
                key={asset.symbol}
                className="flex items-center gap-2.5 sm:gap-3 rounded-xl border border-slate-200 dark:border-[#242424] bg-slate-50/80 dark:bg-[#141414] p-2.5 sm:p-3 hover:bg-slate-100/80 dark:hover:bg-[#171717] transition-colors"
              >
                {/* Rank badge */}
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-slate-200 dark:bg-[#202020] flex items-center justify-center shrink-0">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-600 dark:text-neutral-400">#{index + 1}</span>
                </div>

                {/* Symbol + verdict */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white text-xs leading-tight uppercase truncate">
                    {asset.symbol}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <VerdictBadge verdict={asset.verdict} />
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-neutral-400 mt-0.5 leading-snug truncate">
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