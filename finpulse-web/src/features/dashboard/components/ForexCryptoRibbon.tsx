import { useEffect, useState } from "react";
import { getFundamentalsBatch } from "../../../services/marketService";

interface RibbonItem {
  pair: string;
  price: string;
  change: string;
  up: boolean;
}

const TICKER_MAP = [
  { pair: "USD/INR", symbol: "INR=X" },
  { pair: "EUR/USD", symbol: "EURUSD=X" },
  { pair: "GBP/USD", symbol: "GBPUSD=X" },
  { pair: "BTC/USD", symbol: "BTC-USD" },
  { pair: "ETH/USD", symbol: "ETH-USD" },
  { pair: "SOL/USD", symbol: "SOL-USD" },
];

export default function ForexCryptoRibbon() {
  const [items, setItems] = useState<RibbonItem[]>([
    { pair: "USD/INR", price: "83.45", change: "+0.12%", up: true },
    { pair: "EUR/USD", price: "1.0840", change: "-0.22%", up: false },
    { pair: "GBP/USD", price: "1.2650", change: "+0.05%", up: true },
    { pair: "BTC/USD", price: "67,250", change: "+3.40%", up: true },
    { pair: "ETH/USD", price: "3,520", change: "-1.15%", up: false },
    { pair: "SOL/USD", price: "148.20", change: "+5.12%", up: true },
  ]);

  useEffect(() => {
    async function fetchTickerData() {
      try {
        const symbols = TICKER_MAP.map((t) => t.symbol);
        const batchData = await getFundamentalsBatch(symbols);

        const mapped = TICKER_MAP.map((t) => {
          const matched = batchData.find((item) => item && item.symbol === t.symbol);
          if (!matched) {
            return { pair: t.pair, price: "N/A", change: "0.00%", up: true };
          }

          const priceVal = Number(matched.price) || 0;
          const changeVal = Number(matched.changePercent) || 0;

          const isCrypto = t.symbol.endsWith("-USD");
          const decimalPlaces = isCrypto ? 2 : 4;

          const formattedPrice = priceVal.toLocaleString(undefined, {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          });

          const isUp = changeVal >= 0;
          const formattedChange = `${isUp ? "+" : ""}${changeVal.toFixed(2)}%`;

          return {
            pair: t.pair,
            price: formattedPrice,
            change: formattedChange,
            up: isUp,
          };
        });

        setItems(mapped);
      } catch (err) {
        console.error("Failed to fetch ribbon data:", err);
      }
    }

    fetchTickerData();
    const interval = setInterval(fetchTickerData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-white/10 overflow-hidden py-2.5">
      <div className="flex whitespace-nowrap animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused] gap-12 w-max">
        {/* Duplicate items for a seamless infinite loop */}
        {[...items, ...items].map((item, idx) => (
          <div key={idx} className="inline-flex items-center space-x-2 text-sm font-medium animate-marquee">
            <span className="text-slate-500 dark:text-slate-400">{item.pair}</span>
            <span className="font-semibold">{item.price}</span>
            <span className={item.up ? "text-emerald-500" : "text-rose-500"}>
              {item.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
