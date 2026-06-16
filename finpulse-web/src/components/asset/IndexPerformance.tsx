interface Props {
  history: any[];
}

export default function IndexPerformance({
  history,
}: Props) {
  if (
    !history ||
    history.length < 2
  ) {
    return (
      <div className="rounded-2xl border p-6">
        Loading...
      </div>
    );
  }

  const latest =
    history[history.length - 1]
      .price;

  const calc = (
  periods: number
) => {
  const index =
    Math.max(
      0,
      history.length -
        periods
    );

  const old =
    history[index]?.price;

  if (!old) {
    return null;
  }

  return (
    ((latest - old) /
      old) *
    100
  );
};

  const perf = [
    {
      label: "1W",
      value: calc(5),
    },
    {
      label: "1M",
      value: calc(22),
    },
    {
      label: "6M",
      value: calc(126),
    },
    {
      label: "1Y",
      value: calc(252),
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900">
      <h2 className="text-xl font-bold mb-5">
        Performance
      </h2>

      <div className="space-y-3">
        {perf.map((p) => (
          <div
            key={p.label}
            className="flex justify-between"
          >
            <span>
              {p.label}
            </span>

            <span
              className={
                (p.value ?? 0) >= 0
                  ? "text-emerald-500 font-semibold"
                  : "text-rose-500 font-semibold"
              }
            >
              {p.value?.toFixed(
                2
              )}
              %
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}