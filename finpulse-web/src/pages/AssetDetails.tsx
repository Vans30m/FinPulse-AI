import { useParams } from "react-router-dom";
import CandlestickChart from "../components/charts/CandlestickChart";
import TimeframeSelector from "../components/charts/TimeframeSelector";
import { useState } from "react";

export default function AssetDetails() {
  const { symbol } = useParams();

  const [timeframe, setTimeframe] =
    useState("1D");

  return (
    <div className="p-6 space-y-6">

      {/* Header */}

      <div className="rounded-3xl border p-6 bg-white dark:bg-night-900">

        <h1 className="text-4xl font-bold">
          {symbol}
        </h1>

        <p className="text-slate-500 mt-2">
          Asset Overview
        </p>

      </div>

      {/* Chart */}

      <div className="rounded-3xl border p-6 bg-white dark:bg-night-900">

        <div className="mb-5">
          <TimeframeSelector
            selected={timeframe}
            onChange={setTimeframe}
          />
        </div>

        <CandlestickChart symbol={symbol || "AAPL"} timeframe={timeframe} />


      </div>

      {/* Grid */}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* AI Analysis */}

        <div
          className="
          rounded-3xl
          p-6
          bg-gradient-to-br
          from-cyan-500
          to-blue-600
          text-white
          "
        >
          <h2 className="text-xl font-bold">
            AI Analysis
          </h2>

          <div className="mt-4 space-y-2">

            <p>AI Score: 92</p>

            <p>Sentiment: Bullish</p>

            <p>Action: Strong Buy</p>

          </div>
        </div>

        {/* News */}

        <div className="rounded-3xl border p-6">

          <h2 className="text-xl font-bold">
            Latest News
          </h2>

          <div className="space-y-4 mt-4">

            <p>
              Earnings beat expectations.
            </p>

            <p>
              Institutional buying rising.
            </p>

            <p>
              AI outlook remains positive.
            </p>

          </div>

        </div>

        {/* Fundamentals */}

        <div className="rounded-3xl border p-6">

          <h2 className="text-xl font-bold">
            Fundamentals
          </h2>

          <div className="space-y-2 mt-4">

            <p>Market Cap: $2.7T</p>

            <p>P/E Ratio: 29.5</p>

            <p>Dividend Yield: 0.5%</p>

          </div>

        </div>

      </div>

    </div>
  );
}