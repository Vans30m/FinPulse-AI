import API_BASE_URL from "../../config/api";
const API_URL = `${API_BASE_URL}/api/profile`;

function getHeaders() {
  const token = localStorage.getItem('finpulse_token') || localStorage.getItem('finpulse-token') || 'simulated-jwt-token-123456';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  region: string;
  defaultDashboard: string;
}

export interface NotificationSettings {
  priceAlerts: boolean;
  earnings: boolean;
  news: boolean;
  portfolio: boolean;
  aiInsights: boolean;
  weeklySummary: boolean;
  monthlyReport: boolean;
  productUpdates: boolean;
}

export interface UserProfileData {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar?: string;
  phone?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  bio?: string;
  occupation?: string;
  preferences?: UserPreferences;
  notificationSettings?: NotificationSettings;
  lastLogin?: string;
  createdAt: string;
  riskProfile?: string;
  investmentGoal?: string;
  investmentHorizon?: string;
  experienceLevel?: string;
  preferredExchange?: string;
  baseCurrency?: string;
  taxCountry?: string;
  connectedAccounts?: any;
}

export interface SessionData {
  id: string;
  device: string;
  browser: string;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
}

export interface WatchlistSummaryData {
  totalWatchlists: number;
  totalAssets: number;
  stocks: number;
  etfs: number;
  crypto: number;
  forex: number;
  commodities: number;
  averageGainLoss: number;
}

export const profileService = {
  async getProfile(): Promise<UserProfileData> {
    const res = await fetch(API_URL, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch profile');
    }
    return res.json();
  },

  async updateProfile(data: Partial<UserProfileData>): Promise<{ message: string; user: UserProfileData }> {
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update profile');
    }
    return res.json();
  },

  async uploadAvatar(avatar: string): Promise<{ message: string; avatar: string }> {
    const res = await fetch(`${API_URL}/avatar`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ avatar })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload avatar');
    }
    return res.json();
  },

  async updatePreferences(data: { preferences?: UserPreferences; notificationSettings?: Partial<NotificationSettings> }): Promise<any> {
    const res = await fetch(`${API_URL}/preferences`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update preferences');
    }
    return res.json();
  },

  async changePassword(data: any): Promise<{ message: string }> {
    const res = await fetch(`${API_URL}/change-password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to change password');
    }
    return res.json();
  },

  async getSessions(): Promise<SessionData[]> {
    const res = await fetch(`${API_URL}/sessions`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch sessions');
    }
    return res.json();
  },

  async revokeSession(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_URL}/session/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to revoke session');
    }
    return res.json();
  },

  async revokeAllOtherSessions(): Promise<{ message: string }> {
    const res = await fetch(`${API_URL}/sessions`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to revoke other sessions');
    }
    return res.json();
  },

  async deleteAccount(): Promise<{ message: string }> {
    const res = await fetch(API_URL, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete account');
    }
    return res.json();
  },

  async getWatchlistSummary(): Promise<WatchlistSummaryData> {
    const res = await fetch(`${API_URL}/watchlist-summary`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch watchlist summary');
    }
    return res.json();
  },

  async exportData(format: 'json' | 'csv'): Promise<Blob> {
    const res = await fetch(`${API_URL}/export?format=${format}`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error('Failed to export data');
    }
    return res.blob();
  }
};
