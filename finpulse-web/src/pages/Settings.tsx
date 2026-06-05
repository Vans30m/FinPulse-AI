import { useState } from "react";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  User,
  Shield,
  Key,
  LogOut,
} from "lucide-react";

export default function Settings() {
  const [notifications, setNotifications] =
    useState(true);

  const [priceAlerts, setPriceAlerts] =
    useState(true);

  const [newsAlerts, setNewsAlerts] =
    useState(true);

  const [aiAlerts, setAiAlerts] =
    useState(true);

  return (
    <div className="space-y-6">

      {/* Hero */}

      <div
        className="
        rounded-3xl
        bg-gradient-to-br
        from-slate-800
        to-slate-900
        text-white
        p-8
        shadow-xl
        "
      >
        <div className="flex items-center gap-4">

          <div className="p-4 rounded-2xl bg-white/10">
            <SettingsIcon className="h-10 w-10" />
          </div>

          <div>
            <h1 className="text-4xl font-bold">
              Settings
            </h1>

            <p className="mt-2 text-slate-300">
              Manage preferences, alerts and account.
            </p>
          </div>

        </div>
      </div>

      {/* Account */}

      <div
        className="
        rounded-3xl
        border
        bg-white
        dark:bg-night-900
        p-6
        "
      >
        <div className="flex items-center gap-3 mb-5">
          <User className="h-5 w-5 text-cyan-500" />
          <h2 className="text-xl font-bold">
            Account
          </h2>
        </div>

        <div className="space-y-4">

          <div className="flex justify-between">
            <span>Name</span>
            <span className="font-semibold">
              Demo User
            </span>
          </div>

          <div className="flex justify-between">
            <span>Email</span>
            <span className="font-semibold">
              user@example.com
            </span>
          </div>

        </div>
      </div>

      {/* Appearance */}

      <div
        className="
        rounded-3xl
        border
        bg-white
        dark:bg-night-900
        p-6
        "
      >
        <div className="flex items-center gap-3 mb-5">
          <Sun className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-bold">
            Appearance
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">

          <button
            className="
            border
            rounded-2xl
            p-5
            flex
            items-center
            gap-3
            hover:bg-slate-50
            "
          >
            <Sun className="h-5 w-5" />
            Light Mode
          </button>

          <button
            className="
            border
            rounded-2xl
            p-5
            flex
            items-center
            gap-3
            hover:bg-slate-50
            "
          >
            <Moon className="h-5 w-5" />
            Dark Mode
          </button>

        </div>

      </div>

      {/* Notifications */}

      <div
        className="
        rounded-3xl
        border
        bg-white
        dark:bg-night-900
        p-6
        "
      >
        <div className="flex items-center gap-3 mb-5">
          <Bell className="h-5 w-5 text-emerald-500" />
          <h2 className="text-xl font-bold">
            Notifications
          </h2>
        </div>

        <div className="space-y-4">

          <ToggleRow
            title="Enable Notifications"
            value={notifications}
            onChange={setNotifications}
          />

          <ToggleRow
            title="Price Alerts"
            value={priceAlerts}
            onChange={setPriceAlerts}
          />

          <ToggleRow
            title="Market News Alerts"
            value={newsAlerts}
            onChange={setNewsAlerts}
          />

          <ToggleRow
            title="AI Signal Alerts"
            value={aiAlerts}
            onChange={setAiAlerts}
          />

        </div>
      </div>

      {/* Security */}

      <div
        className="
        rounded-3xl
        border
        bg-white
        dark:bg-night-900
        p-6
        "
      >
        <div className="flex items-center gap-3 mb-5">
          <Shield className="h-5 w-5 text-violet-500" />
          <h2 className="text-xl font-bold">
            Security
          </h2>
        </div>

        <div className="space-y-4">

          <button
            className="
            w-full
            border
            rounded-2xl
            p-4
            text-left
            hover:bg-slate-50
            "
          >
            Change Password
          </button>

          <button
            className="
            w-full
            border
            rounded-2xl
            p-4
            text-left
            hover:bg-slate-50
            "
          >
            Two-Factor Authentication
          </button>

        </div>

      </div>

      {/* API Keys */}

      <div
        className="
        rounded-3xl
        border
        bg-white
        dark:bg-night-900
        p-6
        "
      >
        <div className="flex items-center gap-3 mb-5">
          <Key className="h-5 w-5 text-cyan-500" />
          <h2 className="text-xl font-bold">
            API Keys
          </h2>
        </div>

        <input
          placeholder="Enter API Key..."
          className="
          w-full
          border
          rounded-2xl
          p-3
          bg-transparent
          "
        />
      </div>

      {/* Logout */}

      <button
        className="
        w-full
        rounded-3xl
        bg-red-500
        hover:bg-red-600
        text-white
        p-4
        font-semibold
        flex
        items-center
        justify-center
        gap-2
        "
      >
        <LogOut className="h-5 w-5" />
        Logout
      </button>

    </div>
  );
}

interface ToggleRowProps {
  title: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({
  title,
  value,
  onChange,
}: ToggleRowProps) {
  return (
    <div className="flex justify-between items-center">

      <span>{title}</span>

      <button
        onClick={() =>
          onChange(!value)
        }
        className={`
          w-14
          h-8
          rounded-full
          transition-all
          relative

          ${
            value
              ? "bg-cyan-500"
              : "bg-slate-300"
          }
        `}
      >
        <div
          className={`
            absolute
            top-1
            h-6
            w-6
            rounded-full
            bg-white
            transition-all

            ${
              value
                ? "left-7"
                : "left-1"
            }
          `}
        />
      </button>

    </div>
  );
}