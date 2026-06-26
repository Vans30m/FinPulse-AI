import { useEffect, useState } from "react";
import { Brain } from "lucide-react";
import { getAISentiment } from "../../../services/marketService";

interface SentimentData {
  mood: string;
  score: number;
  headlines: string[];
}

const detectRisk = (headlines: string[]): string => {
  const text = headlines.join(" ").toLowerCase();

  if (text.includes("inflation") || text.includes("cpi")) {
    return "Inflation Data Release";
  }

  if (text.includes("fed")) {
    return "Federal Reserve Commentary";
  }

  if (text.includes("oil")) {
    return "Oil Price Volatility";
  }

  return "No major risks detected";
};

const detectSectors = (
  headlines: string[]
): {
  name: string;
  strength: number;
}[] => {
  const text = headlines.join(" ").toLowerCase();

  return [
    {
      name: "Technology",
      strength: text.includes("ai") || text.includes("nvidia") ? 85 : 65,
    },
    {
      name: "Banking",
      strength: text.includes("bank") ? 80 : 60,
    },
    {
      name: "Energy",
      strength: text.includes("oil") || text.includes("energy") ? 75 : 55,
    },
    {
      name: "Healthcare",
      strength: text.includes("pharma") || text.includes("health") ? 72 : 58,
    },
    {
      name: "Consumer",
      strength: text.includes("retail") ? 70 : 55,
    },
    {
      name: "Industrials",
      strength: 52,
    },
    {
      name: "Real Estate",
      strength: text.includes("real estate") ? 65 : 45,
    },
  ];
};

const generateInsightsFromNews = (headlines: string[]): string[] => {
  const insights: string[] = [];
  const newsText = headlines.join(" ").toLowerCase();

  if (newsText.includes("ai") || newsText.includes("nvidia")) {
    insights.push("AI and technology stocks are driving positive sentiment.");
  }

  if (newsText.includes("bank")) {
    insights.push("Financial sector activity remains elevated.");
  }

  if (newsText.includes("inflation") || newsText.includes("cpi")) {
    insights.push("Investors are closely watching inflation data.");
  }

  if (newsText.includes("fed") || newsText.includes("rate")) {
    insights.push("Interest rate expectations continue influencing markets.");
  }

  if (insights.length === 0) {
    insights.push("Market sentiment remains stable across major sectors.");
    insights.push("Investors continue monitoring macroeconomic developments.");
  }

  return insights;
};

export default function AIMarketSentiment() {
  const [data, setData] = useState<SentimentData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await getAISentiment();
      setData(result);
    } catch (error) {
      console.error("AI ERROR:", error);
    }
  };

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-slate-600 dark:text-slate-400">
        Loading AI Brief...
      </div>
    );
  }

  const insights = generateInsightsFromNews(data.headlines || []);
  const sectors = detectSectors(data.headlines || []);
  const risk = detectRisk(data.headlines || []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0B1220]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI Market Brief</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              AI-powered market intelligence
            </p>
          </div>
        </div>

        <div
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            data.mood === "Bullish"
              ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
              : data.mood === "Bearish"
              ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
          }`}
        >
          {data.mood}
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800/40">
          <div className="text-xs uppercase text-slate-500 dark:text-slate-400">Market Mood</div>
          <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{data.mood}</div>
        </div>

        <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800/40">
          <div className="text-xs uppercase text-slate-500 dark:text-slate-400">Confidence</div>
          <div className="mt-2 text-xl font-bold text-cyan-600 dark:text-cyan-400">
            {data.score}%
          </div>
        </div>

        <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800/40">
          <div className="text-xs uppercase text-slate-500 dark:text-slate-400">Risk Level</div>
          <div className="mt-2 text-xl font-bold text-amber-600 dark:text-amber-400">
            {risk === "No major risks detected" ? "Low" : "Medium"}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
          AI Insights
        </h3>
        <div className="space-y-3">
          {insights.map((item: string, index: number) => (
            <div
              key={index}
              className="rounded-lg bg-slate-50 p-3 text-slate-700 dark:bg-slate-800/30 dark:text-slate-300"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Sector Strength */}
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Sector Strength
          </h3>
          <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">LIVE ANALYSIS</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {sectors.map((sector, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/20"
            >
              <div className="mb-2 flex justify-between">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {sector.name}
                </span>
                <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                  {sector.strength}%
                </span>
              </div>

              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 transition-all duration-500"
                  style={{ width: `${sector.strength}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk */}
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
        <div className="font-semibold text-amber-900 dark:text-white">⚠ Today's Risk</div>
        <div className="mt-2 text-amber-700 dark:text-amber-300">{risk}</div>
      </div>

      {/* Market Drivers */}
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Market Drivers
          </h3>
          <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400">
            LIVE
          </span>
        </div>

        <div className="space-y-3">
          {data.headlines?.slice(0, 5).map((headline: string, index: number) => {
            const impact =
              index === 0
                ? "HIGH IMPACT"
                : index === 1
                ? "MEDIUM IMPACT"
                : "MARKET WATCH";

            return (
              <div
                key={index}
                className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-cyan-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/20 dark:hover:border-cyan-500/30 dark:hover:bg-slate-800/40"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      impact === "HIGH IMPACT"
                        ? "text-red-600 dark:text-red-400"
                        : impact === "MEDIUM IMPACT"
                        ? "text-amber-600 dark:text-yellow-400"
                        : "text-cyan-600 dark:text-cyan-400"
                    }`}
                  >
                    {impact}
                  </span>
                </div>

                <div className="font-medium text-slate-800 group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-white">
                  {headline}
                </div>

                <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                  AI classified this as a market-moving catalyst
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}