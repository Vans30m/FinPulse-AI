import type {
  Dispatch,
  SetStateAction,
} from "react";

import type { ReactNode } from "react";
import { createContext, useContext, useState, useEffect } from "react";
export interface Asset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  sentiment: "Bullish" | "Bearish" | "Neutral";
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  currency?: string;
}

interface AppDataContextType {
  watchlist: Asset[];

  addToWatchlist: (
    asset: Asset
  ) => void;

  removeFromWatchlist: (
    id: string
  ) => void;

  user: UserProfile;

  setUser: Dispatch<
    SetStateAction<UserProfile>
  >;

  notifications: {
    priceAlerts: boolean;
    newsAlerts: boolean;
    aiAlerts: boolean;
  };

  setNotifications: Dispatch<
    SetStateAction<{
      priceAlerts: boolean;
      newsAlerts: boolean;
      aiAlerts: boolean;
    }>
  >;
}

const AppDataContext =
  createContext<
    AppDataContextType | undefined
  >(undefined);

export function AppDataProvider({
  children,
}: {
  children: ReactNode;
}) {
  /*
  ===================================
  WATCHLIST
  ===================================
  */

  const [watchlist, setWatchlist] =
    useState<Asset[]>(() => {
      const saved =
        localStorage.getItem(
          "finpulse-watchlist"
        );

      return saved
        ? JSON.parse(saved)
        : [];
    });

  useEffect(() => {
    localStorage.setItem(
      "finpulse-watchlist",
      JSON.stringify(watchlist)
    );
  }, [watchlist]);

  const addToWatchlist = (
    asset: Asset
  ) => {
    const exists =
      watchlist.find(
        (item) =>
          item.symbol === asset.symbol
      );

    if (exists) return;

    setWatchlist((prev) => [
      ...prev,
      asset,
    ]);
  };

  const removeFromWatchlist = (
    id: string
  ) => {
    setWatchlist((prev) =>
      prev.filter(
        (item) => item.id !== id
      )
    );
  };

  /*
  ===================================
  USER PROFILE
  ===================================
  */

  const [user, setUser] =
    useState<UserProfile>(() => {
      const saved =
        localStorage.getItem(
          "finpulse-user"
        );

      return saved
        ? JSON.parse(saved)
        : {
            name: "Vans",
            email:
              "user@example.com",
            currency: "INR (₹)",
          };
    });

  useEffect(() => {
    localStorage.setItem(
      "finpulse-user",
      JSON.stringify(user)
    );
  }, [user]);

  /*
  ===================================
  NOTIFICATIONS
  ===================================
  */

  const [
    notifications,
    setNotifications,
  ] = useState(() => {
    const saved =
      localStorage.getItem(
        "finpulse-notifications"
      );

    return saved
      ? JSON.parse(saved)
      : {
          priceAlerts: true,
          newsAlerts: true,
          aiAlerts: true,
        };
  });

  useEffect(() => {
    localStorage.setItem(
      "finpulse-notifications",
      JSON.stringify(
        notifications
      )
    );
  }, [notifications]);

  return (
    <AppDataContext.Provider
      value={{
        watchlist,
        addToWatchlist,
        removeFromWatchlist,

        user,
        setUser,

        notifications,
        setNotifications,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context =
    useContext(AppDataContext);

  if (!context) {
    throw new Error(
      "useAppData must be used inside AppDataProvider"
    );
  }

  return context;
}