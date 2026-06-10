interface RankedAsset {
  symbol: string;
  score: number;
  verdict: string;
}

interface Props {
  assets: RankedAsset[];
}

export default function AIRankingCard({
  assets,
}: Props) {
  return (
    <div className="bg-white dark:bg-night-950 rounded-3xl border p-6">

      <h2 className="text-xl font-bold mb-5">
        FinPulse AI Rankings
      </h2>

      <div className="space-y-3">

        {assets.map(
          (asset, index) => (
            <div
              key={asset.symbol}
              className="
              flex
              items-center
              justify-between
              rounded-xl
              border
              p-4
              "
            >
              <div>

                <div className="font-bold">
                  #{index + 1}
                  {" "}
                  {asset.symbol}
                </div>

                <div className="text-sm text-slate-500">
                  {asset.verdict}
                </div>

              </div>

              <div className="text-2xl font-black text-cyan-500">
                {asset.score}
              </div>

            </div>
          )
        )}

      </div>

    </div>
  );
}