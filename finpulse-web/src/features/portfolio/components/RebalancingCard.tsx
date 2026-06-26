import { AlertTriangle } from "lucide-react";

interface Props {
  suggestions: string[];
}

export default function RebalancingCard({
  suggestions,
}: Props) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diagnostics Summary</span>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">Exposure Realignment</h3>
      </div>

      <div className="space-y-3">
        {suggestions.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/[0.03] dark:bg-amber-500/[0.01] p-4 text-sm text-amber-800 dark:text-amber-350 font-semibold"
          >
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}