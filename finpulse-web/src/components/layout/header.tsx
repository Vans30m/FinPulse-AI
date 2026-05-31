import { LayoutDashboard, Search, LogIn, UserCircle } from 'lucide-react';
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
            <div className="relative group hidden sm:flex items-center gap-2 cursor-pointer">
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-blue-600 dark:text-cyan-400 border border-slate-300 dark:border-white/20">
                <UserCircle className="h-5 w-5" />
              </div>
              <button 
                onClick={onLogoutClick}
                className="text-xs font-semibold text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}