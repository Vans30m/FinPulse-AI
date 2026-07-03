interface Props {
  className?: string;
}

const legendScale = [
  { label: "Large Loss", className: "bg-rose-600/90" },
  { label: "Small Loss", className: "bg-rose-500/50" },
  { label: "Neutral", className: "bg-slate-600/60" },
  { label: "Small Gain", className: "bg-emerald-500/45" },
  { label: "Large Gain", className: "bg-emerald-500/90" },
];

export default function HeatmapLegend({ className = "" }: Props) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-2.5 sm:justify-between ${className}`}>
      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Return Intensity</span>
      <div className="flex items-center gap-2.5 flex-wrap">
        {legendScale.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-sm border border-slate-900/50 ${item.className}`} />
            <span className="text-[10px] text-slate-400 font-semibold">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
