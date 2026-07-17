import type { UpcomingEarning } from '../../types/earnings';
import { X, Globe, Calendar, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { StockLogo } from '../../utils/logo';
import { useProfile } from '../../profile/hooks/useProfile';

interface Props {
  earning: UpcomingEarning | null;
  onClose: () => void;
}

export default function CompanyEarningsModal({ earning, onClose }: Props) {
  const { data: profile } = useProfile();
  if (!earning) return null;

  const formatLargeNum = (val?: number) => {
    if (val === undefined || val === 0) return "N/A";
    if (val >= 1e12) return `${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
    return val.toLocaleString();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: profile?.timezone || undefined
      });
    } catch (e) {
      return new Date(dateStr).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 dark:bg-night-950/80 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white dark:bg-night-900 border border-slate-200/50 dark:border-white/10 shadow-2xl p-6 md:p-8 custom-scrollbar flex flex-col space-y-6"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-5">
          <div className="flex items-center gap-4">
            <StockLogo symbol={earning.symbol} name={earning.name} className="h-14 w-14" imgSizeClass="w-10 h-10" />

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl md:text-2xl font-bold font-display text-slate-900 dark:text-white leading-tight">
                  {earning.name}
                </h3>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-500/10 px-2 py-0.5 rounded border border-blue-200/40 dark:border-cyan-500/20 uppercase">
                  {earning.symbol}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5">
                <span>{earning.exchange}</span>
                <span>•</span>
                <span>{earning.country.toUpperCase()}</span>
                <span>•</span>
                <span>{earning.currency}</span>
              </p>
            </div>
          </div>

          <div className="text-left md:text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Current Value</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="font-mono text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {earning.price !== undefined ? `${earning.price.toFixed(2)}` : "N/A"}
              </span>
              <span className={`font-mono text-xs font-bold ${earning.changePercent >= 0 ? 'text-green-600 dark:text-cyan-400' : 'text-red-500'}`}>
                {earning.changePercent >= 0 ? "+" : ""}{earning.changePercent ? earning.changePercent.toFixed(2) : "0.00"}%
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50/50 dark:bg-night-950/40 border border-slate-100 dark:border-white/5 p-3 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Sector</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 block truncate" title={earning.sector}>
              {earning.sector}
            </span>
          </div>

          <div className="bg-slate-50/50 dark:bg-night-950/40 border border-slate-100 dark:border-white/5 p-3 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Industry</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 block truncate" title={earning.industry}>
              {earning.industry}
            </span>
          </div>

          <div className="bg-slate-50/50 dark:bg-night-950/40 border border-slate-100 dark:border-white/5 p-3 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Market Cap</span>
            <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block">
              {formatLargeNum(earning.marketCap)}
            </span>
          </div>

          <div className="bg-slate-50/50 dark:bg-night-950/40 border border-slate-100 dark:border-white/5 p-3 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">TTM Revenue</span>
            <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block">
              {formatLargeNum(earning.revenue)}
            </span>
          </div>
        </div>

        {/* Detailed Metrics Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-night-950/30 border border-slate-100 dark:border-white/5 p-5 rounded-3xl">
          {/* Earnings Info Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-200/50 dark:border-white/5">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
              <h4 className="font-display font-bold text-sm uppercase tracking-wider">Earnings Schedule</h4>
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Next Earnings Date</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {formatDate(earning.earningsDate)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Estimated EPS Consensus</span>
                <span className="font-mono font-black text-slate-800 dark:text-slate-100">
                  {earning.estimatedEPS !== null ? `$${earning.estimatedEPS.toFixed(2)}` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Previous Reported EPS</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {earning.previousEPS !== null && earning.previousEPS !== undefined ? `$${earning.previousEPS.toFixed(2)}` : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Valuations Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-200/50 dark:border-white/5">
              <Activity className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
              <h4 className="font-display font-bold text-sm uppercase tracking-wider">Key Valuation Ratios</h4>
            </div>

            <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">TTM P/E Ratio</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {earning.peRatio ? `${earning.peRatio.toFixed(1)}x` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">TTM EPS</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {earning.eps ? `$${earning.eps.toFixed(2)}` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center col-span-2 border-t border-slate-200/40 dark:border-white/5 pt-3.5">
                <span className="text-slate-400 font-medium">52-Week Range</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {earning.weekLow52?.toFixed(2)} - {earning.weekHigh52?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center col-span-2">
                <span className="text-slate-400 font-medium">Dividend Yield</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {earning.dividendYield ? `${earning.dividendYield.toFixed(2)}%` : "0.00%"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Business Summary Description */}
        <div className="space-y-2">
          <h4 className="font-display font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Business Summary
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans text-justify">
            {earning.summary}
          </p>
        </div>

        {/* Modal Footer Links */}
        {earning.website && (
          <div className="flex items-center gap-2 border-t border-slate-100 dark:border-white/5 pt-4">
            <Globe className="h-4 w-4 text-slate-400" />
            <a
              href={earning.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline transition-all duration-200"
            >
              Visit corporate website: {earning.website.replace(/https?:\/\/(www\.)?/, "")}
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
}
