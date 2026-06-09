interface Props {
  selected: string;
  onChange: (
    value: string
  ) => void;
}

const timeframes = [
  "1D",
  "1W",
  "1M",
  "6M",
  "1Y",
  "MAX",
];

export default function TimeframeSelector({
  selected,
  onChange,
}: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {timeframes.map(
        (tf) => (
          <button
            key={tf}
            onClick={() =>
              onChange(tf)
            }
            className={`
              px-4 py-2
              rounded-xl
              text-sm
              font-medium
              transition-all

              ${
                selected === tf
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-100 dark:bg-night-800"
              }
            `}
          >
            {tf}
          </button>
        )
      )}
    </div>
  );
}