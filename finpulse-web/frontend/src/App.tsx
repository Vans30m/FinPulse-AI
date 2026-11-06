// src/App.tsx

import React, { useState, useEffect } from 'react';
import Header from './components/layout/header';
import Footer from './components/layout/footer';
import Watchlist from './features/dashboard/components/Watchlist';
import LoginModal from './features/auth/LoginModal';
import { Toaster } from 'react-hot-toast';
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
import StockScreener from './pages/StockScreener';
import Pulse from './pages/Pulse';

// Footer Pages
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import SystemStatus from "./pages/SystemStatus";
import ApiDocumentation from "./pages/ApiDocumentation";
import CookiePolicy from "./pages/CookiePolicy";
import RiskDisclosure from "./pages/RiskDisclosure";
import { useTheme } from './context/ThemeContext';
import { profileService } from './profile/services/profileService';

// DRY Protected Route Wrapper
function ProtectedRoute({ isLoggedIn, children }: { isLoggedIn: boolean; children: React.ReactNode }) {
  if (!isLoggedIn) {
    return <Navigate to="/pulse" replace />;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isSecondaryPage = location.pathname !== '/pulse' && !location.pathname.startsWith('/screener');
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('finpulse_token'));

  // Scroll to top on navigation/page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Sync saved theme preference from database profile on load if no local theme was explicitly set
  useEffect(() => {
    const token = localStorage.getItem('finpulse_token') || localStorage.getItem('finpulse-token');
    const localTheme = localStorage.getItem('theme');
    if (token && !localTheme) {
      profileService.getProfile()
        .then(data => {
          if (data?.preferences?.theme) {
            setTheme(data.preferences.theme as any);
          }
        })
        .catch(() => {
          // Stale token handled on re-auth
        });
    }
  }, [setTheme]);

  // Set this to false so it doesn't pop up on load
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Force PIN verification on reload/load if logged in (only when token seems valid)
  useEffect(() => {
    const token = localStorage.getItem('finpulse_token');
    const pinVerified = sessionStorage.getItem('finpulse_pin_verified');
    if (token && pinVerified !== 'true') {
      setIsLoginModalOpen(true);
    }
  }, []);

  // Listen for force-login events dispatched by any page when their API call returns 401
  useEffect(() => {
    const handleForceLogin = () => {
      setIsLoggedIn(false);
      setIsLoginModalOpen(true);
    };
    window.addEventListener('finpulse:force-login', handleForceLogin);
    return () => window.removeEventListener('finpulse:force-login', handleForceLogin);
  }, []);

  const {
    chartOpen,
    selectedAsset,
    closeChart,
  } = useChart();

  // Navigation items
  const navItems = [
    { id: 'pulse', label: 'Pulse' },
    { id: 'screener', label: 'Screener' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'performance', label: 'Performance' },
    { id: 'watchlist', label: 'Watchlist' },
    { id: "news", label: "News" },
  ];

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-night-900 text-slate-900 dark:text-slate-200 transition-colors duration-300 overflow-x-clip ${isSecondaryPage ? 'secondary-page' : ''}`}>

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

      {/* Header */}
      <Header
        navItems={navItems}
        isLoggedIn={isLoggedIn}
        onLoginClick={() => setIsLoginModalOpen(true)}
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
          : 'max-w-[1440px] px-4 sm:px-6 lg:px-8 py-8'
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

            <Route path="/" element={<Navigate to="/pulse" />} />
            <Route path="/pulse" element={<Pulse />} />

            <Route
              path="/watchlist"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Watchlist />
                </ProtectedRoute>
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
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <PortfolioDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/performance"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <PerformanceComparison />
                </ProtectedRoute>
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
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/security"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/preferences"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Preferences />
                </ProtectedRoute>
              }
            />

            {/* Footer Routes */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/status" element={<SystemStatus />} />
            <Route path="/api-docs" element={<ApiDocumentation />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/risk-disclosure" element={<RiskDisclosure />} />
          </Routes>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
