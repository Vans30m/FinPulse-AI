// src/App.tsx

import { useState, useEffect } from 'react';
import Header from './components/layout/header';
import Footer from './components/layout/footer';
import InvestmentCalculator from './features/dashboard/components/InvestmentCalculator';
import MarketScreeners from './features/dashboard/components/MarketScreeners';
import Watchlist from './features/dashboard/components/Watchlist';
import MarketFeedStream from './features/dashboard/components/MarketFeedStream';
import LoginModal from './features/auth/LoginModal';
import { Toaster, toast } from 'react-hot-toast';
import PortfolioDashboard from './features/portfolio/components/PortfolioDashboard';
import PerformanceComparison from './features/dashboard/components/PerformanceComparison';
import AssetDetails from "./pages/AssetDetails";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import News from './pages/News';
import Profile from "./pages/Profile";
import Preferences from "./profile/pages/Preferences";
import AssetChartModal from "./components/charts/AssetChartModal";
import { useChart } from "./context/ChartContext";
import AIMarketSentiment from "./features/dashboard/components/AIMarketSentiment";
import MarketExplanation from "./features/dashboard/components/MarketExplanation";

// New Pulse Page Components
import FearGreedIndex from './features/dashboard/components/FearGreedIndex';
import AIBulletSummary from './features/dashboard/components/AIBulletSummary';
import AIPickOfTheDay from './features/dashboard/components/AIPickOfTheDay';
import TrendingSectorStreaks from './features/dashboard/components/TrendingSectorStreaks';
import { GlobalMarketClock } from './features/dashboard/components/GlobalMarketClock';

// Stock Screener Page Component Integration
import StockScreener from './pages/StockScreener';
import Pulse from './pages/Pulse';

// New Footer Pages
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import { useTheme } from './context/ThemeContext';
import { profileService } from './profile/services/profileService';

export default function App() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('finpulse_token'));

  // Scroll to top on navigation/page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Sync saved theme preference from database profile on load
  useEffect(() => {
    const token = localStorage.getItem('finpulse_token') || localStorage.getItem('finpulse-token');
    if (token) {
      profileService.getProfile()
        .then(data => {
          if (data?.preferences?.theme) {
            setTheme(data.preferences.theme as any);
          }
        })
        .catch(err => console.error("Failed to fetch profile theme preference on app load:", err));
    }
  }, [isLoggedIn]);

  // The state for managing selected region
  const [marketRegion, setMarketRegion] = useState<"india" | "us">("india");

  // Set this to false so it doesn't pop up on load
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Force PIN verification on reload/load if logged in
  useEffect(() => {
    const token = localStorage.getItem('finpulse_token');
    const pinVerified = sessionStorage.getItem('finpulse_pin_verified');
    if (token && pinVerified !== 'true') {
      setIsLoginModalOpen(true);
    }
  }, []);

  const {
    chartOpen,
    selectedAsset,
    closeChart,
  } = useChart();

  // Integrated 'screener' navigation matrix item
  const navItems = [
    { id: 'pulse', label: 'Pulse' },
    { id: 'screener', label: 'Screener' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'performance', label: 'Performance' },
    { id: 'watchlist', label: 'Watchlist' },
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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-night-900 text-slate-900 dark:text-slate-200 transition-colors duration-300 overflow-x-clip">

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          sessionStorage.setItem('finpulse_pin_verified', 'true');
          setIsLoginModalOpen(false);
        }}
        onLogout={() => {
          setIsLoggedIn(false);
          setIsLoginModalOpen(false);
        }}
      />

      <div className="fixed inset-0 pointer-events-none z-0 bg-grid opacity-60 dark:opacity-40 transition-opacity" />

      {/* We leave Header unprotected here so users can toggle Dark Mode and click "Sign In" naturally */}
      <Header
        navItems={navItems}
        isLoggedIn={isLoggedIn}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogoutClick={() => {
          localStorage.removeItem('finpulse_token');
          localStorage.removeItem('finpulse-token');
          localStorage.removeItem('finpulse-user');
          sessionStorage.removeItem('finpulse_pin_verified');
          setIsLoggedIn(false);
          toast.success("Logged out successfully");
          window.location.href = '/';
        }}
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
        className={`relative z-10 mx-auto w-full flex-1 transition-all duration-500 ${location.pathname.startsWith('/screener')
          ? 'max-w-none px-4 sm:px-8 py-6'
          : 'max-w-7xl px-4 sm:px-6 py-8'
          }`}
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
              element={<Pulse />}
            />

            <Route
              path="/watchlist"
              element={
                isLoggedIn ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    <Watchlist />
                  </motion.div>
                ) : (
                  <Navigate to="/pulse" replace />
                )
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
                  className="w-full"
                >
                  <StockScreener />
                </motion.div>
              }
            />

            <Route
              path="/portfolio"
              element={
                isLoggedIn ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    <PortfolioDashboard />
                  </motion.div>
                ) : (
                  <Navigate to="/pulse" replace />
                )
              }
            />

            <Route
              path="/performance"
              element={
                isLoggedIn ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    <PerformanceComparison />
                  </motion.div>
                ) : (
                  <Navigate to="/pulse" replace />
                )
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
                  className="w-full"
                >
                  <AssetDetails />
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
                isLoggedIn ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Profile />
                  </motion.div>
                ) : (
                  <Navigate to="/pulse" replace />
                )
              }
            />

            <Route
              path="/profile/edit"
              element={
                isLoggedIn ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Profile />
                  </motion.div>
                ) : (
                  <Navigate to="/pulse" replace />
                )
              }
            />

            <Route
              path="/profile/security"
              element={
                isLoggedIn ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Profile />
                  </motion.div>
                ) : (
                  <Navigate to="/pulse" replace />
                )
              }
            />

            <Route
              path="/profile/preferences"
              element={
                isLoggedIn ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Preferences />
                  </motion.div>
                ) : (
                  <Navigate to="/pulse" replace />
                )
              }
            />

            {/* Footer Routes */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          </Routes>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}