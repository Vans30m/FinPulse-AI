import { Layers } from "lucide-react";

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
    <div className="glass-panel p-6">
      <div className="flex items-center gap-2.5 mb-6">
        <Layers className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Sector Exposure
        </h2>
      </div>

      <div className="space-y-5">
        {sectors.map((sector) => (
          <div key={sector.sector} className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-700 dark:text-slate-300">
                {sector.sector}
              </span>
              <span className="text-blue-600 dark:text-cyan-400">
                {sector.percentage}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-cyan-500 rounded-full transition-all duration-500"
                style={{
                  width: `${sector.percentage}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}