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
      className="group rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-5 shadow-md hover:shadow-lg hover:border-blue-500/30 dark:hover:border-cyan-400/30 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/[0.01] dark:bg-cyan-500/[0.01] blur-xl pointer-events-none rounded-full" />
      
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 group-hover:scale-105 transition-transform duration-300 text-blue-600 dark:text-cyan-400">
            {icon}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{title}</p>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono tracking-tight">
              {value}
            </h4>
          </div>
        </div>

        {change !== undefined && (
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border flex items-center gap-0.5 ${
            isPositive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20"
          }`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change}
          </span>
        )}
      </div>
    </motion.div>
  );
}
