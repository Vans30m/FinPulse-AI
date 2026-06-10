interface EarningsEvent {
  symbol: string;
  date: string;
}

interface Props {
  earnings: EarningsEvent[];
}

export default function EarningsCalendarCard({
  earnings,
}: Props) {
  return (
    <div className="rounded-3xl border p-6 bg-white dark:bg-night-950">

      <h2 className="text-xl font-bold mb-5">
        Upcoming Earnings
      </h2>

      <div className="space-y-4">

        {earnings.map(
          (item) => (
            <div
              key={item.symbol}
              className="flex justify-between"
            >
              <span className="font-semibold">
                {item.symbol}
              </span>

              <span className="text-slate-500">
                {item.date}
              </span>
            </div>
          )
        )}

      </div>

    </div>
  );
}