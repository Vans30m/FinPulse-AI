import { X } from "lucide-react";
import type { DailyPerformancePoint } from "./types";

interface Props {
  point: DailyPerformancePoint | null;
  onClose: () => void;
}

const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function HeatmapDayModal({ point, onClose }: Props) {
  if (!point) return null;

  const date = new Date(`${point.date}T00:00:00Z`);
  const dateLabel = date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-night-950/65 backdrop-blur-sm" onClick={onClose} aria-label="Close day details" />

      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-900 bg-[#121a2a] shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-4 mb-5 border-b border-slate-900 pb-4">
          <div>
            <h3 className="text-lg font-black text-white">{dateLabel}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Detailed daily attribution and AI summary</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-900 p-2 text-slate-400 hover:text-white hover:bg-[#050711] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div className="bg-[#050711]/70 border border-slate-900 rounded-2xl p-3"><span className="text-slate-500 uppercase text-[10px] font-bold">Daily Return</span><p className={`font-black mt-1 ${point.portfolioReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{point.portfolioReturn >= 0 ? "+" : ""}{point.portfolioReturn.toFixed(2)}%</p></div>
          <div className="bg-[#050711]/70 border border-slate-900 rounded-2xl p-3"><span className="text-slate-500 uppercase text-[10px] font-bold">Portfolio Value</span><p className="font-black mt-1 text-white">{moneyFormatter.format(point.portfolioValue)}</p></div>
          <div className="bg-[#050711]/70 border border-slate-900 rounded-2xl p-3"><span className="text-slate-500 uppercase text-[10px] font-bold">Realized P/L</span><p className={point.realizedProfitLoss >= 0 ? "font-black mt-1 text-emerald-400" : "font-black mt-1 text-rose-400"}>{point.realizedProfitLoss >= 0 ? "+" : "-"}{moneyFormatter.format(Math.abs(point.realizedProfitLoss))}</p></div>
          <div className="bg-[#050711]/70 border border-slate-900 rounded-2xl p-3"><span className="text-slate-500 uppercase text-[10px] font-bold">Unrealized P/L</span><p className={point.unrealizedProfitLoss >= 0 ? "font-black mt-1 text-emerald-400" : "font-black mt-1 text-rose-400"}>{point.unrealizedProfitLoss >= 0 ? "+" : "-"}{moneyFormatter.format(Math.abs(point.unrealizedProfitLoss))}</p></div>
        </div>

        <div className="mt-4 rounded-2xl bg-[#050711]/70 border border-slate-900 p-4 text-xs space-y-2">
          <p className="text-slate-300"><span className="text-slate-500 uppercase text-[10px] font-bold">Assets Responsible:</span> {point.assetsResponsible.join(", ")}</p>
          <p className="text-slate-300"><span className="text-slate-500 uppercase text-[10px] font-bold">Top Contributor:</span> <span className="text-emerald-400 font-bold">{point.topContributor.symbol}</span> ({point.topContributor.contribution >= 0 ? "+" : ""}{moneyFormatter.format(point.topContributor.contribution)})</p>
          <p className="text-slate-300"><span className="text-slate-500 uppercase text-[10px] font-bold">Worst Performer:</span> <span className="text-rose-400 font-bold">{point.worstPerformer.symbol}</span> ({point.worstPerformer.contribution >= 0 ? "+" : ""}{moneyFormatter.format(point.worstPerformer.contribution)})</p>
          <p className="text-slate-300"><span className="text-slate-500 uppercase text-[10px] font-bold">AI Summary:</span> {point.aiSummary}</p>
        </div>
      </div>
    </div>
  );
}
