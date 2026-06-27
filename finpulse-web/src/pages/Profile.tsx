import { useState } from "react";
import { 
  TrendingUp, 
  Coins, 
  BarChart, 
  Layers, 
  Bell, 
  Cpu,
  DollarSign,
  Activity,
  Bookmark
} from "lucide-react";
import { useAppData } from "../context/AppDataContext";

// Reusable Components
import ProfileHeaderCard from "../components/profile/ProfileHeaderCard";
import StatisticCard from "../components/profile/StatisticCard";
import PreferenceCard from "../components/profile/PreferenceCard";
import ToggleRow from "../components/profile/ToggleRow";
import SecurityCard from "../components/profile/SecurityCard";
import SubscriptionCard from "../components/profile/SubscriptionCard";

export default function Profile() {
  const { user, setUser } = useAppData();
  const [email] = useState("user@example.com");

  // SECTION 4 - Preferred Markets State
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(["india", "us", "crypto"]);

  const marketOptions = [
    { id: "india", label: "India", flag: "🇮🇳" },
    { id: "us", label: "USA", flag: "🇺🇸" },
    { id: "europe", label: "Europe", flag: "🇪🇺" },
    { id: "asia", label: "Asia", flag: "🌏" },
    { id: "crypto", label: "Crypto", flag: "🪙" },
    { id: "forex", label: "Forex", flag: "💱" },
    { id: "commodities", label: "Commodities", flag: "🛢" }
  ];

  const handleToggleMarket = (id: string) => {
    setSelectedMarkets((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  // SECTION 5 - AI Preferences Toggles
  const [aiPrefs, setAiPrefs] = useState({
    aiMarketSummary: true,
    buySellSuggestions: true,
    newsSummary: true,
    techAnalysis: false,
    portfolioInsights: true,
    dailyAiBrief: true
  });

  const handleToggleAi = (key: keyof typeof aiPrefs) => {
    setAiPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // SECTION 6 - Notification Settings
  const [notifPrefs, setNotifPrefs] = useState({
    priceAlerts: true,
    newsAlerts: true,
    portfolioAlerts: false,
    aiAlerts: true,
    marketOpen: false,
    marketClose: false,
    breakingNews: true
  });

  const handleToggleNotif = (key: keyof typeof notifPrefs) => {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Dialog triggers / Actions
  const handleEditProfile = () => {
    const newName = prompt("Enter your new profile name:", user.name);
    if (newName?.trim()) {
      setUser({ ...user, name: newName.trim() });
    }
  };

  const handleChangePassword = () => {
    alert("Change password modal has been activated.");
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out from FinPulse-AI?")) {
      localStorage.clear();
      window.location.href = "/";
    }
  };

  const handleToggle2FA = () => {
    alert("Security update: Two-Factor Authentication configuration triggered.");
  };

  const handleLogoutAllDevices = () => {
    if (confirm("Are you sure you want to log out from all other active sessions?")) {
      alert("Success: Logged out from all devices.");
    }
  };

  const handleDeleteAccount = () => {
    if (confirm("WARNING: Are you sure you want to delete your account permanently? This action cannot be undone.")) {
      alert("Account deletion request submitted.");
    }
  };

  // Stats definition for SECTION 2 - Investment Summary
  const stats = [
    { title: "Portfolio Value", value: "$124,560.80", change: "+12.4%", isPositive: true, icon: <DollarSign className="h-5 w-5" /> },
    { title: "Today's Profit/Loss", value: "+$1,240.20", change: "+1.0%", isPositive: true, icon: <TrendingUp className="h-5 w-5" /> },
    { title: "Total Return", value: "+$24,800.50", change: "+24.8%", isPositive: true, icon: <Activity className="h-5 w-5" /> },
    { title: "Watchlist Assets", value: "12 Items", icon: <Bookmark className="h-5 w-5" /> },
    { title: "Active Alerts", value: "3 Triggered", icon: <Bell className="h-5 w-5" /> },
    { title: "Total Holdings", value: "8 Positions", icon: <Layers className="h-5 w-5" /> },
    { title: "Favorite Market", value: "NSE India", icon: <Coins className="h-5 w-5" /> },
    { title: "Favorite Sector", value: "Technology", icon: <BarChart className="h-5 w-5" /> },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* SECTION 1 - User Header Profile Info */}
      <ProfileHeaderCard
        name={user.name}
        email={email}
        onEditProfile={handleEditProfile}
        onChangePassword={handleChangePassword}
        onLogout={handleLogout}
      />

      {/* SECTION 2 - Investment Statistics Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Investment Summary Dashboard</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <StatisticCard
              key={idx}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              isPositive={stat.isPositive}
              icon={stat.icon}
              delayIndex={idx}
            />
          ))}
        </div>
      </div>

      {/* 2-Column Desktop Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Hand Column */}
        <div className="space-y-8">
          
          {/* SECTION 4 - Favorite Markets Selector */}
          <PreferenceCard
            options={marketOptions}
            selectedMarkets={selectedMarkets}
            onToggleMarket={handleToggleMarket}
          />

          {/* SECTION 5 - AI Settings */}
          <div className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-6 shadow-lg space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="h-5 w-5 text-indigo-500" /> AI Features Preference
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Control AI model assistance scope across chart verdicts and alert timeline cards.</p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <ToggleRow
                title="Enable AI Market Summary"
                description="Generates dynamic summary insights based on historical trends."
                value={aiPrefs.aiMarketSummary}
                onChange={() => handleToggleAi("aiMarketSummary")}
              />
              <ToggleRow
                title="Enable Buy/Sell Suggestions"
                description="Show predicted momentum recommendations in Asset Details."
                value={aiPrefs.buySellSuggestions}
                onChange={() => handleToggleAi("buySellSuggestions")}
              />
              <ToggleRow
                title="Enable News Summary"
                description="Fuses multiple recent news articles into a bulleted TL;DR block."
                value={aiPrefs.newsSummary}
                onChange={() => handleToggleAi("newsSummary")}
              />
              <ToggleRow
                title="Enable Technical Analysis"
                description="Auto-calculates RSI, MACD, and EMA indicator evaluations."
                value={aiPrefs.techAnalysis}
                onChange={() => handleToggleAi("techAnalysis")}
              />
              <ToggleRow
                title="Enable Portfolio Insights"
                description="Diagnoses overall portfolio allocation risk levels using machine learning."
                value={aiPrefs.portfolioInsights}
                onChange={() => handleToggleAi("portfolioInsights")}
              />
              <ToggleRow
                title="Enable Daily AI Brief"
                description="Sends an inbox brief summarizing pre-market asset activity every morning."
                value={aiPrefs.dailyAiBrief}
                onChange={() => handleToggleAi("dailyAiBrief")}
              />
            </div>
          </div>

          {/* SECTION 8 - Security Controls */}
          <SecurityCard
            onChangePassword={handleChangePassword}
            onToggle2FA={handleToggle2FA}
            onLogoutAllDevices={handleLogoutAllDevices}
            onDeleteAccount={handleDeleteAccount}
          />
        </div>

        {/* Right Hand Column */}
        <div className="space-y-8">
          
          {/* SECTION 6 - Notification Settings */}
          <div className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-6 shadow-lg space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" /> Notifications Settings
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Receive system alerts or emails concerning market price triggers.</p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <ToggleRow
                title="Price Alerts"
                description="Trigger alerts when chosen assets exceed or drop below targets."
                value={notifPrefs.priceAlerts}
                onChange={() => handleToggleNotif("priceAlerts")}
              />
              <ToggleRow
                title="News Alerts"
                description="Get notified when breaking stories emerge for pinned symbols."
                value={notifPrefs.newsAlerts}
                onChange={() => handleToggleNotif("newsAlerts")}
              />
              <ToggleRow
                title="Portfolio Alerts"
                description="Notify when major moves alter asset allocations."
                value={notifPrefs.portfolioAlerts}
                onChange={() => handleToggleNotif("portfolioAlerts")}
              />
              <ToggleRow
                title="AI Alerts"
                description="Receive updates on newly triggered algorithmic buy/sell sentiments."
                value={notifPrefs.aiAlerts}
                onChange={() => handleToggleNotif("aiAlerts")}
              />
              <ToggleRow
                title="Market Open / Close"
                description="Receive updates at market opening/closing checkpoints."
                value={notifPrefs.marketOpen}
                onChange={() => handleToggleNotif("marketOpen")}
              />
              <ToggleRow
                title="Breaking Global News"
                description="Receive pushes regarding global macroeconomic shifts."
                value={notifPrefs.breakingNews}
                onChange={() => handleToggleNotif("breakingNews")}
              />
            </div>
          </div>

          {/* SECTION 9 - Premium Subscription details */}
          <SubscriptionCard
            onUpgrade={() => alert("Subscription Upgrade modal opened.")}
          />
        </div>

      </div>

    </div>
  );
}