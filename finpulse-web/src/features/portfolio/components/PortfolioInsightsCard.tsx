interface Props {
  insights: string[];
}

export default function PortfolioInsightsCard({
  insights,
}: Props) {
  return (
    <div className="bg-white dark:bg-night-950 rounded-3xl border p-6">

      <h2 className="text-xl font-bold mb-5">
        AI Portfolio Insights
      </h2>

      <div className="space-y-3">

        {insights.map(
          (insight, index) => (
            <div
              key={index}
              className="
              flex
              items-start
              gap-3
              rounded-xl
              bg-slate-50
              dark:bg-white/5
              p-3
              "
            >
              <div className="text-cyan-500">
                ✓
              </div>

              <div className="text-sm">
                {insight}
              </div>

            </div>
          )
        )}

      </div>

    </div>
  );
}