import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface StatisticCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  change?: string | number;
  isPositive?: boolean;
  delayIndex?: number;
}

export default function StatisticCard({
  icon,
  title,
  value,
  change,
  isPositive = true,
  delayIndex = 0
}: StatisticCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delayIndex * 0.04 }}
      className="group rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-3 sm:p-5 shadow-md hover:shadow-lg hover:border-blue-500/30 dark:hover:border-cyan-400/30 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/[0.01] dark:bg-cyan-500/[0.01] blur-xl pointer-events-none rounded-full" />
      
      <div className="flex flex-col justify-between h-full gap-2 sm:gap-4">
        {/* Top Row: Icon & Status Badge */}
        <div className="flex items-center justify-between w-full">
          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 group-hover:scale-105 transition-transform duration-300 text-blue-600 dark:text-cyan-400">
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-4 w-4 sm:h-5 sm:w-5' })}
          </div>
          
          {change !== undefined && (
            <span className={`px-1.5 py-0.5 rounded-lg text-[8px] sm:text-[10px] font-black border flex items-center gap-0.5 ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20"
            }`}>
              {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              {change}
            </span>
          )}
        </div>

        {/* Bottom Row: Title & Value */}
        <div className="min-w-0">
          <p className="text-[9px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 truncate" title={title}>
            {title}
          </p>
          <h4 className="text-xs sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1 font-mono tracking-tight truncate" title={String(value)}>
            {value}
          </h4>
        </div>
      </div>
    </motion.div>
  );
}
