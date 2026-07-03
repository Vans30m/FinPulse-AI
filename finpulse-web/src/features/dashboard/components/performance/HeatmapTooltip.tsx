import type { DailyPerformancePoint } from "./types";

interface Props {
  point: DailyPerformancePoint;
  x: number;
  y: number;
}

const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function formatSigned(value: number, suffix: string = "") {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${Math.abs(value).toFixed(2)}${suffix}`;
}

export default function HeatmapTooltip({ point, x, y }: Props) {
  const date = new Date(`${point.date}T00:00:00Z`);
  const dateLabel = date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="pointer-events-none absolute z-20 w-[255px] rounded-2xl border border-slate-800 bg-[#050711]/95 backdrop-blur-md p-3.5 shadow-2xl"
      style={{ left: x + 12, top: y + 12 }}
    >
      <p className="text-xs font-black text-white mb-2.5">{dateLabel}</p>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex justify-between text-slate-300"><span>Portfolio Return:</span><span className={point.portfolioReturn >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{formatSigned(point.portfolioReturn, "%")}</span></div>
        <div className="flex justify-between text-slate-300"><span>Profit/Loss:</span><span className={point.profitLoss >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{point.profitLoss >= 0 ? "+" : "-"}{moneyFormatter.format(Math.abs(point.profitLoss))}</span></div>
        <div className="flex justify-between text-slate-300"><span>Portfolio Value:</span><span className="text-white font-bold">{moneyFormatter.format(point.portfolioValue)}</span></div>
        <div className="flex justify-between text-slate-300"><span>Benchmark:</span><span className={point.benchmarkReturn >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{formatSigned(point.benchmarkReturn, "%")}</span></div>
        <div className="flex justify-between text-slate-300"><span>Difference:</span><span className={point.differenceVsBenchmark >= 0 ? "text-cyan-400 font-bold" : "text-rose-400 font-bold"}>{formatSigned(point.differenceVsBenchmark, "%")}</span></div>
        <div className="flex justify-between text-slate-300"><span>Volume:</span><span className="text-slate-100 font-semibold">{point.tradingVolume.toLocaleString()}</span></div>
      </div>
    </div>
  );
}
