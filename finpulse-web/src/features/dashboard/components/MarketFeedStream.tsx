import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Globe,
} from "lucide-react";
import { useGlobalMarkets } from "../../../hooks/useGlobalMarkets";
import { useNavigate } from "react-router-dom";

interface Props {
  marketRegion: "india" | "us";
  onMarketChange: (
    market: "india" | "us"
  ) => void;
}

export default function MarketFeedStream({
  marketRegion: _marketRegion,
  onMarketChange,
}: Props) {
  const { data: markets = [], isLoading } =
    useGlobalMarkets();

const navigate = useNavigate();

  const [filter, setFilter] =
    useState<
      "All" |
      "Domestic" |
      "Global"
    >("All");

  const filteredIndices = markets
    .filter((market: any) => {
      const type =
        market.region === "India"
          ? "Domestic"
          : "Global";

      return (
        filter === "All" ||
        filter === type
      );
    })
    .slice(0, 9);

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-bold">
            Loading Indices...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Indices Stream
            </h2>
          </div>

          {/* Filters */}
          <div className="flex gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl self-start">
            {(
              [
                "All",
                "Domestic",
                "Global",
              ] as const
            ).map((type) => (
              <button
                key={type}
                onClick={() => {
  setFilter(type);

  if (type === "Domestic") {
    onMarketChange("india");
  }

  if (type === "Global") {
    onMarketChange("us");
  }
}}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  filter === type
                    ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredIndices.map(
            (market: any) => {
              const isPositive =
                Number(
                  market.changePercent
                ) >= 0;

              const marketType =
                market.region ===
                "India"
                  ? "Domestic"
                  : "Global";

              return (
                <div
                  key={market.symbol}
                  onClick={() =>
  navigate(
  `/asset/${encodeURIComponent(
    market.symbol
  )}`,
  {
    state: {
      name: market.name,
    },
  }
)
}
                  className="
                    glass-card
                    p-5
                    flex
                    flex-col
                    justify-between
                    hover:border-slate-300
                    dark:hover:border-white/20
                    transition-all
                    cursor-pointer
                    group
                  "
                >
                  {/* Top */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span
                        className="
                        text-[10px]
                        uppercase
                        font-bold
                        tracking-wider
                        px-1.5
                        py-0.5
                        rounded
                        bg-slate-100
                        dark:bg-white/5
                        text-slate-500
                        dark:text-slate-400
                      "
                      >
                        {marketType}
                      </span>

                      <h3
                        className="
                        text-base
                        font-bold
                        text-slate-900
                        dark:text-white
                        mt-1.5
                        group-hover:text-blue-600
                        dark:group-hover:text-cyan-400
                        transition-colors
                      "
                      >
                        {market.name}
                      </h3>

                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {market.symbol}
                      </p>
                    </div>

                    <ArrowUpRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Bottom */}
                  <div className="flex items-end justify-between mt-6">
                    <div>
                      <p
                        className="
                        text-2xl
                        font-bold
                        tracking-tight
                        text-slate-900
                        dark:text-white
                      "
                      >
                        {Number(
                          market.price
                        ).toLocaleString()}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1">
                        {isPositive ? (
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                        )}

                        <span
                          className={`text-xs font-semibold ${
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {Number(
                            market.change
                          ).toFixed(2)}
                          {" "}
                          (
                          {Number(
                            market.changePercent
                          ).toFixed(2)}
                          %)
                        </span>
                      </div>
                    </div>

                    {/* Trend Indicator */}
                    <div
                      className={`
                        h-10
                        w-10
                        rounded-full
                        flex
                        items-center
                        justify-center
                        ${
                          isPositive
                            ? "bg-emerald-500/10"
                            : "bg-rose-500/10"
                        }
                      `}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-rose-500" />
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </>
  );
}