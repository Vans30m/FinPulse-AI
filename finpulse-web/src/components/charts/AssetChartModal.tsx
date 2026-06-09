import {X, Newspaper, Brain,} from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import TimeframeSelector from "./TimeframeSelector";
import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  asset: any;
}

export default function AssetChartModal({
  open,
  onClose,
  asset,
}: Props) {
  const [timeframe, setTimeframe] =
    useState("1Y");

  if (!open) return null;

  return (
    <div
      className="
      fixed inset-0
      z-[100]
      flex
      items-center
      justify-center
      "
    >
      <div
        onClick={onClose}
        className="
        absolute inset-0
        bg-black/50
        backdrop-blur-sm
        "
      />

      <div
        className="
        relative
        w-[95vw]
        h-[92vh]
        rounded-3xl
        bg-white
        dark:bg-night-900
        overflow-hidden
        shadow-2xl
        "
      >
        <div
          className="
          flex
          justify-between
          items-center
          p-5
          border-b
          "
        >
          <div>
            <h2 className="text-2xl font-bold">
              {asset.symbol}
            </h2>

            <p className="text-slate-500">
              {asset.name}
            </p>
          </div>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div
          className="
          grid
          xl:grid-cols-[1fr_320px]
          h-full
          "
        >
          <div className="p-6">

            <TimeframeSelector
              selected={timeframe}
              onChange={setTimeframe}
            />

            <div className="mt-6">
              <CandlestickChart
                symbol={asset.yahooSymbol}
                timeframe={timeframe}
              />
            </div>

          </div>

          <div
            className="
            border-l
            p-6
            space-y-6
            "
          >
            <div>
              <div className="flex gap-2">
                <Brain />
                <h3 className="font-bold">
                  AI Analysis
                </h3>
              </div>

              <div className="mt-4">
                <div>AI Score: 92</div>
                <div>Sentiment: Bullish</div>
                <div>Action: Strong Buy</div>
              </div>
            </div>

            <div>
              <div className="flex gap-2">
                <Newspaper />
                <h3 className="font-bold">
                  News
                </h3>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <p>
                  Apple unveils new AI roadmap
                </p>

                <p>
                  Earnings beat expectations
                </p>

                <p>
                  Institutional buying rises
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}