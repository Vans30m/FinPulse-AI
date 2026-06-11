interface Props {
  score: number;
  diversification: string;
  risk: string;
  growth: string;
}

export default function PortfolioHealthCard({
  score,
  diversification,
  risk,
  growth,
}: Props) {
  return (
    <div className="bg-white dark:bg-night-950 rounded-3xl border p-6">

      <h2 className="text-xl font-bold mb-4">
        AI Portfolio Health
      </h2>

      <div className="text-5xl font-black text-cyan-500">
        {score}
      </div>

      <div className="text-sm text-slate-500">
        Health Score
      </div>

      <div className="mt-6 space-y-3">

        <div className="flex justify-between">
          <span>Diversification</span>
          <span>{diversification}</span>
        </div>

        <div className="flex justify-between">
          <span>Risk</span>
          <span>{risk}</span>
        </div>

        <div className="flex justify-between">
          <span>Growth Potential</span>
          <span>{growth}</span>
        </div>

      </div>

    </div>
  );
}