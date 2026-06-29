import React from "react";

interface ToggleRowProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function ToggleRow({
  icon,
  title,
  description,
  value,
  onChange
}: ToggleRowProps) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-slate-800 last:border-none gap-4">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="p-2 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-xl text-slate-500 dark:text-slate-400 shrink-0">
            {icon}
          </div>
        )}
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</p>
          {description && (
            <p className="text-xs text-slate-400 dark:text-slate-550 leading-relaxed font-semibold">{description}</p>
          )}
        </div>
      </div>

      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6.5 rounded-full shrink-0 transition-all duration-300 ${
          value ? "bg-cyan-500 shadow-md shadow-cyan-500/25" : "bg-slate-200 dark:bg-white/10"
        }`}
      >
        <div
          className={`absolute top-0.75 h-5 w-5 rounded-full bg-white dark:bg-slate-100 shadow-sm transition-all duration-300 ${
            value ? "left-6" : "left-0.75"
          }`}
        />
      </button>
    </div>
  );
}
