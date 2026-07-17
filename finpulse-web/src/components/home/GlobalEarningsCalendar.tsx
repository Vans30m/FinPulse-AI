import { useState, lazy, Suspense, useRef, memo } from 'react';
import { useUpcomingEarnings } from '../../hooks/useUpcomingEarnings';
import type { UpcomingEarning } from '../../types/earnings';
import { Sparkles, TrendingUp, TrendingDown, Calendar, ChevronLeft, ChevronRight, AlertCircle, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { StockLogo } from '../../utils/logo';
import { useProfile } from '../../profile/hooks/useProfile';

// Lazy load modal
const CompanyEarningsModal = lazy(() => import('./CompanyEarningsModal'));

// ----------------------------------------------------
// 1. COUNTDOWN BADGE COMPONENT
// ----------------------------------------------------
function CountdownBadge({ earningsDate }: { earningsDate: string | null }) {
  if (!earningsDate) {
    return (
      <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-night-800 px-2.5 py-0.5 text-xs font-bold text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5 uppercase tracking-wide">
        Upcoming
      </span>
    );
  }

  const localToday = new Date();
  localToday.setHours(0, 0, 0, 0);

  const targetDate = new Date(earningsDate);
  const targetLocal = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  );

  const diffTime = targetLocal.getTime() - localToday.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return (
      <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500 border border-emerald-500/20 uppercase tracking-wide animate-pulse">
        Today
      </span>
    );
  } else if (diffDays === 1) {
    return (
      <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-500 border border-amber-500/20 uppercase tracking-wide">
        Tomorrow
      </span>
    );
  } else if (diffDays < 0) {
    return (
      <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-night-800 px-2.5 py-0.5 text-xs font-bold text-slate-400 dark:text-slate-600 border border-slate-200/40 dark:border-white/5 uppercase tracking-wide">
        Passed
      </span>
    );
  } else if (diffDays <= 7) {
    return (
      <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-500 border border-blue-500/20 uppercase tracking-wide">
        {diffDays} Days
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-500 border border-indigo-500/20 uppercase tracking-wide">
        1 Week+
      </span>
    );
  }
}

