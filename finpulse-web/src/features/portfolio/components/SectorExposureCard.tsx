interface Props {
  sectors: {
    sector: string;
    percentage: string;
    value: number;
  }[];
}

export default function SectorExposureCard({
  sectors,
}: Props) {
  return (
    <div className="rounded-3xl border p-6 bg-white dark:bg-night-950">

      <h2 className="text-xl font-bold mb-6">
        Sector Exposure
      </h2>

      <div className="space-y-5">

        {sectors.map(
          (sector) => (
            <div
              key={sector.sector}
            >
              <div className="flex justify-between mb-2">

                <span className="font-medium">
                  {sector.sector}
                </span>

                <span className="text-cyan-400">
                  {sector.percentage}%
                </span>

              </div>

              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">

                <div
                  className="h-full bg-cyan-500 rounded-full transition-all"
                  style={{
                    width: `${sector.percentage}%`,
                  }}
                />

              </div>

            </div>
          )
        )}

      </div>

    </div>
  );
}