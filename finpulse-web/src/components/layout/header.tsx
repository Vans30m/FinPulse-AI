import { useState } from 'react';
import {
  Search,
  LogIn,
  UserCircle,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import {
  useAppData,
} from "../../context/AppDataContext";
import { Link } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';

import LightLogo from '../../assets/Dark_Logo.png'; 
import DarkLogo from '../../assets/Light_Logo.png';

interface NavItem {
  id: string;
  label: string;
}

interface HeaderProps {
  navItems: NavItem[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  // New props for authentication state
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export default function Header({ navItems, activeTab, setActiveTab, isLoggedIn, onLoginClick, onLogoutClick }: HeaderProps) {
  const { user } =
  useAppData();
  const [showProfileMenu, setShowProfileMenu] =
  useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-night-950/80 backdrop-blur-xl transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        
        <div className="flex items-center gap-8">
          {/* Brand Logo - Navigates Home */}
          <Link to="/" className="flex items-center gap-2 group">

            <img 
              src={DarkLogo} 
              alt="FinPulse Logo" 
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105 block dark:hidden" 
            />

            <img 
              src={LightLogo} 
              alt="FinPulse Logo" 
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105 hidden dark:block" 
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  activeTab === item.id
                    ? 'bg-slate-100 text-blue-600 dark:bg-white/10 dark:text-cyan-400'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-night-900 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 transition-colors hover:border-blue-300 dark:hover:border-cyan-500/50"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
            <kbd className="ml-2 rounded bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">Ctrl K</kbd>
          </button>

          <ThemeToggle />

          <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-white/10 mx-1"></div>

          {/* Conditional Rendering: Show Login Button OR User Profile */}
          {!isLoggedIn ? (
            <button 
              onClick={onLoginClick}
              className="hidden sm:flex items-center gap-2 rounded-xl bg-blue-600 dark:bg-cyan-400 px-4 py-2 text-sm font-bold text-white dark:text-night-900 shadow-sm transition-all hover:bg-blue-700 dark:hover:bg-cyan-300 hover:shadow-md hover:-translate-y-0.5"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </button>
          ) : (
            <div className="relative hidden sm:block">

  <button
    onClick={() =>
      setShowProfileMenu(!showProfileMenu)
    }
    className="
    flex
    items-center
    gap-3
    rounded-xl
    px-3
    py-2
    hover:bg-slate-100
    dark:hover:bg-white/5
    transition-all
    "
  >
    <div
      className="
      h-10
      w-10
      rounded-full
      bg-gradient-to-r
      from-cyan-500
      to-blue-600
      flex
      items-center
      justify-center
      text-white
      shadow-md
      "
    >
      <UserCircle className="h-6 w-6" />
    </div>

    <div className="text-left">
      <p className="text-sm font-semibold text-slate-900 dark:text-white">
        {user.name}
      </p>

      <p className="text-xs text-slate-500">
        Account
      </p>
    </div>

    <ChevronDown
      className={`
      h-4
      w-4
      transition-transform
      ${showProfileMenu ? "rotate-180" : ""}
      `}
    />
  </button>

  {showProfileMenu && (
    <div
      className="
      absolute
      right-0
      mt-2
      w-56
      rounded-2xl
      border
      border-slate-200
      dark:border-white/10
      bg-white
      dark:bg-night-900
      shadow-xl
      overflow-hidden
      z-50
      "
    >
      <Link
        to="/profile"
        onClick={() =>
          setShowProfileMenu(false)
        }
        className="
        flex
        items-center
        gap-3
        px-4
        py-3
        hover:bg-slate-50
        dark:hover:bg-white/5
        transition-colors
        "
      >
        <UserCircle className="h-4 w-4" />
        <span>My Profile</span>
      </Link>

      <button
        onClick={() => {
          setShowProfileMenu(false);
          onLogoutClick();
        }}
        className="
        w-full
        flex
        items-center
        gap-3
        px-4
        py-3
        text-left
        text-red-500
        hover:bg-red-50
        dark:hover:bg-red-500/10
        transition-colors
        "
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </div>
  )}

</div>
          )}
        </div>
      </div>
    </header>
  );
}