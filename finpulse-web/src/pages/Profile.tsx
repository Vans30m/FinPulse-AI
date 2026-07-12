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
  Bookmark,
  Shield,
  Palette,
  FileDown,
  Link,
  Laptop,
  CheckCircle,
  AlertTriangle,
  X,
  User as UserIcon,
  Briefcase,
  Globe,
  Clock,
  Unlock,
  LogOut
} from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { useTheme, type ThemeMode } from "../context/ThemeContext";
import { profileService, type UserProfileData, type SessionData, type WatchlistSummaryData } from "../profile/services/profileService";
import ProfileHeaderCard from "../components/profile/ProfileHeaderCard";
import StatisticCard from "../components/profile/StatisticCard";
import ToggleRow from "../components/profile/ToggleRow";
import SubscriptionCard from "../components/profile/SubscriptionCard";
import SecurityCard from "../components/profile/SecurityCard";
import toast from "react-hot-toast";
import API_BASE_URL from "../config/api";


export default function Profile() {
  const { user, setUser } = useAppData();
  const { theme, setTheme } = useTheme();

  // Profile data from backend
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [profileStats, setProfileStats] = useState<any>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [watchlistSummary, setWatchlistSummary] = useState<WatchlistSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Appearance & Privacy settings (derived from profileData.preferences)
  const [accentColor, setAccentColor] = useState("indigo");
  const [compactMode, setCompactMode] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tableDensity, setTableDensity] = useState("comfortable");

  const [publicProfile, setPublicProfile] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Preference details
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(["india", "us", "crypto"]);
  const [aiPrefs, setAiPrefs] = useState({
    aiMarketSummary: true,
    buySellSuggestions: true,
    newsSummary: true,
    techAnalysis: false,
    portfolioInsights: true,
    dailyAiBrief: true
  });
  const [notifPrefs, setNotifPrefs] = useState({
    priceAlerts: true,
    newsAlerts: true,
    portfolioAlerts: false,
    aiAlerts: true,
    marketOpen: false,
    marketClose: false,
    breakingNews: true
  });

  // Modal Control States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLogoutAllOpen, setIsLogoutAllOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState("");

  // Edit Profile Form State
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    phone: "",
    bio: "",
    occupation: "",
    country: "",
    timezone: "",
    currency: "",
    avatar: ""
  });

  // Change Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Investment Profile Form State
  const [investmentForm, setInvestmentForm] = useState({
    riskProfile: "Moderate",
    investmentGoal: "Growth",
    investmentHorizon: "Medium-term (1-5 years)",
    experienceLevel: "Intermediate",
    preferredExchange: "NASDAQ",
    baseCurrency: "USD",
    taxCountry: "United States"
  });

  // Connected Accounts State
  const [connectedAccounts, setConnectedAccounts] = useState({
    google: true,
    github: false,
    apple: false,
    microsoft: false
  });



  // Load profile and related stats on mount
  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await profileService.getProfile();
      setProfileData(data);
      
      // Sync global user context with database details
      setUser({
        name: data.name || user.name,
        email: data.email || user.email,
        avatar: data.avatar,
        currency: data.currency || user.currency
      });
      
      // Seed forms
      setEditForm({
        name: data.name || "",
        username: data.username || "",
        phone: data.phone || "",
        bio: data.bio || "",
        occupation: data.occupation || "",
        country: data.country || "India",
        timezone: data.timezone || "Asia/Kolkata",
        currency: data.currency || "INR (₹)",
        avatar: data.avatar || ""
      });

      setInvestmentForm({
        riskProfile: data.riskProfile || "Moderate",
        investmentGoal: data.investmentGoal || "Growth",
        investmentHorizon: data.investmentHorizon || "Medium-term (1-5 years)",
        experienceLevel: data.experienceLevel || "Intermediate",
        preferredExchange: data.preferredExchange || "NASDAQ",
        baseCurrency: data.baseCurrency || "USD",
        taxCountry: data.taxCountry || "United States"
      });

      if (data.connectedAccounts) {
        setConnectedAccounts(data.connectedAccounts);
      }

      if (data.preferences) {
        const prefs = data.preferences as any;
        if (prefs.theme) setTheme(prefs.theme as ThemeMode);
        if (prefs.accentColor) setAccentColor(prefs.accentColor);
        if (prefs.compactMode !== undefined) setCompactMode(prefs.compactMode);
        if (prefs.animationsEnabled !== undefined) setAnimationsEnabled(prefs.animationsEnabled);
        if (prefs.sidebarCollapsed !== undefined) {
          setSidebarCollapsed(prefs.sidebarCollapsed);
          localStorage.setItem('sidebar_collapsed', String(prefs.sidebarCollapsed));
        }
        if (prefs.tableDensity) setTableDensity(prefs.tableDensity);
        
        if (prefs.publicProfile !== undefined) setPublicProfile(prefs.publicProfile);
        if (prefs.analyticsConsent !== undefined) setAnalyticsConsent(prefs.analyticsConsent);
        if (prefs.marketingEmails !== undefined) setMarketingEmails(prefs.marketingEmails);

        if (prefs.selectedMarkets) setSelectedMarkets(prefs.selectedMarkets);
        if (prefs.aiPrefs) setAiPrefs(prefs.aiPrefs);
      }

      if (data.notificationSettings) {
        setNotifPrefs(data.notificationSettings as any);
      }

      // Fetch sessions, watchlist summary, and profile stats in parallel
      const [fetchedSessions, fetchedWatchlist, fetchedStats] = await Promise.all([
        profileService.getSessions().catch(() => []),
        profileService.getWatchlistSummary().catch(() => null),
        fetch(`${API_BASE_URL}/api/auth/profile-stats/${data.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('finpulse_token') || localStorage.getItem('finpulse-token') || ''}`
          }
        }).then(r => r.json()).catch(() => null)
      ]);

      setSessions(fetchedSessions);
      setWatchlistSummary(fetchedWatchlist);
      setProfileStats(fetchedStats);
      
      if (fetchedSessions.length > 0) {
        setCurrentSessionId(fetchedSessions[0].id); // First session is usually active
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load profile details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm((prev) => ({ ...prev, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Update App Theme in DB
  const handleUpdatePreferences = async (newPrefs: any) => {
    try {
      const mergedPrefs = {
        ...(profileData?.preferences || {}),
        ...newPrefs
      };
      await profileService.updatePreferences({ preferences: mergedPrefs as any });
      if (profileData) {
        setProfileData({ ...profileData, preferences: mergedPrefs as any });
      }
    } catch (err) {
      console.error("Failed to update preferences:", err);
      toast.error("Failed to save settings");
    }
  };

  // Toggle handlers for Preferences / Notification Settings
  const handleToggleAi = async (key: keyof typeof aiPrefs) => {
    const updated = { ...aiPrefs, [key]: !aiPrefs[key] };
    setAiPrefs(updated);
    try {
      await handleUpdatePreferences({ aiPrefs: updated });
      toast.success("AI preferences updated!");
    } catch (err) {
      setAiPrefs(aiPrefs);
    }
  };

  const handleToggleNotif = async (key: keyof typeof notifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    try {
      await profileService.updatePreferences({ notificationSettings: updated });
      toast.success("Notifications updated!");
    } catch (err) {
      setNotifPrefs(notifPrefs);
    }
  };

  const handleToggleMarket = async (id: string) => {
    const updated = selectedMarkets.includes(id) 
      ? selectedMarkets.filter((m) => m !== id) 
      : [...selectedMarkets, id];
    setSelectedMarkets(updated);
    await handleUpdatePreferences({ selectedMarkets: updated });
  };

  // Edit Profile Submission
  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast.error("Display Name is required");
      return;
    }
    if (!editForm.username.trim()) {
      toast.error("Username is required");
      return;
    }

    try {
      const res = await profileService.updateProfile(editForm);
      toast.success(res.message || "Profile updated successfully!");
      setUser({
        ...user,
        name: editForm.name,
        avatar: editForm.avatar,
        currency: editForm.currency
      });
      setIsEditProfileOpen(false);
      loadProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    }
  };

  // Save Investment Profile
  const handleSaveInvestmentProfile = async () => {
    try {
      await profileService.updateProfile(investmentForm);
      toast.success("Investment profile updated successfully!");
      loadProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to save investment profile");
    }
  };

  // Change Password Submission
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      toast.error("Current password is required");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      await profileService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success("Password changed successfully!");
      setIsChangePasswordOpen(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    }
  };

  // Session Management
  const handleRevokeSession = async (id: string) => {
    try {
      await profileService.revokeSession(id);
      toast.success("Session revoked successfully");
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke session");
    }
  };

  const handleLogoutOtherDevices = async () => {
    try {
      await profileService.revokeAllOtherSessions();
      toast.success("Logged out from other devices successfully");
      setIsLogoutAllOpen(false);
      loadProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke other sessions");
    }
  };

  // Account Operations
  const handleConfirmLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    try {
      await profileService.deleteAccount();
      localStorage.clear();
      toast.success("Account deleted permanently");
      window.location.href = "/";
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    }
  };

  // Social Account Linking Toggle
  const handleToggleAccountLink = async (provider: 'google' | 'github' | 'apple' | 'microsoft') => {
    const updated = {
      ...connectedAccounts,
      [provider]: !connectedAccounts[provider]
    };
    setConnectedAccounts(updated);
    try {
      await profileService.updateProfile({ connectedAccounts: updated });
      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account status updated`);
    } catch (err) {
      setConnectedAccounts(connectedAccounts);
    }
  };

  // Data Export Actions
  const handleExportData = async (format: 'json' | 'csv') => {
    try {
      const blob = await profileService.exportData(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finpulse_data_export.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Data exported to ${format.toUpperCase()} successfully!`);
    } catch (err) {
      toast.error("Failed to export data");
    }
  };

  const getCurrencySymbol = (currencyString?: string) => {
    if (!currencyString) return '₹';
    if (currencyString.includes('₹') || currencyString.toUpperCase().includes('INR')) return '₹';
    if (currencyString.includes('$') || currencyString.toUpperCase().includes('USD')) return '$';
    if (currencyString.includes('€') || currencyString.toUpperCase().includes('EUR')) return '€';
    if (currencyString.includes('£') || currencyString.toUpperCase().includes('GBP')) return '£';
    return '₹';
  };
  const cSymbol = getCurrencySymbol(user.currency || profileData?.currency);

  // Stats Grid Definition (Updated: removed static Favorite Market & Favorite Sector cards)
  const stats = [
    { 
      title: "Portfolio Value", 
      value: profileStats && typeof profileStats.portfolioValue === 'number' ? `${cSymbol}${profileStats.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${cSymbol}0.00`, 
      change: undefined, 
      isPositive: true, 
      icon: <DollarSign className="h-5 w-5" /> 
    },
    { 
      title: "Today's Profit/Loss", 
      value: profileStats && typeof profileStats.todayProfitLoss === 'number' ? `${profileStats.todayProfitLoss >= 0 ? '+' : ''}${cSymbol}${profileStats.todayProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${cSymbol}0.00`, 
      change: profileStats && profileStats.holdingsCount > 0 && typeof profileStats.todayProfitLossPercent === 'number' ? `${profileStats.todayProfitLossPercent >= 0 ? '+' : ''}${profileStats.todayProfitLossPercent.toFixed(2)}%` : undefined, 
      isPositive: profileStats ? profileStats.todayProfitLoss >= 0 : true, 
      icon: <TrendingUp className="h-5 w-5" /> 
    },
    { 
      title: "Total Return", 
      value: profileStats && typeof profileStats.totalReturn === 'number' ? `${profileStats.totalReturn >= 0 ? '+' : ''}${cSymbol}${profileStats.totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${cSymbol}0.00`, 
      change: profileStats && profileStats.holdingsCount > 0 && typeof profileStats.totalReturnPercent === 'number' ? `${profileStats.totalReturnPercent >= 0 ? '+' : ''}${profileStats.totalReturnPercent.toFixed(2)}%` : undefined, 
      isPositive: profileStats ? profileStats.totalReturn >= 0 : true, 
      icon: <Activity className="h-5 w-5" /> 
    },
    { title: "Watchlist Assets", value: watchlistSummary ? `${watchlistSummary.totalAssets} Items` : "0 Items", icon: <Bookmark className="h-5 w-5" /> },
    { title: "Active Alerts", value: profileStats && typeof profileStats.alertsCount === 'number' ? `${profileStats.alertsCount} Active` : "0 Active", icon: <Bell className="h-5 w-5" /> },
    { title: "Total Holdings", value: profileStats && typeof profileStats.holdingsCount === 'number' ? `${profileStats.holdingsCount} Positions` : "0 Positions", icon: <Layers className="h-5 w-5" /> }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin" />
        </div>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 animate-pulse">Loading FinPulse Profile Hub…</p>
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-7xl space-y-8 p-4 md:p-8 text-slate-900 dark:text-slate-100 transition-colors ${compactMode ? 'text-xs' : 'text-sm'}`}>
      
      {/* SECTION 1 - User Header Profile Info */}
      <ProfileHeaderCard
        name={profileData?.name || user.name}
        email={profileData?.email || user.email}
        avatar={profileData?.avatar}
        memberSince={profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : undefined}
        plan={(profileData as any)?.role === 'ADMIN' ? 'Admin Tier' : 'Premium Plus'}
        country={profileData?.country || "India"}
        currency={profileData?.currency || "INR (₹)"}
        market={profileData?.timezone || "Asia/Kolkata"}
        onEditProfile={() => setIsEditProfileOpen(true)}
        onChangePassword={() => setIsChangePasswordOpen(true)}
        onLogout={() => setIsLogoutOpen(true)}
      />

      {/* SECTION 2 - Investment Statistics Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Investment Summary Dashboard</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
          
          {/* Watchlist Summary Section */}
          <div className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-6 shadow-lg space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-indigo-500" /> Watchlist Summary
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Real-time asset breakdowns currently saved to your watchlists.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Total Lists</span>
                <p className="text-lg font-black text-indigo-500 dark:text-cyan-400 mt-1">{watchlistSummary?.totalWatchlists || 0}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Total Assets</span>
                <p className="text-lg font-black text-indigo-500 dark:text-cyan-400 mt-1">{watchlistSummary?.totalAssets || 0}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Stocks / ETFs</span>
                <p className="text-lg font-black text-indigo-500 dark:text-cyan-400 mt-1">{(watchlistSummary?.stocks || 0) + (watchlistSummary?.etfs || 0)}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Avg Change</span>
                <p className={`text-lg font-black mt-1 ${watchlistSummary && watchlistSummary.averageGainLoss >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {watchlistSummary && watchlistSummary.averageGainLoss >= 0 ? '+' : ''}{watchlistSummary?.averageGainLoss.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Security Controls */}
          <SecurityCard
            onChangePassword={() => setIsChangePasswordOpen(true)}
            onLogoutAllDevices={() => setIsLogoutAllOpen(true)}
            onDeleteAccount={() => setIsDeleteAccountOpen(true)}
            onRevokeSession={handleRevokeSession}
            sessions={sessions}
            currentSessionId={currentSessionId}
          />
        </div>

        {/* Right Hand Column */}
        <div className="space-y-8">
          
          {/* Appearance Customizer Section */}
          <div className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-6 shadow-lg space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="h-5 w-5 text-indigo-500" /> UI Appearance settings
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Configure layout densities, color options and rendering styles.</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Theme mode</span>
                <div className="grid grid-cols-3 gap-2">
                  {(["light", "dark", "system"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTheme(t);
                        handleUpdatePreferences({ theme: t });
                      }}
                      className={`py-2 rounded-xl text-xs font-black uppercase border capitalize transition-all ${
                        theme === t
                          ? "bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/25"
                          : "border-slate-250 dark:border-white/5 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <ToggleRow 
                  title="Collapse Sidebar by Default" 
                  description="Collapses navigation controls to clean up workspace." 
                  value={sidebarCollapsed} 
                  onChange={() => {
                    const nextVal = !sidebarCollapsed;
                    setSidebarCollapsed(nextVal);
                    localStorage.setItem('sidebar_collapsed', String(nextVal));
                    handleUpdatePreferences({ sidebarCollapsed: nextVal });
                  }} 
                />
              </div>
            </div>
          </div>


          {/* Data Export Options Section */}
          <div className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-6 shadow-lg space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileDown className="h-5 w-5 text-indigo-500" /> Personal Data Export Hub
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Download a full breakdown archive of alerts, portfolios, and transaction records.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleExportData('json')}
                className="py-3 rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] flex flex-col items-center justify-center gap-1.5 transition-all"
              >
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">JSON Archive</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Download Data</span>
              </button>
              
              <button
                onClick={() => handleExportData('csv')}
                className="py-3 rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] flex flex-col items-center justify-center gap-1.5 transition-all"
              >
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">CSV Spreadsheet</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Download Sheets</span>
              </button>
            </div>
          </div>


        </div>

      </div>

      {/* ========================================================
          MODAL INTERFACES (REPLACES BROWSER PROMPTS/ALERTS/CONFIRMS)
          ======================================================== */}
      
      {/* 1. Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-night-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-indigo-500" /> Edit Profile Details
              </h4>
              <button 
                onClick={() => setIsEditProfileOpen(false)}
                className="text-slate-450 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form 
              onSubmit={handleEditProfileSubmit} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleEditProfileSubmit(e);
                }
              }}
              className="p-6 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Profile Picture / Avatar</label>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-sm overflow-hidden shrink-0">
                    {editForm.avatar ? (
                      <img src={editForm.avatar} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      (() => {
                        if (!editForm.name) return 'US';
                        const parts = editForm.name.trim().split(/\s+/);
                        if (parts.length > 1) {
                          return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                        }
                        return parts[0][0].toUpperCase();
                      })()
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-500/10 file:text-indigo-500 hover:file:bg-indigo-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Display Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] rounded-xl text-xs font-bold text-slate-700 dark:text-slate-250 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Country</label>
                  <select
                    value={editForm.country}
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-night-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="India" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">India</option>
                    <option value="United States" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">United States</option>
                    <option value="United Kingdom" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">United Kingdom</option>
                    <option value="Germany" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">Germany</option>
                    <option value="Japan" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">Japan</option>
                    <option value="Hong Kong" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">Hong Kong</option>
                    <option value="Taiwan" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">Taiwan</option>
                    <option value="South Korea" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">South Korea</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Timezone</label>
                  <select
                    value={editForm.timezone}
                    onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-night-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Asia/Kolkata" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">Asia/Kolkata</option>
                    <option value="America/New_York" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">America/New_York</option>
                    <option value="Europe/London" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">Europe/London</option>
                    <option value="Europe/Berlin" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">Europe/Berlin</option>
                    <option value="Asia/Tokyo" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">Asia/Tokyo</option>
                    <option value="Asia/Hong_Kong" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">Asia/Hong_Kong</option>
                    <option value="Asia/Taipei" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">Asia/Taipei</option>
                    <option value="Asia/Seoul" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">Asia/Seoul</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Preferred Currency</label>
                <select
                  value={editForm.currency}
                  onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-night-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="INR (₹)" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">INR (₹)</option>
                  <option value="USD ($)" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">USD ($)</option>
                  <option value="EUR (€)" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">EUR (€)</option>
                  <option value="GBP (£)" className="bg-white dark:bg-night-900 text-slate-800 dark:text-white">GBP (£)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/5 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-black uppercase transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-night-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Unlock className="h-5 w-5 text-indigo-500" /> Change Account Password
              </h4>
              <button 
                onClick={() => setIsChangePasswordOpen(false)}
                className="text-slate-450 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleChangePasswordSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] rounded-xl text-xs font-bold text-slate-700 dark:text-slate-250 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] rounded-xl text-xs font-bold text-slate-700 dark:text-slate-250 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] rounded-xl text-xs font-bold text-slate-700 dark:text-slate-250 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/5 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-black uppercase transition-all"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Confirm Logout Modal */}
      {isLogoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-night-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto text-xl font-bold">
              👤
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Sign Out</h4>
              <p className="text-xs text-slate-400 mt-1.5">Are you sure you want to end your active FinPulse session?</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsLogoutOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-250 dark:border-white/5 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5"
              >
                No, Stay
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Logout All Other Devices Modal */}
      {isLogoutAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-night-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <LogOut className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Logout other devices</h4>
              <p className="text-xs text-slate-400 mt-1.5">This will invalidate all other active logins. Current browser session remains active.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsLogoutAllOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-250 dark:border-white/5 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutOtherDevices}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase"
              >
                Logout Others
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Delete Account Permanently Modal */}
      {isDeleteAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-night-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Profile permanently</h4>
              <p className="text-xs text-slate-400 mt-1.5">WARNING: This soft-deletes your user profile, watchlist settings, and portfolio details. This cannot be undone.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsDeleteAccountOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-250 dark:border-white/5 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}