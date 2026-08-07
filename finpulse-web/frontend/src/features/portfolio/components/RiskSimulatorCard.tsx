import { ShieldAlert, ArrowUpRight } from "lucide-react";

interface Props {
  riskScore: number;
  expectedReturn: number;
  bestCase: number;
  worstCase: number;
}

export default function RiskSimulatorCard({
  riskScore,
  expectedReturn,
  bestCase,
  worstCase,
}: Props) {
  const getRiskLabel = (val: number) => {
    if (val >= 70) return "High Risk";
    if (val >= 40) return "Moderate Risk";
    return "Low Risk";
  };

  const getRiskColor = (val: number) => {
    if (val >= 70) return "text-red-500 dark:text-red-400";
    if (val >= 40) return "text-orange-500 dark:text-orange-400";
    return "text-emerald-500 dark:text-emerald-400";
  };

  return (
    <div className="glass-panel p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:scale-110 transition-transform">
        <ShieldAlert className="h-28 w-28 text-orange-500" />
      </div>

      <div className="flex items-center gap-2.5 mb-5">
        <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Portfolio Risk Analysis
        </h2>
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-5xl font-black tracking-tight ${getRiskColor(riskScore)}`}>
          {riskScore}
        </span>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          / 100 {getRiskLabel(riskScore)}
        </span>
      </div>

      <div className="mt-6 space-y-3.5">
        <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800/40 pb-2.5">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Expected Return</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">+{expectedReturn}%</span>
        </div>

        <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800/40 pb-2.5">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Best Case Scenario</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <ArrowUpRight className="h-4 w-4" /> +{bestCase}%
          </span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Worst Case Scenario</span>
          <span className="font-bold text-rose-600 dark:text-rose-450">
            {worstCase}%
          </span>
        </div>
      </div>
    </div>
  );
}