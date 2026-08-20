import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchGlobalMarkets } from "../services/marketService";

import AIMarketSentiment from "../features/dashboard/components/AIMarketSentiment";
import AIBulletSummary from "../features/dashboard/components/AIBulletSummary";
import { GlobalMarketClock } from "../features/dashboard/components/GlobalMarketClock";
import FearGreedIndex from "../features/dashboard/components/FearGreedIndex";
import AIPickOfTheDay from "../features/dashboard/components/AIPickOfTheDay";
import MarketScreeners from "../features/dashboard/components/MarketScreeners";
import InvestmentCalculator from "../features/dashboard/components/InvestmentCalculator";
import AlertsTimeline from "../features/dashboard/components/AlertsTimeline";
import MarketCompass from "../features/dashboard/components/MarketCompass";
import {
  TrendingUp,
  Globe,
  Shield,
  Clock,
  Newspaper,
  Calculator,
  Activity,
  Brain,
  Compass,
} from "lucide-react";

/** Consistent section header used across all Pulse sections */
function SectionHeader({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
}) {
  return (
    <div className="mb-4 sm:mb-5">
      <div className="section-overline">
        {icon}
        <span>{label}</span>
      </div>
      {description && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

export default function Pulse() {
  const queryClient = useQueryClient();

  useEffect(() => {
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
      <div className="space-y-10 sm:space-y-12">

        {/* ── 1. AI MARKET BRIEF (Hero) ── */}
        <section aria-label="AI Market Brief">
          <AIMarketSentiment />
        </section>

        {/* ── 2. GLOBAL TOP MOVERS ── */}
        <section aria-label="Global Top Movers">
          <MarketScreeners />
        </section>

        {/* ── 3. GLOBAL MARKET PULSE ── */}
        <section aria-label="Global Market Pulse">
          <AIBulletSummary />
        </section>

        {/* ── 5. RISK & PSYCHOLOGY ── */}
        <section aria-label="Risk and Market Psychology">
          {/* Top row: Fear & Greed full width */}
          <div>
            <FearGreedIndex />
          </div>
          {/* Middle row: Market Compass full width */}
          <div className="mt-8">
            <MarketCompass />
          </div>
          {/* Bottom row: AI Pick of the Day full width */}
          <div className="mt-8">
            <AIPickOfTheDay />
          </div>
        </section>

        {/* ── 6. GLOBAL MARKET CLOCK ── */}
        <section aria-label="Global Market Clock">
          <GlobalMarketClock />
        </section>

        {/* ── 7. NEWS & CALCULATOR ── */}
        <section aria-label="News and Wealth Calculator">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
            <div>
              <div className="h-[600px]">
                <AlertsTimeline fullPage={true} />
              </div>
            </div>
            <div>
              <div className="h-auto lg:h-[600px]">
                <InvestmentCalculator />
              </div>
            </div>
          </div>
        </section>

      </div>
    </motion.div>
  );
}

