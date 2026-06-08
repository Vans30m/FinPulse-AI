export default function MarketStatusBar() {
  return (
    <div className="
      flex
      gap-6
      px-6
      py-2
      text-sm
      border-b
      border-white/10
    ">
      <div className="text-green-400">
        ● NSE OPEN
      </div>

      <div className="text-red-400">
        ● NASDAQ CLOSED
      </div>

      <div className="text-green-400">
        ● CRYPTO OPEN
      </div>

      <div className="text-green-400">
        ● FOREX OPEN
      </div>
    </div>
  );
}