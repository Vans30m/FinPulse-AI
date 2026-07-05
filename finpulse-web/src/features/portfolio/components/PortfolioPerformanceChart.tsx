import CandlestickChart from "../../../components/charts/CandlestickChart";
import { TrendingUp } from "lucide-react";

interface Props {
  data: {
    month: string;
    value: number;
  }[];
}

export default function PortfolioPerformanceChart({
  data: initialData,
}: Props) {
  const hasNoData = !initialData || initialData.length === 0;

  if (hasNoData) {
    return (
      <div className="glass-panel p-6 flex flex-col justify-center items-center py-20 text-center">
        <TrendingUp className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
        <h3 className="font-extrabold text-base text-slate-750 dark:text-white">
          Portfolio Performance History
        </h3>
        <p className="text-xs text-slate-400 mt-1.5 max-w-xs">
          No transaction history found. Your performance chart will generate automatically once you add your first transaction.
        </p>
      </div>
    );
  }

  // Map month strings to sequential date strings for lightweight-charts compatibility
  const mappedChartData = initialData.map((d, index) => {
    const date = new Date("2026-01-01");
    date.setDate(date.getDate() + index);
    const timeStr = date.toISOString().split("T")[0];
    return {
      time: timeStr,
      value: d.value
    };
  });

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-2.5 mb-6">
        <TrendingUp className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Portfolio Performance
        </h2>
      </div>

      <div className="h-[320px] w-full">
        <CandlestickChart
          customData={mappedChartData}
          chartType="area"
          height={320}
        />
      </div>
    </div>
  );
}