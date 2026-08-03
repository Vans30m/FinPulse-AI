import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchGlobalMarkets } from "../services/marketService";

import AIMarketSentiment from "../features/dashboard/components/AIMarketSentiment";
import MarketExplanation from "../features/dashboard/components/MarketExplanation";
import AIBulletSummary from "../features/dashboard/components/AIBulletSummary";
import TrendingSectorStreaks from "../features/dashboard/components/TrendingSectorStreaks";
import { GlobalMarketClock } from "../features/dashboard/components/GlobalMarketClock";
import FearGreedIndex from "../features/dashboard/components/FearGreedIndex";
import AIPickOfTheDay from "../features/dashboard/components/AIPickOfTheDay";
import MarketScreeners from "../features/dashboard/components/MarketScreeners";
import InvestmentCalculator from "../features/dashboard/components/InvestmentCalculator";
import AlertsTimeline from "../features/dashboard/components/AlertsTimeline";

export default function Pulse() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Pre-fetch global markets in the background once the Pulse page is loaded
    queryClient.prefetchQuery({
      queryKey: ["globalMarkets"],
      queryFn: fetchGlobalMarkets,
    });
  }, [queryClient]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="space-y-8">
        <AIMarketSentiment />
        <MarketExplanation />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column (2 cols wide on desktop) */}
          <div className="lg:col-span-2 space-y-8">
            <AIBulletSummary />
            <TrendingSectorStreaks />
            <AIPickOfTheDay />
          </div>

          {/* Right Column (1 col wide on desktop) */}
          <div className="flex flex-col space-y-6 sm:space-y-8 h-full justify-between">
            <FearGreedIndex className="flex-1 h-full animate-pulse-slow" />
          </div>
        </div>

        {/* Full-width Global Market Clock */}
        <div className="mt-8">
          <GlobalMarketClock />
        </div>

        {/* Full-width Market Screeners */}
        <div className="mt-8">
          <MarketScreeners />
        </div>

        {/* Bottom Full-width Row: Lumpsum Calculator & Live News side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-8 items-stretch">
          <div className="h-auto lg:h-[600px]">
            <InvestmentCalculator />
          </div>
          <div className="h-auto lg:h-[600px]">
            <AlertsTimeline fullPage={true} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
