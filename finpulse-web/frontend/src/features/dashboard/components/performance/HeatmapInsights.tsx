interface Props {
  insights: string[];
}

export default function HeatmapInsights({ insights }: Props) {
  return (
    <div className="mt-6 bg-[#050711]/55 border border-slate-900 rounded-2xl p-4">
      <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
        <span className="h-2 w-2 rounded-full bg-blue-400" />
        <span className="text-xs font-black uppercase tracking-wider text-slate-200">Performance Heatmap Insights</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight) => (
          <div key={insight} className="rounded-2xl border border-slate-900 bg-[#050711]/80 p-3 text-xs text-slate-300 flex items-start gap-2.5">
            <span className="h-2 w-2 rounded-full bg-slate-300 shrink-0 mt-1" />
            <span>{insight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

