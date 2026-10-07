import { useState, useEffect } from 'react';
import {
  Search,
  LogIn,
  UserCircle,
  ChevronDown,
  LogOut,
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (showProfileMenu && !target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
      if (isMobileMenuOpen && !target.closest('.mobile-menu-container') && !target.closest('.mobile-menu-toggle')) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu, isMobileMenuOpen]);

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
        backgroundColor: isScrolled ? "rgba(10, 10, 10, 0.95)" : "rgba(10, 10, 10, 1)",
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-[#242424] bg-white dark:bg-[#0A0A0A] transition-colors duration-200 flex items-center"
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Left Column: Logo + brand name */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <img
              src={DarkLogo}
              alt="FinPulse Logo"
              className="h-12 w-auto -ml-2 -mr-1 object-contain block dark:hidden mix-blend-multiply"
            />
            <img
              src={LightLogo}
              alt="FinPulse Logo"
              className="h-12 w-auto -ml-2 -mr-1 object-contain hidden dark:block mix-blend-screen"
            />
            {/* Brand name */}
            <span className="hidden sm:inline font-bold text-base tracking-tight text-slate-900 dark:text-white ml-1">
              FinPulse<span className="text-emerald-500 font-extrabold ml-0.5">AI</span>
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
                    onClick={(e) => {
                      const protectedIds = ['portfolio', 'watchlist', 'performance', 'profile'];
                      if (protectedIds.includes(item.id.toLowerCase()) && !isLoggedIn) {
                        e.preventDefault();
                        onLoginClick();
                      }
                    }}
                    className={({ isActive }) =>
                      `relative px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 z-10 ${isActive
                        ? "text-slate-900 dark:text-white font-semibold"
                        : "text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <span className="relative z-10 flex items-center justify-center py-1">
                        {/* Hover Pill Background */}
                        {hoveredTab === item.id && !isActive && (
                          <motion.span
                            layoutId="navbarHoverPill"
                            className="absolute inset-0 rounded-md bg-slate-100 dark:bg-[#171717] -z-20"
                            transition={{ type: "spring", stiffness: 350, damping: 28 }}
                          />
                        )}

                        {/* Active Selection Sliding Indicator (Minimalist Accent Line) */}
                        {isActive && (
                          <motion.span
                            layoutId="activeNavIndicator"
                            className="absolute bottom-[-8px] left-0 right-0 h-[2px] bg-slate-900 dark:bg-white rounded-full"
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
          {/* Global Search Button */}
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="flex items-center justify-between w-32 xs:w-40 sm:w-48 md:w-56 rounded-md border border-slate-200 dark:border-[#242424] bg-slate-50 dark:bg-[#111111] px-3 py-1.5 text-xs text-slate-500 dark:text-neutral-400 hover:border-slate-300 dark:hover:border-[#2A2A2A] transition-colors shrink-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="h-3.5 w-3.5 text-slate-400 dark:text-neutral-500 shrink-0" />
              <span className="text-xs font-medium truncate">Search markets...</span>
            </div>
            <kbd className="hidden sm:inline-block rounded bg-slate-200 dark:bg-[#1C1C1C] px-1.5 py-0.5 text-[9px] font-mono text-slate-500 dark:text-neutral-400 border border-slate-300 dark:border-[#242424]">Ctrl K</kbd>
          </button>

          <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-[#242424] mx-1"></div>

          {/* Conditional Rendering: Login / Profile Menu */}
          {!isLoggedIn ? (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-2 rounded-md bg-slate-900 dark:bg-white px-3 py-1.5 text-xs font-semibold text-white dark:text-black hover:bg-slate-800 dark:hover:bg-neutral-200 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Sign In</span>
            </button>
          ) : (
            <div className="relative profile-menu-container">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 rounded-md p-1 sm:px-2 sm:py-1 hover:bg-slate-100 dark:hover:bg-[#141414] transition-colors"
              >
                <div className="h-7 w-7 rounded-md bg-[#1C1C1C] border border-[#242424] flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
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
                  <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                    {user?.name || 'User'}
                  </p>
                </div>

                <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    style={{ transformOrigin: "top right" }}
                    transition={{ duration: 0.15, ease: "easeInOut" }}
                    className="absolute right-0 mt-2 w-48 rounded-md border border-slate-200 dark:border-[#242424] bg-white dark:bg-[#111111] shadow-lg overflow-hidden z-50 p-1"
                  >
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#171717] rounded transition-colors"
                    >
                      <UserCircle className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>

                    <button
                      onClick={() => {
                        setTheme(theme === 'dark' ? 'light' : 'dark');
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#171717] rounded transition-colors"
                    >
                      {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-400" />}
                      <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex md:hidden p-1.5 rounded-md text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-[#141414] transition-colors mobile-menu-toggle"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute top-full left-0 right-0 z-30 md:hidden bg-white dark:bg-[#0A0A0A] border-b border-slate-200 dark:border-[#242424] px-4 py-3 flex flex-col gap-1 shadow-lg mobile-menu-container"
          >
            {navItems.map((item) => {
              const path = item.id === "pulse" ? "/pulse" : `/${item.id.toLowerCase()}`;
              return (
                <NavLink
                  key={item.id}
                  to={path}
                  end={item.id === "pulse"}
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    const protectedIds = ['portfolio', 'watchlist', 'performance', 'profile'];
                    if (protectedIds.includes(item.id.toLowerCase()) && !isLoggedIn) {
                      e.preventDefault();
                      onLoginClick();
                    }
                  }}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-xs font-medium transition-colors ${isActive
                      ? "bg-slate-900 text-white dark:bg-[#1C1C1C] dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141414]"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}