// ----------------------------------------------------
// 2. EARNINGS CARD COMPONENT
// ----------------------------------------------------
const EarningsCard = memo(function EarningsCard({
  earning,
  onClick
}: {
  earning: UpcomingEarning;
  onClick: (earning: UpcomingEarning) => void;
}) {
  const { data: profile } = useProfile();
  const isPositive = earning.changePercent >= 0;

  const formatMarketCap = (val: number) => {
    if (!val) return "N/A";
    if (val >= 1e12) return `${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
    return val.toLocaleString();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: profile?.timezone || undefined
      });
    } catch (e) {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };



  return (
    <motion.div
      onClick={() => onClick(earning)}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="glass-card flex flex-col justify-between p-5 cursor-pointer relative overflow-hidden group hover:border-blue-400/40 dark:hover:border-cyan-500/30 hover:shadow-lg dark:hover:shadow-glow transition-all duration-300 h-full"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-cyan-500/5 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />

      <div>
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <StockLogo symbol={earning.symbol} name={earning.name} className="h-11 w-11 shrink-0" imgSizeClass="w-8 h-8" />

            <div className="hidden sm:flex flex-col min-w-0">
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight truncate block" title={earning.symbol}>
                {earning.symbol}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5 truncate block">
                {earning.exchange}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <CountdownBadge earningsDate={earning.earningsDate} />
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-display font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors text-base line-clamp-1">
            {earning.name}
          </h4>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block mt-0.5">
            {earning.sector}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-white/5 pt-3 pb-3 mb-3">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Price ({earning.currency})</span>
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 mt-0.5">
              <span className="font-mono text-lg font-black tracking-tight text-slate-800 dark:text-slate-100">
                {earning.price !== undefined ? `${earning.price.toFixed(2)}` : "N/A"}
              </span>
              <span className={`inline-flex items-center gap-0.5 text-xs font-bold font-mono ${isPositive ? 'text-emerald-650 dark:text-emerald-400' : 'text-rose-500'}`}>
                {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {isPositive ? "+" : ""}{earning.changePercent ? earning.changePercent.toFixed(2) : "0.00"}%
              </span>
            </div>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Market Cap</span>
            <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block">
              {formatMarketCap(earning.marketCap)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-3 mt-auto">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Earnings Date</span>
            <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
              {formatDate(earning.earningsDate)}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Est. EPS</span>
          <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5 block">
            {earning.estimatedEPS !== null ? `$${earning.estimatedEPS.toFixed(2)}` : "N/A"}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

// ----------------------------------------------------
// 3. EARNINGS GRID COMPONENT
// ----------------------------------------------------
function EarningsGrid({
  earnings,
  isLoading,
  isError,
  onRetry,
  onCardClick
}: {
  earnings: UpcomingEarning[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onCardClick: (earning: UpcomingEarning) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      const containerWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: -containerWidth, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const containerWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: containerWidth, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-6 pb-4 w-full">
        {Array.from({ length: 10 }).map((_, idx) => (
          <div
            key={idx}
            className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] flex-shrink-0 snap-start glass-card flex flex-col justify-between p-5 border border-slate-200/20 dark:border-white/5 animate-pulse min-h-[220px]"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-night-800 shrink-0" />
                  <div className="space-y-1.5 w-1/2">
                    <div className="h-4 w-12 bg-slate-200 dark:bg-night-800 rounded" />
                    <div className="h-3 w-16 bg-slate-200 dark:bg-night-800 rounded" />
                  </div>
                </div>
                <div className="h-5 w-16 bg-slate-200 dark:bg-night-800 rounded-md shrink-0" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="h-5 w-3/4 bg-slate-200 dark:bg-night-800 rounded" />
                <div className="h-3.5 w-1/2 bg-slate-200 dark:bg-night-800 rounded" />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-white/5 pt-3 pb-3 mb-3">
                <div className="space-y-1.5">
                  <div className="h-2 w-10 bg-slate-200 dark:bg-night-800 rounded" />
                  <div className="h-5 w-14 bg-slate-200 dark:bg-night-800 rounded" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 w-14 bg-slate-200 dark:bg-night-800 rounded" />
                  <div className="h-5 w-16 bg-slate-200 dark:bg-night-800 rounded" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-3 mt-auto">
              <div className="flex items-center gap-1.5 w-1/2">
                <div className="h-3 w-3 rounded bg-slate-200 dark:bg-night-800 shrink-0" />
                <div className="space-y-1 w-full">
                  <div className="h-2 w-10 bg-slate-200 dark:bg-night-800 rounded" />
                  <div className="h-3 w-16 bg-slate-200 dark:bg-night-800 rounded" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="h-2 w-10 bg-slate-200 dark:bg-night-800 rounded ml-auto" />
                <div className="h-3.5 w-12 bg-slate-200 dark:bg-night-800 rounded ml-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-3xl border border-rose-200/30 dark:border-rose-500/20 bg-rose-500/5 backdrop-blur-md space-y-4 max-w-lg mx-auto text-center">
        <AlertCircle className="h-10 w-10 text-rose-500 animate-bounce" />
        <div>
          <h4 className="font-display font-bold text-slate-800 dark:text-white">Failed to fetch earnings calendar</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            We encountered a connection issue fetching the latest Yahoo Finance data.
          </p>
        </div>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 rounded-xl shadow-md transition-all active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Retry Fetching</span>
        </button>
      </div>
    );
  }

  if (earnings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-3xl border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-night-950/20 text-center max-w-lg mx-auto space-y-3">
        <span className="text-3xl">📅</span>
        <h4 className="font-display font-bold text-slate-800 dark:text-white">No upcoming earnings available</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          There are no corporate announcements scheduled for the chosen country tab within the upcoming weeks.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full group">
      {earnings.length > 2 && (
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none z-10 -mx-4 md:-mx-6">
          <button
            onClick={scrollLeft}
            className="w-11 h-11 rounded-full bg-white/95 dark:bg-night-900/95 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-400 shadow-lg hover:shadow-xl transition-all active:scale-95 pointer-events-auto opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={scrollRight}
            className="w-11 h-11 rounded-full bg-white/95 dark:bg-night-900/95 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-400 shadow-lg hover:shadow-xl transition-all active:scale-95 pointer-events-auto opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Next page"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-6 pb-4 w-full"
      >
        {earnings.map((earning) => (
          <div
            key={earning.symbol}
            className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] flex-shrink-0 snap-start"
          >
            <EarningsCard
              earning={earning}
              onClick={onCardClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4. COUNTRY TABS COMPONENT
// ----------------------------------------------------
export const COUNTRIES = [
  { id: 'india', name: 'India', flag: '🇮🇳' },
  { id: 'usa', name: 'USA', flag: '🇺🇸' },
  { id: 'japan', name: 'Japan', flag: '🇯🇵' },
  { id: 'hongkong', name: 'Hong Kong', flag: '🇭🇰' },
  { id: 'uk', name: 'United Kingdom', flag: '🇬🇧' },
  { id: 'germany', name: 'Germany', flag: '🇩🇪' }
];

const CountryTabs = memo(function CountryTabs({
  activeMarket,
  onChange
}: {
  activeMarket: string;
  onChange: (marketId: string) => void;
}) {
  return (
    <div className="w-full overflow-x-auto scrollbar-none border-b border-slate-200/50 dark:border-white/5 pb-2">
      <div className="flex gap-2 min-w-max p-1 bg-slate-100/50 dark:bg-night-950/40 rounded-2xl border border-slate-200/40 dark:border-white/5 w-fit">
        {COUNTRIES.map((country) => {
          const isActive = activeMarket === country.id;
          return (
            <button
              key={country.id}
              onClick={() => onChange(country.id)}
              className={`
                relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-display text-sm font-semibold transition-all duration-300 select-none z-10
                ${isActive
                  ? 'text-white dark:text-cyan-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'}
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-blue-600 dark:bg-cyan-500/20 rounded-xl border border-transparent dark:border-cyan-500/30 shadow-md dark:shadow-glow -z-10"
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                />
              )}
              <span className="text-base">{country.flag}</span>
              <span>{country.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

// ----------------------------------------------------
// 5. GLOBAL EARNINGS CALENDAR MAIN COMPONENT
// ----------------------------------------------------
export default function GlobalEarningsCalendar() {
  const [activeMarket, setActiveMarket] = useState<string>('india');
  const [selectedEarning, setSelectedEarning] = useState<UpcomingEarning | null>(null);

  const { data = [], isLoading, isError, refetch } = useUpcomingEarnings(activeMarket);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-white/5 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 dark:from-cyan-500/10 dark:to-cyan-400/20 text-white dark:text-cyan-400 border border-indigo-500/10 dark:border-cyan-500/30 shadow-md">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 border border-blue-200/40 dark:border-cyan-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-widest font-black">
              Upcoming Schedule
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Global Earnings Calendar
            </h2>
          </div>
        </div>
      </div>

      <CountryTabs activeMarket={activeMarket} onChange={setActiveMarket} />

      <EarningsGrid
        earnings={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onCardClick={setSelectedEarning}
      />

      <AnimatePresence>
        {selectedEarning && (
          <Suspense fallback={null}>
            <CompanyEarningsModal
              earning={selectedEarning}
              onClose={() => setSelectedEarning(null)}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}