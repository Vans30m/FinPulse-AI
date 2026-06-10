interface Props {
  insight: string;
  recommendation: string;
  score: number;
  topSector: string;
}

export default function AISectorAnalysisCard({
  insight,
  recommendation,
  score,
  topSector,
}: Props) {
  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6">

      <h2 className="text-xl font-bold mb-4">
        AI Sector Analysis
      </h2>

      <div className="text-4xl font-bold text-cyan-400">
        {score}/100
      </div>

      <div className="text-sm text-slate-400">
        Diversification Score
      </div>

      <div className="mt-4">
        <span className="font-semibold">
          Top Sector:
        </span>
        {" "}
        {topSector}
      </div>

      <p className="mt-4 text-slate-300">
        {insight}
      </p>

      <div className="mt-4 rounded-xl bg-slate-900/50 p-3">
        <div className="font-semibold text-cyan-400">
          Recommendation
        </div>

        <div className="mt-1 text-sm">
          {recommendation}
        </div>
      </div>

    </div>
  );
}