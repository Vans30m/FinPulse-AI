import { useState, useEffect } from 'react';
import {
  Search,
  LogIn,
  UserCircle,
  ChevronDown,
  LogOut,
  Bell,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { useAppData } from "../../context/AppDataContext";
import { useTheme } from '../../context/ThemeContext';
import LightLogo from '../../assets/Dark_Logo.png';
import DarkLogo from '../../assets/Light_Logo.png';
import { Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useChart } from "../../context/ChartContext";
import API_BASE_URL from "../../config/api";

interface UserAlert {
  id: string;
  ticker: string;
  targetPrice: number;
  direction: 'ABOVE' | 'BELOW';
  isTriggered: boolean;
  createdAt: string;
}

interface NavItem {
  id: string;
  label: string;
}

interface HeaderProps {
  navItems: NavItem[];
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export default function Header({ navItems, isLoggedIn, onLoginClick, onLogoutClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useAppData();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { chartOpen } = useChart();

  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem('finpulse_token') || localStorage.getItem('finpulse-token') || '';
        const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
        const userId = storedUser.id || '';
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (userId) headers['X-User-Id'] = userId;

        const res = await fetch(`${API_BASE_URL}/api/alerts-custom`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setAlerts(data);
            const triggered = data.filter(a => a.isTriggered).length;
            setUnreadCount(triggered);
          }
        }
      } catch (error) {
        console.error("Failed to fetch notifications in navbar:", error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (showNotifications && !target.closest('.notification-container')) {
        setShowNotifications(false);
      }
      if (showProfileMenu && !target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
      if (isMobileMenuOpen && !target.closest('.mobile-menu-container') && !target.closest('.mobile-menu-toggle')) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications, showProfileMenu, isMobileMenuOpen]);

  // Track scroll position to change styling dynamically (Stripe-like effect)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (chartOpen) {
    return null;
  }

  return (
    <motion.header
      animate={{
        height: isScrolled ? "56px" : "64px",
        backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.95)",
        boxShadow: isScrolled 
          ? "0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 1px rgba(0, 0, 0, 0.02), 0 8px 30px -15px rgba(99, 102, 241, 0.08)" 
          : "0 0px 0px rgba(0, 0, 0, 0)"
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="sticky top-0 z-40 w-full backdrop-blur-xl dark:!bg-night-950/80 transition-colors duration-300 flex items-center"
    >
      <div className="mx-auto flex w-full max-w-none items-center justify-between px-4 sm:px-8">

        {/* Left Column: Logo + brand name */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <img
              src={DarkLogo}
              alt="FinPulse Logo"
              className="h-14 w-auto -ml-2 -mr-1 object-contain transition-transform duration-300 group-hover:scale-105 block dark:hidden mix-blend-multiply"
            />
            <img
              src={LightLogo}
              alt="FinPulse Logo"
              className="h-14 w-auto -ml-2 -mr-1 object-contain transition-transform duration-300 group-hover:scale-105 hidden dark:block mix-blend-screen"
            />
            {/* Brand name */}
            <span className="hidden sm:inline font-black text-lg tracking-tight text-slate-900 dark:text-white ml-1">
              FinPulse<span className="bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-cyan-400 dark:to-blue-500 bg-clip-text text-transparent">AI</span>
            </span>
          </Link>
        </div>

        {/* Middle Column: Centered Navigation */}
        <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-auto px-4">
          <LayoutGroup id="navbar">
            <nav
              className="flex items-center gap-1 relative"
              onMouseLeave={() => setHoveredTab(null)}
            >
              {navItems.map((item) => {
                const path = item.id === "pulse" ? "/pulse" : `/${item.id.toLowerCase()}`;

                return (
                  <NavLink
                    key={item.id}
                    to={path}
                    end={item.id === "pulse"}
                    onMouseEnter={() => setHoveredTab(item.id)}
                    className={({ isActive }) =>
                      `relative px-4 py-2 text-sm font-semibold transition-colors duration-300 z-10 ${isActive
                        ? "text-blue-600 dark:text-cyan-400"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <span className="relative z-10 flex items-center justify-center py-1">
                        {/* Hover Pill Background */}
                        {hoveredTab === item.id && !isActive && (
                          <motion.span
                            layoutId="navbarHoverPill"
                            className="absolute inset-0 -mx-1.5 -my-0.5 rounded-xl bg-slate-100/70 dark:bg-white/[0.04] -z-20"
                            transition={{ type: "spring", stiffness: 350, damping: 28 }}
                          />
                        )}

                        {/* Active Selection Sliding Indicator (Minimalist Underline) */}
                        {isActive && (
                          <motion.span
                            layoutId="activeNavIndicator"
                            className="absolute bottom-[-6px] left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-cyan-400 dark:to-blue-500 rounded-full shadow-[0_1px_4px_rgba(6,182,212,0.4)]"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </LayoutGroup>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search Button: near notification bell on all viewports */}
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="flex items-center justify-between w-32 xs:w-40 sm:w-48 md:w-56 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 transition-all duration-300 hover:bg-white dark:hover:bg-night-900 hover:border-blue-500/40 dark:hover:border-cyan-400/40 shadow-inner shrink-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate">Search</span>
            </div>
            <kbd className="hidden sm:inline-block rounded bg-slate-200/60 dark:bg-white/10 px-1.5 py-0.5 text-[9px] font-black text-slate-500 dark:text-slate-400">Ctrl K</kbd>
          </button>

          {/* Notification Bell */}
          {isLoggedIn && (
            <div className="relative notification-container">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-all flex items-center justify-center"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-white dark:ring-night-950">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="fixed top-16 left-4 right-4 md:absolute md:top-auto md:left-auto md:right-0 md:mt-2 md:w-80 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-900 shadow-xl overflow-hidden z-50 p-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2 mb-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Alerts & Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            setUnreadCount(0);
                          }}
                          className="text-[10px] font-bold text-blue-600 dark:text-cyan-400 hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1.5 custom-scrollbar pr-0.5">
                      {alerts.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                          No active notifications.
                        </div>
                      ) : (
                        alerts.map((alert) => (
                          <div
                            key={alert.id}
                            className={`p-2.5 rounded-xl border text-xs transition-all ${alert.isTriggered
                              ? "bg-rose-500/5 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-200"
                              : "bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-350"
                              }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-extrabold tracking-wide uppercase text-slate-900 dark:text-white">{alert.ticker}</span>
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${alert.isTriggered
                                ? "bg-rose-500 text-white"
                                : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400"
                                }`}>
                                {alert.isTriggered ? "Triggered" : "Active"}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px]">
                              Price went {alert.direction.toLowerCase()} target of <span className="font-extrabold">${alert.targetPrice.toFixed(2)}</span>.
                            </p>
                            <span className="text-[9px] text-slate-400 mt-1 block">
                              {new Date(alert.createdAt).toLocaleDateString()} at {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-white/10 mx-1"></div>

          {/* Conditional Rendering: Login / Profile Menu */}
          {!isLoggedIn ? (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-2 rounded-xl bg-blue-600 dark:bg-cyan-400 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-white dark:text-night-950 shadow-md hover:shadow-lg transition-all duration-350 hover:bg-blue-700 dark:hover:bg-cyan-300 hover:-translate-y-0.5"
            >
              <LogIn className="h-3.5 w-3.5 stroke-[2.5]" />
              <span className="hidden xs:inline">Sign In</span>
            </button>
          ) : (
            <div className="relative profile-menu-container">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 rounded-xl p-1 sm:px-2.5 sm:py-1.5 hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-all"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md text-xs font-black shrink-0 overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    (() => {
                      if (!user?.name) return 'US';
                      const parts = user.name.trim().split(/\s+/);
                      if (parts.length > 1) {
                        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                      }
                      return parts[0][0].toUpperCase();
                    })()
                  )}
                </div>

                <div className="text-left hidden sm:block">
                  <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 leading-none">Account</p>
                </div>

                <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Jitter-Free Animated Profile Dropdown */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-night-900 shadow-xl overflow-hidden z-50 p-1.5"
                  >
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors"
                    >
                      <UserCircle className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>

                    <button
                      onClick={() => {
                        setTheme(theme === 'dark' ? 'light' : 'dark');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors"
                    >
                      {theme === 'dark' ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-slate-400" />}
                      <span>Theme</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Hamburger Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-450 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-all mobile-menu-toggle"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Slide-out Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="absolute top-full left-0 right-0 z-30 md:hidden bg-white/95 dark:bg-night-950/95 backdrop-blur-lg border-b border-slate-200 dark:border-white/10 px-6 py-4 flex flex-col gap-2 shadow-xl mobile-menu-container"
          >
            {navItems.map((item, index) => {
              const path = item.id === "pulse" ? "/pulse" : `/${item.id.toLowerCase()}`;
              return (
                <div key={item.id} className="flex flex-col w-full">
                  {index > 0 && (
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-200/60 to-transparent dark:via-white/10 w-full my-1 shrink-0" />
                  )}
                  <NavLink
                    to={path}
                    end={item.id === "pulse"}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/10"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-150/50 dark:hover:bg-white/5"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Ambient Gradient Glow Line at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-600 to-transparent dark:via-cyan-400 opacity-90 dark:opacity-100 pointer-events-none" />
      {/* Blurred secondary glow layer for light and dark mode ambient radiance */}
      <div className="absolute bottom-0 left-0 right-0 h-[5px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent dark:via-cyan-500/30 blur-[2px] pointer-events-none" />
    </motion.header>
  );
}