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
  return (
    <div className="rounded-3xl border p-6 bg-white dark:bg-night-950">

      <h2 className="text-xl font-bold mb-4">
        Portfolio Risk Analysis
      </h2>

      <div className="text-4xl font-bold text-orange-500">
        {riskScore}/100
      </div>

      <div className="text-sm text-slate-500">
        Risk Score
      </div>

      <div className="mt-6 space-y-3">

        <div className="flex justify-between">
          <span>Expected Return</span>
          <span>
            +{expectedReturn}%
          </span>
        </div>

        <div className="flex justify-between">
          <span>Best Case</span>
          <span className="text-green-500">
            +{bestCase}%
          </span>
        </div>

        <div className="flex justify-between">
          <span>Worst Case</span>
          <span className="text-red-500">
            {worstCase}%
          </span>
        </div>

      </div>

    </div>
  );
}