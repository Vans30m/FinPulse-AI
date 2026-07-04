import { useState, useEffect } from "react";
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
  const email = user.email || "user@example.com";

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

  const [profileStats, setProfileStats] = useState<{
    memberSince: string;
    country: string;
    currency: string;
    market: string;
    plan: string;
    watchlistCount: number;
    alertsCount: number;
    holdingsCount: number;
    portfolioValue: number;
    todayProfitLoss: number;
    todayProfitLossPercent: number;
    totalReturn: number;
    totalReturnPercent: number;
  } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
        const userId = storedUser.id;
        if (!userId) return;

        const res = await fetch(`http://localhost:3000/api/auth/profile-stats/${userId}`);
        const data = await res.json();
        if (res.ok) {
          setProfileStats(data);
          if (data.preferences) {
            setAiPrefs(data.preferences);
          }
          if (data.notificationSettings) {
            setNotifPrefs(data.notificationSettings);
          }
        }
      } catch (err) {
        console.error("Failed to load profile stats:", err);
      }
    };

    fetchStats();
  }, []);

  const handleToggleAi = async (key: keyof typeof aiPrefs) => {
    const updated = { ...aiPrefs, [key]: !aiPrefs[key] };
    setAiPrefs(updated);
    try {
      const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
      const userId = storedUser.id;
      if (!userId) return;

      await fetch('http://localhost:3000/api/auth/save-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, preferences: updated })
      });
    } catch (err) {
      console.error("Failed to save AI preferences:", err);
    }
  };

  const handleToggleNotif = async (key: keyof typeof notifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    try {
      const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
      const userId = storedUser.id;
      if (!userId) return;

      await fetch('http://localhost:3000/api/auth/save-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notificationSettings: updated })
      });
    } catch (err) {
      console.error("Failed to save notification settings:", err);
    }
  };

  // Dialog triggers / Actions
  const handleEditProfile = async () => {
    const newName = prompt("Enter display name:", user.name);
    if (newName === null) return;

    const newCountry = prompt("Enter country / location:", profileStats?.country || "India");
    if (newCountry === null) return;

    const newCurrency = prompt("Enter currency / market (e.g. INR (₹) / NSE / BSE):", `${profileStats?.currency || "INR (₹)"} / ${profileStats?.market || "NSE / BSE"}`);
    if (newCurrency === null) return;

    // Parse currency and market from combined string
    const parts = newCurrency.split('/');
    const currencyStr = parts[0]?.trim() || "INR (₹)";

    try {
      const storedUser = JSON.parse(localStorage.getItem('finpulse-user') || '{}');
      const userId = storedUser.id;

      if (!userId) {
        alert("Please log in to edit your profile.");
        return;
      }

      const res = await fetch('http://localhost:3000/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          name: newName.trim() || user.name, 
          bio: '', 
          country: newCountry.trim(), 
          currency: currencyStr
        })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('finpulse-user', JSON.stringify(data.user));
        setUser(data.user);
        
        // Refresh profile stats to reflect country and currency changes
        const statsRes = await fetch(`http://localhost:3000/api/auth/profile-stats/${userId}`);
        const statsData = await statsRes.json();
        if (statsRes.ok) {
          setProfileStats(statsData);
        }
        
        alert("Profile details updated successfully!");
      } else {
        alert(data.error || "Failed to update profile details.");
      }
    } catch (err) {
      console.error("Failed to update profile details:", err);
      alert("Connection error. Please try again.");
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
    { 
      title: "Portfolio Value", 
      value: profileStats ? `$${profileStats.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00", 
      change: undefined, 
      isPositive: true, 
      icon: <DollarSign className="h-5 w-5" /> 
    },
    { 
      title: "Today's Profit/Loss", 
      value: profileStats ? `${profileStats.todayProfitLoss >= 0 ? '+' : ''}$${profileStats.todayProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00", 
      change: profileStats && profileStats.holdingsCount > 0 ? `${profileStats.todayProfitLossPercent >= 0 ? '+' : ''}${profileStats.todayProfitLossPercent.toFixed(2)}%` : undefined, 
      isPositive: profileStats ? profileStats.todayProfitLoss >= 0 : true, 
      icon: <TrendingUp className="h-5 w-5" /> 
    },
    { 
      title: "Total Return", 
      value: profileStats ? `${profileStats.totalReturn >= 0 ? '+' : ''}$${profileStats.totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00", 
      change: profileStats && profileStats.holdingsCount > 0 ? `${profileStats.totalReturnPercent >= 0 ? '+' : ''}${profileStats.totalReturnPercent.toFixed(2)}%` : undefined, 
      isPositive: profileStats ? profileStats.totalReturn >= 0 : true, 
      icon: <Activity className="h-5 w-5" /> 
    },
    { title: "Watchlist Assets", value: profileStats ? `${profileStats.watchlistCount} Items` : "0 Items", icon: <Bookmark className="h-5 w-5" /> },
    { title: "Active Alerts", value: profileStats ? `${profileStats.alertsCount} Active` : "0 Active", icon: <Bell className="h-5 w-5" /> },
    { title: "Total Holdings", value: profileStats ? `${profileStats.holdingsCount} Positions` : "0 Positions", icon: <Layers className="h-5 w-5" /> },
    { title: "Favorite Market", value: "NSE India", icon: <Coins className="h-5 w-5" /> },
    { title: "Favorite Sector", value: "Technology", icon: <BarChart className="h-5 w-5" /> },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* SECTION 1 - User Header Profile Info */}
      <ProfileHeaderCard
        name={user.name}
        email={email}
        memberSince={profileStats ? new Date(profileStats.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : undefined}
        plan={profileStats?.plan}
        country={profileStats?.country}
        currency={profileStats?.currency}
        market={profileStats?.market}
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