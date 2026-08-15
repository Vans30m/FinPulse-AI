import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchGlobalMarkets } from "../services/marketService";

import AIMarketSentiment from "../features/dashboard/components/AIMarketSentiment";
import AIBulletSummary from "../features/dashboard/components/AIBulletSummary";
import TrendingSectorStreaks from "../features/dashboard/components/TrendingSectorStreaks";
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
          <SectionHeader
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="Global Top Movers"
            description="Real-time top gaining and losing equities across global markets"
          />
          <MarketScreeners />
        </section>

        {/* ── 3. GLOBAL MARKET PULSE ── */}
        <section aria-label="Global Market Pulse">
          <SectionHeader
            icon={<Globe className="h-3.5 w-3.5" />}
            label="Global Market Pulse"
            description="AI-powered macro sentiment analysis and key global market insights"
          />
          <AIBulletSummary />
        </section>

        {/* ── 4. AI SECTOR ROTATION ── */}
        <section aria-label="AI Sector Rotation">
          <SectionHeader
            icon={<Activity className="h-3.5 w-3.5" />}
            label="AI Sector Rotation"
            description="Top rallying and declining sectors based on AI momentum analysis"
          />
          <TrendingSectorStreaks />
        </section>

        {/* ── 5. RISK & PSYCHOLOGY ── */}
        <section aria-label="Risk and Market Psychology">
          <SectionHeader
            icon={<Shield className="h-3.5 w-3.5" />}
            label="Risk & Market Psychology"
            description="Fear & Greed gauge, market compass reference, and AI stock pick of the day"
          />
          {/* Top row: Fear & Greed + AI Pick */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6 items-stretch">
            <div className="lg:col-span-3 h-full">
              <FearGreedIndex className="h-full" />
            </div>
            <div className="lg:col-span-2 h-full">
              <AIPickOfTheDay />
            </div>
          </div>
          {/* Bottom row: Market Compass full width */}
          <div className="mt-6">
            <MarketCompass />
          </div>
        </section>

        {/* ── 6. GLOBAL MARKET CLOCK ── */}
        <section aria-label="Global Market Clock">
          <SectionHeader
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Global Market Clock"
            description="Real-time market open/closed status across major global exchanges"
          />
          <GlobalMarketClock />
        </section>

        {/* ── 7. NEWS & CALCULATOR ── */}
        <section aria-label="News and Wealth Calculator">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
            <div>
              <SectionHeader
                icon={<Newspaper className="h-3.5 w-3.5" />}
                label="Global Market News"
                description="Latest financial headlines from Finnhub and Google News"
              />
              <div className="h-[600px]">
                <AlertsTimeline fullPage={true} />
              </div>
            </div>
            <div>
              <SectionHeader
                icon={<Calculator className="h-3.5 w-3.5" />}
                label="Wealth Compound Calculator"
                description="Project your SIP or lumpsum investment growth over time"
              />
              <InvestmentCalculator />
            </div>
          </div>
        </section>

      </div>
    </motion.div>
  );
}

