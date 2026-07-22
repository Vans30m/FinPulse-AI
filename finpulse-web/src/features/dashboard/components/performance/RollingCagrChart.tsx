import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RollingCagrPoint } from "./rollingCagrTypes";

interface Props {
  data: RollingCagrPoint[];
}

export default function RollingCagrChart({ data }: Props) {
  return (
    <div className="bg-[#050711]/65 border border-slate-900 rounded-2xl p-4 h-[360px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={data} margin={{ top: 10, right: 14, left: -8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
          <XAxis dataKey="period" stroke="#64748b" fontSize={10} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            formatter={(value) => `${Number(value ?? 0).toFixed(2)}%`}
            contentStyle={{ backgroundColor: "#121a2a", borderColor: "#0f172a", borderRadius: "12px", fontSize: "11px" }}
          />
          <Legend wrapperStyle={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }} />

          <Line type="monotone" dataKey="portfolio" stroke="#38bdf8" strokeWidth={3} dot={false} name="Portfolio" />
          <Line type="monotone" dataKey="nifty50" stroke="#10b981" strokeWidth={2} dot={false} name="NIFTY 50" />
          <Line type="monotone" dataKey="sp500" stroke="#6366f1" strokeWidth={2} dot={false} name="S&P 500" />
          <Line type="monotone" dataKey="nasdaq" stroke="#a855f7" strokeWidth={2} dot={false} name="NASDAQ" />
          <Line type="monotone" dataKey="gold" stroke="#f59e0b" strokeWidth={2} dot={false} name="Gold" />
          <Line type="monotone" dataKey="bitcoin" stroke="#f97316" strokeWidth={2} dot={false} name="Bitcoin" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
