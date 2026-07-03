// src/App.tsx

import { useState } from 'react';
import Header from './components/layout/header';
import Footer from './components/layout/footer';
import AlertsTimeline from './features/dashboard/components/AlertsTimeline';
import InvestmentCalculator from './features/dashboard/components/InvestmentCalculator';
import MarketScreeners from './features/dashboard/components/MarketScreeners';
import Watchlist from './features/dashboard/components/Watchlist';
import MarketFeedStream from './features/dashboard/components/MarketFeedStream';
import LoginModal from './features/auth/LoginModal';
import { Toaster } from 'react-hot-toast';
import PortfolioDashboard from './features/portfolio/components/PortfolioDashboard';
import PerformanceComparison from './features/dashboard/components/PerformanceComparison';
import MyAlertsDashboard from './features/dashboard/components/MyAlertsDashboard';
import AssetDetails from "./pages/AssetDetails";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Markets from "./pages/Markets";
import News from './pages/News';
import Profile from "./pages/Profile";
import AssetChartModal from "./components/charts/AssetChartModal";
import { useChart } from "./context/ChartContext";
import AIMarketSentiment from "./features/dashboard/components/AIMarketSentiment";
import MarketExplanation from "./features/dashboard/components/MarketExplanation";
import GlobalEarningsCalendar from "./components/home/GlobalEarningsCalendar";

// New Pulse Page Components
import ForexCryptoRibbon from './features/dashboard/components/ForexCryptoRibbon';
import FearGreedIndex from './features/dashboard/components/FearGreedIndex';
import AIBulletSummary from './features/dashboard/components/AIBulletSummary';
import AIPickOfTheDay from './features/dashboard/components/AIPickOfTheDay';
import TrendingSectorStreaks from './features/dashboard/components/TrendingSectorStreaks';
import VolatilityGauges from './features/dashboard/components/VolatilityGauges';

// Stock Screener Page Component Integration
import StockScreener from './pages/StockScreener';

// New Footer Pages
import Analytics from "./pages/Analytics";
import Pricing from "./pages/Pricing";
import Docs from "./pages/Docs";
import ApiRef from "./pages/ApiRef";
import Blog from "./pages/Blog";
import About from "./pages/About";
import Careers from "./pages/Careers";
import Press from "./pages/Press";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Disclosures from "./pages/Disclosures";
import Security from "./pages/Security";

export default function App() {
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(true); // <-- Start as logged in for easier testing

  // The state for managing selected region
  const [marketRegion, setMarketRegion] = useState<"india" | "us">("india");

  // Set this to false so it doesn't pop up on load
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const {
    chartOpen,
    selectedAsset,
    closeChart,
  } = useChart();

  // Integrated 'screener' navigation matrix item
  const navItems = [
    { id: 'pulse', label: 'Pulse' },
    { id: 'markets', label: 'Markets' },
    { id: 'screener', label: 'Screener' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'performance', label: 'Performance' },
    { id: 'watchlist', label: 'Watchlist' },
    { id: 'alerts', label: 'Alerts' },
    { id: "news", label: "News" },
  ];

  // The Interceptor: If not logged in, any click forces the modal open
  const handleProtectedAction = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault();
      e.stopPropagation();
      setIsLoginModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-night-900 text-slate-900 dark:text-slate-200 transition-colors duration-300">

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          setIsLoginModalOpen(false);
        }}
      />

      <div className="fixed inset-0 pointer-events-none z-0 bg-grid opacity-60 dark:opacity-40 transition-opacity" />

      {/* We leave Header unprotected here so users can toggle Dark Mode and click "Sign In" naturally */}
      <Header
        navItems={navItems}
        isLoggedIn={isLoggedIn}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogoutClick={() => setIsLoggedIn(false)}
      />

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          className: 'bg-white dark:bg-night-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-xl rounded-2xl text-sm font-bold',
          success: {
            iconTheme: {
              primary: '#10b981', // Emerald green
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e', // Rose red
              secondary: '#ffffff',
            },
          },
        }}
      />

      <main
        onClickCapture={handleProtectedAction}
        className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 flex-1 transition-all duration-500"
      >
        <AssetChartModal
          open={chartOpen}
          onClose={closeChart}
          asset={
            selectedAsset || {
              symbol: "",
              yahooSymbol: "",
              name: "",
              exchange: "",
              type: "",
            }
          }
        />

        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={<Navigate to="/pulse" />}
            />

            <Route
              path="/pulse"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-8">
                    {/* Horizontal marquee ticker at the top */}
                    <ForexCryptoRibbon />

                    <AIMarketSentiment />
                    <MarketExplanation />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                      {/* Left Column (2 cols wide on desktop) */}
                      <div className="lg:col-span-2 space-y-8">
                        <AIBulletSummary />

                        <MarketFeedStream
                          marketRegion={marketRegion}
                          onMarketChange={setMarketRegion}
                        />

                        <TrendingSectorStreaks />
                        <VolatilityGauges />

                        <GlobalEarningsCalendar />

                        <MarketScreeners
                          marketRegion={marketRegion}
                        />

                        <InvestmentCalculator />
                      </div>

                      {/* Right Column (1 col wide on desktop) */}
                      <div className="space-y-6 sm:space-y-8">
                        <FearGreedIndex />
                        <AIPickOfTheDay />
                        <AlertsTimeline />
                      </div>
                    </div>
                  </div>
                </motion.div>
              }
            />

            <Route
              path="/watchlist"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Watchlist />
                </motion.div>
              }
            />

            <Route
              path="/screener"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <StockScreener />
                </motion.div>
              }
            />

            <Route
              path="/portfolio"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <PortfolioDashboard />
                </motion.div>
              }
            />

            <Route
              path="/performance"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <PerformanceComparison />
                </motion.div>
              }
            />

            <Route
              path="/alerts"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <MyAlertsDashboard />
                </motion.div>
              }
            />

            <Route
              path="/asset/:symbol"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AssetDetails />
                </motion.div>
              }
            />

            <Route
              path="/markets"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Markets />
                </motion.div>
              }
            />

            <Route
              path="/news"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <News />
                </motion.div>
              }
            />

            <Route
              path="/profile"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Profile />
                </motion.div>
              }
            />

            {/* Footer Routes */}
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/api" element={<ApiRef />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/press" element={<Press />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/disclosures" element={<Disclosures />} />
            <Route path="/security" element={<Security />} />
          </Routes>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}