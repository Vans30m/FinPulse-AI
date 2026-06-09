import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: {
    month: string;
    value: number;
  }[];
}

export default function PortfolioPerformanceChart({
  data,
}: Props) {
  return (
    <div className="rounded-3xl border p-6 bg-white dark:bg-night-950">

      <h2 className="text-xl font-bold mb-4">
        Portfolio Performance
      </h2>

      <div className="h-[350px]">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart data={data}>

            <XAxis dataKey="month" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="value"
              strokeWidth={3}
            />

          </LineChart>
        </ResponsiveContainer>

      </div>

    </div>
  );
}