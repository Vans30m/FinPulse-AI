import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: {
    name: string;
    value: number;
  }[];
}

const COLORS = [
  "#06b6d4",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
];

export default function PortfolioAllocationChart({
  data,
}: Props) {
  return (
    <div className="bg-white dark:bg-night-950 rounded-3xl border p-6">

      <h2 className="text-xl font-bold mb-4">
        Portfolio Allocation
      </h2>

      <div className="h-[350px]">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart>

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={120}
              label
            >
              {data.map(
                (_, index) => (
                  <Cell
                    key={index}
                    fill={
                      COLORS[
                        index %
                          COLORS.length
                      ]
                    }
                  />
                )
              )}
            </Pie>

            <Tooltip />

          </PieChart>
        </ResponsiveContainer>

      </div>

    </div>
  );
}