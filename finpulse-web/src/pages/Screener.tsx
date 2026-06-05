import { useState } from "react";
import {
  Filter,
  TrendingUp,
  TrendingDown,
  Search,
} from "lucide-react";

interface Stock {
  symbol: string;
  company: string;
  sector: string;
  aiScore: number;
  sentiment: "Bullish" | "Bearish";
  price: number;
}

const STOCKS: Stock[] = [
  {
    symbol: "AAPL",
    company: "Apple Inc.",
    sector: "Technology",
    aiScore: 92,
    sentiment: "Bullish",
    price: 175,
  },
  {
    symbol: "NVDA",
    company: "NVIDIA",
    sector: "Technology",
    aiScore: 97,
    sentiment: "Bullish",
    price: 982,
  },
  {
    symbol: "TSLA",
    company: "Tesla",
    sector: "Automotive",
    aiScore: 78,
    sentiment: "Bearish",
    price: 177,
  },
  {
    symbol: "JPM",
    company: "JPMorgan",
    sector: "Finance",
    aiScore: 84,
    sentiment: "Bullish",
    price: 198,
  },
  {
    symbol: "NFLX",
    company: "Netflix",
    sector: "Entertainment",
    aiScore: 72,
    sentiment: "Bearish",
    price: 620,
  },
];

export default function Screener() {
  const [search, setSearch] = useState("");
  const [sector, setSector] =
    useState("All");
  const [sentiment, setSentiment] =
    useState("All");

  const filteredStocks = STOCKS.filter(
    (stock) => {
      const matchesSearch =
        stock.symbol
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        stock.company
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesSector =
        sector === "All" ||
        stock.sector === sector;

      const matchesSentiment =
        sentiment === "All" ||
        stock.sentiment === sentiment;

      return (
        matchesSearch &&
        matchesSector &&
        matchesSentiment
      );
    }
  );

  return (
    <div className="space-y-6">

      {/* Header */}

      <div
        className="
        rounded-3xl
        bg-gradient-to-br
        from-emerald-500
        to-cyan-600
        text-white
        p-8
        shadow-xl
        "
      >
        <div className="flex items-center gap-4">

          <div className="p-4 rounded-2xl bg-white/10">
            <Filter className="h-10 w-10" />
          </div>

          <div>
            <h1 className="text-4xl font-bold">
              Market Screener
            </h1>

            <p className="mt-2 text-white/80">
              Discover opportunities using
              AI scores and sentiment.
            </p>
          </div>

        </div>
      </div>

      {/* Filters */}

      <div
        className="
        rounded-3xl
        border
        bg-white
        dark:bg-night-900
        p-5
        "
      >
        <div className="grid md:grid-cols-3 gap-4">

          {/* Search */}

          <div className="relative">

            <Search
              className="
              absolute
              left-3
              top-3.5
              h-4
              w-4
              text-slate-400
              "
            />

            <input
              type="text"
              placeholder="Search asset..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="
              w-full
              pl-10
              pr-4
              py-3
              rounded-xl
              border
              bg-transparent
              "
            />
          </div>

          {/* Sector */}

          <select
            value={sector}
            onChange={(e) =>
              setSector(e.target.value)
            }
            className="
            px-4
            py-3
            rounded-xl
            border
            bg-transparent
            "
          >
            <option>All</option>
            <option>Technology</option>
            <option>Finance</option>
            <option>Automotive</option>
            <option>Entertainment</option>
          </select>

          {/* Sentiment */}

          <select
            value={sentiment}
            onChange={(e) =>
              setSentiment(e.target.value)
            }
            className="
            px-4
            py-3
            rounded-xl
            border
            bg-transparent
            "
          >
            <option>All</option>
            <option>Bullish</option>
            <option>Bearish</option>
          </select>

        </div>
      </div>

      {/* Results */}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

        {filteredStocks.map((stock) => (
          <div
            key={stock.symbol}
            className="
            rounded-3xl
            border
            bg-white
            dark:bg-night-900
            p-5
            hover:shadow-xl
            transition-all
            "
          >
            <div className="flex justify-between">

              <div>
                <h3 className="text-xl font-bold">
                  {stock.symbol}
                </h3>

                <p className="text-sm text-slate-500">
                  {stock.company}
                </p>
              </div>

              <div>
                {stock.sentiment ===
                "Bullish" ? (
                  <TrendingUp className="text-emerald-500" />
                ) : (
                  <TrendingDown className="text-red-500" />
                )}
              </div>

            </div>

            <div className="mt-5 space-y-3">

              <div className="flex justify-between">
                <span>Sector</span>
                <span>
                  {stock.sector}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Price</span>
                <span>
                  ${stock.price}
                </span>
              </div>

              <div className="flex justify-between">
                <span>AI Score</span>
                <span className="font-bold text-cyan-500">
                  {stock.aiScore}
                </span>
              </div>

            </div>

            <div className="mt-5">

              <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-night-800">

                <div
                  className="
                  h-3
                  rounded-full
                  bg-cyan-500
                  "
                  style={{
                    width: `${stock.aiScore}%`,
                  }}
                />

              </div>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}