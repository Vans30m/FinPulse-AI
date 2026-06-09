interface Props {
  symbol: string;
  candle: any;
}

export default function ChartHeader({
  symbol,
  candle,
}: Props) {
  if (!candle) return null;

  return (
    <div
      className="
      flex
      flex-wrap
      gap-4
      items-center
      text-sm
      font-medium
      mb-4
      "
    >
      <span className="font-bold">
        {symbol}
      </span>

      <span>
        O {candle.open}
      </span>

      <span>
        H {candle.high}
      </span>

      <span>
        L {candle.low}
      </span>

      <span>
        C {candle.close}
      </span>
    </div>
  );
}