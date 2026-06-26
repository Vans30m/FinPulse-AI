interface Props {
  data: any;
}

export default function IndexStatistics({
  data,
}: Props) {
  if (!data) {
    return (
      <div className="rounded-2xl border p-6">
        Loading...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-sm">
      <h2 className="text-xl font-bold mb-5">
        Index Statistics
      </h2>

      <div className="space-y-3">

        <div className="flex justify-between">
          <span>Current Value</span>
          <span className="font-semibold">
            {data.current?.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Day High</span>
          <span className="text-emerald-500 font-semibold">
            {data.dayHigh?.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Day Low</span>
          <span className="text-rose-500 font-semibold">
            {data.dayLow?.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span>52W High</span>
          <span>
            {data.fiftyTwoWeekHigh?.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span>52W Low</span>
          <span>
            {data.fiftyTwoWeekLow?.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between border-t pt-3">
          <span>Daily Change</span>

          <span
            className={
              data.change >= 0
                ? "text-emerald-500 font-semibold"
                : "text-rose-500 font-semibold"
            }
          >
            {data.change?.toFixed(2)}
            {" "}
            (
            {data.changePercent?.toFixed(
              2
            )}
            %)
          </span>
        </div>

      </div>
    </div>
  );
}